import { useRef } from 'react'
import { STATUSES, formatDue, isOverdue } from '../lib/tasks.js'
import { useI18n } from '../i18n/index.jsx'

export default function TaskItem({
  task,
  onEdit,
  onDelete,
  onToggleStatus,
  onStatusChange,
  dragEnabled = false,
  isDragging = false,
  isOver = false,
  isFirst = false,
  isLast = false,
  onMove,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}) {
  const { t, locale } = useI18n()
  const overdue = isOverdue(task)
  const cardRef = useRef(null)

  const dropClass = isDragging ? 'task--dragging' : isOver ? 'task--over' : ''

  return (
    <article
      ref={cardRef}
      className={`task task--${task.status} ${overdue ? 'task--overdue' : ''} ${
        dragEnabled ? 'task--draggable' : ''
      } ${dropClass}`}
      onDragOver={dragEnabled ? (e) => onDragOver(e, task.id) : undefined}
      onDrop={dragEnabled ? (e) => onDrop(e, task.id) : undefined}
    >
      {dragEnabled && (
        <span
          className="task__handle"
          draggable
          role="button"
          tabIndex={0}
          title={t('task.dragTitle')}
          aria-label={t('task.dragTitle')}
          onDragStart={(e) => onDragStart(e, task.id, cardRef.current)}
          onDragEnd={onDragEnd}
        >
          ⠿
        </span>
      )}

      <button
        className={`task__check ${task.status === 'done' ? 'is-done' : ''}`}
        type="button"
        aria-label={t('task.toggleStatus')}
        onClick={() => onToggleStatus(task.id)}
      >
        {task.status === 'done' ? '✓' : ''}
      </button>

      <div className="task__body">
        <div className="task__head">
          <h3 className={`task__title ${task.status === 'done' ? 'is-done' : ''}`}>
            {task.title}
          </h3>
          <span className={`badge badge--priority-${task.priority}`}>
            {t(`priority.${task.priority}`)}
          </span>
        </div>

        {task.description && <p className="task__desc">{task.description}</p>}

        <div className="task__meta">
          <select
            className={`chip chip--status chip--status-${task.status}`}
            value={task.status}
            onChange={(e) => onStatusChange(task.id, e.target.value)}
            aria-label={t('task.statusAria')}
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{t(s.labelKey)}</option>
            ))}
          </select>

          {task.dueDate && (
            <span className={`chip chip--date ${overdue ? 'is-overdue' : ''}`}>
              <span aria-hidden="true">📅</span>
              {formatDue(task.dueDate, locale)}
              {overdue && t('task.overdue')}
            </span>
          )}
        </div>
      </div>

      <div className="task__actions">
        {dragEnabled && (
          <>
            <button
              className="icon-btn"
              type="button"
              onClick={() => onMove(task.id, -1)}
              disabled={isFirst}
              aria-label={t('task.moveUp')}
              title={t('task.moveUp')}
            >
              ↑
            </button>
            <button
              className="icon-btn"
              type="button"
              onClick={() => onMove(task.id, 1)}
              disabled={isLast}
              aria-label={t('task.moveDown')}
              title={t('task.moveDown')}
            >
              ↓
            </button>
          </>
        )}
        <button
          className="icon-btn"
          type="button"
          onClick={() => onEdit(task)}
          aria-label={t('task.edit')}
          title={t('common.edit')}
        >
          ✎
        </button>
        <button
          className="icon-btn icon-btn--danger"
          type="button"
          onClick={() => onDelete(task.id)}
          aria-label={t('task.remove')}
          title={t('common.delete')}
        >
          🗑
        </button>
      </div>
    </article>
  )
}
