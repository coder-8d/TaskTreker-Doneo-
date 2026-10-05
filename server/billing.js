// Подписки и пробные периоды.
//
// ВАЖНО: реальной оплаты здесь нет. Активация помечается demo: true —
// подключение реального платёжного провайдера (Stripe и т.п.) делается
// в createOrder(): сейчас он просто сразу подтверждает подписку.
import { getDb, save } from './store.js'
import { findTier, isValidPeriod, PERIODS } from './plans.js'

const DAY = 86400000

function table() {
  const db = getDb()
  if (!db.subscriptions) db.subscriptions = {}
  return db.subscriptions
}

function monthsToMs(months) {
  return Math.round(months * 30.44 * DAY)
}

// Приводит запись к актуальному статусу: триал закончился → идёт оплаченный
// период → период закончился → free.
function evaluate(record) {
  const now = Date.now()
  const tier = findTier(record.tier) || null

  if (!tier) return freeSubscription()

  const trialEndsAt = record.trialEndsAt || 0
  const endsAt = record.endsAt || 0
  const inTrial = trialEndsAt > now
  const paid = !inTrial && endsAt > now

  if (!inTrial && !paid) {
    return { ...freeSubscription(), expiredTier: record.tier, expiredAt: endsAt }
  }

  return {
    tier: record.tier,
    status: inTrial ? 'trial' : 'active',
    trialDays: tier.trialDays,
    trialEndsAt,
    startedAt: record.startedAt,
    endsAt,
    // Сколько осталось пробного периода / оплаченного.
    renewsAt: inTrial ? trialEndsAt : endsAt,
    demo: Boolean(record.demo),
    cancelAtPeriodEnd: Boolean(record.cancelAtPeriodEnd),
  }
}

function freeSubscription() {
  return {
    tier: 'free',
    status: 'free',
    trialDays: 0,
    trialEndsAt: 0,
    startedAt: 0,
    endsAt: 0,
    renewsAt: 0,
    demo: false,
    cancelAtPeriodEnd: false,
  }
}

export function getSubscription(userId) {
  const record = table()[userId]
  return record ? evaluate(record) : freeSubscription()
}

// Создаёт подписку: сначала пробный период, потом оплаченный.
export function startSubscription(userId, { tierId, periodId }) {
  const tier = findTier(tierId)
  const period = PERIODS.find((item) => item.id === periodId)
  if (!tier || !period) return null

  const now = Date.now()
  const trialEndsAt = now + tier.trialDays * DAY

  const record = {
    tier: tier.id,
    periodId: period.id,
    // После пробного периода подписка переходит на выбранный платный тариф.
    endsAt: trialEndsAt + monthsToMs(period.months),
    trialEndsAt,
    startedAt: now,
    demo: true,
    cancelAtPeriodEnd: false,
  }

  table()[userId] = record
  save()
  return evaluate(record)
}

export function cancelSubscription(userId) {
  const table_ = table()
  if (!table_[userId]) return freeSubscription()
  table_[userId].cancelAtPeriodEnd = true
  save()
  return evaluate(table_[userId])
}

export function isValidSelection(tierId, periodId) {
  return Boolean(findTier(tierId)) && isValidPeriod(periodId)
}
