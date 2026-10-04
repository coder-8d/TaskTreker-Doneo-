import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { readJSON, writeJSON } from '../lib/storage.js'
import { makeTask, moveItem } from '../lib/tasks.js'
import { seedTasks } from '../lib/auth.js'
import { useI18n } from '../i18n/index.jsx'
import * as serverTasks from '../lib/serverTasks.js'

// Задачи владельца. Работает в двух режимах:
//  - 'server' — данные на Express-сервере (запросы к API);
//  - 'local'  — данные в localStorage (как раньше).
export function useTasks(ownerId, mode = 'local') {
  const { t } = useI18n()
  const isServer = mode === 'server'
  const storageKey = `doneo.tasks.${ownerId}`

  // Переводчик нужен для примеров-задач, поэтому храним его в ref:
  // смена языка не должна пересоздавать хранилище и список задач.
  const tRef = useRef(t)
  useEffect(() => {
    tRef.current = t
  }, [t])

  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Актуальный список для откатов и перестановок.
  const tasksRef = useRef(tasks)
  useEffect(() => {
    tasksRef.current = tasks
  }, [tasks])

  // Загрузка при смене владельца/режима.
  useEffect(() => {
    let alive = true
    setError('')
    if (isServer) {
      setLoading(true)
      serverTasks
        .list()
        .then((list) => alive && setTasks(Array.isArray(list) ? list : []))
        .catch((e) => alive && setError(e.message))
        .finally(() => alive && setLoading(false))
    } else {
      seedTasks(ownerId, tRef.current)
      setTasks(readJSON(storageKey, [], 'local') || [])
      setLoading(false)
    }
    return () => {
      alive = false
    }
  }, [ownerId, isServer, storageKey])

  // Локальная персистентность (только режим 'local').
  useEffect(() => {
    if (isServer || loading) return
    writeJSON(storageKey, tasks, 'local')
  }, [isServer, loading, storageKey, tasks])

  const addTask = useCallback(
    async (input) => {
      const draft = makeTask(input)
      setTasks((prev) => [draft, ...prev])
      if (!isServer) return draft
      try {
        const saved = await serverTasks.create(draft)
        setTasks((prev) => prev.map((t) => (t.id === draft.id ? saved : t)))
        return saved
      } catch (e) {
        setTasks((prev) => prev.filter((t) => t.id !== draft.id))
        setError(e.message)
        return null
      }
    },
    [isServer],
  )

  const updateTask = useCallback(
    async (id, patch) => {
      const previous = tasksRef.current.find((t) => t.id === id)
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...patch, updatedAt: Date.now() } : t)),
      )
      if (!isServer) return
      try {
        const saved = await serverTasks.update(id, patch)
        setTasks((prev) => prev.map((t) => (t.id === id ? saved : t)))
      } catch (e) {
        if (previous) {
          setTasks((prev) => prev.map((t) => (t.id === id ? previous : t)))
        }
        setError(e.message)
      }
    },
    [isServer],
  )

  const removeTask = useCallback(
    async (id) => {
      const previous = tasksRef.current.find((t) => t.id === id)
      setTasks((prev) => prev.filter((t) => t.id !== id))
      if (!isServer) return
      try {
        await serverTasks.remove(id)
      } catch (e) {
        if (previous) setTasks((prev) => [previous, ...prev])
        setError(e.message)
      }
    },
    [isServer],
  )

  const toggleStatus = useCallback(
    (id) => {
      const task = tasksRef.current.find((t) => t.id === id)
      if (!task) return
      const next =
        task.status === 'done' ? 'todo' : task.status === 'todo' ? 'progress' : 'done'
      return updateTask(id, { status: next })
    },
    [updateTask],
  )

  const clearCompleted = useCallback(async () => {
    const snapshot = tasksRef.current
    setTasks((prev) => prev.filter((t) => t.status !== 'done'))
    if (!isServer) return
    try {
      await serverTasks.clearCompleted()
    } catch (e) {
      setTasks(snapshot)
      setError(e.message)
    }
  }, [isServer])

  const reorderTasks = useCallback(
    async (sourceId, targetId) => {
      const next = moveItem(tasksRef.current, sourceId, targetId)
      if (next === tasksRef.current) return
      setTasks(next)
      if (!isServer) return
      try {
        await serverTasks.reorder(next.map((t) => t.id))
      } catch (e) {
        setError(e.message)
      }
    },
    [isServer],
  )

  const stats = useMemo(() => {
    const total = tasks.length
    const done = tasks.filter((t) => t.status === 'done').length
    const progress = tasks.filter((t) => t.status === 'progress').length
    const todo = tasks.filter((t) => t.status === 'todo').length
    return { total, done, progress, todo, active: total - done }
  }, [tasks])

  const clearError = useCallback(() => setError(''), [])

  return {
    tasks,
    stats,
    loading,
    error,
    clearError,
    addTask,
    updateTask,
    removeTask,
    toggleStatus,
    clearCompleted,
    reorderTasks,
  }
}
