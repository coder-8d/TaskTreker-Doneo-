import { apiFetch } from './api.js'

// Обёртки над серверными эндпоинтами авторизации.
export const register = (payload) =>
  apiFetch('/auth/register', { method: 'POST', body: payload })

export const login = (payload) =>
  apiFetch('/auth/login', { method: 'POST', body: payload })

export const guest = (payload = {}) => apiFetch('/auth/guest', { method: 'POST', body: payload })

export const me = () => apiFetch('/auth/me')

export const logout = () => apiFetch('/auth/logout', { method: 'POST' })
