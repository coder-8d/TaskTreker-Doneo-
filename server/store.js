// Простое файловое хранилище (JSON) для серверной авторизации и задач.
// Данные держим в памяти, а на диск пишем после каждого изменения.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, 'data')
const DB_FILE = join(DATA_DIR, 'db.json')

const EMPTY = { users: [], sessions: {}, tasks: {}, settings: {} }

function load() {
  try {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })
    if (existsSync(DB_FILE)) {
      const parsed = JSON.parse(readFileSync(DB_FILE, 'utf8'))
      return {
        users: parsed.users || [],
        sessions: parsed.sessions || {},
        tasks: parsed.tasks || {},
        // Настройки SMS-напоминаний (номер, включение, время предупреждения).
        settings: parsed.settings || {},
      }
    }
  } catch (error) {
    console.error('[store] не удалось прочитать базу:', error.message)
  }
  return { ...EMPTY }
}

let db = load()

export function getDb() {
  return db
}

export function save() {
  try {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })
    writeFileSync(DB_FILE, JSON.stringify(db, null, 2))
  } catch (error) {
    console.error('[store] не удалось сохранить базу:', error.message)
  }
}
