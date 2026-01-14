import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  // PTY operations
  pty: {
    create: (id: string, cwd: string) => ipcRenderer.invoke('pty:create', { id, cwd }),
    input: (id: string, data: string) => ipcRenderer.send('pty:input', { id, data }),
    resize: (id: string, cols: number, rows: number) =>
      ipcRenderer.send('pty:resize', { id, cols, rows }),
    close: (id: string) => ipcRenderer.send('pty:close', { id }),
    onOutput: (callback: (data: { id: string; data: string }) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, data: { id: string; data: string }) =>
        callback(data)
      ipcRenderer.on('pty:output', handler)
      return () => ipcRenderer.removeListener('pty:output', handler)
    },
    onExit: (callback: (data: { id: string; exitCode: number }) => void) => {
      const handler = (
        _event: Electron.IpcRendererEvent,
        data: { id: string; exitCode: number }
      ) => callback(data)
      ipcRenderer.on('pty:exit', handler)
      return () => ipcRenderer.removeListener('pty:exit', handler)
    }
  },

  // File system operations
  fs: {
    browse: (path: string, showHidden = false) =>
      ipcRenderer.invoke('fs:browse', { path, showHidden }),
    home: () => ipcRenderer.invoke('fs:home')
  },

  // Settings operations
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    set: (settings: Record<string, unknown>) => ipcRenderer.invoke('settings:set', settings),
    isFirstTime: () => ipcRenderer.invoke('settings:isFirstTime')
  },

  // History operations
  history: {
    get: () => ipcRenderer.invoke('history:get'),
    add: (path: string) => ipcRenderer.invoke('history:add', { path }),
    update: (id: string, title: string) => ipcRenderer.invoke('history:update', { id, title }),
    clear: () => ipcRenderer.invoke('history:clear')
  },

  // Shortcut listeners
  onShortcut: {
    newTab: (callback: () => void) => {
      ipcRenderer.on('shortcut:new-tab', callback)
      return () => ipcRenderer.removeListener('shortcut:new-tab', callback)
    },
    closeTab: (callback: () => void) => {
      ipcRenderer.on('shortcut:close-tab', callback)
      return () => ipcRenderer.removeListener('shortcut:close-tab', callback)
    },
    nextTab: (callback: () => void) => {
      ipcRenderer.on('shortcut:next-tab', callback)
      return () => ipcRenderer.removeListener('shortcut:next-tab', callback)
    },
    prevTab: (callback: () => void) => {
      ipcRenderer.on('shortcut:prev-tab', callback)
      return () => ipcRenderer.removeListener('shortcut:prev-tab', callback)
    },
    switchTab: (callback: (index: number) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, index: number) => callback(index)
      ipcRenderer.on('shortcut:switch-tab', handler)
      return () => ipcRenderer.removeListener('shortcut:switch-tab', handler)
    }
  },

  // Update operations
  update: {
    download: () => ipcRenderer.invoke('update:download'),
    install: () => ipcRenderer.invoke('update:install'),
    onAvailable: (callback: (info: { version: string }) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, info: { version: string }) =>
        callback(info)
      ipcRenderer.on('update-available', handler)
      return () => ipcRenderer.removeListener('update-available', handler)
    },
    onDownloadProgress: (
      callback: (progress: { percent: number; transferred: number; total: number }) => void
    ) => {
      const handler = (
        _event: Electron.IpcRendererEvent,
        progress: { percent: number; transferred: number; total: number }
      ) => callback(progress)
      ipcRenderer.on('update-download-progress', handler)
      return () => ipcRenderer.removeListener('update-download-progress', handler)
    },
    onDownloaded: (callback: (info: { version: string }) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, info: { version: string }) =>
        callback(info)
      ipcRenderer.on('update-downloaded', handler)
      return () => ipcRenderer.removeListener('update-downloaded', handler)
    }
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
