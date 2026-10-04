import { apiFetch } from './api.js'

// Обёртки над серверными эндпоинтами задач (авторизация через токен).
export const list = () => apiFetch('/tasks')

export const create = (task) => apiFetch('/tasks', { method: 'POST', body: task })

export const update = (id, patch) =>
  apiFetch(`/tasks/${id}`, { method: 'PUT', body: patch })

export const remove = (id) => apiFetch(`/tasks/${id}`, { method: 'DELETE' })

export const clearCompleted = () =>
  apiFetch('/tasks/clear-completed', { method: 'POST' })

export const reorder = (ids) =>
  apiFetch('/tasks/reorder', { method: 'PUT', body: { ids } })
