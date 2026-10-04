import { useI18n } from '../i18n/index.jsx'

// Переключатель языка интерфейса: O'zbekcha / Русский / English.
export default function LanguageSwitcher({ className = '' }) {
  const { lang, setLang, langs, t } = useI18n()

  return (
    <div
      className={`lang ${className}`.trim()}
      role="group"
      aria-label={t('header.language')}
    >
      {langs.map((item) => (
        <button
          key={item.code}
          type="button"
          className={`lang__btn ${lang === item.code ? 'is-active' : ''}`}
          onClick={() => setLang(item.code)}
          aria-pressed={lang === item.code}
          title={item.label}
        >
          {item.short}
        </button>
      ))}
    </div>
  )
}
