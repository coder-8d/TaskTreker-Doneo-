// Крошечный реестр переводчика: позволяет локализовать тексты ошибок
// вне React-компонентов (в библиотеках и хуках), куда нельзя передать t().
let translator = null

export function setTranslator(fn) {
  translator = typeof fn === 'function' ? fn : null
}

// Возвращает перевод кода ошибки или fallback (например, текст от сервера).
export function localizeError(code, vars, fallback = '') {
  if (!code) return fallback
  if (translator) {
    try {
      const translated = translator(code, vars)
      if (translated) return translated
    } catch {
      /* сбой переводчика не должен ломать приложение */
    }
  }
  return fallback
}
