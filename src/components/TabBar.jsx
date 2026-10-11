import { useI18n } from '../i18n/index.jsx'
import { Link, useRouter } from '../router/index.jsx'

// Нижняя панель вкладок для телефонов: дублирует навигацию шапки
// и показывается только на узких экранах (media max-width в index.css).
// Активность считается по списку маршрутов — «Ещё» активно и на
// Настройках, и на Справке, как и в шапке.
const TAB_ITEMS = [
  { to: 'tasks', icon: '✓', labelKey: 'nav.tasks', routes: ['tasks'] },
  { to: 'stats', icon: '▦', labelKey: 'nav.stats', routes: ['stats'] },
  { to: 'more', icon: '⋯', labelKey: 'nav.more', routes: ['more', 'settings', 'help'] },
]

export default function TabBar() {
  const { t } = useI18n()
  const { route } = useRouter()

  return (
    <nav className="tabbar" aria-label={t('meta.name')}>
      {TAB_ITEMS.map((item) => {
        const active = item.routes.includes(route)
        return (
          <Link
            key={item.to}
            to={item.to}
            className={`tabbar__link ${active ? 'is-active' : ''}`}
            aria-current={active ? 'page' : undefined}
          >
            <span className="tabbar__icon" aria-hidden="true">{item.icon}</span>
            <span className="tabbar__label">{t(item.labelKey)}</span>
          </Link>
        )
      })}
    </nav>
  )
}