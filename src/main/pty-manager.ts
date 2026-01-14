import * as pty from 'node-pty'
import { BrowserWindow } from 'electron'

interface PtySession {
  id: string
  ptyProcess: pty.IPty
  cwd: string
  window: BrowserWindow | null
}

const sessions = new Map<string, PtySession>()

function getShell(): string {
  if (process.platform === 'win32') {
    return 'powershell.exe'
  }
  return process.env.SHELL || '/bin/zsh'
}

export function createPtySession(
  id: string,
  cwd: string,
  window: BrowserWindow
): { id: string; pid: number } {
  const shell = getShell()

  const env: { [key: string]: string } = {
    ...(process.env as { [key: string]: string }),
    LANG: 'en_US.UTF-8',
    LC_ALL: 'en_US.UTF-8',
    LC_CTYPE: 'en_US.UTF-8'
  }

  const ptyProcess = pty.spawn(shell, [], {
    name: 'xterm-256color',
    cols: 80,
    rows: 24,
    cwd,
    env,
    encoding: 'utf8'
  })

  const session: PtySession = { id, ptyProcess, cwd, window }
  sessions.set(id, session)

  ptyProcess.onData((data) => {
    const currentSession = sessions.get(id)
    if (currentSession && currentSession.window && !currentSession.window.isDestroyed()) {
      try {
        currentSession.window.webContents.send('pty:output', { id, data })
      } catch (error) {
        console.error('Error sending pty output:', error)
        // Null out the window reference to prevent further attempts
        currentSession.window = null
      }
    }
  })

  ptyProcess.onExit(({ exitCode }) => {
    const currentSession = sessions.get(id)
    if (currentSession && currentSession.window && !currentSession.window.isDestroyed()) {
      try {
        currentSession.window.webContents.send('pty:exit', { id, exitCode })
      } catch (error) {
        console.error('Error sending pty exit:', error)
      }
    }
    sessions.delete(id)
  })

  return { id, pid: ptyProcess.pid }
}

export function writeToPty(id: string, data: string): void {
  const session = sessions.get(id)
  if (session && session.ptyProcess) {
    try {
      session.ptyProcess.write(data)
    } catch (error) {
      console.error('Error writing to pty:', error)
    }
  }
}

export function resizePty(id: string, cols: number, rows: number): void {
  const session = sessions.get(id)
  if (session && session.ptyProcess) {
    try {
      session.ptyProcess.resize(cols, rows)
    } catch (error) {
      console.error('Error resizing pty:', error)
    }
  }
}

export function closePty(id: string): void {
  const session = sessions.get(id)
  if (session) {
    session.window = null // Clear window reference first
    try {
      session.ptyProcess.kill()
    } catch (error) {
      console.error('Error closing pty:', error)
    }
    sessions.delete(id)
  }
}

export function closeAllPty(): void {
  sessions.forEach((session) => {
    session.window = null // Clear window references
    try {
      session.ptyProcess.kill()
    } catch (error) {
      console.error('Error killing pty process:', error)
    }
  })
  sessions.clear()
}

// New function to invalidate window references
export function invalidateWindowReferences(): void {
  sessions.forEach((session) => {
    session.window = null
  })
}

export function getPtySession(id: string): PtySession | undefined {
  return sessions.get(id)
}
