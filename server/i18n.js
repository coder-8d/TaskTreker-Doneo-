// Локализованные тексты серверной части Doneo.
// Клиент переводит сообщения по полю "code", поэтому английский текст здесь
// нужен только как запасной вариант.

// Задачи-примеры для нового пользователя (по языку интерфейса).
export const SEEDS = {
  ru: [
    {
      title: 'Изучить интерфейс Doneo',
      description: 'Добавьте, отредактируйте и перетащите задачу, чтобы освоиться.',
      status: 'todo',
      priority: 'medium',
      days: 1,
    },
    {
      title: 'Сделать отчёт за неделю',
      description: 'Собрать метрики и отправить руководителю.',
      status: 'progress',
      priority: 'high',
      days: 3,
    },
    {
      title: 'Настроить серверную авторизацию',
      description: 'Готово — данные хранятся на сервере.',
      status: 'done',
      priority: 'low',
      days: 0,
    },
  ],
  en: [
    {
      title: 'Explore the Doneo interface',
      description: 'Add, edit and drag a task to get comfortable.',
      status: 'todo',
      priority: 'medium',
      days: 1,
    },
    {
      title: 'Prepare the weekly report',
      description: 'Collect the metrics and send them to your manager.',
      status: 'progress',
      priority: 'high',
      days: 3,
    },
    {
      title: 'Set up server-side auth',
      description: 'Done — your data lives on the server.',
      status: 'done',
      priority: 'low',
      days: 0,
    },
  ],
  uz: [
    {
      title: 'Doneo interfeysi bilan tanishing',
      description: 'Ko’nikish uchun vazifa qo’shing, tahrirlang va sudrab ko’chiring.',
      status: 'todo',
      priority: 'medium',
      days: 1,
    },
    {
      title: 'Haftalik hisobotni tayyorlang',
      description: 'Ko’rsatkichlarni to’plab, rahbarga yuboring.',
      status: 'progress',
      priority: 'high',
      days: 3,
    },
    {
      title: 'Server avtorizatsiyasini yoqing',
      description: 'Tayyor — ma’lumotlaringiz serverda saqlanadi.',
      status: 'done',
      priority: 'low',
      days: 0,
    },
  ],
}

export const GUEST_NAMES = {
  ru: 'Гость',
  en: 'Guest',
  uz: 'Mehmon',
}

const LOCALES = { ru: 'ru-RU', en: 'en-US', uz: 'uz-UZ' }

function formatWhen(lang, stamp) {
  const locale = LOCALES[lang] || LOCALES.ru
  try {
    return new Date(stamp).toLocaleString(locale, {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return new Date(stamp).toISOString().slice(0, 16).replace('T', ' ')
  }
}

// Текст SMS-напоминания — на языке, выбранном при регистрации.
export function reminderText(lang, task, dueStamp) {
  const title = String((task && task.title) || '').slice(0, 80)
  const when = formatWhen(lang, dueStamp)
  if (lang === 'en') return `Doneo: task "${title}" is due ${when}.`
  if (lang === 'uz') return `Doneo: "${title}" vazifasi muddati ${when}.`
  return `Doneo: скоро дедлайн задачи «${title}» — ${when}.`
}

export function testText(lang) {
  if (lang === 'en') return 'Doneo: test SMS. Notifications are working.'
  if (lang === 'uz') return 'Doneo: test SMS. Bildirishnomalar ishlayapti.'
  return 'Doneo: тестовое SMS. Уведомления работают.'
}

export function seedTexts(lang) {
  return SEEDS[lang] || SEEDS.ru
}

export function guestName(lang) {
  return GUEST_NAMES[lang] || GUEST_NAMES.ru
}