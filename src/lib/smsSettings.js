import { apiFetch } from './api.js'

// Настройки SMS-напоминаний живут на сервере: номер телефона не должен
// попадать в браузерное хранилище.
export const getSmsSettings = () => apiFetch('/sms/settings')

export const saveSmsSettings = (payload) =>
  apiFetch('/sms/settings', { method: 'PUT', body: payload })

export const sendTestSms = () => apiFetch('/sms/test', { method: 'POST' })
