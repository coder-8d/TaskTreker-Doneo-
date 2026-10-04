import { useMemo, useState } from 'react'
import PageHead from '../components/PageHead.jsx'
import ExportButtons from '../components/ExportButtons.jsx'
import StatsBar from '../components/StatsBar.jsx'
import FilterBar from '../components/FilterBar.jsx'
import TaskForm from '../components/TaskForm.jsx'
import TaskList from '../components/TaskList.jsx'
import Modal from '../components/Modal.jsx'
import { useI18n } from '../i18n/index.jsx'
import { sortTasks } from '../lib/tasks.js'
import { downloadCSV } from '../lib/csv.js'
import { downloadJSON } from '../lib/json.js'

// Страница «Задачи»: форма добавления, фильтры, список и drag-and-drop.
export default function TasksPage({
  user,
  tasks,
  stats,
  loading,
  addTask,
  updateTask,
  removeTask,
  toggleStatus,
  clearCompleted,
  reorderTasks,
}) {
  const { t, lang, locale } = useI18n()

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [priority, setPriority] = useState('all')
  const [sortBy, setSortBy] = useState('created')
  const [editing, setEditing] = useState(null)

  const visibleTasks = useMemo(() => {
    const query = search.trim().toLowerCase()
    const filtered = tasks.filter((task) => {
      if (status !== 'all' && task.status !== status) return false
      if (priority !== 'all' && task.priority !== priority) return false
      if (query) {
        const haystack = `${task.title} ${task.description}`.toLowerCase()
        if (!haystack.includes(query)) return false
      }
      return true
    })
    return sortTasks(filtered, sortBy, lang)
  }, [tasks, search, status, priority, sortBy, lang])

  const dragEnabled = sortBy === 'custom'
  const filtersActive = search.trim() !== '' || status !== 'all' || priority !== 'all'

  const resetFilters = () => {
    setSearch('')
    setStatus('all')
    setPriority('all')
  }

  const handleStatusChange = (id, value) => updateTask(id, { status: value })

  const handleSaveEdit = async (values) => {
    if (!editing) return
    await updateTask(editing.id, values)
    setEditing(null)
  }

  const exportFilename = (extension) => {
    const stamp = new Date().toISOString().slice(0, 10)
    const label = user.guest
      ? 'guest'
      : (user.name || 'user').toLowerCase().replace(/\s+/g, '-')
    return `doneo-tasks-${label}-${stamp}.${extension}`
  }

  const handleExportCSV = () =>
    downloadCSV(visibleTasks, exportFilename('csv'), { t, locale })
  const handleExportJSON = () =>
    downloadJSON(visibleTasks, exportFilename('json'), { lang })

  return (
    <div className="page">
      <PageHead
        title={t('pages.tasks.title')}
        subtitle={t('pages.tasks.subtitle')}
        actions={
          <ExportButtons
            onExportCSV={handleExportCSV}
            onExportJSON={handleExportJSON}
            hint={t('pages.tasks.exportHint')}
          />
        }
      />

      <StatsBar stats={stats} onClearCompleted={clearCompleted} />

      <TaskForm onSubmit={addTask} compact />

      <FilterBar
        search={search}
        onSearch={setSearch}
        status={status}
        onStatus={setStatus}
        priority={priority}
        onPriority={setPriority}
        sortBy={sortBy}
        onSortBy={setSortBy}
        resultCount={visibleTasks.length}
        total={tasks.length}
        onReset={resetFilters}
        dragEnabled={dragEnabled}
      />

      {loading ? (
        <div className="empty">
          <span className="empty__icon" aria-hidden="true">⏳</span>
          <p className="empty__title">{t('list.loading')}</p>
        </div>
      ) : (
        <TaskList
          tasks={visibleTasks}
          onEdit={setEditing}
          onDelete={removeTask}
          onToggleStatus={toggleStatus}
          onStatusChange={handleStatusChange}
          dragEnabled={dragEnabled}
          onReorder={reorderTasks}
          filtered={filtersActive}
        />
      )}

      {editing && (
        <Modal title={t('modal.editTitle')} onClose={() => setEditing(null)}>
          <TaskForm
            initial={editing}
            onSubmit={handleSaveEdit}
            onCancel={() => setEditing(null)}
            submitLabel={t('form.save')}
          />
        </Modal>
      )}
    </div>
  )
}