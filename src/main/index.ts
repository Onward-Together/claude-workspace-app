import { app, shell, BrowserWindow, ipcMain, globalShortcut } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { autoUpdater } from 'electron-updater'
import icon from '../../resources/icon.png?asset'

import {
  createPtySession,
  writeToPty,
  resizePty,
  closePty,
  closeAllPty,
  invalidateWindowReferences
} from './pty-manager'
import {
  getSettings,
  saveSettings,
  isFirstTime,
  getHistory,
  addToHistory,
  updateHistoryTitle,
  clearHistory
} from './storage'
import { browseDirectory, getHomeDirectory } from './fs-utils'

let mainWindow: BrowserWindow | null = null
let isQuitting = false

function createWindow(): void {
  const settings = getSettings()

  mainWindow = new BrowserWindow({
    width: settings.windowBounds?.width || 1200,
    height: settings.windowBounds?.height || 800,
    x: settings.windowBounds?.x,
    y: settings.windowBounds?.y,
    minWidth: 800,
    minHeight: 600,
    show: false,
    autoHideMenuBar: false,
    backgroundColor: '#111827',
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  // Handle close event - save bounds and cleanup
  mainWindow.on('close', () => {
    if (mainWindow && !isQuitting) {
      const bounds = mainWindow.getBounds()
      saveSettings({ windowBounds: bounds })

      // Invalidate window references in pty sessions
      invalidateWindowReferences()
    }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function registerIpcHandlers(): void {
  // PTY handlers
  ipcMain.handle('pty:create', (_event, { id, cwd }) => {
    if (!mainWindow) return null
    return createPtySession(id, cwd, mainWindow)
  })

  ipcMain.on('pty:input', (_event, { id, data }) => {
    if (!isQuitting) {
      writeToPty(id, data)
    }
  })

  ipcMain.on('pty:resize', (_event, { id, cols, rows }) => {
    if (!isQuitting) {
      resizePty(id, cols, rows)
    }
  })

  ipcMain.on('pty:close', (_event, { id }) => {
    closePty(id)
  })

  // File system handlers
  ipcMain.handle('fs:browse', (_event, { path, showHidden }) => {
    return browseDirectory(path, showHidden)
  })

  ipcMain.handle('fs:home', () => {
    return getHomeDirectory()
  })

  // Settings handlers
  ipcMain.handle('settings:get', () => {
    return getSettings()
  })

  ipcMain.handle('settings:set', (_event, settings) => {
    return saveSettings(settings)
  })

  ipcMain.handle('settings:isFirstTime', () => {
    return isFirstTime()
  })

  // History handlers
  ipcMain.handle('history:get', () => {
    return getHistory()
  })

  ipcMain.handle('history:add', (_event, { path }) => {
    return addToHistory(path)
  })

  ipcMain.handle('history:update', (_event, { id, title }) => {
    return updateHistoryTitle(id, title)
  })

  ipcMain.handle('history:clear', () => {
    clearHistory()
    return []
  })
}

function registerGlobalShortcuts(): void {
  if (mainWindow) {
    mainWindow.webContents.on('before-input-event', (_event, input) => {
      const isModifier = process.platform === 'darwin' ? input.meta : input.control

      if (isModifier && input.key.toLowerCase() === 't') {
        mainWindow?.webContents.send('shortcut:new-tab')
      } else if (isModifier && input.key.toLowerCase() === 'w') {
        mainWindow?.webContents.send('shortcut:close-tab')
      } else if (isModifier && input.key === 'Tab') {
        if (input.shift) {
          mainWindow?.webContents.send('shortcut:prev-tab')
        } else {
          mainWindow?.webContents.send('shortcut:next-tab')
        }
      } else if (isModifier && /^[1-9]$/.test(input.key)) {
        mainWindow?.webContents.send('shortcut:switch-tab', parseInt(input.key) - 1)
      }
    })
  }
}

function setupAutoUpdater(): void {
  // Disable auto-download to show user notification first
  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = true

  // Check for updates on app start (after 3 seconds)
  setTimeout(() => {
    if (!is.dev) {
      autoUpdater.checkForUpdates()
    }
  }, 3000)

  // Check for updates every 30 minutes
  setInterval(
    () => {
      if (!is.dev) {
        autoUpdater.checkForUpdates()
      }
    },
    30 * 60 * 1000
  )

  autoUpdater.on('update-available', (info) => {
    console.log('Update available:', info.version)
    mainWindow?.webContents.send('update-available', info)
  })

  autoUpdater.on('update-not-available', () => {
    console.log('No updates available')
  })

  autoUpdater.on('error', (err) => {
    console.error('Update error:', err)
  })

  autoUpdater.on('download-progress', (progressObj) => {
    mainWindow?.webContents.send('update-download-progress', progressObj)
  })

  autoUpdater.on('update-downloaded', (info) => {
    console.log('Update downloaded:', info.version)
    mainWindow?.webContents.send('update-downloaded', info)
  })

  // Handle download update request from renderer
  ipcMain.handle('update:download', () => {
    autoUpdater.downloadUpdate()
  })

  // Handle install update request from renderer
  ipcMain.handle('update:install', () => {
    autoUpdater.quitAndInstall(false, true)
  })
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.claude-workspace')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  registerIpcHandlers()
  createWindow()
  registerGlobalShortcuts()
  setupAutoUpdater()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Handle before-quit to set flag and cleanup
app.on('before-quit', () => {
  isQuitting = true
  invalidateWindowReferences()
  closeAllPty()
})

app.on('window-all-closed', () => {
  invalidateWindowReferences()
  closeAllPty()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
  closeAllPty()
})
