// Doneo API — серверная авторизация и хранение задач.
// Запуск: node server/index.js  (порт по умолчанию 4000)
import express from 'express'
import { randomUUID } from 'node:crypto'
import { getDb, save } from './store.js'
import { createToken, hashPassword, verifyPassword } from './auth.js'
import { guestName, seedTexts } from './i18n.js'

const PORT = process.env.PORT || 4000
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/
const STATUSES = ['todo', 'progress', 'done']
const PRIORITIES = ['low', 'medium', 'high']
const PATCH_FIELDS = ['title', 'description', 'status', 'priority', 'dueDate']

// Дедлайн принимает и дату, и дату со временем: 'YYYY-MM-DD' или 'YYYY-MM-DDTHH:mm'.
// Секунды на входе допускаются, но отбрасываются.
const DUE_RE = /^(\d{4}-\d{2}-\d{2})(?:T(\d{2}:\d{2})(?::\d{2})?)?$/

function normalizeDue(value) {
  const match = DUE_RE.exec(String(value ?? '').trim())
  if (!match) return ''
  return match[2] ? `${match[1]}T${match[2]}` : match[1]
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

app.use((req, res) => res.status(404).json({ error: 'Не найдено', code: 'not_found' }))

app.listen(PORT, () => {
  console.log(`✔ Doneo API запущен: http://localhost:${PORT}`)
})
