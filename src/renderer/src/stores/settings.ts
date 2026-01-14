import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Settings } from '../types'

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<Settings>({
    firstTimeSetupCompleted: false,
    sidebarCollapsed: false,
    workingFolder: undefined
  })
  const isLoading = ref(false)
  const isFirstTime = ref(true)

  const workingFolder = computed(() => settings.value.workingFolder)
  const workingFolderName = computed(() => {
    if (!settings.value.workingFolder) return ''
    const parts = settings.value.workingFolder.split('/')
    return parts[parts.length - 1] || settings.value.workingFolder
  })

  async function loadSettings(): Promise<void> {
    isLoading.value = true
    try {
      settings.value = await window.api.settings.get()
      isFirstTime.value = await window.api.settings.isFirstTime()
    } catch (error) {
      console.error('Failed to load settings:', error)
    } finally {
      isLoading.value = false
    }
  }

  async function updateSettings(updates: Partial<Settings>): Promise<void> {
    try {
      settings.value = await window.api.settings.set(updates)
      if (updates.firstTimeSetupCompleted !== undefined) {
        isFirstTime.value = !updates.firstTimeSetupCompleted
      }
    } catch (error) {
      console.error('Failed to update settings:', error)
    }
  }

  async function setWorkingFolder(path: string): Promise<void> {
    await updateSettings({ workingFolder: path })
  }

  async function completeFirstTimeSetup(folder: string): Promise<void> {
    await updateSettings({
      firstTimeSetupCompleted: true,
      workingFolder: folder
    })
  }

  function toggleSidebar(): void {
    updateSettings({ sidebarCollapsed: !settings.value.sidebarCollapsed })
  }

  return {
    settings,
    isLoading,
    isFirstTime,
    workingFolder,
    workingFolderName,
    loadSettings,
    updateSettings,
    setWorkingFolder,
    completeFirstTimeSetup,
    toggleSidebar
  }
})
