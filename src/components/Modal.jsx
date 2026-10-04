import { useEffect } from 'react'
import { useI18n } from '../i18n/index.jsx'

export default function Modal({ title, onClose, children }) {
  const { t } = useI18n()

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
      <div className="modal__backdrop" onClick={onClose} />
      <div className="modal__panel">
        <div className="modal__head">
          <h2 className="modal__title">{title}</h2>
          <button
            className="icon-btn"
            type="button"
            onClick={onClose}
            aria-label={t('modal.close')}
          >
            ×
          </button>
        </div>
        <div className="modal__body">{children}</div>
      </div>
    </div>
  )
}
