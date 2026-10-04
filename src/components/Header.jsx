import { useAuth } from '../context/AuthContext.jsx'
import { useTheme } from '../hooks/useTheme.js'
import { useI18n } from '../i18n/index.jsx'
import { NavLink } from '../router/index.jsx'
import LanguageSwitcher from './LanguageSwitcher.jsx'

// Пункты навигации между страницами Doneo.
const NAV_ITEMS = [
  { to: 'tasks', icon: '✓', labelKey: 'nav.tasks' },
  { to: 'stats', icon: '▦', labelKey: 'nav.stats' },
  { to: 'settings', icon: '⚙', labelKey: 'nav.settings' },
  { to: 'help', icon: '?', labelKey: 'nav.help' },
]

function initials(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

export default function Header({ taskCount = 0 }) {
  const { user, mode, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { t } = useI18n()

  const isServer = mode === 'server'

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
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.to} to={item.to} className="nav__link">
            <span className="nav__icon" aria-hidden="true">{item.icon}</span>
            <span className="nav__label">{t(item.labelKey)}</span>
          </NavLink>
        ))}
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
          title={theme === 'dark' ? t('header.themeToLight') : t('header.themeToDark')}
          aria-label={t('header.themeToggle')}
        >
          {theme === 'dark' ? '☀' : '☾'}
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
