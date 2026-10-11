import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { useI18n } from '../i18n/index.jsx'
import LanguageSwitcher from './LanguageSwitcher.jsx'
import Modal from './Modal.jsx'

const TABS = { LOGIN: 'login', REGISTER: 'register' }

export default function AuthScreen() {
  const { login, register, loginAsGuest, error, busy, clearError, mode } = useAuth()
  const { t } = useI18n()
  const [tab, setTab] = useState(TABS.LOGIN)

  // Поля формы.
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [remember, setRemember] = useState(true)
  const [localError, setLocalError] = useState('')
  const [guestWarning, setGuestWarning] = useState(false)

  const switchTab = (next) => {
    setTab(next)
    setLocalError('')
    clearError()
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLocalError('')

    if (tab === TABS.REGISTER) {
      if (password !== confirm) {
        setLocalError(t('auth.passwordMismatch'))
        return
      }
      await register({ name, email, password })
    } else {
      await login({ email, password, remember })
    }
  }

  const shownError = localError || error
  // Структурированные тексты предупреждения о входе в гостевой режим (см. i18n).
  const warning = t('auth.guestWarning')

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
            <h1 className="auth__title">{t('meta.name')}</h1>
            <p className="auth__subtitle">{t('auth.subtitle')}</p>
          </div>
        </div>

        <div className="auth__tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === TABS.LOGIN}
            className={`auth__tab ${tab === TABS.LOGIN ? 'is-active' : ''}`}
            onClick={() => switchTab(TABS.LOGIN)}
          >
            {t('auth.login')}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === TABS.REGISTER}
            className={`auth__tab ${tab === TABS.REGISTER ? 'is-active' : ''}`}
            onClick={() => switchTab(TABS.REGISTER)}
          >
            {t('auth.register')}
          </button>
        </div>

        <form className="auth__form" onSubmit={handleSubmit} noValidate>
          {tab === TABS.REGISTER && (
            <label className="field">
              <span className="field__label">{t('auth.name')}</span>
              <input
                className="field__input"
                type="text"
                autoComplete="name"
                placeholder={t('auth.namePlaceholder')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </label>
          )}

          <label className="field">
            <span className="field__label">{t('auth.email')}</span>
            <input
              className="field__input"
              type="email"
              autoComplete="email"
              placeholder={t('auth.emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label className="field">
            <span className="field__label">{t('auth.password')}</span>
            <input
              className="field__input"
              type="password"
              autoComplete={tab === TABS.REGISTER ? 'new-password' : 'current-password'}
              placeholder={t('auth.passwordPlaceholder')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          {tab === TABS.REGISTER && (
            <label className="field">
              <span className="field__label">{t('auth.confirm')}</span>
              <input
                className="field__input"
                type="password"
                autoComplete="new-password"
                placeholder={t('auth.confirmPlaceholder')}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </label>
          )}

          {tab === TABS.LOGIN && (
            <label className="checkbox">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              <span>{t('auth.remember')}</span>
            </label>
          )}

          {shownError && <p className="form-error" role="alert">{shownError}</p>}

          <button className="btn btn--primary btn--block" type="submit" disabled={busy}>
            {busy
              ? t('auth.busy')
              : tab === TABS.REGISTER
                ? t('auth.submitRegister')
                : t('auth.submitLogin')}
          </button>
        </form>

        <div className="auth__divider"><span>{t('common.or')}</span></div>

        <button
          className="btn btn--ghost btn--block"
          type="button"
          onClick={() => setGuestWarning(true)}
        >
          {t('auth.guest')}
        </button>

        {guestWarning && (
          <Modal title={warning.title} onClose={() => setGuestWarning(false)}>
            <div className="guest-warn">
              <p>{warning.hello}</p>
              <p className="guest-warn__note">{warning.note}</p>
              <ul className="guest-warn__list">
                {warning.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <p>{warning.tip}</p>
              <p className="guest-warn__ready">{warning.ready}</p>
              <p className="guest-warn__confirm">{warning.confirm}</p>
              <button
                className="btn btn--primary btn--block"
                type="button"
                onClick={async () => {
                  setGuestWarning(false)
                  await loginAsGuest()
                }}
              >
                {warning.button}
              </button>
            </div>
          </Modal>
        )}

        <p className="auth__hint">
          {t('auth.guestHint')}{' '}
          {mode === 'server' ? t('auth.guestHintServer') : t('auth.guestHintLocal')}
        </p>
      </div>
    </div>
  )
}
