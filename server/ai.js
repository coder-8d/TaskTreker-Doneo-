// AI-советник Doneo.
//
// Данные берутся ТОЛЬКО у ChatGPT, Grok или Gemini — других источников нет.
// Ключи провайдеров читаются из окружения на сервере и в браузер не попадают.
// Если ключей нет или интернет недоступен — возвращаем офлайн-советы,
// чтобы страница никогда не выглядела как ошибка.

const MAX_TOKENS = 400

const PROVIDERS = {
  chatgpt: {
    id: 'chatgpt',
    label: 'ChatGPT',
    envKey: 'OPENAI_API_KEY',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-4o-mini',
    auth: (key) => ({ Authorization: `Bearer ${key}` }),
    body: (question, lang) => ({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt(lang) },
        { role: 'user', content: question },
      ],
      max_tokens: MAX_TOKENS,
    }),
    read: (data) => data?.choices?.[0]?.message?.content || '',
  },
  grok: {
    id: 'grok',
    label: 'Grok',
    envKey: 'XAI_API_KEY',
    endpoint: 'https://api.x.ai/v1/chat/completions',
    model: 'grok-2-latest',
    auth: (key) => ({ Authorization: `Bearer ${key}` }),
    body: (question, lang) => ({
      model: 'grok-2-latest',
      messages: [
        { role: 'system', content: systemPrompt(lang) },
        { role: 'user', content: question },
      ],
      max_tokens: MAX_TOKENS,
    }),
    read: (data) => data?.choices?.[0]?.message?.content || '',
  },
  gemini: {
    id: 'gemini',
    label: 'Gemini',
    envKey: 'GEMINI_API_KEY',
    endpoint: (key, model) =>
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
    model: 'gemini-1.5-flash',
    auth: () => ({}),
    body: (question, lang) => ({
      systemInstruction: { parts: [{ text: systemPrompt(lang) }] },
      contents: [{ role: 'user', parts: [{ text: question }] }],
      generationConfig: { maxOutputTokens: MAX_TOKENS },
    }),
    read: (data) => data?.candidates?.[0]?.content?.parts?.[0]?.text || '',
  },
}

function systemPrompt(lang) {
  if (lang === 'en') {
    return 'You are a productivity advisor inside the Doneo task tracker. Give short, concrete advice about planning the day, priorities, breaks and habits. Maximum 6 sentences, no lists longer than 5 items. Reply in English.'
  }
  if (lang === 'uz') {
    return 'Siz Doneo vazifa trekeri ichidagi mahsuldorlik maslahatchisisiz. Kunni rejalashtirish, ustuvorlik, tanaffus va odatlar haqida qisqa va amaliy maslahat bering. Ko’pi bilan 6 jumla, ro’yxatda 5 tagacha element. O’zbek tilida javob bering.'
  }
  return 'Ты советник по продуктивности внутри трекера задач Doneo. Давай короткие и конкретные советы: планирование дня, приоритеты, перерывы, привычки. Не больше 6 предложений, в списках — до 5 пунктов. Отвечай на русском.'
}


// Офлайн-советы: показываются, когда ключей нет или сеть упала.
const OFFLINE_TIPS = {
  ru: [
    'Начни день с трёх самых важных задач — остальное легче.',
    'Ставь дедлайн с временем: «до 18:00» работает лучше, чем «сегодня».',
    'Если задача больше 60 минут — разбей её на шаги по 15 минут.',
    'Планируй 2 минуты вечером на завтрашний день.',
    'Каждые полчаса вставай и двигайся хотя бы минуту.',
    'Закрывай день списком того, что реально сделано, а не что планировалось.',
  ],
  en: [
    'Start the day with your three most important tasks — the rest gets easier.',
    'Always set a due date with a time: "before 18:00" beats "today".',
    'If a task takes more than an hour, split it into 15-minute steps.',
    'Spend 2 minutes in the evening planning tomorrow.',
    'Stand up and move for a minute every half hour.',
    'Close the day with what you actually finished, not what you planned.',
  ],
  uz: [
    'Kunni uchta eng muhim vazifa bilan boshlang — qolgani osonroq bo’ladi.',
    'Muddatga vaqt ham qo’ying: «soat 18:00 gacha» «bugun»dan yaxshi.',
    'Vazifa bir soatdan uzun bo’lsa, 15 daqiqalik bosqichlarga bo’ling.',
    'Kechqurun 2 daqiqa ertangi kunning rejasiga ajrating.',
    'Yarim soatda bir marta turib, biroz harakat qiling.',
    'Kunni rejalashtirgan emas, bajarilgan vazifalar bilan yakunlang.',
  ],
}

export function aiProviders() {
  return Object.values(PROVIDERS).map((provider) => ({
    id: provider.id,
    label: provider.label,
    model: provider.model,
    ready: Boolean(process.env[provider.envKey]),
  }))
}

export function defaultProvider() {
  const ready = aiProviders().find((provider) => provider.ready)
  return ready ? ready.id : null
}

export function offlineTips(lang) {
  return OFFLINE_TIPS[lang] || OFFLINE_TIPS.ru
}

// Основная точка входа: ответ провайдера или офлайн-советы.
export async function askAdvice({ question, lang = 'ru', providerId } = {}) {
  const clean = String(question || '').trim().slice(0, 500)
  if (!clean) return { ok: false, reason: 'empty_question' }

  const provider = PROVIDERS[providerId] || PROVIDERS[defaultProvider() || 'chatgpt']
  const key = process.env[provider.envKey]

  if (!key) {
    return {
      ok: true,
      offline: true,
      provider: null,
      answer: '',
      tips: offlineTips(lang),
      reason: 'not_configured',
    }
  }

  const url =
    typeof provider.endpoint === 'function'
      ? provider.endpoint(key, provider.model)
      : provider.endpoint

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...provider.auth(key) },
      body: JSON.stringify(provider.body(clean, lang)),
      signal: AbortSignal.timeout(20000),
    })

    if (!res.ok) {
      return {
        ok: false,
        offline: true,
        provider: provider.id,
        reason: 'provider_error',
        detail: `HTTP ${res.status}`,
        answer: '',
        tips: offlineTips(lang),
      }
    }

    const answer = provider.read(await res.json())
    if (!answer) {
      return {
        ok: false,
        offline: true,
        provider: provider.id,
        reason: 'empty_answer',
        answer: '',
        tips: offlineTips(lang),
      }
    }

    return { ok: true, offline: false, provider: provider.id, answer }
  } catch (error) {
    // Сеть недоступна или провайдер не отвечает — показываем офлайн-советы.
    return {
      ok: false,
      offline: true,
      provider: provider.id,
      reason: 'network',
      detail: error.message,
      answer: '',
      tips: offlineTips(lang),
    }
  }
}
