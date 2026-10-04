import { downloadBlob } from './download.js'

export function tasksToJSON(tasks, { app = 'Doneo', lang } = {}) {
  return JSON.stringify(
    {
      app,
      ...(lang ? { lang } : {}),
      exportedAt: new Date().toISOString(),
      count: tasks.length,
      tasks,
    },
    null,
    2,
  )
}

export function downloadJSON(tasks, filename = 'tasks.json', options) {
  const blob = new Blob([tasksToJSON(tasks, options)], {
    type: 'application/json;charset=utf-8',
  })
  downloadBlob(blob, filename)
}
