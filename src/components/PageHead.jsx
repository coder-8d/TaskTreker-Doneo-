// Заголовок страницы: название, пояснение и действия справа.
export default function PageHead({ title, subtitle, actions }) {
  return (
    <div className="page-head">
      <div className="page-head__text">
        <h2 className="page-head__title">{title}</h2>
        {subtitle && <p className="page-head__subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="page-head__actions">{actions}</div>}
    </div>
  )
}
