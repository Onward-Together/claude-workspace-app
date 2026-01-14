export interface Tab {
  id: string
  name: string
  path: string
  isActive: boolean
  historyId?: string
  resume?: boolean
}

export interface HistoryItem {
  id: string
  path: string
  name: string
  title: string
  timestamp: number
}

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

export interface DirectoryItem {
  name: string
  path: string
  isDirectory: boolean
}
