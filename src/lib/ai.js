import { apiFetch } from './api.js'

// AI-советник: ChatGPT, Grok или Gemini. Выбор провайдера — на сервере.
export const getAiProviders = () => apiFetch('/ai/providers')

export const askAi = (question, providerId) =>
  apiFetch('/ai/advice', { method: 'POST', body: { question, providerId } })
