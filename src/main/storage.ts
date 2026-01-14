import { app } from 'electron'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join, basename } from 'path'

interface Settings {
  firstTimeSetupCompleted: boolean
  sidebarCollapsed: boolean
  workingFolder?: string
  windowBounds?: {
    x: number
    y: number
    width: number
    height: number
  }
}

interface HistoryItem {
  id: string
  path: string
  name: string
  title: string
  timestamp: number
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9)
}

const DEFAULT_SETTINGS: Settings = {
  firstTimeSetupCompleted: false,
  sidebarCollapsed: false,
  workingFolder: undefined
}

function getStoragePath(): string {
  return app.getPath('userData')
}

function ensureStorageDir(): void {
  const storagePath = getStoragePath()
  if (!existsSync(storagePath)) {
    mkdirSync(storagePath, { recursive: true })
  }
}

function readJsonFile<T>(filename: string, defaultValue: T): T {
  ensureStorageDir()
  const filePath = join(getStoragePath(), filename)

  if (!existsSync(filePath)) {
    return defaultValue
  }

  try {
    const content = readFileSync(filePath, 'utf-8')
    return JSON.parse(content) as T
  } catch {
    return defaultValue
  }
}

function writeJsonFile<T>(filename: string, data: T): void {
  ensureStorageDir()
  const filePath = join(getStoragePath(), filename)
  writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
}

// Settings
export function getSettings(): Settings {
  return readJsonFile('settings.json', DEFAULT_SETTINGS)
}

export function saveSettings(settings: Partial<Settings>): Settings {
  const current = getSettings()
  const updated = { ...current, ...settings }
  writeJsonFile('settings.json', updated)
  return updated
}

export function isFirstTime(): boolean {
  const settings = getSettings()
  return !settings.firstTimeSetupCompleted
}

// History
const MAX_HISTORY_ITEMS = 50

export function getHistory(): HistoryItem[] {
  const history = readJsonFile<HistoryItem[]>('history.json', [])

  // Migrate old items without id/title
  let needsMigration = false
  const migrated = history.map((item) => {
    if (!item.id || item.title === undefined) {
      needsMigration = true
      return {
        ...item,
        id: item.id || generateId(),
        title: item.title ?? 'Untitled'
      }
    }
    return item
  })

  if (needsMigration) {
    writeJsonFile('history.json', migrated)
  }

  return migrated
}

export function addToHistory(path: string): HistoryItem[] {
  const history = getHistory()
  const name = basename(path) || path

  // Remove existing entry for this path
  // const filtered = history.filter((item) => item.path !== path)

  // Add new entry at the beginning
  const newItem: HistoryItem = {
    id: generateId(),
    path,
    name,
    title: 'Untitled',
    timestamp: Date.now()
  }
  const updated = [newItem, ...history].slice(0, MAX_HISTORY_ITEMS)

  writeJsonFile('history.json', updated)
  return updated
}

export function updateHistoryTitle(id: string, title: string): HistoryItem[] {
  const history = getHistory()
  const updated = history.map((item) =>
    item.id === id ? { ...item, title: title || 'Untitled' } : item
  )
  writeJsonFile('history.json', updated)
  return updated
}

export function clearHistory(): void {
  writeJsonFile('history.json', [])
}
