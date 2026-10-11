// Doneo API — серверная авторизация и хранение задач.
// Запуск: node server/index.js  (порт по умолчанию 4000)
import express from 'express'
import { randomUUID } from 'node:crypto'
// Первым импортом читаем .env — чтобы ключи провайдеров были видны ниже.
import './env.js'
import { getDb, save } from './store.js'
import { createToken, hashPassword, verifyPassword } from './auth.js'
import { guestName, reminderText, seedTexts, testText } from './i18n.js'
import {
  maskPhone,
  normalizePhone,
  sendSms,
  smsConfigured,
  smsProvider,
  smsProviderLabel,
} from './sms.js'

const PORT = process.env.PORT || 4000
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/
const STATUSES = ['todo', 'progress', 'done']
const PRIORITIES = ['low', 'medium', 'high']
const PATCH_FIELDS = ['title', 'description', 'status', 'priority', 'dueDate']

// Варианты «напомнить за …» (в минутах).
const REMIND_OPTIONS = [10, 30, 60, 180, 1440, 10080]
const SMS_CHECK_INTERVAL = 60 * 1000

// Дедлайн принимает и дату, и дату со временем: 'YYYY-MM-DD' или 'YYYY-MM-DDTHH:mm'.
// Секунды на входе допускаются, но отбрасываются.
const DUE_RE = /^(\d{4}-\d{2}-\d{2})(?:T(\d{2}:\d{2})(?::\d{2})?)?$/

function normalizeDue(value) {
  const match = DUE_RE.exec(String(value ?? '').trim())
  if (!match) return ''
  return match[2] ? `${match[1]}T${match[2]}` : match[1]
}

// Дедлайн в миллисекундах. Без времени считаем конец дня.
function dueTimestamp(value) {
  const normalized = normalizeDue(value)
  if (!normalized) return 0
  const stamp = normalized.length > 10 ? `${normalized}:00` : `${normalized}T23:59:59`
  const parsed = new Date(stamp).getTime()
  return Number.isNaN(parsed) ? 0 : parsed
}

// --- Настройки SMS для пользователя ---
const DEFAULT_SMS = { phone: '', enabled: false, remindMinutes: 60, verifiedAt: 0 }

function smsSettings(userId) {
  const db = getDb()
  if (!db.settings) db.settings = {}
  if (!db.settings[userId]) db.settings[userId] = { ...DEFAULT_SMS }
  return db.settings[userId]
}

function publicSmsSettings(userId) {
  const settings = smsSettings(userId)
  return {
    phone: settings.phone,
    maskedPhone: maskPhone(settings.phone),
    enabled: Boolean(settings.enabled),
    remindMinutes: settings.remindMinutes,
    verified: Boolean(settings.verifiedAt),
    provider: smsProvider(),
    providerLabel: smsProviderLabel(),
    configured: smsConfigured(),
    remindOptions: REMIND_OPTIONS,
  }
}

const app = express()
app.use(express.json({ limit: '1mb' }))

// Минимальный CORS (без внешних зависимостей).
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
  if (req.method === 'OPTIONS') return res.sendStatus(204)
  next()
})

const publicUser = (u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  guest: Boolean(u.guest),
})

// Время в примерах-задачах: чтобы дедлайн сразу выглядел как «сегодня в 18:00».
const SEED_TIMES = ['18:00', '12:00', '']

// Задачи-примеры для нового пользователя — на языке интерфейса.
function seedTasks(lang) {
  const now = Date.now()
  const iso = (days) => new Date(now + days * 86400000).toISOString().slice(0, 10)
  const items = seedTexts(lang)
  return items.map((item, index) => ({
    id: randomUUID(),
    title: item.title,
    description: item.description,
    status: item.status,
    priority: item.priority,
    dueDate: item.days ? `${iso(item.days)}T${SEED_TIMES[index] || '09:00'}` : '',
    createdAt: now - (items.length - index) * 1000,
    updatedAt: now - (items.length - index) * 1000,
  }))
}

function sanitizeTask(input, base = {}) {
  const now = Date.now()
  const status = STATUSES.includes(input.status) ? input.status : base.status || 'todo'
  const priority = PRIORITIES.includes(input.priority)
    ? input.priority
    : base.priority || 'medium'
  const clientId = typeof input.id === 'string' ? input.id.trim() : ''
  return {
    id: base.id || clientId || randomUUID(),
    title: String(input.title ?? base.title ?? '').trim(),
    description: String(input.description ?? base.description ?? '').trim(),
    status,
    priority,
    dueDate: normalizeDue(input.dueDate ?? base.dueDate),
    createdAt: base.createdAt || now,
    updatedAt: now,
  }
}

// Проверка токена: кладёт req.user и req.token.
function requireAuth(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  const db = getDb()
  const session = token ? db.sessions[token] : null
  const user = session ? db.users.find((u) => u.id === session.userId) : null
  if (!user) {
    return res.status(401).json({ error: 'Требуется авторизация.', code: 'unauthorized' })
  }
  req.user = user
  req.token = token
  next()
}

// ---------- Health ----------
app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'doneo-api', name: 'Doneo' })
})

// ---------- Авторизация ----------
app.post('/api/auth/register', (req, res) => {
  const db = getDb()
  const name = String(req.body?.name || '').trim()
  const email = String(req.body?.email || '').trim().toLowerCase()
  const password = String(req.body?.password || '')
  const lang = String(req.body?.lang || '')

  if (name.length < 2) {
    return res
      .status(400)
      .json({ error: 'Введите имя (минимум 2 символа).', code: 'name_short' })
  }
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'Введите корректный email.', code: 'email_invalid' })
  }
  if (password.length < 6) {
    return res
      .status(400)
      .json({ error: 'Пароль должен содержать минимум 6 символов.', code: 'password_short' })
  }
  if (db.users.some((u) => u.email === email)) {
    return res
      .status(409)
      .json({
        error: 'Пользователь с таким email уже зарегистрирован.',
        code: 'email_taken',
      })
  }

  const { salt, hash } = hashPassword(password)
  const user = {
    id: randomUUID(),
    name,
    email,
    salt,
    passwordHash: hash,
    // Язык нужен для текста SMS-напоминаний.
    lang,
    createdAt: Date.now(),
  }
  db.users.push(user)
  db.tasks[user.id] = seedTasks(lang)

  const token = createToken()
  db.sessions[token] = { userId: user.id, createdAt: Date.now() }
  save()
  res.status(201).json({ token, user: publicUser(user) })
})

app.post('/api/auth/login', (req, res) => {
  const db = getDb()
  const email = String(req.body?.email || '').trim().toLowerCase()
  const password = String(req.body?.password || '')

  const user = db.users.find((u) => u.email === email && !u.guest)
  if (!user) {
    return res
      .status(401)
      .json({
        error: 'Пользователь с таким email не найден. Зарегистрируйтесь.',
        code: 'user_not_found',
      })
  }
  if (!verifyPassword(password, user.salt, user.passwordHash)) {
    return res
      .status(401)
      .json({ error: 'Неверный пароль. Попробуйте снова.', code: 'password_wrong' })
  }

  const token = createToken()
  db.sessions[token] = { userId: user.id, createdAt: Date.now() }
  save()
  res.json({ token, user: publicUser(user) })
})

app.post('/api/auth/guest', (req, res) => {
  const db = getDb()
  const lang = String(req.body?.lang || '')
  const user = {
    id: `guest_${randomUUID()}`,
    name: guestName(lang),
    email: '',
    guest: true,
    createdAt: Date.now(),
  }
  db.users.push(user)
  db.tasks[user.id] = []

  const token = createToken()
  db.sessions[token] = { userId: user.id, createdAt: Date.now() }
  save()
  res.status(201).json({ token, user: publicUser(user) })
})

app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) })
})

app.post('/api/auth/logout', requireAuth, (req, res) => {
  const db = getDb()
  delete db.sessions[req.token]
  // Гостевую сессию и её задачи подчищаем, чтобы не копить мусор.
  if (req.user.guest) {
    db.users = db.users.filter((u) => u.id !== req.user.id)
    delete db.tasks[req.user.id]
  }
  save()
  res.json({ ok: true })
})

// ---------- Задачи ----------
function userTasks(req) {
  const db = getDb()
  if (!Array.isArray(db.tasks[req.user.id])) db.tasks[req.user.id] = []
  return db.tasks[req.user.id]
}

app.get('/api/tasks', requireAuth, (req, res) => {
  res.json(userTasks(req))
})

app.post('/api/tasks', requireAuth, (req, res) => {
  const list = userTasks(req)
  const task = sanitizeTask(req.body || {})
  if (!task.title) {
    return res
      .status(400)
      .json({ error: 'Название задачи обязательно.', code: 'title_required' })
  }
  // Клиентский id переиспользуем, но не допускаем дубликатов.
  if (list.some((t) => t.id === task.id)) task.id = randomUUID()
  list.unshift(task)
  save()
  res.status(201).json(task)
})

app.post('/api/tasks/clear-completed', requireAuth, (req, res) => {
  const db = getDb()
  db.tasks[req.user.id] = userTasks(req).filter((t) => t.status !== 'done')
  save()
  res.json({ ok: true })
})

// Важно: определяется до PUT /:id, иначе "reorder" попадёт в параметр :id.
app.put('/api/tasks/reorder', requireAuth, (req, res) => {
  const db = getDb()
  const ids = Array.isArray(req.body?.ids) ? req.body.ids : []
  const list = userTasks(req)
  const byId = new Map(list.map((t) => [t.id, t]))
  const ordered = ids.map((id) => byId.get(id)).filter(Boolean)
  const rest = list.filter((t) => !ids.includes(t.id))
  db.tasks[req.user.id] = [...ordered, ...rest]
  save()
  res.json(db.tasks[req.user.id])
})

app.put('/api/tasks/:id', requireAuth, (req, res) => {
  const list = userTasks(req)
  const index = list.findIndex((t) => t.id === req.params.id)
  if (index === -1) {
    return res.status(404).json({ error: 'Задача не найдена.', code: 'task_not_found' })
  }
  const patch = {}
  for (const field of PATCH_FIELDS) {
    if (req.body && field in req.body) patch[field] = req.body[field]
  }
  const updated = sanitizeTask(patch, list[index])
  if (!updated.title) {
    return res
      .status(400)
      .json({ error: 'Название задачи обязательно.', code: 'title_required' })
  }
  list[index] = updated
  save()
  res.json(updated)
})

app.delete('/api/tasks/:id', requireAuth, (req, res) => {
  const db = getDb()
  db.tasks[req.user.id] = userTasks(req).filter((t) => t.id !== req.params.id)
  save()
  res.json({ ok: true })
})

// ---------- SMS-напоминания ----------
app.get('/api/sms/settings', requireAuth, (req, res) => {
  res.json(publicSmsSettings(req.user.id))
})

app.put('/api/sms/settings', requireAuth, (req, res) => {
  const settings = smsSettings(req.user.id)
  const { phone, enabled, remindMinutes } = req.body || {}

  if (phone !== undefined) {
    const clean = normalizePhone(phone)
    if (phone && !clean) {
      return res
        .status(400)
        .json({ error: 'Некорректный номер телефона.', code: 'phone_invalid' })
    }
    // Новый номер нужно подтвердить тестовым SMS.
    if (clean && clean !== settings.phone) settings.verifiedAt = 0
    settings.phone = clean
  }

  if (enabled !== undefined) settings.enabled = Boolean(enabled)

  if (remindMinutes !== undefined) {
    const minutes = Number(remindMinutes)
    settings.remindMinutes = REMIND_OPTIONS.includes(minutes)
      ? minutes
      : DEFAULT_SMS.remindMinutes
  }

  save()
  res.json(publicSmsSettings(req.user.id))
})

app.post('/api/sms/test', requireAuth, async (req, res) => {
  const settings = smsSettings(req.user.id)
  if (!settings.phone) {
    return res
      .status(400)
      .json({ error: 'Сначала укажите номер телефона.', code: 'phone_missing' })
  }

  const result = await sendSms(settings.phone, testText(req.user.lang))
  if (!result.ok) {
    return res.status(502).json({
      error: 'Не удалось отправить SMS.',
      code: result.reason === 'not_configured' ? 'sms_not_configured' : 'sms_failed',
      detail: result.detail || result.reason,
    })
  }

  settings.verifiedAt = Date.now()
  save()
  res.json({ ok: true, mocked: Boolean(result.mocked), provider: result.provider })
})

// Раз в минуту ищем задачи, у которых скоро дедлайн, и шлём одно SMS.
async function sendDueReminders() {
  const db = getDb()
  const now = Date.now()
  let changed = false

  for (const user of db.users) {
    if (user.guest) continue
    const settings = smsSettings(user.id)
    if (!settings.enabled || !settings.phone) continue

    const list = Array.isArray(db.tasks[user.id]) ? db.tasks[user.id] : []
    for (const task of list) {
      if (task.status === 'done' || !task.dueDate || task.smsSentAt) continue
      const due = dueTimestamp(task.dueDate)
      if (!due) continue

      // Время ещё не наступило и окно предупреждения не открылось.
      if (due > now + settings.remindMinutes * 60000) continue

      const result = await sendSms(settings.phone, reminderText(user.lang, task, due))
      if (!result.ok) {
        console.warn(`[sms] не отправлено для ${settings.phone}:`, result.reason, result.detail || '')
        continue
      }
      task.smsSentAt = now
      changed = true
      console.log(`[sms] отправлено: «${task.title}» → ${maskPhone(settings.phone)}`)
    }
  }

  if (changed) save()
}

function startReminderScheduler() {
  setTimeout(() => {
    sendDueReminders().catch((error) => console.error('[sms] ошибка проверки:', error.message))
  }, 5000)
  setInterval(() => {
    sendDueReminders().catch((error) => console.error('[sms] ошибка проверки:', error.message))
  }, SMS_CHECK_INTERVAL)
  console.log(
    `✉  SMS-напоминания: провайдер «${smsProviderLabel()}»${
      smsConfigured() ? '' : ' (не настроен — отправка отключена)'
    }`,
  )
}

app.use((req, res) => res.status(404).json({ error: 'Не найдено', code: 'not_found' }))

app.listen(PORT, () => {
  console.log(`✔ Doneo API запущен: http://localhost:${PORT}`)
  startReminderScheduler()
})
