import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import * as billing from '../lib/billing.js'
import { useAuth } from './AuthContext.jsx'

const SubscriptionContext = createContext(null)

const FREE = {
  tier: 'free',
  status: 'free',
  adIntervalMs: 5 * 60 * 1000,
  trialEndsAt: 0,
  endsAt: 0,
  renewsAt: 0,
  demo: false,
}

// Тариф и интервал рекламы нужны шапке, рекламе, страницам цен и AI —
// держим их в одном контексте.
export function SubscriptionProvider({ children }) {
  const { user, mode } = useAuth()
  const [subscription, setSubscription] = useState(FREE)
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (!user || mode !== 'server') {
      setSubscription(FREE)
      return FREE
    }
    setLoading(true)
    try {
      const data = await billing.getSubscription()
      setSubscription(data)
      return data
    } catch {
      setSubscription(FREE)
      return FREE
    } finally {
      setLoading(false)
    }
  }, [user, mode])

  useEffect(() => {
    refresh()
  }, [refresh])

  const activate = useCallback(
    async (tierId, periodId) => {
      const updated = await billing.checkout(tierId, periodId)
      setSubscription(updated)
      return updated
    },
    [],
  )

  const cancel = useCallback(async () => {
    const updated = await billing.cancelSubscription()
    setSubscription(updated)
    return updated
  }, [])

  const tier = subscription.tier || 'free'
  const hasAds = Number(subscription.adIntervalMs) > 0

  const value = useMemo(
    () => ({ subscription, tier, hasAds, loading, refresh, activate, cancel }),
    [subscription, tier, hasAds, loading, refresh, activate, cancel],
  )

  return (
    <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>
  )
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext)
  if (!ctx) {
    throw new Error('useSubscription должен использоваться внутри SubscriptionProvider')
  }
  return ctx
}
