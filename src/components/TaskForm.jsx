import { useEffect, useState } from 'react'
import { PRIORITIES, STATUSES, duePreset, normalizeDue, toDateTimeInput } from '../lib/tasks.js'
import { useI18n } from '../i18n/index.jsx'

const EMPTY = {
  title: '',
  description: '',
  status: 'todo',
  priority: 'medium',
  dueDate: '',
}

// Быстрые пресеты дедлайна под полем ввода.
const PRESETS = [
  { kind: 'today', key: 'form.dueToday' },
  { kind: 'tomorrow', key: 'form.dueTomorrow' },
  { kind: 'week', key: 'form.dueWeek' },
]

// Одна форма используется и для создания (compact), и для редактирования.
export default function TaskForm({ initial, onSubmit, onCancel, submitLabel, compact = false }) {
  const { t } = useI18n()
  const [values, setValues] = useState(EMPTY)
  const [error, setError] = useState('')

  useEffect(() => {
    if (initial) {
      setValues({
        title: initial.title || '',
        description: initial.description || '',
        status: initial.status || 'todo',
        priority: initial.priority || 'medium',
        dueDate: normalizeDue(initial.dueDate),
      })
    } else {
      setValues(EMPTY)
    }
    setError('')
  }, [initial])

  const update = (key) => (event) => {
    setValues((prev) => ({ ...prev, [key]: event.target.value }))
  }

  const submit = (event) => {
    event.preventDefault()
    if (!values.title.trim()) {
      setError(t('form.requiredTitle'))
      return
    }
    onSubmit(values)
    if (!initial) {
      setValues(EMPTY)
    }
    setError('')
  }

  return (
    <form className={`task-form ${compact ? 'task-form--compact' : ''}`} onSubmit={submit}>
      <div className="task-form__grid">
        <label className="field field--wide">
          <span className="field__label">{t('form.title')}</span>
          <input
            className="field__input"
            type="text"
            placeholder={t('form.titlePlaceholder')}
            value={values.title}
            onChange={update('title')}
            autoFocus={compact}
          />
        </label>

        <label className="field field--wide">
          <span className="field__label">{t('form.description')}</span>
          <textarea
            className="field__input field__textarea"
            rows={compact ? 2 : 3}
            placeholder={t('form.descriptionPlaceholder')}
            value={values.description}
            onChange={update('description')}
          />
        </label>

        <label className="field">
          <span className="field__label">{t('form.status')}</span>
          <select className="field__input" value={values.status} onChange={update('status')}>
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{t(s.labelKey)}</option>
            ))}
          </select>
        </label>

        <label className="field">
          <span className="field__label">{t('form.priority')}</span>
          <select className="field__input" value={values.priority} onChange={update('priority')}>
            {PRIORITIES.map((p) => (
              <option key={p.value} value={p.value}>{t(p.labelKey)}</option>
            ))}
          </select>
        </label>

        <label className="field field--due">
          <span className="field__label">{t('form.dueDate')}</span>
          <input
            className="field__input"
            type="datetime-local"
            step={300}
            value={toDateTimeInput(values.dueDate)}
            onChange={update('dueDate')}
          />
          <span className="due-presets">
            {PRESETS.map((preset) => (
              <button
                key={preset.kind}
                type="button"
                className="due-presets__btn"
                onClick={() =>
                  setValues((prev) => ({ ...prev, dueDate: duePreset(preset.kind) }))
                }
              >
                {t(preset.key)}
              </button>
            ))}
            {values.dueDate && (
              <button
                type="button"
                className="due-presets__btn due-presets__btn--clear"
                onClick={() => setValues((prev) => ({ ...prev, dueDate: '' }))}
              >
                {t('form.dueClear')}
              </button>
            )}
          </span>
        </label>
      </div>

      {error && <p className="form-error" role="alert">{error}</p>}

      <div className="task-form__actions">
        {onCancel && (
          <button className="btn btn--ghost" type="button" onClick={onCancel}>
            {t('form.cancel')}
          </button>
        )}
        <button className="btn btn--primary" type="submit">
          {!initial && <span className="btn__plus" aria-hidden="true">+</span>}
          {submitLabel || (initial ? t('form.save') : t('form.add'))}
        </button>
      </div>
    </form>
  )
}
