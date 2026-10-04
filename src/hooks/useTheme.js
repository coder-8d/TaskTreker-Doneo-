import { useCallback, useEffect, useState } from 'react'
import { readJSON, writeJSON } from '../lib/storage.js'

const THEME_KEY = 'doneo.theme'

// Тема приложения: 'dark' по умолчанию, выбор сохраняется в localStorage.
// Значение выставляется на <html data-theme="...">, CSS читает его как :root[data-theme].
export function useTheme() {
  const [theme, setTheme] = useState(() => {
    const saved = readJSON(THEME_KEY, 'dark', 'local')
    return saved === 'light' ? 'light' : 'dark'
  })

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    // Цвет адресной строки мобильных браузеров тоже подстраиваем под тему.
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', theme === 'light' ? '#eef0f6' : '#0b0b0f')
    writeJSON(THEME_KEY, theme, 'local')
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }, [])

  return { theme, toggleTheme }
}
