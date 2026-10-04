import { useI18n } from '../i18n/index.jsx'

// Кнопки экспорта. Используются на страницах «Задачи» (отфильтрованный
// список) и «Настройки» (полный список).
export default function ExportButtons({ onExportCSV, onExportJSON, hint, csvTitle, jsonTitle }) {
  const { t } = useI18n()

  return (
    <div className="export">
      {hint && <span className="export__hint">{hint}</span>}
      <button
        className="btn btn--export"
        type="button"
        onClick={onExportCSV}
        title={csvTitle || t('header.exportCSV')}
      >
        <span className="btn__icon" aria-hidden="true">⭳</span>
        {t('pages.tasks.exportCSV')}
      </button>
      <button
        className="btn btn--export"
        type="button"
        onClick={onExportJSON}
        title={jsonTitle || t('header.exportJSON')}
      >
        <span className="btn__icon" aria-hidden="true">⭳</span>
        {t('pages.tasks.exportJSON')}
      </button>
    </div>
  )
}
