import { ElectronAPI } from '@electron-toolkit/preload'

export interface Settings {
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

export interface HistoryItem {
  id: string
  path: string
  name: string
  title: string
  timestamp: number
}

export interface DirectoryItem {
  name: string
  path: string
  isDirectory: boolean
}

export interface Api {
  pty: {
    create: (id: string, cwd: string) => Promise<{ id: string; pid: number } | null>
    input: (id: string, data: string) => void
    resize: (id: string, cols: number, rows: number) => void
    close: (id: string) => void
    onOutput: (callback: (data: { id: string; data: string }) => void) => () => void
    onExit: (callback: (data: { id: string; exitCode: number }) => void) => () => void
  }
  fs: {
    browse: (path: string, showHidden?: boolean) => Promise<DirectoryItem[]>
    home: () => Promise<string>
  }
  settings: {
    get: () => Promise<Settings>
    set: (settings: Partial<Settings>) => Promise<Settings>
    isFirstTime: () => Promise<boolean>
  }
  history: {
    get: () => Promise<HistoryItem[]>
    add: (path: string) => Promise<HistoryItem[]>
    update: (id: string, title: string) => Promise<HistoryItem[]>
    clear: () => Promise<HistoryItem[]>
  }
  onShortcut: {
    newTab: (callback: () => void) => () => void
    closeTab: (callback: () => void) => () => void
    nextTab: (callback: () => void) => () => void
    prevTab: (callback: () => void) => () => void
    switchTab: (callback: (index: number) => void) => () => void
  }
  update: {
    download: () => Promise<void>
    install: () => Promise<void>
    onAvailable: (callback: (info: { version: string }) => void) => () => void
    onDownloadProgress: (
      callback: (progress: { percent: number; transferred: number; total: number }) => void
    ) => () => void
    onDownloaded: (callback: (info: { version: string }) => void) => () => void
  }
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: Api
  }
}
