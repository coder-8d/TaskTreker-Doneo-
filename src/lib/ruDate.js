// Русские дата и время для главного экрана.
//
// Названия месяцев и дней недели заданы явно, а не через Intl: так дата
// не зависит от локали системы и никогда не покажет "October" или "Monday".
export const MONTHS_GENITIVE = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
]

export const WEEKDAYS = [
  'воскресенье', 'понедельник', 'вторник', 'среда',
  'четверг', 'пятница', 'суббота',
]

const pad = (value) => String(value).padStart(2, '0')

// 20:41 — локальное время устройства.
export function formatClock(date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

// 04 октября, воскресенье
export function formatRussianDate(date) {
  return `${pad(date.getDate())} ${MONTHS_GENITIVE[date.getMonth()]}, ${WEEKDAYS[date.getDay()]}`
}
