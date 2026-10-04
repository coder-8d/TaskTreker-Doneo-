import { useI18n } from '../i18n/index.jsx'

// Экран загрузки, пока приложение определяет режим (сервер/локально)
// и восстанавливает сессию.
export default function Splash() {
  const { t } = useI18n()

  return (
    <div className="splash">
      <span className="splash__logo">D</span>
      <div className="splash__dots" aria-label={t('common.loading')}>
        <span />
        <span />
        <span />
      </div>
    </div>
  )
}
