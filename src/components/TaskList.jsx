import { useState } from 'react'
import TaskItem from './TaskItem.jsx'
import { useI18n } from '../i18n/index.jsx'

// Список задач с поддержкой drag-and-drop (когда включён режим «Своя сортировка»).
export default function TaskList({
  tasks,
  onEdit,
  onDelete,
  onToggleStatus,
  onStatusChange,
  dragEnabled = false,
  onReorder,
  filtered = false,
}) {
  const { t } = useI18n()
  const [draggingId, setDraggingId] = useState(null)
  const [overId, setOverId] = useState(null)

  const handleDragStart = (event, id, cardEl) => {
    setDraggingId(id)
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', id)
    if (cardEl) event.dataTransfer.setDragImage(cardEl, 24, 24)
  }

  const handleDragEnd = () => {
    setDraggingId(null)
    setOverId(null)
  }

  const handleDragOver = (event, id) => {
    if (!draggingId) return
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    if (id !== overId) setOverId(id)
  }

  const handleDrop = (event, id) => {
    event.preventDefault()
    if (draggingId && draggingId !== id) onReorder(draggingId, id)
    handleDragEnd()
  }

  // Перемещение на одну позицию — работает на тач-устройствах и с клавиатуры.
  const moveBy = (id, delta) => {
    const index = tasks.findIndex((t) => t.id === id)
    const target = tasks[index + delta]
    if (!target) return
    onReorder(id, target.id)
  }

  if (tasks.length === 0) {
    return (
      <div className="empty">
        <span className="empty__icon" aria-hidden="true">🗒</span>
        <p className="empty__title">
          {filtered ? t('list.emptyFiltered') : t('list.emptyTitle')}
        </p>
        <p className="empty__text">
          {filtered ? t('list.emptyFilteredText') : t('list.emptyText')}
        </p>
      </div>
    )
  }

  return (
    <ul className="task-list">
      {tasks.map((task, index) => (
        <li key={task.id} className="task-list__item">
          <TaskItem
            task={task}
            onEdit={onEdit}
            onDelete={onDelete}
            onToggleStatus={onToggleStatus}
            onStatusChange={onStatusChange}
            dragEnabled={dragEnabled}
            isDragging={draggingId === task.id}
            isOver={overId === task.id}
            isFirst={index === 0}
            isLast={index === tasks.length - 1}
            onMove={moveBy}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          />
        </li>
      ))}
    </ul>
  )
}
