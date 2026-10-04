import { useEffect, useRef, useState } from 'react'
import { useI18n } from '../i18n/index.jsx'
import { useSubscription } from '../context/SubscriptionContext.jsx'
import { ADS, nextAd } from '../lib/ads.js'

// Реклама показывается по тарифу:
//   нет подписки → раз в 5 минут, Plus → раз в 10 минут, Pro/Ultima → нет.
// Первый показ — только после полного интервала, не сразу при запуске.
export default function AdSlot() {
  const { t } = useI18n()
  const { subscription, hasAds } = useSubscription()
  const interval = Number(subscription.adIntervalMs) || 0

  const [ad, setAd] = useState(null)
  const [index, setIndex] = useState(-1)
  const [left, setLeft] = useState(0)
  const [videoOpen, setVideoOpen] = useState(false)
  const timer = useRef(null)
  const tick = useRef(null)

  // Смена тарифа прямо во время работы сразу перенастраивает таймер:
  // при переходе на Pro/Ultima реклама исчезает без задержки.
  useEffect(() => {
    if (!hasAds || interval <= 0) {
      setAd(null)
      setLeft(0)
      if (timer.current) clearTimeout(timer.current)
      return undefined
    }

    const start = () => {
      setLeft(interval)
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => {
        setIndex((prev) => {
          const creative = nextAd(prev)
          setAd(creative)
          setVideoOpen(false)
          return (prev + 1) % ADS.length
        })
        start()
      }, interval)
    }

    start()

    tick.current = setInterval(() => {
      setLeft((value) => (value > 1000 ? value - 1000 : 0))
    }, 1000)

    return () => {
      if (timer.current) clearTimeout(timer.current)
      if (tick.current) clearInterval(tick.current)
    }
  }, [hasAds, interval])

  const close = () => {
    setAd(null)
    setVideoOpen(false)
  }

  if (!ad) return null

  const minutes = Math.max(1, Math.round(left / 60000))
  const isYoutube = String(ad.videoUrl || '').includes('youtube.com')

  return (
    <aside className={`ad ad--${ad.tone}`} role="complementary" aria-label={t('ads.label')}>
      <div className="ad__body">
        <div className="ad__head">
          <span className="ad__brand">{ad.brand}</span>
          <span className="ad__timer">
            {t('ads.nextIn', { minutes })}
          </span>
        </div>

        {videoOpen && isYoutube ? (
          <div className="ad__video">
            <iframe
              title={t(ad.titleKey)}
              src={`https://www.youtube-nocookie.com/embed/${
                new URL(ad.videoUrl).searchParams.get('v') || ''
              }`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="ad__text">
            <p className="ad__title">{t(ad.titleKey)}</p>
            <p className="ad__desc">{t(ad.textKey)}</p>
          </div>
        )}

        <div className="ad__actions">
          {ad.kind === 'video' && !videoOpen && (
            <button
              className="btn btn--export btn--sm"
              type="button"
              onClick={() => setVideoOpen(true)}
            >
              ▶ {t('ads.watch')}
            </button>
          )}
          {ad.to && (
            <a className="btn btn--export btn--sm" href={ad.to}>
              {t(ad.ctaKey)}
            </a>
          )}
          <button className="btn btn--link btn--sm" type="button" onClick={close}>
            {t('ads.close')}
          </button>
        </div>
      </div>
    </aside>
  )
}
