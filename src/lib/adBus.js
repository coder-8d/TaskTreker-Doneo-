// Простая шина событий для рекламы: позволяет показать объявление
// по кнопке из настроек, не прокидывая колбэки через все компоненты.
const EVENT = 'doneo:show-ad'

export function showAdNow() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(EVENT))
}

export function onShowAd(handler) {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener(EVENT, handler)
  return () => window.removeEventListener(EVENT, handler)
}