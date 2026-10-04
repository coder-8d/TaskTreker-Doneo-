import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import * as localAuth from '../lib/auth.js'
import * as serverAuth from '../lib/serverAuth.js'
import { useI18n } from '../i18n/index.jsx'
import {
  checkServer,
  clearStoredToken,
  getStoredToken,
  setStoredToken,
} from '../lib/api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const { lang, t } = useI18n()
  const [user, setUser] = useState(null)
  const [mode, setMode] = useState('local') // 'server' | 'local'
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  // При старте проверяем, доступно ли API. Если да — серверный режим
  // и восстановление сессии по токену, иначе — локальный.
  useEffect(() => {
    let alive = true
    ;(async () => {
      const isServer = await checkServer()
      if (!alive) return
      const nextMode = isServer ? 'server' : 'local'
      setMode(nextMode)

      if (nextMode === 'server') {
        if (getStoredToken()) {
          try {
            const { user: me } = await serverAuth.me()
            if (alive) setUser(me)
          } catch {
            clearStoredToken()
          }
        }
      } else {
        setUser(localAuth.getSession())
      }
      if (alive) setReady(true)
    })()
    return () => {
      alive = false
    }
  }, [])

  const register = useCallback(
    async (payload) => {
      setBusy(true)
      setError('')
      try {
        if (mode === 'server') {
          const { token, user: created } = await serverAuth.register({
            ...payload,
            lang,
          })
          setStoredToken(token, true)
          setUser(created)
        } else {
          const created = await localAuth.register(payload)
          localAuth.saveSession(created, true)
          setUser(localAuth.publicUser(created))
        }
        return true
      } catch (e) {
        setError(e.message || t('errors.register_failed'))
        return false
      } finally {
        setBusy(false)
      }
    },
    [mode, lang, t],
  )

  const login = useCallback(
    async ({ email, password, remember }) => {
      setBusy(true)
      setError('')
      try {
        if (mode === 'server') {
          const { token, user: found } = await serverAuth.login({ email, password })
          setStoredToken(token, remember)
          setUser(found)
        } else {
          const found = await localAuth.login({ email, password, remember })
          setUser(localAuth.publicUser(found))
        }
        return true
      } catch (e) {
        setError(e.message || t('errors.login_failed'))
        return false
      } finally {
        setBusy(false)
      }
    },
    [mode, t],
  )

  const loginAsGuest = useCallback(async () => {
    setError('')
    if (mode === 'server') {
      try {
        const { token, user: guest } = await serverAuth.guest({ lang })
        setStoredToken(token, false)
        setUser(guest)
      } catch (e) {
        setError(e.message || t('errors.guest_failed'))
      }
    } else {
      const guest = localAuth.loginAsGuest(t('header.guest'))
      setUser(localAuth.publicUser(guest))
    }
  }, [mode, lang, t])

  const logout = useCallback(async () => {
    if (mode === 'server') {
      try {
        await serverAuth.logout()
      } catch {
        /* игнорируем сетевые ошибки при выходе */
      }
      clearStoredToken()
    } else {
      localAuth.logout()
    }
    setUser(null)
    setError('')
  }, [mode])

  const clearError = useCallback(() => setError(''), [])

  const value = useMemo(
    () => ({
      user,
      mode,
      ready,
      error,
      busy,
      register,
      login,
      loginAsGuest,
      logout,
      clearError,
    }),
    [user, mode, ready, error, busy, register, login, loginAsGuest, logout, clearError],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth должен использоваться внутри AuthProvider')
  return ctx
}
