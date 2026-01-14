import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { HistoryItem } from '../types'

export const useHistoryStore = defineStore('history', () => {
  const history = ref<HistoryItem[]>([])
  const isLoading = ref(false)

  const sortedHistory = computed(() => {
    return [...history.value].sort((a, b) => b.timestamp - a.timestamp)
  })

  async function loadHistory(): Promise<void> {
    isLoading.value = true
    try {
      history.value = await window.api.history.get()
    } catch (error) {
      console.error('Failed to load history:', error)
      history.value = []
    } finally {
      isLoading.value = false
    }
  }

  async function addToHistory(path: string): Promise<void> {
    try {
      history.value = await window.api.history.add(path)
    } catch (error) {
      console.error('Failed to add to history:', error)
    }
  }

  async function updateTitle(id: string, title: string): Promise<void> {
    try {
      history.value = await window.api.history.update(id, title)
    } catch (error) {
      console.error('Failed to update history title:', error)
    }
  }

  async function clearHistory(): Promise<void> {
    try {
      await window.api.history.clear()
      history.value = []
    } catch (error) {
      console.error('Failed to clear history:', error)
    }
  }

  function formatTimestamp(timestamp: number): string {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()

    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`

    return date.toLocaleDateString()
  }

  return {
    history,
    sortedHistory,
    isLoading,
    loadHistory,
    addToHistory,
    updateTitle,
    clearHistory,
    formatTimestamp
  }
})
