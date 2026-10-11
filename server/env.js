// Минимальный загрузчик .env без внешних зависимостей.
//
// Зачем он нужен: Node не читает .env сам, если не запущен с --env-file.
// Пользователю не нужно запоминать флаги — достаточно создать .env рядом
// с package.json и перезапустить сервер.
//
// Переменные, уже заданные в окружении, НЕ перезаписываются:
// реальные переменные терминала имеют приоритет над файлом.
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const ENV_FILE = process.env.ENV_FILE || join(ROOT, '.env')

const LINE_RE = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/

export function loadEnv(file = ENV_FILE) {
  const loaded = {}

  let raw
  try {
    if (!existsSync(file)) return loaded
    raw = readFileSync(file, 'utf8')
  } catch {
    return loaded
  }

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const match = LINE_RE.exec(trimmed)
    if (!match) continue

    const key = match[1]
    let value = match[2]

    // Убираем кавычки и хвостовые комментарии вне кавычек.
    const quoted = /^(['"])([\s\S]*)\1$/.exec(value)
    if (quoted) {
      value = quoted[2]
    } else {
      value = value.replace(/\s+#.*$/, '')
    }

    if (process.env[key] === undefined) {
      process.env[key] = value
      loaded[key] = value
    }
  }

  return loaded
}

// Секреты в .env не должны попадать в логи.
export function describeEnv() {
  return ['SMS_PROVIDER']
    .map((key) => `${key}: ${process.env[key] ? 'задан' : 'нет'}`)
    .join(' · ')
}

// Запускается при импорте: `import './env.js'` в server/index.js стоит
// первым, поэтому ключи доступны всем модулям ниже.
const loadedKeys = Object.keys(loadEnv())
if (loadedKeys.length > 0) {
  console.log(`[env] прочитан .env (${ENV_FILE}): ${loadedKeys.join(', ')}`)
}

