import PageHead from '../components/PageHead.jsx'
import ExportButtons from '../components/ExportButtons.jsx'
import { useI18n } from '../i18n/index.jsx'
import { useTheme } from '../hooks/useTheme.js'
import { downloadCSV } from '../lib/csv.js'
import { downloadJSON } from '../lib/json.js'

const THEMES = [
  { value: 'dark', icon: '☾', labelKey: 'pages.settings.themeDark' },
  { value: 'light', icon: '☀', labelKey: 'pages.settings.themeLight' },
]

// Страница «Настройки»: тема, язык, хранение данных, аккаунт и экспорт.
export default function SettingsPage({ user, mode, tasks, stats, clearCompleted, logout }) {
  const { t, lang, setLang, langs, locale } = useI18n()
  const { theme, toggleTheme } = useTheme()

  const isServer = mode === 'server'

  const exportFilename = (extension) => {
    const stamp = new Date().toISOString().slice(0, 10)
    const label = user.guest
      ? 'guest'
      : (user.name || 'user').toLowerCase().replace(/\s+/g, '-')
    return `doneo-tasks-${label}-${stamp}.${extension}`
  }

  const handleExportCSV = () =>
    downloadCSV(tasks, exportFilename('csv'), { t, locale })
  const handleExportJSON = () =>
    downloadJSON(tasks, exportFilename('json'), { lang })

  return (
    <div className="page">
      <PageHead
        title={t('pages.settings.title')}
        subtitle={t('pages.settings.subtitle')}
      />

      <section className="panel">
        <h3 className="panel__title">{t('pages.settings.appearance')}</h3>

        <div className="setting">
          <div className="setting__text">
            <span className="setting__label">{t('pages.settings.theme')}</span>
          </div>
          <div className="segmented" role="group" aria-label={t('pages.settings.theme')}>
            {THEMES.map((item) => (
              <button
                key={item.value}
                type="button"
                className={`segmented__btn ${theme === item.value ? 'is-active' : ''}`}
                onClick={() => theme !== item.value && toggleTheme()}
                aria-pressed={theme === item.value}
              >
                <span aria-hidden="true">{item.icon}</span> {t(item.labelKey)}
              </button>
            ))}
          </div>
        </div>

        <div className="setting setting--stack">
          <div className="setting__text">
            <span className="setting__label">{t('pages.settings.language')}</span>
            <span className="setting__hint">{t('pages.settings.languageHint')}</span>
          </div>
          <div className="radios">
            {langs.map((item) => (
              <label
                key={item.code}
                className={`radio ${lang === item.code ? 'is-active' : ''}`}
              >
                <input
                  type="radio"
                  name="lang"
                  value={item.code}
                  checked={lang === item.code}
                  onChange={() => setLang(item.code)}
                />
                <span className="radio__name">{item.label}</span>
                <span className="radio__code">{item.short}</span>
              </label>
            ))}
          </div>
        </div>
      </section>

      <section className="panel">
        <h3 className="panel__title">{t('pages.settings.data')}</h3>

        <div className="setting setting--stack">
          <div className="setting__text">
            <span className="setting__label">{t('pages.settings.mode')}</span>
            <span className={`mode-badge mode-badge--${mode}`}>
              <span className="mode-badge__dot" aria-hidden="true" />
              {isServer ? t('pages.settings.modeServer') : t('pages.settings.modeLocal')}
            </span>
            <span className="setting__hint">
              {isServer ? t('pages.settings.modeHintServer') : t('pages.settings.modeHintLocal')}
            </span>
          </div>
        </div>

        <div className="setting">
          <div className="setting__text">
            <span className="setting__label">{t('pages.settings.export')}</span>
            <span className="setting__hint">
              {t('pages.settings.exportHint', { count: tasks.length })}
            </span>
          </div>
          <ExportButtons
            onExportCSV={handleExportCSV}
            onExportJSON={handleExportJSON}
          />
        </div>
      </section>

      <section className="panel">
        <h3 className="panel__title">{t('pages.settings.account')}</h3>

        <dl className="details">
          <div className="details__row">
            <dt>{t('pages.settings.accountName')}</dt>
            <dd>{user.name}</dd>
          </div>
          <div className="details__row">
            <dt>{t('pages.settings.accountEmail')}</dt>
            <dd>{user.email || '—'}</dd>
          </div>
          <div className="details__row">
            <dt>{t('pages.settings.accountRole')}</dt>
            <dd>{user.guest ? t('pages.settings.roleGuest') : t('pages.settings.roleRegistered')}</dd>
          </div>
          <div className="details__row">
            <dt>{t('pages.settings.accountId')}</dt>
            <dd className="details__mono">{user.id}</dd>
          </div>
        </dl>
      </section>

      <section className="panel panel--danger">
        <h3 className="panel__title">{t('pages.settings.danger')}</h3>

        <div className="setting setting--stack">
          <div className="setting__text">
            <span className="setting__label">
              {t('pages.settings.clearCompleted', { count: stats.done })}
            </span>
            <span className="setting__hint">{t('pages.settings.clearCompletedHint')}</span>
          </div>
          <button
            className="btn btn--ghost btn--sm"
            type="button"
            onClick={clearCompleted}
            disabled={stats.done === 0}
          >
            {t('common.delete')}
          </button>
        </div>

        <div className="setting setting--stack">
          <div className="setting__text">
            <span className="setting__label">{t('pages.settings.logout')}</span>
            <span className="setting__hint">{t('pages.settings.logoutHint')}</span>
          </div>
          <button className="btn btn--ghost btn--sm" type="button" onClick={logout}>
            {t('header.logout')}
          </button>
        </div>
      </section>

      <section className="panel">
        <h3 className="panel__title">{t('pages.settings.about')}</h3>
        <p className="panel__text">{t('pages.settings.aboutText')}</p>
      </section>
    </div>
  )
}