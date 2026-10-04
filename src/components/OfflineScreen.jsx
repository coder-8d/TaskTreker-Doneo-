import { useState } from 'react'
import { useI18n } from '../i18n/index.jsx'

// Компактный офлайн-экран: не перекрывает приложение, а висит карточкой,
// чтобы задачи продолжали быть доступны.
export default function OfflineScreen({ online }) {
  const { t } = useI18n()
  const [checking, setChecking] = useState(false)

  if (online) return null

  const handleRetry = async () => {
    setChecking(true)
    try {
      await fetch('/api/health', { cache: 'no-store', signal: AbortSignal.timeout(4000) })
    } catch {
      /* сети всё ещё нет — перезагрузимся позже */
    }
    setChecking(false)
    window.location.reload()
  }

  return (
    <div className="offline" role="status">
      <div className="offline__card">
        <div className="offline__art" aria-hidden="true">
          <svg viewBox="0 0 120 90" className="offline__cloud">
            <g className="offline__cloud-body">
              <circle cx="38" cy="52" r="20" />
              <circle cx="60" cy="40" r="26" />
              <circle cx="82" cy="54" r="18" />
              <rect x="38" y="54" width="44" height="18" rx="9" />
            </g>
            <text className="offline__cloud-letter" x="60" y="50" textAnchor="middle">
              D
            </text>

            <g className="offline__wifi">
              <path d="M28 30 A34 34 0 0 1 92 30" />
              <path d="M38 40 A22 22 0 0 1 82 40" />
              <path d="M48 50 A10 10 0 0 1 72 50" />
              <circle cx="60" cy="60" r="2.6" className="offline__wifi-dot" />
            </g>
            <line className="offline__slash" x1="24" y1="72" x2="96" y2="16" />
          </svg>
        </div>

        <h2 className="offline__title">{t('offline.title')}</h2>
        <p className="offline__lead">{t('offline.lead')}</p>
        <p className="offline__text">{t('offline.body')}</p>
        <p className="offline__text">{t('offline.sync')}</p>

        <button
          className="btn btn--primary btn--sm"
          type="button"
          onClick={handleRetry}
          disabled={checking}
        >
          <span className="btn__icon" aria-hidden="true">🔄</span>
          {checking ? t('offline.checking') : t('offline.retry')}
        </button>

        <p className="offline__foot">{t('offline.fineprint')}</p>
        <code className="offline__code">&/ERR_CONNECTION_RESET / NETWORK_ERROR 503-ERR_CODE</code>
      </div>
    </div>
  )
}
