import { downloadBlob } from './download.js'

// Библиотека экспорта не зависит от React: переводчик (t) и локаль
// передаются из вызывающего кода.
const fallbackT = (key) => key

// Экранирование значения по правилам CSV (RFC 4180).
function escapeCell(value) {
  const str = value == null ? '' : String(value)
  if (/[";\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

// Разделитель ";" — Excel в русской/европейской локали открывает такой файл корректно.
const DELIMITER = ';'

const HEADER_KEYS = [
  'csv.id',
  'csv.title',
  'csv.description',
  'csv.status',
  'csv.priority',
  'csv.dueDate',
  'csv.createdAt',
  'csv.updatedAt',
]

function toRow(task, t, locale) {
  return [
    task.id,
    task.title,
    task.description,
    t(`stats.${task.status}`),
    t(`priority.${task.priority}`),
    // 'YYYY-MM-DDTHH:mm' → 'YYYY-MM-DD HH:mm' (удобнее в Excel)
    String(task.dueDate || '').replace('T', ' '),
    new Date(task.createdAt).toLocaleString(locale),
    new Date(task.updatedAt).toLocaleString(locale),
  ]
}

export function tasksToCSV(tasks, { t = fallbackT, locale = 'ru-RU' } = {}) {
  const headers = HEADER_KEYS.map((key) => t(key))
  const lines = [headers, ...tasks.map((task) => toRow(task, t, locale))].map((row) =>
    row.map(escapeCell).join(DELIMITER),
  )
  // BOM, чтобы Excel не ломал кириллицу и узбекские символы.
  return `\ufeff${lines.join('\r\n')}`
}

export function downloadCSV(tasks, filename = 'tasks.csv', options) {
  const blob = new Blob([tasksToCSV(tasks, options)], {
    type: 'text/csv;charset=utf-8;',
  })
  downloadBlob(blob, filename)
}

