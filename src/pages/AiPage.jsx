import { useState } from 'react'
import PageHead from '../components/PageHead.jsx'
import { useI18n } from '../i18n/index.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useOnline } from '../hooks/useOnline.js'
import { useSubscription } from '../context/SubscriptionContext.jsx'
import { askAi } from '../lib/ai.js'

const STARTERS = ['ai.samples.one', 'ai.samples.two', 'ai.samples.three']

// AI-советник (тариф Ultima). Источник выбирает сервер автоматически,
// пользователю остаётся только кнопка «Отправить запрос». Без сети или
// без ключа показываются офлайн-советы, а не ошибка.
export default function AiPage() {
  const { t } = useI18n()
  const { mode } = useAuth()
  const { tier } = useSubscription()
  const online = useOnline()

  const [question, setQuestion] = useState('')
  const [result, setResult] = useState(null)
  const [busy, setBusy] = useState(false)

  const allowed = tier === 'ultima'


  const ask = async (text) => {
    const value = String(text ?? question).trim()
    if (!value) return
    setBusy(true)
    setResult(null)
    try {
      const data = await askAi(value)
      setResult(data)
    } catch (error) {
      setResult({ offline: true, tips: [], error: error.message })
    } finally {
      setBusy(false)
    }
  }

  if (!allowed) {
    return (
      <div className="page">
        <PageHead title={t('ai.title')} subtitle={t('ai.subtitle')} />
        <div className="empty">
          <span className="empty__icon" aria-hidden="true">👑</span>
          <p className="empty__title">{t('ai.lockedTitle')}</p>
          <p className="empty__text">{t('ai.lockedText')}</p>
          <a className="btn btn--primary btn--sm" href="#/pricing">
            {t('ai.lockedCta')}
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <PageHead title={t('ai.title')} subtitle={t('ai.subtitle')} />

      {!online && (
        <p className="plans__status plans__status--warn">{t('ai.offlineBanner')}</p>
      )}

      <section className="panel">
        <h3 className="panel__title">{t('ai.askTitle')}</h3>

        <label className="field">
          <span className="field__label">{t('ai.questionLabel')}</span>
          <textarea
            className="field__input field__textarea"
            rows={3}
            placeholder={t('ai.questionPlaceholder')}
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
          />
        </label>

        <div className="ai__samples">
          {STARTERS.map((key) => (
            <button
              key={key}
              type="button"
              className="ai__sample"
              onClick={() => {
                setQuestion(t(key))
                ask(t(key))
              }}
            >
              {t(key)}
            </button>
          ))}
        </div>

        <div className="task-form__actions">
          <button
            className="btn btn--primary"
            type="button"
            onClick={() => ask()}
            disabled={busy || !question.trim()}
          >
            {busy ? t('ai.thinking') : t('ai.sendRequest')}
          </button>
        </div>
      </section>

      {result && (
        <section className="panel">
          <h3 className="panel__title">
            {result.offline ? t('ai.offlineTitle') : t('ai.answerTitle')}
          </h3>

          {!result.offline && result.answer && <p className="ai__answer">{result.answer}</p>}

          {result.offline && (
            <>
              <p className="panel__text">{t('ai.offlineText')}</p>
              {result.reason && result.reason !== 'not_configured' && (
                <p className="sms__status sms__status--error">
                  {t('ai.providerError', {
                    reason: result.reason,
                    detail: result.detail || '—',
                  })}
                </p>
              )}
              <ul className="ai__tips">
                {(result.tips || []).map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
              <button className="btn btn--ghost btn--sm" type="button" onClick={() => ask()}>
                {t('ai.retry')}
              </button>
            </>
          )}
        </section>
      )}
    </div>
  )
}
