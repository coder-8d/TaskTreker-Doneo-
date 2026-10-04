// Тонкая обёртка над Web Storage с безопасным JSON-парсингом.
// Все операции обёрнуты в try/catch, чтобы приложение не падало,
// если хранилище недоступно (приватный режим, отключённые cookies и т.д.).

const memory = new Map()

// Префикс ключей Doneo и префикс предыдущей версии (Task Tracker)
// — нужен, чтобы перенести данные пользователя после переименования.
export const PREFIX = 'doneo.'
const LEGACY_PREFIX = 'tt.'

function getStore(kind) {
  if (typeof window === 'undefined') return null
  try {
    return kind === 'session' ? window.sessionStorage : window.localStorage
  } catch {
    return null
  }
}

export function readJSON(key, fallback = null, kind = 'local') {
  const store = getStore(kind)
  if (!store) return memory.has(key) ? memory.get(key) : fallback
  try {
    const raw = store.getItem(key)
    if (raw == null) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

export function writeJSON(key, value, kind = 'local') {
  const store = getStore(kind)
  const serialized = JSON.stringify(value)
  if (!store) {
    memory.set(key, value)
    return
  }
  try {
    store.setItem(key, serialized)
  } catch {
    memory.set(key, value)
  }
}

export function removeKey(key, kind = 'local') {
  const store = getStore(kind)
  if (!store) {
    memory.delete(key)
    return
  }
  try {
    store.removeItem(key)
  } catch {
    memory.delete(key)
  }
}

export function readRaw(key, kind = 'local') {
  const store = getStore(kind)
  if (!store) return memory.has(key) ? memory.get(key) : null
  try {
    return store.getItem(key)
  } catch {
    return null
  }
}

// Однократный перенос старых ключей "tt.*" в "doneo.*" (тема, язык,
// токен, пользователи, сессия и задачи). Полезно после ребрендинга.
export function migrateLegacyKeys() {
  for (const kind of ['local', 'session']) {
    const store = getStore(kind)
    if (!store) continue
    try {
      const legacy = []
      for (let i = 0; i < store.length; i += 1) {
        const key = store.key(i)
        if (key && key.startsWith(LEGACY_PREFIX)) legacy.push(key)
      }
      for (const oldKey of legacy) {
        const newKey = PREFIX + oldKey.slice(LEGACY_PREFIX.length)
        const value = store.getItem(oldKey)
        if (value != null && store.getItem(newKey) == null) {
          store.setItem(newKey, value)
        }
        store.removeItem(oldKey)
      }
    } catch {
      /* миграция — необязательный шаг */
    }
  }
}
