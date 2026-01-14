import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { v4 as uuidv4 } from 'uuid'
import type { Tab } from '../types'

export const useTabsStore = defineStore('tabs', () => {
  const tabs = ref<Tab[]>([])
  const activeTabId = ref<string | null>(null)

  const activeTab = computed(() => tabs.value.find((tab) => tab.id === activeTabId.value) || null)

  const tabCount = computed(() => tabs.value.length)

  interface CreateTabOptions {
    path: string
    name?: string
    resume?: boolean
    skipHistory?: boolean
  }

  async function createTab(options: CreateTabOptions | string, name?: string): Promise<Tab> {
    // Support both old signature (path, name) and new options object
    const opts: CreateTabOptions =
      typeof options === 'string' ? { path: options, name, resume: false } : options

    const id = uuidv4()
    const tabName = opts.name || opts.path.split('/').pop() || opts.path

    // Add to history first to get the history ID (skip if resuming from history)
    let historyId: string | undefined
    if (!opts.skipHistory) {
      const history = await window.api.history.add(opts.path)
      historyId = history.length > 0 ? history[0].id : undefined
    }

    const newTab: Tab = {
      id,
      name: tabName,
      path: opts.path,
      isActive: true,
      historyId,
      resume: opts.resume
    }

    // Deactivate all existing tabs
    tabs.value.forEach((tab) => (tab.isActive = false))

    // Add new tab
    tabs.value.push(newTab)
    activeTabId.value = id

    return newTab
  }

  async function updateTabTitle(tabId: string, title: string): Promise<void> {
    const tab = tabs.value.find((t) => t.id === tabId)
    if (tab?.historyId) {
      await window.api.history.update(tab.historyId, title)
    }
  }

  function closeTab(id: string): void {
    const index = tabs.value.findIndex((tab) => tab.id === id)
    if (index === -1) return

    // Close PTY session
    window.api.pty.close(id)

    // Remove tab
    tabs.value.splice(index, 1)

    // If we closed the active tab, activate another
    if (activeTabId.value === id) {
      if (tabs.value.length > 0) {
        // Activate the tab at the same index, or the last one
        const newIndex = Math.min(index, tabs.value.length - 1)
        setActiveTab(tabs.value[newIndex].id)
      } else {
        activeTabId.value = null
      }
    }
  }

  function setActiveTab(id: string): void {
    tabs.value.forEach((tab) => {
      tab.isActive = tab.id === id
    })
    activeTabId.value = id
  }

  function nextTab(): void {
    if (tabs.value.length <= 1) return

    const currentIndex = tabs.value.findIndex((tab) => tab.id === activeTabId.value)
    const nextIndex = (currentIndex + 1) % tabs.value.length
    setActiveTab(tabs.value[nextIndex].id)
  }

  function prevTab(): void {
    if (tabs.value.length <= 1) return

    const currentIndex = tabs.value.findIndex((tab) => tab.id === activeTabId.value)
    const prevIndex = (currentIndex - 1 + tabs.value.length) % tabs.value.length
    setActiveTab(tabs.value[prevIndex].id)
  }

  function switchToTab(index: number): void {
    if (index >= 0 && index < tabs.value.length) {
      setActiveTab(tabs.value[index].id)
    }
  }

  function closeAllTabs(): void {
    tabs.value.forEach((tab) => {
      window.api.pty.close(tab.id)
    })
    tabs.value = []
    activeTabId.value = null
  }

  return {
    tabs,
    activeTabId,
    activeTab,
    tabCount,
    createTab,
    updateTabTitle,
    closeTab,
    setActiveTab,
    nextTab,
    prevTab,
    switchToTab,
    closeAllTabs
  }
})
