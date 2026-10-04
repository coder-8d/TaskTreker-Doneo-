import { readJSON, writeJSON, removeKey, readRaw } from './storage.js'
import { createId } from './tasks.js'
import { localizeError } from './messages.js'

// Ключи хранилища.
const USERS_KEY = 'doneo.users'
const SESSION_KEY = 'doneo.session'

export const GUEST_ID = 'guest'

// Соль для локального хеша пароля. LEGACY_SALT нужен, чтобы аккаунты,
// созданные до переименования проекта в Doneo, оставались рабочими.
const SALT = 'doneo::'
const LEGACY_SALT = 'tastracker::'

// Ошибка с кодом — клиент переведёт её на текущий язык интерфейса.
function fail(code, fallback) {
  const error = new Error(localizeError(code, null, fallback))
  error.code = code
  return error
}

// --- Хеширование пароля ---------------------------------------------------
// Используем Web Crypto (SHA-256) с солью-префиксом. Есть синхронный фолбэк
// на случай окружений без crypto.subtle (например, не-HTTPS/старые браузеры).
export async function hashPassword(password, salt = SALT) {
  const payload = `${salt}${password}`
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const data = new TextEncoder().encode(payload)
    const digest = await crypto.subtle.digest('SHA-256', data)
    return [...new Uint8Array(digest)]
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
  }
  let hash = 0
  for (let i = 0; i < payload.length; i += 1) {
    hash = (hash * 31 + payload.charCodeAt(i)) >>> 0
  }
  return `fallback_${hash.toString(16)}`
}

// --- Пользователи ---------------------------------------------------------
function getUsers() {
  const users = readJSON(USERS_KEY, [], 'local')
  return Array.isArray(users) ? users : []
}

function saveUsers(users) {
  writeJSON(USERS_KEY, users, 'local')
}

export function findUserByEmail(email) {
  const normalized = String(email || '').trim().toLowerCase()
  return getUsers().find((u) => u.email === normalized) || null
}

export function publicUser(user) {
  if (!user) return null
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    guest: Boolean(user.guest),
  }
}

// --- Сессия ---------------------------------------------------------------
// «Запомнить меня» -> localStorage (живёт после перезапуска браузера).
// Иначе -> sessionStorage (живёт до закрытия вкладки).
export function saveSession(user, remember = true) {
  const kind = remember ? 'local' : 'session'
  const other = remember ? 'session' : 'local'
  writeJSON(SESSION_KEY, publicUser(user), kind)
  removeKey(SESSION_KEY, other)
}

export function getSession() {
  const fromLocal = readJSON(SESSION_KEY, null, 'local')
  if (fromLocal) return fromLocal
  const fromSession = readJSON(SESSION_KEY, null, 'session')
  return fromSession || null
}

export function clearSession() {
  removeKey(SESSION_KEY, 'local')
  removeKey(SESSION_KEY, 'session')
}

// --- Операции авторизации -------------------------------------------------
export async function register({ name, email, password }) {
  const cleanName = String(name || '').trim()
  const cleanEmail = String(email || '').trim().toLowerCase()

  if (cleanName.length < 2) throw fail('name_short', 'Введите имя (минимум 2 символа).')
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(cleanEmail)) {
    throw fail('email_invalid', 'Введите корректный email.')
  }
  if (String(password || '').length < 6) {
    throw fail('password_short', 'Пароль должен содержать минимум 6 символов.')
  }
  if (findUserByEmail(cleanEmail)) {
    throw fail('email_taken', 'Пользователь с таким email уже зарегистрирован.')
  }

  const user = {
    id: createId(),
    name: cleanName,
    email: cleanEmail,
    passwordHash: await hashPassword(password),
    createdAt: Date.now(),
  }
  saveUsers([...getUsers(), user])
  return user
}

export async function login({ email, password, remember = true }) {
  const cleanEmail = String(email || '').trim().toLowerCase()
  const user = findUserByEmail(cleanEmail)
  if (!user) {
    throw fail('user_not_found', 'Пользователь с таким email не найден. Зарегистрируйтесь.')
  }

  const hash = await hashPassword(password)
  if (hash !== user.passwordHash) {
    // Проверяем пароль из старой соли (до переименования проекта).
    const legacy = await hashPassword(password, LEGACY_SALT)
    if (legacy !== user.passwordHash) {
      throw fail('password_wrong', 'Неверный пароль. Попробуйте снова.')
    }
  }

  saveSession(user, remember)
  return user
}

export function loginAsGuest(name = 'Гость') {
  const guest = { id: GUEST_ID, name, email: '', guest: true }
  saveSession(guest, false)
  return guest
}

export function logout() {
  clearSession()
}

// Стартовые задачи для нового аккаунта — примеры на языке интерфейса.
export function seedTasks(ownerId, t) {
  const key = `doneo.tasks.${ownerId}`
  if (readRaw(key, 'local') != null) return
  const now = Date.now()
  const iso = (offsetDays) => {
    const d = new Date(now + offsetDays * 86400000)
    return d.toISOString().slice(0, 10)
  }
  const pick = (name) => ({
    title: t(`seed.${name}.title`),
    description: t(`seed.${name}.text`),
  })

  const drafts = [
    { ...pick('first'), status: 'todo', priority: 'medium', dueDate: iso(1), offset: -3000 },
    { ...pick('second'), status: 'progress', priority: 'high', dueDate: iso(3), offset: -2000 },
    { ...pick('third'), status: 'done', priority: 'low', dueDate: '', offset: -1000 },
  ]

  const seeded = drafts.map(({ offset, ...item }) => ({
    id: createId(),
    ...item,
    createdAt: now + offset,
    updatedAt: now + offset,
  }))
  writeJSON(key, seeded, 'local')
}
