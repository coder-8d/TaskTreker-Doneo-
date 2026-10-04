import PageHead from '../components/PageHead.jsx'
import { useI18n } from '../i18n/index.jsx'
import { PRIORITIES, STATUSES, dueTime, isOverdue } from '../lib/tasks.js'

// Страница «Статистика»: сводка по статусам, приоритетам и дедлайнам.
export default function StatsPage({ tasks, stats }) {
  const { t } = useI18n()

  const percent = stats.total ? Math.round((stats.done / stats.total) * 100) : 0

  const byStatus = STATUSES.map((status) => ({
    key: status.value,
    label: t(status.labelKey),
    count: tasks.filter((task) => task.status === status.value).length,
  }))

  const byPriority = PRIORITIES.map((priority) => ({
    key: priority.value,
    label: t(priority.labelKey),
    count: tasks.filter((task) => task.priority === priority.value).length,
  }))

  const soon = Date.now() + 7 * 86400000
  const deadlines = [
    {
      key: 'overdue',
      label: t('pages.stats.overdue'),
      count: tasks.filter((task) => isOverdue(task)).length,
      tone: 'danger',
    },
    {
      key: 'upcoming',
      label: t('pages.stats.upcoming'),
      count: tasks.filter((task) => {
        if (!task.dueDate || task.status === 'done') return false
        const due = dueTime(task)
        return due >= Date.now() && due <= soon
      }).length,
      tone: 'progress',
    },
    {
      key: 'noDeadline',
      label: t('pages.stats.noDeadline'),
      count: tasks.filter((task) => !task.dueDate).length,
      tone: 'muted',
    },
    {
      key: 'highPriority',
      label: t('pages.stats.highPriority'),
      count: tasks.filter((task) => task.priority === 'high').length,
      tone: 'todo',
    },
  ]

  const maxCount = Math.max(1, ...byStatus.map((i) => i.count), ...byPriority.map((i) => i.count))

  return (
    <div className="page">
      <PageHead
        title={t('pages.stats.title')}
        subtitle={t('pages.stats.subtitle', { total: stats.total })}
      />

      {stats.total === 0 ? (
        <div className="empty">
          <span className="empty__icon" aria-hidden="true">📊</span>
          <p className="empty__title">{t('pages.stats.empty')}</p>
        </div>
      ) : (
        <>
          <div className="stats">
            <div className="stats__grid">
              <div className="stat stat--accent">
                <span className="stat__value">{stats.total}</span>
                <span className="stat__label">{t('pages.stats.total')}</span>
              </div>
              <div className="stat stat--done">
                <span className="stat__value">{stats.done}</span>
                <span className="stat__label">{t('pages.stats.completed')}</span>
              </div>
              <div className="stat stat--progress">
                <span className="stat__value">{percent}%</span>
                <span className="stat__label">{t('pages.stats.rate')}</span>
              </div>
              <div className="stat stat--todo">
                <span className="stat__value">{stats.active}</span>
                <span className="stat__label">{t('stats.active')}</span>
              </div>
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
          </div>

          <section className="panel">
            <h3 className="panel__title">{t('pages.stats.byStatus')}</h3>
            <ul className="bars">
              {byStatus.map((item) => (
                <li key={item.key} className={`bars__row bars__row--${item.key}`}>
                  <span className="bars__label">{item.label}</span>
                  <span className="bars__track">
                    <span
                      className="bars__fill"
                      style={{ width: `${(item.count / maxCount) * 100}%` }}
                    />
                  </span>
                  <span className="bars__value">{item.count}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="panel">
            <h3 className="panel__title">{t('pages.stats.byPriority')}</h3>
            <ul className="bars">
              {byPriority.map((item) => (
                <li key={item.key} className={`bars__row bars__row--priority-${item.key}`}>
                  <span className="bars__label">{item.label}</span>
                  <span className="bars__track">
                    <span
                      className="bars__fill"
                      style={{ width: `${(item.count / maxCount) * 100}%` }}
                    />
                  </span>
                  <span className="bars__value">{item.count}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="panel">
            <h3 className="panel__title">{t('pages.stats.deadlines')}</h3>
            <div className="tiles">
              {deadlines.map((item) => (
                <div key={item.key} className={`tile tile--${item.tone}`}>
                  <span className="tile__value">{item.count}</span>
                  <span className="tile__label">{item.label}</span>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  )
}