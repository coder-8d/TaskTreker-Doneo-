import { useEffect, useRef, useState } from 'react'
import { useI18n } from '../i18n/index.jsx'
import { useSubscription } from '../context/SubscriptionContext.jsx'
import { ADS, AD_SECONDS, adState, nextAd } from '../lib/ads.js'
import { onShowAd } from '../lib/adBus.js'

// Полноэкранная реклама (interstitial), а не всплывающий баннер.
//
// Правила показа:
//   • открывается сразу на весь экран, без вопроса «посмотреть?»;
//   • тонкая полоса прогресса с обратным отсчётом;
//   • крестик ✕ недоступен, пока идёт обязательное время;
//   • если ролик закончился раньше — чёрный экран и отсчёт продолжается;
//   • после отсчёта ролик может начаться заново, а ✕ появляется;
//   • автоматически реклама не закрывается — только по ✕.
//
// Частота: нет подписки — раз в 5 минут, Plus — раз в 10 минут,
// Pro и Ultima — рекламы нет. Первый показ только после полного интервала.
export default function AdSlot() {
  const { t } = useI18n()
  const { subscription, hasAds } = useSubscription()
  const interval = Number(subscription.adIntervalMs) || 0

  const [ad, setAd] = useState(null)
  const [elapsed, setElapsed] = useState(0)
  const startTimer = useRef(null)
  const tickTimer = useRef(null)

  useEffect(() => {
    if (!hasAds || interval <= 0) {
      setAd(null)
      return undefined
    }

    // Отсчёт до следующего показа — реклама не появляется при запуске.
    startTimer.current = setTimeout(() => {
      setAd(nextAd(0))
      setElapsed(0)
    }, interval)

    return () => clearTimeout(startTimer.current)
  }, [hasAds, interval])

  // Ручной показ из настроек: сразу, не дожидаясь таймера.
  useEffect(() => onShowAd(() => {
    setAd(nextAd(0))
    setElapsed(0)
  }), [])

  // Показывается объявление: тикаем каждую секунду.
  useEffect(() => {
    if (!ad) return undefined

    tickTimer.current = setInterval(() => {
      setElapsed((value) => value + 1)
    }, 1000)

    return () => clearInterval(tickTimer.current)
  }, [ad])

  const close = () => {
    setAd(null)
    setElapsed(0)
  }

  if (!ad) return null

  const { mandatoryLeft, closable, cycle, blackout, progress } = adState(elapsed, ad)
  const inBlackout = blackout

  return (
    <div className={`fsad fsad--${ad.tone}`} role="dialog" aria-modal="true" aria-label={t('ads.label')}>
      {inBlackout ? (
        // Ролик закончился раньше: чёрный экран, отсчёт продолжается.
        <div className="fsad__blackout">
          <span className="fsad__countdown">{mandatoryLeft}</span>
          <span className="fsad__countdown-label">{t('ads.endingIn')}</span>
        </div>
      ) : (
        <div className="fsad__content" key={`${ad.id}-${cycle}`}>
          <div className="fsad__inner">
            <span className="fsad__brand">{ad.brand}</span>
            <h2 className="fsad__title">{t(ad.titleKey)}</h2>
            <p className="fsad__text">{t(ad.textKey)}</p>
            {ad.noteKey && <p className="fsad__note">{t(ad.noteKey)}</p>}
          </div>
        </div>
      )}

      {/* Управление и прогресс — внизу, чтобы не закрывать креатив сверху */}
      <div className="fsad__bottom">
        <div
          className="fsad__progress"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={AD_SECONDS}
          aria-valuenow={mandatoryLeft}
        >
          <span className="fsad__progress-fill" style={{ width: `${progress}%` }} />
        </div>

        <div className="fsad__controls">
          {!closable ? (
            <span className="fsad__counter">
              {t('ads.endingIn')} {mandatoryLeft}
            </span>
          ) : (
            <span className="fsad__counter">{t('ads.canClose')}</span>
          )}

          {closable && (
            <button
              className="fsad__close"
              type="button"
              onClick={close}
              aria-label={t('ads.close')}
              title={t('ads.close')}
            >
              ✕
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
