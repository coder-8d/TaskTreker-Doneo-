import { useState } from 'react'
import { useI18n } from '../i18n/index.jsx'
import { writeJSON } from '../lib/storage.js'
import AuthScreen from './AuthScreen.jsx'
import LanguageSwitcher from './LanguageSwitcher.jsx'

const DEVICE_KEY = 'doneo.device'

// Экраны до входа: выбор устройства → подтверждение «не робот» → форма входа.
// Шаги локальные (не маршруты): после logout возврат идёт на первый шаг,
// а выбранный тип устройства запоминается в doneo.device.
export default function PreAuth() {
  const { t } = useI18n()
  const [step, setStep] = useState('device') // 'device' | 'captcha' | 'auth'
  const [captcha, setCaptcha] = useState('idle') // 'idle' | 'checking' | 'verified'

  const chooseDevice = (value) => {
    writeJSON(DEVICE_KEY, value, 'local')
    setStep('captcha')
    setCaptcha('idle')
  }

  const verify = () => {
    if (captcha !== 'idle') return
    setCaptcha('checking')
    // Имитация серверной проверки: чекбокс подтверждается через паузу.
    setTimeout(() => setCaptcha('verified'), 1200)
  }

  if (step === 'auth') return <AuthScreen />

  const isDevice = step === 'device'

  return (
    <div className="auth">
      <div className="auth__glow" aria-hidden="true" />
      <div className="auth__card">
        <div className="auth__top">
          <LanguageSwitcher />
        </div>

        <div className="auth__brand">
          <span className="auth__logo">D</span>
          <div>
            <h1 className="auth__title">{t('welcome.hi')}</h1>
            <p className="auth__subtitle">
              {isDevice ? t('welcome.chooseDevice') : t('welcome.captchaText')}
            </p>
          </div>
        </div>

        {isDevice && (
          <div className="device-list">
            <button className="device-btn" type="button" onClick={() => chooseDevice('phone')}>
              <span className="device-btn__icon" aria-hidden="true">📱</span>
              <span className="device-btn__body">
                <span className="device-btn__title">{t('welcome.phone')}</span>
                <span className="device-btn__hint">{t('welcome.phoneHint')}</span>
              </span>
              <span className="device-btn__arrow" aria-hidden="true">→</span>
            </button>
            <button className="device-btn" type="button" onClick={() => chooseDevice('laptop')}>
              <span className="device-btn__icon" aria-hidden="true">💻</span>
              <span className="device-btn__body">
                <span className="device-btn__title">{t('welcome.laptop')}</span>
                <span className="device-btn__hint">{t('welcome.laptopHint')}</span>
              </span>
              <span className="device-btn__arrow" aria-hidden="true">→</span>
            </button>
          </div>
        )}

        {!isDevice && (
          <div className="captcha-step">
            <button
              className={`captcha${captcha === 'checking' ? ' is-checking' : ''}${captcha === 'verified' ? ' is-verified' : ''}`}
              type="button"
              onClick={verify}
              disabled={captcha !== 'idle'}
              aria-pressed={captcha === 'verified'}
            >
              <span className="captcha__box" aria-hidden="true">
                {captcha === 'checking' && <span className="captcha__spinner" />}
                {captcha === 'verified' && '✓'}
              </span>
              <span className="captcha__label">
                {captcha === 'checking'
                  ? t('welcome.captchaChecking')
                  : captcha === 'verified'
                    ? t('welcome.captchaVerified')
                    : t('welcome.captcha')}
              </span>
              <span className="captcha__brand" aria-hidden="true">
                <strong>Doneo</strong>
                <span>Verify</span>
              </span>
            </button>

            <button
              className="btn btn--primary btn--block"
              type="button"
              disabled={captcha !== 'verified'}
              onClick={() => setStep('auth')}
            >
              {t('welcome.continue')}
            </button>

            <button
              className="btn btn--link btn--block"
              type="button"
              onClick={() => setStep('device')}
            >
              {t('welcome.back')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}