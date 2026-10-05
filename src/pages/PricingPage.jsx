import { Fragment, useEffect, useMemo, useState } from 'react'
import PageHead from '../components/PageHead.jsx'
import { useI18n } from '../i18n/index.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useSubscription } from '../context/SubscriptionContext.jsx'
import { getPlans } from '../lib/billing.js'

const PERIOD_KEYS = {
  month: 'plans.periodMonth',
  half: 'plans.periodHalf',
  year: 'plans.periodYear',
}

const PERIOD_SHORT = ['month', 'half', 'year']

const money = (value) => `$${Number(value).toFixed(2)}`

export default function PricingPage() {
  const { t, lang } = useI18n()
  const { mode } = useAuth()
  const { subscription, tier, activate, cancel } = useSubscription()

  const [plans, setPlans] = useState([])
  // По умолчанию показываем год — он самый выгодный.
  const [period, setPeriod] = useState('year')
  const [busy, setBusy] = useState('')
  const [cancelling, setCancelling] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    getPlans()
      .then((data) => alive && setPlans(data.plans || []))
      .catch(() => alive && setError(t('plans.loadError')))
    return () => {
      alive = false
    }
  }, [t])

  const tierName = useMemo(() => {
    const current = plans.find((plan) => plan.id === tier)
    return current ? `Doneo ${current.name}` : t('plans.freeName')
  }, [plans, tier, t])

  const trialLeft = Math.max(
    0,
    Math.ceil(((subscription.trialEndsAt || 0) - Date.now()) / 86400000),
  )

  const handleActivate = async (tierId, periodId) => {
    setBusy(tierId)
    setError('')
    setNotice('')
    try {
      const updated = await activate(tierId, periodId)
      setNotice(
        updated.status === 'trial'
          ? t('plans.activatedTrial', { tier: `Doneo ${tierName}`, days: updated.trialDays })
          : t('plans.activated'),
      )
    } catch (e) {
      setError(errorMessage(e) || t('plans.activateError'))
    } finally {
      setBusy('')
    }
  }

  const handleCancel = async () => {
    setError('')
    setNotice('')

    // Отменять нечего — всё равно отвечаем, чтобы кнопка никогда не «умирала».
    if (tier === 'free') {
      setNotice(t('plans.noSubscriptionHint'))
      return
    }

    setCancelling(true)
    try {
      const updated = await cancel()
      setNotice(
        updated.cancelAtPeriodEnd
          ? t('plans.cancelScheduled', { date: formatDate(updated.endsAt) })
          : t('plans.cancelled'),
      )
    } catch (e) {
      setError(errorMessage(e) || t('plans.cancelError'))
    } finally {
      setCancelling(false)
    }
  }

  const locale = lang === 'uz' ? 'uz-UZ' : lang === 'en' ? 'en-US' : 'ru-RU'
  const formatDate = (stamp) =>
    stamp ? new Date(stamp).toLocaleDateString(locale) : '—'

  // Сетевая ошибка браузера приходит по-английски — заменяем на понятный текст.
  const errorMessage = (e) => {
    const raw = e?.message || ''
    if (!raw || /fetch|network|load failed/i.test(raw)) return t('plans.serverUnreachable')
    return raw
  }

  return (
    <div className="page">
      <PageHead title={t('plans.title')} subtitle={t('plans.subtitle')} />

      {mode !== 'server' && <p className="plans__note">{t('plans.localMode')}</p>}

      {notice && <p className="plans__status plans__status--ok">{notice}</p>}
      {error && <p className="plans__status plans__status--error">{error}</p>}

      {subscription.status !== 'free' && (
        <div className="plans__current">
          <div className="plans__current-text">
            <span className="plans__current-name">
              {tierName}
              {subscription.status === 'trial' && (
                <span className="plans__pill plans__pill--trial">{t('plans.statusTrial')}</span>
              )}
              {subscription.status === 'active' && (
                <span className="plans__pill plans__pill--active">{t('plans.statusActive')}</span>
              )}
              {subscription.cancelAtPeriodEnd && (
                <span className="plans__pill">{t('plans.statusCancelling')}</span>
              )}
            </span>
            <span className="plans__current-hint">
              {subscription.status === 'trial'
                ? t('plans.trialLeft', { days: trialLeft })
                : t('plans.renewsAt', {
                    date: new Date(subscription.renewsAt).toLocaleDateString(lang === 'uz' ? 'uz-UZ' : lang === 'en' ? 'en-US' : 'ru-RU'),
                  })}
              {subscription.demo ? ` · ${t('plans.demoMode')}` : ''}
            </span>
          </div>
          <button
            className="btn btn--ghost btn--sm"
            type="button"
            onClick={handleCancel}
            disabled={cancelling}
          >
            {cancelling ? t('common.loading') : t('plans.cancel')}
          </button>
        </div>
      )}

      <div className="plans__periods" role="group" aria-label={t('plans.periodLabel')}>
        {PERIOD_SHORT.map((id) => (
          <button
            key={id}
            type="button"
            className={`plans__period ${period === id ? 'is-active' : ''}`}
            onClick={() => setPeriod(id)}
            aria-pressed={period === id}
          >
            {t(PERIOD_KEYS[id])}
            {id === 'year' && <span className="plans__period-badge">{t('plans.bestPeriod')}</span>}
          </button>
        ))}
      </div>

      {tier === 'free' && (
        <div className="plans__current plans__current--off">
          <div className="plans__current-text">
            <span className="plans__current-name">{t('plans.freeName')}</span>
            <span className="plans__current-hint">
              {subscription.cancelAtPeriodEnd
                ? t('plans.cancelScheduled', { date: formatDate(subscription.endsAt) })
                : t('plans.noSubscriptionHint')}
            </span>
          </div>
          <button
            className="btn btn--ghost btn--sm"
            type="button"
            onClick={handleCancel}
            disabled={cancelling}
            title={t('plans.noSubscriptionHint')}
          >
            {cancelling ? t('common.loading') : t('plans.cancel')}
          </button>
        </div>
      )}

      <div className="plans__grid">
        {plans.map((plan) => {
          const offer = plan.periods.find((item) => item.id === period) || plan.periods[0]
          const current = tier === plan.id
          const firstInherited = plan.features.findIndex((feature) => feature.inherited)
          const inheritedTier =
            firstInherited > -1
              ? plans.find((item) => item.id === plan.features[firstInherited].tier)
              : null

          return (
            <article
              key={plan.id}
              className={`plan plan--${plan.id} ${offer.badge ? 'plan--featured' : ''} ${
                current ? 'is-current' : ''
              }`}
            >
              {offer.badge && (
                <span className="plan__badge">{t(`plans.badges.${offer.badge}`)}</span>
              )}

              <header className="plan__head">
                <span className="plan__emoji" aria-hidden="true">{plan.emoji}</span>
                <div>
                  <h3 className="plan__name">Doneo {plan.name}</h3>
                  <p className="plan__tag">{t(`plans.tagline.${plan.id}`)}</p>
                </div>
              </header>

              <div className="plan__price">
                <span className="plan__amount">{money(offer.price)}</span>
                <span className="plan__per">/ {t(`plans.periodShort.${period}`)}</span>
              </div>

              <div className={`plan__deal ${offer.discount === 0 ? 'plan__deal--none' : ''}`}>
                {offer.discount > 0 ? (
                  <>
                    <s className="plan__regular">{money(offer.regular)}</s>
                    <span className="plan__discount">−{offer.discount}%</span>
                    <span className="plan__saving">
                      {t('plans.saving', { amount: money(offer.savings) })}
                    </span>
                    <span className="plan__perMonth">
                      {money(offer.perMonth)} / {t('plans.month')}
                    </span>
                  </>
                ) : (
                  <span className="plan__discount plan__discount--zero">
                    {t('plans.discountZero')}
                  </span>
                )}
              </div>

              <p className="plan__trial">
                <span aria-hidden="true">🎁</span> {t('plans.trial', { days: plan.trialDays })}
              </p>
              <p className="plan__after">
                {t('plans.afterTrial', {
                  price: money(offer.price),
                  period: t(PERIOD_KEYS[period]),
                })}
              </p>

              <button
                className={`btn btn--block ${current ? 'btn--ghost' : 'btn--primary'}`}
                type="button"
                onClick={() => handleActivate(plan.id, period)}
                disabled={busy === plan.id || current || mode !== 'server'}
              >
                {busy === plan.id
                  ? t('common.loading')
                  : current
                    ? t('plans.current')
                    : t('plans.tryFree')}
              </button>

              <ul className="plan__features">
                {plan.features.map((feature, index) => (
                  <Fragment key={feature.id}>
                    {index === firstInherited && inheritedTier && (
                      <li className="plan__divider">
                        {t('plans.inheritedFrom', { tier: `Doneo ${inheritedTier.name}` })}
                      </li>
                    )}
                    <li className={feature.inherited ? 'is-inherited' : ''}>
                      <span className="plan__check" aria-hidden="true">✓</span>
                      <span>{t(`plans.features.${feature.id}`)}</span>
                    </li>
                  </Fragment>
                ))}
              </ul>
            </article>
          )
        })}
      </div>
    </div>
  )
}
