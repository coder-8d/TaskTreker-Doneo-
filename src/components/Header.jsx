import { useAuth } from '../context/AuthContext.jsx'
import { useTheme } from '../hooks/useTheme.js'
import { useI18n } from '../i18n/index.jsx'
import { Link, useRouter } from '../router/index.jsx'
import LanguageSwitcher from './LanguageSwitcher.jsx'

// Пункты навигации между страницами Doneo.
// Настройки и Справка живут в разделе «Ещё» — шапка не перегружена,
// а на телефоне те же пункты уходят в нижнюю таб-панель (см. TabBar).
const NAV_ITEMS = [
  { to: 'tasks', icon: '✓', labelKey: 'nav.tasks', routes: ['tasks'] },
  { to: 'stats', icon: '▦', labelKey: 'nav.stats', routes: ['stats'] },
  { to: 'more', icon: '⋯', labelKey: 'nav.more', routes: ['more', 'settings', 'help'] },
]

function initials(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

export default function Header({ taskCount = 0 }) {
  const { user, mode, logout } = useAuth()
  const { theme, mode: themeMode, toggleTheme } = useTheme()
  const { t } = useI18n()
  const { route } = useRouter()

  const isServer = mode === 'server'
  // Кнопка темы циклит Light → Dark → Auto.
  const themeIcon = themeMode === 'auto' ? '◐' : theme === 'dark' ? '☾' : '☀'
  const themeLabel =
    themeMode === 'auto'
      ? t('pages.settings.themeAuto')
      : theme === 'dark'
        ? t('pages.settings.themeDark')
        : t('pages.settings.themeLight')

  return (
    <header className="header">
      <div className="header__brand">
        <span className="header__logo" aria-hidden="true">D</span>
        <div>
          <h1 className="header__title">{t('meta.name')}</h1>
          <p className="header__subtitle">
            {t('header.tasksCount', { count: taskCount })} ·{' '}
            {isServer ? t('mode.dataOnServer') : t('mode.dataInBrowser')}
          </p>
        </div>
      </div>

      <nav className="nav" aria-label={t('meta.name')}>
        {NAV_ITEMS.map((item) => {
          // Пункт «Ещё» активен и на Настройках, и на Справке.
          const active = item.routes.includes(route)
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`nav__link ${active ? 'is-active' : ''}`}
              aria-current={active ? 'page' : undefined}
            >
              <span className="nav__icon" aria-hidden="true">{item.icon}</span>
              <span className="nav__label">{t(item.labelKey)}</span>
            </Link>
          )
        })}
      </nav>

      <div className="header__actions">
        <span
          className={`mode-badge mode-badge--${mode}`}
          title={isServer ? t('mode.serverTitle') : t('mode.localTitle')}
        >
          <span className="mode-badge__dot" aria-hidden="true" />
          {isServer ? t('mode.server') : t('mode.local')}
        </span>

        <LanguageSwitcher />

        <button
          className="icon-btn"
          type="button"
          onClick={toggleTheme}
          title={`${t('header.themeToggle')}: ${themeLabel}`}
          aria-label={`${t('header.themeToggle')}: ${themeLabel}`}
        >
          {themeIcon}
        </button>

        <div className="user">
          <div className="user__meta">
            <span className="user__name">{user.name}</span>
            <span className="user__role">{user.guest ? t('header.guest') : user.email}</span>
          </div>
          <span className="user__avatar" aria-hidden="true">{initials(user.name)}</span>
          <button
            className="icon-btn icon-btn--danger"
            type="button"
            onClick={logout}
            title={t('header.logoutTitle')}
            aria-label={t('header.logout')}
          >
            ⎋
          </button>
        </div>
      </div>
    </header>
  )
}
