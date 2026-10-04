// Каталог тарифов Doneo. Источник истины — сервер, клиент только рисует.
// Реальной оплаты нет: активация помечается demo: true (см. server/billing.js).

export const TRIERS = ['plus', 'pro', 'ultima']

export const PERIODS = [
  { id: 'month', months: 1 },
  { id: 'half', months: 6 },
  { id: 'year', months: 12 },
]

// Как часто показывается реклама (мс). Pro и Ultima — без рекламы.
export const AD_INTERVALS = {
  free: 5 * 60 * 1000,
  plus: 10 * 60 * 1000,
  pro: 0,
  ultima: 0,
}

const TIERS = {
  plus: {
    id: 'plus',
    name: 'Plus',
    emoji: '💎',
    trialDays: 5,
    prices: { month: 1.49, half: 6.99, year: 11.99 },
    regular: { month: 1.49, half: 8.94, year: 17.88 },
    // Годовой тариф — самый выгодный вариант.
    badge: { year: 'bestValue' },
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    emoji: '🚀',
    trialDays: 7,
    prices: { month: 2.99, half: 14.99, year: 24.99 },
    regular: { month: 2.99, half: 17.94, year: 35.88 },
    badge: { year: 'popular' },
  },
  ultima: {
    id: 'ultima',
    name: 'Ultima',
    emoji: '👑',
    trialDays: 10,
    prices: { month: 4.99, half: 24.99, year: 39.99 },
    regular: { month: 4.99, half: 29.94, year: 59.88 },
    badge: { year: 'everything' },
  },
}

// Список функций по возрастанию тарифа: у Pro и Ultima видны «всё из Plus».
const FEATURE_TIERS = [
  { id: 'tasks', tier: 'plus' },
  { id: 'calendar', tier: 'plus' },
  { id: 'reminders', tier: 'plus' },
  { id: 'categories', tier: 'plus' },
  { id: 'priorities', tier: 'plus' },
  { id: 'basicThemes', tier: 'plus' },
  { id: 'recurring', tier: 'pro' },
  { id: 'advancedCalendar', tier: 'pro' },
  { id: 'smartReminders', tier: 'pro' },
  { id: 'stats', tier: 'pro' },
  { id: 'templates', tier: 'pro' },
  { id: 'advancedSearch', tier: 'pro' },
  { id: 'extraThemes', tier: 'pro' },
  { id: 'sync', tier: 'pro' },
  { id: 'aiAssistant', tier: 'ultima' },
  { id: 'aiDayPlanning', tier: 'ultima' },
  { id: 'autoPriorities', tier: 'ultima' },
  { id: 'weekPlanning', tier: 'ultima' },
  { id: 'goals', tier: 'ultima' },
  { id: 'advancedAnalytics', tier: 'ultima' },
  { id: 'exportAll', tier: 'ultima' },
  { id: 'sharedTasks', tier: 'ultima' },
  { id: 'exclusiveThemes', tier: 'ultima' },
]

const round2 = (value) => Math.round(value * 100) / 100

// Скидка, экономия и цена за месяц считаются, чтобы цифры не расходились.
function periodOffer(tier, periodId) {
  const price = tier.prices[periodId]
  const regular = tier.regular[periodId]
  const months = PERIODS.find((p) => p.id === periodId).months
  const savings = round2(regular - price)
  return {
    id: periodId,
    months,
    price,
    regular,
    savings,
    discount: regular > 0 ? Math.round((1 - price / regular) * 100) : 0,
    perMonth: round2(price / months),
    badge: tier.badge[periodId] || null,
  }
}

export function tierOrder(tierId) {
  const index = TRIERS.indexOf(tierId)
  return index === -1 ? -1 : index
}

// Возможности тарифа: свои + все, что в нижних (inherit: 'plus' → 'всё из Plus').
export function featuresFor(tierId) {
  const limit = tierOrder(tierId)
  if (limit < 0) return []
  return FEATURE_TIERS.filter((feature) => tierOrder(feature.tier) <= limit).map(
    (feature) => ({ ...feature, inherited: tierOrder(feature.tier) < limit }),
  )
}

export function planCatalog() {
  return TRIERS.map((tierId) => {
    const tier = TIERS[tierId]
    return {
      id: tier.id,
      name: tier.name,
      emoji: tier.emoji,
      trialDays: tier.trialDays,
      periods: PERIODS.map((period) => periodOffer(tier, period.id)),
      features: featuresFor(tier.id),
    }
  })
}

export function findTier(tierId) {
  return TIERS[tierId] || null
}

export function isValidPeriod(periodId) {
  return PERIODS.some((period) => period.id === periodId)
}
