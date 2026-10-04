import { useI18n } from '../i18n/index.jsx'

export default function StatsBar({ stats, onClearCompleted }) {
  const { t } = useI18n()

  const items = [
    { key: 'active', label: t('stats.active'), value: stats.active, tone: 'accent' },
    { key: 'todo', label: t('stats.todo'), value: stats.todo, tone: 'todo' },
    { key: 'progress', label: t('stats.progress'), value: stats.progress, tone: 'progress' },
    { key: 'done', label: t('stats.done'), value: stats.done, tone: 'done' },
  ]

  const percent = stats.total ? Math.round((stats.done / stats.total) * 100) : 0

  return (
    <section className="stats" aria-label={t('pages.stats.title')}>
      <div className="stats__grid">
        {items.map((item) => (
          <div key={item.key} className={`stat stat--${item.tone}`}>
            <span className="stat__value">{item.value}</span>
            <span className="stat__label">{item.label}</span>
          </div>
        ))}
      </div>

      <div className="progress">
        <div className="progress__head">
          <span>{t('stats.progressTitle')}</span>
          <span className="progress__percent">{percent}%</span>
        </div>
        <div className="progress__track">
          <div className="progress__fill" style={{ width: `${percent}%` }} />
        </div>
      </div>

      {stats.done > 0 && (
        <button className="btn btn--ghost btn--sm stats__clear" type="button" onClick={onClearCompleted}>
          {t('stats.clearCompleted', { count: stats.done })}
        </button>
      )}
    </section>
  )
}
