import { useCallback, useEffect, useState } from 'react'
import { useI18n } from '../i18n/index.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { getSmsSettings, saveSmsSettings, sendTestSms } from '../lib/smsSettings.js'

// Подписи вариантов «напомнить за …» (значения — минуты).
const LEAD_KEYS = {
  10: 'sms.lead10',
  30: 'sms.lead30',
  60: 'sms.lead60',
  180: 'sms.lead180',
  1440: 'sms.lead1440',
  10080: 'sms.lead10080',
}

// Панель SMS-напоминаний на странице «Настройки».
export default function SmsPanel() {
  const { t } = useI18n()
  const { mode } = useAuth()
  const isServer = mode === 'server'

  const [settings, setSettings] = useState(null)
  const [phone, setPhone] = useState('')
  const [enabled, setEnabled] = useState(false)
  const [remindMinutes, setRemindMinutes] = useState(60)
  const [status, setStatus] = useState('')
  const [tone, setTone] = useState('info')
  const [busy, setBusy] = useState(false)

  const show = useCallback((message, nextTone = 'info') => {
    setStatus(message)
    setTone(nextTone)
  }, [])

  useEffect(() => {
    if (!isServer) return undefined
    let alive = true

    getSmsSettings()
      .then((data) => {
        if (!alive) return
        setSettings(data)
        setPhone(data.phone || '')
        setEnabled(Boolean(data.enabled))
        setRemindMinutes(data.remindMinutes)
      })
      .catch(() => {
        if (alive) show(t('sms.loadError'), 'error')
      })

    return () => {
      alive = false
    }
  }, [isServer, t, show])

  const handleSave = async () => {
    setBusy(true)
    show('')
    try {
      const data = await saveSmsSettings({ phone, enabled, remindMinutes })
      setSettings(data)
      setPhone(data.phone || '')
      setEnabled(Boolean(data.enabled))
      setRemindMinutes(data.remindMinutes)
      show(t('sms.saved'), 'ok')
    } catch (error) {
      show(error.message || t('sms.saveFailed'), 'error')
    } finally {
      setBusy(false)
    }
  }

  const handleTest = async () => {
    setBusy(true)
    show('')
    try {
      const result = await sendTestSms()
      show(
        result.mocked ? t('sms.testOkMock') : t('sms.testOk', { phone: settings?.maskedPhone }),
        'ok',
      )
      // Тестовое SMS подтверждает номер.
      setSettings((prev) => (prev ? { ...prev, verified: true } : prev))
    } catch (error) {
      show(error.message || t('sms.testFailed'), 'error')
    } finally {
      setBusy(false)
    }
  }

  const samePhone = Boolean(settings && phone === settings.phone)
  const verified = Boolean(settings && settings.verified) && samePhone

  return (
    <section className="panel">
      <h3 className="panel__title">{t('sms.title')}</h3>
      {!isServer && <p className="sms__note">{t('sms.unavailable')}</p>}

      {isServer && settings && (
        <>
          <p className="panel__text">{t('sms.intro')}</p>

          <div className="setting">
            <div className="setting__text">
              <span className="setting__label">{t('sms.phone')}</span>
              <span className="setting__hint">{t('sms.phoneHint')}</span>
            </div>
            <div className="sms__phone">
              <input
                className="field__input sms__input"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder={t('sms.phonePlaceholder')}
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
              />
              {samePhone && phone && (
                <span className={`sms__badge ${verified ? 'is-on' : ''}`}>
                  {verified ? t('sms.verified') : t('sms.notVerified')}
                </span>
              )}
            </div>
          </div>

          <div className="setting">
            <div className="setting__text">
              <span className="setting__label">{t('sms.enabled')}</span>
              <span className="setting__hint">{t('sms.enabledHint')}</span>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={enabled}
                disabled={!phone}
                onChange={(event) => setEnabled(event.target.checked)}
              />
              <span className="switch__track" aria-hidden="true" />
            </label>
          </div>

          <div className="setting">
            <div className="setting__text">
              <span className="setting__label">{t('sms.leadTime')}</span>
            </div>
            <select
              className="select__input sms__select"
              value={remindMinutes}
              onChange={(event) => setRemindMinutes(Number(event.target.value))}
            >
              {(settings.remindOptions || []).map((minutes) => (
                <option key={minutes} value={minutes}>
                  {t(LEAD_KEYS[minutes] || 'sms.lead60')}
                </option>
              ))}
            </select>
          </div>

          <div className="setting">
            <div className="setting__text">
              <span className="setting__label">{t('sms.provider')}</span>
              <span className="setting__hint">
                {settings.configured
                  ? t('sms.providerReady', { provider: settings.providerLabel })
                  : t('sms.providerMissing')}
              </span>
            </div>
            <span className={`sms__badge ${settings.configured ? 'is-on' : ''}`}>
              {settings.providerLabel}
            </span>
          </div>

          <div className="setting">
            <div className="setting__text">
              <span className="setting__hint">{t('sms.privacy')}</span>
            </div>
            <div className="sms__actions">
              <button
                className="btn btn--primary btn--sm"
                type="button"
                onClick={handleSave}
                disabled={busy}
              >
                {t('sms.save')}
              </button>
              <button
                className="btn btn--ghost btn--sm"
                type="button"
                onClick={handleTest}
                disabled={busy || !phone}
              >
                {t('sms.test')}
              </button>
            </div>
          </div>

          {status && <p className={`sms__status sms__status--${tone}`}>{status}</p>}
        </>
      )}
    </section>
  )
}