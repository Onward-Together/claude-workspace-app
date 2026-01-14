import * as pty from 'node-pty'
import { BrowserWindow } from 'electron'

interface PtySession {
  id: string
  ptyProcess: pty.IPty
  cwd: string
}

const sessions = new Map<string, PtySession>()

function getShell(): string {
  if (process.platform === 'win32') {
    return 'powershell.exe'
  }
  // Use user's default shell or fallback to zsh/bash
  return process.env.SHELL || '/bin/zsh'
}

export function createPtySession(
  id: string,
  cwd: string,
  window: BrowserWindow
): { id: string; pid: number } {
  const shell = getShell()

  // Set UTF-8 locale for Vietnamese and other Unicode support
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

  sessions.set(id, { id, ptyProcess, cwd })

  ptyProcess.onData((data) => {
    try {
      if (!window.isDestroyed()) {
        window.webContents.send('pty:output', { id, data })
      }
    } catch {
      // Window already closed, ignore
    }
  })

  ptyProcess.onExit(({ exitCode }) => {
    try {
      if (!window.isDestroyed()) {
        window.webContents.send('pty:exit', { id, exitCode })
      }
    } catch {
      // Window already closed, ignore
    }
    sessions.delete(id)
  })

  return { id, pid: ptyProcess.pid }
}

export function writeToPty(id: string, data: string): void {
  const session = sessions.get(id)
  if (session) {
    session.ptyProcess.write(data)
  }
}

export function resizePty(id: string, cols: number, rows: number): void {
  const session = sessions.get(id)
  if (session) {
    session.ptyProcess.resize(cols, rows)
  }
}

export function closePty(id: string): void {
  const session = sessions.get(id)
  if (session) {
    try {
      session.ptyProcess.kill()
    } catch {
      // Process already exited, ignore
    }
    sessions.delete(id)
  }
}

export function closeAllPty(): void {
  sessions.forEach((session) => {
    try {
      session.ptyProcess.kill()
    } catch {
      // Process already exited, ignore
    }
  })
  sessions.clear()
}

export function getPtySession(id: string): PtySession | undefined {
  return sessions.get(id)
}
