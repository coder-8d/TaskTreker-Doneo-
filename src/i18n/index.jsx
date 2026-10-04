import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import ru from './ru.js'
import en from './en.js'
import uz from './uz.js'
import { readRaw, writeJSON } from '../lib/storage.js'
import { setTranslator } from '../lib/messages.js'

// Список поддерживаемых языков. Порядок = порядок переключателя.
export const LANGS = [
  { code: 'uz', label: 'Oʻzbekcha', short: 'UZ', locale: 'uz-UZ' },
  { code: 'ru', label: 'Русский', short: 'RU', locale: 'ru-RU' },
  { code: 'en', label: 'English', short: 'EN', locale: 'en-US' },
]

const DICTIONARIES = { ru, en, uz }
const LANG_KEY = 'doneo.lang'
const FALLBACK_LANG = 'ru'

const I18nContext = createContext(null)

// Язык по умолчанию: сохранённый выбор → язык браузера → русский.
function detectLang() {
  const stored = readRaw(LANG_KEY, 'local')
  if (stored && DICTIONARIES[stored]) return stored

  const candidates =
    typeof navigator === 'undefined'
      ? []
      : [navigator.language, ...(navigator.languages || [])]
  for (const candidate of candidates) {
    const short = String(candidate || '').slice(0, 2).toLowerCase()
    if (DICTIONARIES[short]) return short
  }
  return FALLBACK_LANG
}

function lookup(dict, key) {
  return String(key)
    .split('.')
    .reduce((acc, part) => (acc == null ? acc : acc[part]), dict)
}

function interpolate(text, vars) {
  if (!vars) return text
  return text.replace(/\{(\w+)\}/g, (match, name) =>
    vars[name] == null ? match : String(vars[name]),
  )
}

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(detectLang)

  const t = useCallback(
    (key, vars) => {
      const dict = DICTIONARIES[lang] || DICTIONARIES[FALLBACK_LANG]
      let value = lookup(dict, key)
      if (value == null) value = lookup(DICTIONARIES[FALLBACK_LANG], key)
      if (value == null) return key
      // Массивы и объекты (например, списки в справке) возвращаем как есть.
      return typeof value === 'string' ? interpolate(value, vars) : value
    },
    [lang],
  )

  const setLang = useCallback((next) => {
    if (!DICTIONARIES[next]) return
    setLangState(next)
    writeJSON(LANG_KEY, next, 'local')
  }, [])

  // Атрибут lang у <html> — нужен для переносов, скринридеров и автоперевода.
  useEffect(() => {
    if (typeof document !== 'undefined') document.documentElement.lang = lang
  }, [lang])

  // Сообщения об ошибках API приходят с кодом — переводим их здесь,
  // чтобы любой throw new Error(...) в приложении был локализован.
  useEffect(() => {
    setTranslator((code, vars) => {
      const value = lookup(
        DICTIONARIES[lang] || DICTIONARIES[FALLBACK_LANG],
        `errors.${code}`,
      )
      return typeof value === 'string' ? interpolate(value, vars) : ''
    })
  }, [lang])

  const locale =
    (LANGS.find((item) => item.code === lang) || LANGS[0]).locale

  const value = useMemo(
    () => ({ lang, locale, setLang, t, langs: LANGS }),
    [lang, locale, setLang, t],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n должен использоваться внутри I18nProvider')
  return ctx
}
