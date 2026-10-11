import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

// Мини-роутер на хэш-маршрутах: не требует серверных rewrite-правил,
// работает из статического билда и сохраняет историю браузера.
// «more» — меню «Ещё»: ведёт на Настройки и Справку (они скрыты из основной навигации).
export const ROUTES = ['tasks', 'stats', 'more', 'settings', 'help']
export const DEFAULT_ROUTE = 'tasks'

const RouterContext = createContext(null)

function parseHash(hash) {
  const raw = String(hash || '')
    .replace(/^#\/?/, '')
    .split('?')[0]
    .trim()
  return ROUTES.includes(raw) ? raw : DEFAULT_ROUTE
}

export function RouterProvider({ children }) {
  const [route, setRoute] = useState(() =>
    typeof window === 'undefined' ? DEFAULT_ROUTE : parseHash(window.location.hash),
  )

  useEffect(() => {
    const sync = () => {
      setRoute(parseHash(window.location.hash))
      window.scrollTo({ top: 0, behavior: 'auto' })
    }

    window.addEventListener('hashchange', sync)

    // Нормализуем адрес: пустой или неизвестный хэш → #/tasks.
    const initial = parseHash(window.location.hash)
    if (window.location.hash !== `#/${initial}`) {
      window.history.replaceState(null, '', `#/${initial}`)
    }

    return () => window.removeEventListener('hashchange', sync)
  }, [])

  const navigate = useCallback((next, { replace = false } = {}) => {
    const target = ROUTES.includes(next) ? next : DEFAULT_ROUTE
    const hash = `#/${target}`
    if (window.location.hash === hash) return
    if (replace) {
      window.history.replaceState(null, '', hash)
      setRoute(target)
    } else {
      window.location.hash = hash
    }
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [])

  const value = useMemo(() => ({ route, navigate }), [route, navigate])

  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>
}

export function useRouter() {
  const ctx = useContext(RouterContext)
  if (!ctx) throw new Error('useRouter должен использоваться внутри RouterProvider')
  return ctx
}

export function Link({ to, className = '', onClick, children, ...rest }) {
  const { navigate } = useRouter()

  const handleClick = (event) => {
    if (onClick) onClick(event)
    // Уважаем открытие в новой вкладке и модификаторы клавиатуры.
    if (event.defaultPrevented) return
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return
    }
    event.preventDefault()
    navigate(to)
  }

  return (
    <a href={`#/${to}`} className={className} onClick={handleClick} {...rest}>
      {children}
    </a>
  )
}

export function NavLink({ to, className = '', activeClassName = 'is-active', children, ...rest }) {
  const { route } = useRouter()
  const active = route === to
  const classes = [className, active ? activeClassName : ''].filter(Boolean).join(' ')

  return (
    <Link
      to={to}
      className={classes}
      aria-current={active ? 'page' : undefined}
      {...rest}
    >
      {children}
    </Link>
  )
}
