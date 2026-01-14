import { readdirSync, statSync } from 'fs'
import { join, basename } from 'path'
import { homedir } from 'os'

export interface DirectoryItem {
  name: string
  path: string
  isDirectory: boolean
}

export function getHomeDirectory(): string {
  return homedir()
}

export function browseDirectory(dirPath: string, showHidden = false): DirectoryItem[] {
  try {
    const entries = readdirSync(dirPath, { withFileTypes: true })

    const items: DirectoryItem[] = entries
      .filter((entry) => {
        // Filter hidden files/folders if showHidden is false
        if (!showHidden && entry.name.startsWith('.')) {
          return false
        }
        // Only show directories for browsing
        return entry.isDirectory()
      })
      .map((entry) => ({
        name: entry.name,
        path: join(dirPath, entry.name),
        isDirectory: entry.isDirectory()
      }))
      .sort((a, b) => a.name.localeCompare(b.name))

    return items
  } catch {
    return []
  }
}

export function getParentDirectory(dirPath: string): string {
  const parts = dirPath.split(/[\\/]/)
  parts.pop()
  return parts.join('/') || '/'
}

export function isValidDirectory(dirPath: string): boolean {
  try {
    const stat = statSync(dirPath)
    return stat.isDirectory()
  } catch {
    return false
  }
}

export function getDirectoryName(dirPath: string): string {
  return basename(dirPath) || dirPath
}
