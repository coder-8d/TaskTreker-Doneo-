import PageHead from '../components/PageHead.jsx'
import { useI18n } from '../i18n/index.jsx'
import { Link } from '../router/index.jsx'

// Страница «Ещё»: сюда вынесены Настройки и Справка, чтобы не занимать
// места в основной навигации шапки и в нижней таб-панели телефона.
const MORE_ENTRIES = [
  { to: 'settings', icon: '⚙', titleKey: 'nav.settings', hintKey: 'pages.more.settingsHint' },
  { to: 'help', icon: '?', titleKey: 'nav.help', hintKey: 'pages.more.helpHint' },
]

export default function MorePage() {
  const { t } = useI18n()

  return (
    <div className="page">
      <PageHead title={t('pages.more.title')} subtitle={t('pages.more.subtitle')} />

      <section className="panel">
        <div className="more-grid">
          {MORE_ENTRIES.map((item) => (
            <Link key={item.to} to={item.to} className="more-card">
              <span className="more-card__icon" aria-hidden="true">{item.icon}</span>
              <span className="more-card__body">
                <span className="more-card__title">{t(item.titleKey)}</span>
                <span className="more-card__hint">{t(item.hintKey)}</span>
              </span>
              <span className="more-card__arrow" aria-hidden="true">→</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}