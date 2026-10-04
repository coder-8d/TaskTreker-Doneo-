// Отправка SMS через внешнего провайдера.
//
// Провайдер выбирается переменной окружения SMS_PROVIDER:
//   console — по умолчанию: сообщение только пишется в лог сервера;
//   twilio  — Twilio  (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM);
//   smsru   — SMS.ru  (SMSRU_API_ID).
//
// Секреты живут только на сервере и никогда не попадают в браузер.

const PROVIDERS = {
  console: 'console',
  twilio: 'Twilio',
  smsru: 'SMS.ru',
}

// У Twilio/SMS.ru код ответа обратный: 0 — успех.
export function smsProvider() {
  const name = String(process.env.SMS_PROVIDER || 'console').toLowerCase()
  return PROVIDERS[name] ? name : 'console'
}

export function smsProviderLabel() {
  return PROVIDERS[smsProvider()]
}

// Готов ли провайдер к реальной отправке (в console-режиме — всегда да).
export function smsConfigured() {
  switch (smsProvider()) {
    case 'twilio':
      return Boolean(
        process.env.TWILIO_ACCOUNT_SID &&
          process.env.TWILIO_AUTH_TOKEN &&
          process.env.TWILIO_FROM,
      )
    case 'smsru':
      return Boolean(process.env.SMSRU_API_ID)
    default:
      return true
  }
}

// Номер приводим к виду '+79991234567' — так его понимают все провайдеры.
export function normalizePhone(value) {
  const digits = String(value ?? '').trim().replace(/[^\d+]/g, '')
  if (!digits) return ''
  return /^\+?\d{7,15}$/.test(digits) ? digits : ''
}

export function maskPhone(phone) {
  const digits = String(phone || '')
  if (digits.length <= 4) return '***'
  return `${'*'.repeat(Math.max(0, digits.length - 4))}${digits.slice(-4)}`
}

export async function sendSms(to, text) {
  const phone = normalizePhone(to)
  const message = String(text || '').trim().slice(0, 480)

  if (!phone) return { ok: false, reason: 'invalid_phone' }
  if (!message) return { ok: false, reason: 'empty_message' }
  if (!smsConfigured()) return { ok: false, reason: 'not_configured' }

  switch (smsProvider()) {
    case 'twilio':
      return sendTwilio(phone, message)
    case 'smsru':
      return sendSmsRu(phone, message)
    default:
      return sendToConsole(phone, message)
  }
}

function sendToConsole(phone, message) {
  console.log(`[sms:console] → ${maskPhone(phone)}: ${message}`)
  return { ok: true, provider: 'console', mocked: true }
}

async function sendTwilio(phone, message) {
  const sid = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN
  const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ To: phone, From: process.env.TWILIO_FROM, Body: message }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return { ok: false, reason: 'provider_error', detail: data.message || `HTTP ${res.status}` }
    }
    return { ok: true, provider: 'twilio', sid: data.sid }
  } catch (error) {
    return { ok: false, reason: 'network', detail: error.message }
  }
}

async function sendSmsRu(phone, message) {
  const apiId = process.env.SMSRU_API_ID

  try {
    const res = await fetch(`https://api.sms.ru/sms/send?api_id=${encodeURIComponent(apiId)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: phone, text: message }),
    })
    const data = await res.json().catch(() => ({}))
    // У SMS.ru status 0 — успех, любое другое значение — ошибка.
    if (!res.ok || (data.status != null && Number(data.status) !== 0)) {
      return {
        ok: false,
        reason: 'provider_error',
        detail: data.message || (data.status != null ? `status ${data.status}` : `HTTP ${res.status}`),
      }
    }
    return { ok: true, provider: 'smsru', id: data.id }
  } catch (error) {
    return { ok: false, reason: 'network', detail: error.message }
  }
}