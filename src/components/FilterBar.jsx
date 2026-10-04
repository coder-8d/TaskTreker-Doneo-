import { PRIORITIES, STATUSES } from '../lib/tasks.js'
import { useI18n } from '../i18n/index.jsx'

const SORT_OPTIONS = [
  { value: 'custom', key: 'filters.sortCustom' },
  { value: 'created', key: 'filters.sortCreated' },
  { value: 'due-asc', key: 'filters.sortDueAsc' },
  { value: 'due-desc', key: 'filters.sortDueDesc' },
  { value: 'priority', key: 'filters.sortPriority' },
  { value: 'title', key: 'filters.sortTitle' },
]

export default function FilterBar({
  search,
  onSearch,
  status,
  onStatus,
  priority,
  onPriority,
  sortBy,
  onSortBy,
  resultCount,
  total,
  onReset,
  dragEnabled,
}) {
  const { t } = useI18n()
  const filtersActive =
    search.trim() !== '' || status !== 'all' || priority !== 'all'

  return (
    <section className="filters" aria-label={t('filters.aria')}>
      <div className="filters__row">
        <div className="search">
          <span className="search__icon" aria-hidden="true">⌕</span>
          <input
            className="search__input"
            type="search"
            placeholder={t('filters.searchPlaceholder')}
            value={search}
            onChange={(e) => onSearch(e.target.value)}
          />
          {search && (
            <button
              className="search__clear"
              type="button"
              aria-label={t('filters.clearSearch')}
              onClick={() => onSearch('')}
            >
              ×
            </button>
          )}
        </div>

        <label className="select">
          <span className="select__label">{t('filters.status')}</span>
          <select className="select__input" value={status} onChange={(e) => onStatus(e.target.value)}>
            <option value="all">{t('filters.all')}</option>
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{t(s.labelKey)}</option>
            ))}
          </select>
        </label>

        <label className="select">
          <span className="select__label">{t('filters.priority')}</span>
          <select className="select__input" value={priority} onChange={(e) => onPriority(e.target.value)}>
            <option value="all">{t('filters.all')}</option>
            {PRIORITIES.map((p) => (
              <option key={p.value} value={p.value}>{t(p.labelKey)}</option>
            ))}
          </select>
        </label>

        <label className="select">
          <span className="select__label">{t('filters.sort')}</span>
          <select className="select__input" value={sortBy} onChange={(e) => onSortBy(e.target.value)}>
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{t(o.key)}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="filters__meta">
        <span>
          {t('filters.shown', { count: resultCount, total })}
        </span>
        {dragEnabled && (
          <span className="filters__hint">
            {t('filters.dragHint')}
          </span>
        )}
        {filtersActive && (
          <button className="btn btn--link" type="button" onClick={onReset}>
            {t('filters.reset')}
          </button>
        )}
      </div>
    </section>
  )
}
