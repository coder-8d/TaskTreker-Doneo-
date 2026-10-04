import { apiFetch } from './api.js'

export const getPlans = () => apiFetch('/billing/plans')

export const getSubscription = () => apiFetch('/billing/subscription')

// Активация тарифа. Реальной оплаты нет — сервер подтверждает сразу (demo).
export const checkout = (tierId, periodId) =>
  apiFetch('/billing/checkout', { method: 'POST', body: { tierId, periodId } })

export const cancelSubscription = () =>
  apiFetch('/billing/cancel', { method: 'POST' })
