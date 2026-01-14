import { ref, onMounted, onUnmounted, watch, type Ref } from 'vue'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebLinksAddon } from '@xterm/addon-web-links'
import type { Tab } from '../types'
import { useHistoryStore } from '../stores/history'

export function useTerminal(tab: Ref<Tab>, containerRef: Ref<HTMLElement | null>) {
  const terminal = ref<Terminal | null>(null)
  const fitAddon = ref<FitAddon | null>(null)
  const isReady = ref(false)
  const historyStore = useHistoryStore()
  let unsubscribeOutput: (() => void) | null = null
  let unsubscribeExit: (() => void) | null = null
  let resizeObserver: ResizeObserver | null = null

  // Title auto-generation
  let titleSet = false
  let inputBuffer = ''
  let claudeReady = false

  // Generate title from first user input
  async function setTitleFromInput(question: string, historyId: string): Promise<void> {
    // Clean and truncate the question to use as title
    const cleanedQuestion = question.trim().replace(/\s+/g, ' ')
    const title = cleanedQuestion.length > 50
      ? cleanedQuestion.substring(0, 47) + '...'
      : cleanedQuestion
    await historyStore.updateTitle(historyId, title)
  }

  async function initTerminal(): Promise<void> {
    if (!containerRef.value || terminal.value) return

    // Create terminal instance with IME support for Vietnamese
    terminal.value = new Terminal({
      theme: {
        background: '#111827',
        foreground: '#e5e7eb',
        cursor: '#e5e7eb',
        cursorAccent: '#111827',
        selectionBackground: '#374151',
        black: '#1f2937',
        red: '#ef4444',
        green: '#22c55e',
        yellow: '#eab308',
        blue: '#3b82f6',
        magenta: '#a855f7',
        cyan: '#06b6d4',
        white: '#e5e7eb',
        brightBlack: '#4b5563',
        brightRed: '#f87171',
        brightGreen: '#4ade80',
        brightYellow: '#facc15',
        brightBlue: '#60a5fa',
        brightMagenta: '#c084fc',
        brightCyan: '#22d3ee',
        brightWhite: '#f9fafb'
      },
      // OS-specific monospace fonts: SF Mono/Menlo (macOS), Consolas (Windows), Liberation Mono (Linux)
      fontFamily: '"SF Mono", Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
      fontSize: 14,
      lineHeight: 1.2,
      cursorBlink: true,
      cursorStyle: 'block',
      scrollback: 10000,
      allowProposedApi: true,
      // Enable IME support for Vietnamese input
      screenReaderMode: false,
      macOptionIsMeta: false,
      macOptionClickForcesSelection: false
    })

    // Add addons
    fitAddon.value = new FitAddon()
    terminal.value.loadAddon(fitAddon.value)
    terminal.value.loadAddon(new WebLinksAddon())

    // Open terminal in container
    terminal.value.open(containerRef.value)

    // Fit to container
    fitAddon.value.fit()

    // Create PTY session
    const result = await window.api.pty.create(tab.value.id, tab.value.path)
    if (!result) {
      console.error('Failed to create PTY session')
      return
    }

    // Handle terminal input
    terminal.value.onData((data) => {
      window.api.pty.input(tab.value.id, data)

      // Auto-generate title from first user input
      if (!titleSet && claudeReady && tab.value.historyId) {
        // Check for Enter key (carriage return)
        if (data === '\r' || data === '\n') {
          const trimmedInput = inputBuffer.trim()
          if (trimmedInput.length > 0) {
            titleSet = true
            // Set title from first user input
            setTitleFromInput(trimmedInput, tab.value.historyId)
          }
          inputBuffer = ''
        } else if (data === '\x7f' || data === '\b') {
          // Backspace - remove last character
          inputBuffer = inputBuffer.slice(0, -1)
        } else if (data.charCodeAt(0) >= 32) {
          // Printable characters
          inputBuffer += data
        }
      }
    })

    // Handle PTY output
    unsubscribeOutput = window.api.pty.onOutput(({ id, data }) => {
      if (id === tab.value.id && terminal.value) {
        terminal.value.write(data)
      }
    })

    // Handle PTY exit
    unsubscribeExit = window.api.pty.onExit(({ id, exitCode }) => {
      if (id === tab.value.id && terminal.value) {
        terminal.value.write(`\r\n\x1b[33mProcess exited with code ${exitCode}\x1b[0m\r\n`)
      }
    })

    // Setup resize observer
    resizeObserver = new ResizeObserver(() => {
      if (fitAddon.value && terminal.value) {
        fitAddon.value.fit()
        const { cols, rows } = terminal.value
        window.api.pty.resize(tab.value.id, cols, rows)
      }
    })
    resizeObserver.observe(containerRef.value)

    // Auto-run claude command
    setTimeout(() => {
      // Use --continue flag to resume previous conversation if opening from history
      const command = tab.value.resume ? 'claude --continue\n' : 'claude\n'
      window.api.pty.input(tab.value.id, command)

      // If resuming, title is already set from history
      if (tab.value.resume) {
        titleSet = true
      }

      // Set claudeReady after Claude has time to start
      setTimeout(() => {
        claudeReady = true
      }, 2000)
    }, 500)

    isReady.value = true
  }

  function focusTerminal(): void {
    terminal.value?.focus()
  }

  function dispose(): void {
    if (unsubscribeOutput) {
      unsubscribeOutput()
      unsubscribeOutput = null
    }
    if (unsubscribeExit) {
      unsubscribeExit()
      unsubscribeExit = null
    }
    if (resizeObserver) {
      resizeObserver.disconnect()
      resizeObserver = null
    }
    if (terminal.value) {
      try {
        terminal.value.dispose()
      } catch {
        // Ignore addon dispose errors
      }
      terminal.value = null
    }
    fitAddon.value = null
    isReady.value = false
  }

  onMounted(() => {
    initTerminal()
  })

  onUnmounted(() => {
    dispose()
  })

  // Watch for container changes
  watch(containerRef, (newVal) => {
    if (newVal && !terminal.value) {
      initTerminal()
    }
  })

  return {
    terminal,
    isReady,
    focusTerminal,
    dispose
  }
}
