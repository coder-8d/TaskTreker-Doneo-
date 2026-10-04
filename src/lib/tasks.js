// Доменные константы и утилиты для задач.
// Подписи статусов и приоритетов хранятся как ключи словаря (labelKey),
// чтобы перевод подставлялся в момент отрисовки.

export const STATUSES = [
  { value: 'todo', labelKey: 'stats.todo' },
  { value: 'progress', labelKey: 'stats.progress' },
  { value: 'done', labelKey: 'stats.done' },
]

export const PRIORITIES = [
  { value: 'low', labelKey: 'priority.low' },
  { value: 'medium', labelKey: 'priority.medium' },
  { value: 'high', labelKey: 'priority.high' },
]

const PRIORITY_WEIGHT = { high: 3, medium: 2, low: 1 }

export function createId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `t_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`
}

export function makeTask(input = {}) {
  const now = Date.now()
  return {
    id: input.id || createId(),
    title: (input.title || '').trim(),
    description: (input.description || '').trim(),
    status: input.status || 'todo',
    priority: input.priority || 'medium',
    dueDate: normalizeDue(input.dueDate),
    createdAt: input.createdAt || now,
    updatedAt: now,
  }
}

// --- Дедлайн: 'YYYY-MM-DD' или 'YYYY-MM-DDTHH:mm' (локальное время) ------

// Секунды допускаются на входе (браузер может их прислать) — но не хранятся.
const DATE_RE = /^(\d{4}-\d{2}-\d{2})(?:T(\d{2}:\d{2})(?::\d{2})?)?$/

// Приводит любое входящее значение к 'YYYY-MM-DD' или 'YYYY-MM-DDTHH:mm'.
export function normalizeDue(value) {
  const match = DATE_RE.exec(String(value ?? '').trim())
  if (!match) return ''
  return match[2] ? `${match[1]}T${match[2]}` : match[1]
}

// Значение для <input type="datetime-local">: там время обязательно.
export function toDateTimeInput(value, fallbackTime = '09:00') {
  const normalized = normalizeDue(value)
  if (!normalized) return ''
  if (normalized.length > 10) return normalized
  return `${normalized}T${fallbackTime}`
}

// Момент дедлайна в мс. Если время не задано — считаем конец дня.
export function dueTime(task) {
  const normalized = normalizeDue(task && task.dueDate)
  if (!normalized) return 0
  const stamp = normalized.length > 10 ? `${normalized}:00` : `${normalized}T23:59:59`
  const parsed = new Date(stamp).getTime()
  return Number.isNaN(parsed) ? 0 : parsed
}

export function isOverdue(task) {
  if (!task || !task.dueDate || task.status === 'done') return false
  return dueTime(task) < Date.now()
}

// Дата + время в локали интерфейса. Для старых задач (без времени)
// показывается только дата.
export function formatDue(value, locale = 'ru-RU') {
  const normalized = normalizeDue(value)
  if (!normalized) return ''
  const date = new Date(`${normalized}T00:00:00`)
  if (Number.isNaN(date.getTime())) return normalized

  const options = { day: '2-digit', month: 'short', year: 'numeric' }
  const time = normalized.length > 10 ? `, ${normalized.slice(11, 16)}` : ''
  try {
    return `${date.toLocaleDateString(locale, options)}${time}`
  } catch {
    return `${date.toLocaleDateString('ru-RU', options)}${time}`
  }
}

// «Сегодня» / «Завтра» / «+7 дней» — готовые значения для формы.
export function duePreset(kind, hours = 18) {
  const base = new Date()
  base.setHours(hours, 0, 0, 0)
  if (kind === 'today') return toDateTimeInput(dateKey(base), '18:00')
  if (kind === 'tomorrow') {
    base.setDate(base.getDate() + 1)
    return toDateTimeInput(dateKey(base), '09:00')
  }
  base.setDate(base.getDate() + 7)
  return toDateTimeInput(dateKey(base), '09:00')
}

function dateKey(date) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

// Возвращает новый массив задач, отсортированный по выбранному ключу.
export function sortTasks(tasks, sortBy, locale = 'ru') {
  const list = [...tasks]
  switch (sortBy) {
    case 'due-asc':
      return list.sort((a, b) => compareDue(a, b, 'asc'))
    case 'due-desc':
      return list.sort((a, b) => compareDue(a, b, 'desc'))
    case 'priority':
      return list.sort(
        (a, b) => PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority],
      )
    case 'title':
      return list.sort((a, b) => a.title.localeCompare(b.title, locale))
    case 'custom':
      // Пользовательский порядок (drag-and-drop) — не сортируем.
      return list
    case 'created':
    default:
      return list.sort((a, b) => b.createdAt - a.createdAt)
  }
}


// Перемещает задачу sourceId на место targetId, сохраняя порядок массива.
// Возвращает исходный массив, если перемещение невозможно.
export function moveItem(list, sourceId, targetId) {
  if (sourceId === targetId) return list
  const from = list.findIndex((t) => t.id === sourceId)
  const to = list.findIndex((t) => t.id === targetId)
  if (from === -1 || to === -1) return list
  const next = [...list]
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  return next
}

function compareDue(a, b, dir) {
  // Задачи без дедлайна всегда уходят в конец.
  if (!a.dueDate && !b.dueDate) return 0
  if (!a.dueDate) return 1
  if (!b.dueDate) return -1
  const diff = a.dueDate < b.dueDate ? -1 : a.dueDate > b.dueDate ? 1 : 0
  return dir === 'asc' ? diff : -diff
}
