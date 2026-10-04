import { readJSON, removeKey, writeJSON } from './storage.js'
import { localizeError } from './messages.js'

// Базовый URL API. В dev-режиме Vite проксирует /api на Express-сервер.
// Можно переопределить переменной окружения VITE_API_URL.
const BASE = import.meta.env?.VITE_API_URL || '/api'
const TOKEN_KEY = 'doneo.token'

// Идентификатор нашего API: защищает от ложного определения режима,
// когда dev-сервер отдаёт index.html на любой запрос.
export const API_SERVICE = 'doneo-api'

// --- Токен сессии ---------------------------------------------------------
export function getStoredToken() {
  return (
    readJSON(TOKEN_KEY, null, 'local') ||
    readJSON(TOKEN_KEY, null, 'session') ||
    null
  )
}

export function setStoredToken(token, remember = true) {
  if (remember) {
    writeJSON(TOKEN_KEY, token, 'local')
    removeKey(TOKEN_KEY, 'session')
  } else {
    writeJSON(TOKEN_KEY, token, 'session')
    removeKey(TOKEN_KEY, 'local')
  }
}

export function clearStoredToken() {
  removeKey(TOKEN_KEY, 'local')
  removeKey(TOKEN_KEY, 'session')
}

// --- Запросы --------------------------------------------------------------
export async function apiFetch(path, { method = 'GET', body, token } = {}) {
  const headers = {}
  const authToken = token ?? getStoredToken()
  if (authToken) headers.Authorization = `Bearer ${authToken}`

  const init = { method, headers }
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    init.body = JSON.stringify(body)
  }

  let res
  try {
    res = await fetch(`${BASE}${path}`, init)
  } catch {
    const error = new Error(
      localizeError('network', null, 'Network error') || 'Network error',
    )
    error.code = 'network'
    error.status = 0
    throw error
  }

  const text = await res.text()
  let data = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = null
    }
  }

  if (!res.ok) {
    // Сервер отвечает кодом ошибки (например, "email_taken") — переводим
    // его на текущий язык, а текст сервера оставляем как запасной вариант.
    const code = data && data.code
    const message =
      localizeError(code, null, '') ||
      (data && data.error) ||
      localizeError('generic', { status: res.status }, '') ||
      `API error ${res.status}`

    const error = new Error(message)
    error.code = code || 'generic'
    error.status = res.status
    throw error
  }
  return data
}

// Проверка доступности серверной части. Возвращает true только если
// ответило именно наше API (а не SPA-фолбэк Vite со страницей index.html).
export async function checkServer(timeout = 1500) {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeout)
    const res = await fetch(`${BASE}/health`, { signal: controller.signal })
    clearTimeout(timer)
    const contentType = res.headers.get('content-type') || ''
    if (!res.ok || !contentType.includes('application/json')) return false
    const data = await res.json()
    return data?.service === API_SERVICE
  } catch {
    return false
  }
}
