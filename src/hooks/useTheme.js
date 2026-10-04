import { useCallback, useEffect, useState } from 'react'
import { readJSON, writeJSON } from '../lib/storage.js'

const THEME_KEY = 'doneo.theme'

// Три режима: два ручных и Auto — тема полностью по локальному времени.
export const THEME_MODES = ['light', 'dark', 'auto']
export const AUTO_MODE = 'auto'

// 06:00–20:59 — светлая, 21:00–05:59 — тёмная (локальное время устройства).
export function themeForTime(date = new Date()) {
  const hour = date.getHours()
  return hour >= 6 && hour < 21 ? 'light' : 'dark'
}

export function resolveTheme(mode, date = new Date()) {
  return mode === AUTO_MODE ? themeForTime(date) : mode
}

// Ближайшая граница переключения — чтобы тема менялась ровно в 06:00 и 21:00,
// а не с задержкой до конца интервала проверки.
export function nextBoundary(date = new Date()) {
  const next = new Date(date)
  next.setSeconds(0, 0)
  const hour = date.getHours()

  if (hour >= 6 && hour < 21) {
    next.setHours(21, 0, 0)
  } else if (hour < 6) {
    next.setHours(6, 0, 0)
  } else {
    next.setHours(6, 0, 0)
    next.setDate(next.getDate() + 1)
  }
  return next
}

function applyTheme(theme) {
  if (typeof document === 'undefined') return
  document.documentElement.dataset.theme = theme
  // Цвет адресной строки мобильных браузеров тоже подстраиваем под тему.
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', theme === 'light' ? '#eef0f6' : '#0b0b0f')
}

// Режим темы: 'light' | 'dark' | 'auto'.
// В Auto тема обновляется сама — на старте и при наступлении 06:00 / 21:00.
export function useTheme() {
  const [mode, setModeState] = useState(() => {
    const saved = readJSON(THEME_KEY, 'dark', 'local')
    return THEME_MODES.includes(saved) ? saved : 'dark'
  })
  const [theme, setTheme] = useState(() => resolveTheme(mode))

  const setMode = useCallback((next) => {
    if (!THEME_MODES.includes(next)) return
    setModeState(next)
    writeJSON(THEME_KEY, next, 'local')
  }, [])

  useEffect(() => {
    let timer = null

    const sync = () => {
      const next = resolveTheme(mode)
      setTheme((current) => (current === next ? current : next))
      applyTheme(next)
    }

    // На старте и сразу при смене режима.
    sync()

    if (mode === AUTO_MODE) {
      // Точное срабатывание на границе + минутный «страховочный» пульс
      // (например, если ноутбук спал в момент перехода).
      const schedule = () => {
        const delay = Math.max(1000, nextBoundary().getTime() - Date.now() + 250)
        timer = setTimeout(() => {
          sync()
          schedule()
        }, delay)
      }
      schedule()

      const heartbeat = setInterval(sync, 60000)
      return () => {
        clearTimeout(timer)
        clearInterval(heartbeat)
      }
    }

    writeJSON(THEME_KEY, mode, 'local')
    return () => clearTimeout(timer)
  }, [mode])

  // Цикл по кнопке в шапке: Light → Dark → Auto → Light.
  const toggleTheme = useCallback(() => {
    const index = THEME_MODES.indexOf(mode)
    setMode(THEME_MODES[(index + 1) % THEME_MODES.length])
  }, [mode, setMode])

  return { theme, mode, setMode, toggleTheme }
}
