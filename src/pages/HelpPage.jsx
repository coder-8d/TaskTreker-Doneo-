import PageHead from '../components/PageHead.jsx'
import { useI18n } from '../i18n/index.jsx'

// Страница «Справка»: возможности, страницы, горячие клавиши и хранение данных.
export default function HelpPage() {
  const { t } = useI18n()

  const features = t('pages.help.featureList')
  const pages = t('pages.help.pages')
  const hotkeys = t('pages.help.hotkeys')

  return (
    <div className="page">
      <PageHead
        title={t('pages.help.title')}
        subtitle={t('pages.help.subtitle')}
      />

      <section className="panel">
        <h3 className="panel__title">{t('pages.help.features')}</h3>
        <div className="cards">
          {features.map((item) => (
            <article key={item.title} className="card">
              <h4 className="card__title">{item.title}</h4>
              <p className="card__text">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <h3 className="panel__title">{t('pages.help.pagesTitle')}</h3>
        <ul className="list">
          {pages.map((item) => (
            <li key={item.title} className="list__item">
              <span className="list__title">{item.title}</span>
              <span className="list__text">{item.text}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel">
        <h3 className="panel__title">{t('pages.help.hotkeysTitle')}</h3>
        <ul className="list">
          {hotkeys.map((item) => (
            <li key={item.keys} className="list__item">
              <kbd className="kbd">{item.keys}</kbd>
              <span className="list__text">{item.text}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel">
        <h3 className="panel__title">{t('pages.help.storageTitle')}</h3>
        <p className="panel__text">{t('pages.help.storageText')}</p>
      </section>

      <section className="panel">
        <h3 className="panel__title">{t('pages.help.apiTitle')}</h3>
        <p className="panel__text panel__text--mono">{t('pages.help.apiText')}</p>
      </section>

      <section className="panel">
        <h3 className="panel__title">{t('pages.help.techTitle')}</h3>
        <p className="panel__text">{t('pages.help.techText')}</p>
      </section>
    </div>
  )
}