<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useSettingsStore } from './stores/settings'
import { useHistoryStore } from './stores/history'
import { useTabsStore } from './stores/tabs'
import Sidebar from './components/layout/Sidebar.vue'
import MainContent from './components/layout/MainContent.vue'
import FolderBrowser from './components/modals/FolderBrowser.vue'
import UpdateNotification from './components/UpdateNotification.vue'

const settingsStore = useSettingsStore()
const historyStore = useHistoryStore()
const tabsStore = useTabsStore()

const isLoading = ref(true)
const showFolderBrowser = ref(false)
const folderBrowserMode = ref<'new-tab' | 'change-folder'>('new-tab')

// Cleanup functions for shortcuts
let cleanupNewTab: (() => void) | null = null
let cleanupCloseTab: (() => void) | null = null
let cleanupNextTab: (() => void) | null = null
let cleanupPrevTab: (() => void) | null = null
let cleanupSwitchTab: (() => void) | null = null

async function init() {
  await settingsStore.loadSettings()
  await historyStore.loadHistory()

  // If returning user with working folder, open it automatically
  if (!settingsStore.isFirstTime && settingsStore.workingFolder && tabsStore.tabs.length === 0) {
    tabsStore.createTab(settingsStore.workingFolder, settingsStore.workingFolderName)
  }

  isLoading.value = false
}

function setupShortcuts() {
  cleanupNewTab = window.api.onShortcut.newTab(() => {
    folderBrowserMode.value = 'new-tab'
    showFolderBrowser.value = true
  })

  cleanupCloseTab = window.api.onShortcut.closeTab(() => {
    if (tabsStore.activeTabId) {
      tabsStore.closeTab(tabsStore.activeTabId)
    }
  })

  cleanupNextTab = window.api.onShortcut.nextTab(() => {
    tabsStore.nextTab()
  })

  cleanupPrevTab = window.api.onShortcut.prevTab(() => {
    tabsStore.prevTab()
  })

  cleanupSwitchTab = window.api.onShortcut.switchTab((index) => {
    tabsStore.switchToTab(index)
  })
}

function cleanupShortcuts() {
  cleanupNewTab?.()
  cleanupCloseTab?.()
  cleanupNextTab?.()
  cleanupPrevTab?.()
  cleanupSwitchTab?.()
}

function openFolderBrowserForNewTab() {
  folderBrowserMode.value = 'new-tab'
  showFolderBrowser.value = true
}

function openFolderBrowserForChange() {
  folderBrowserMode.value = 'change-folder'
  showFolderBrowser.value = true
}

async function handleFolderSelect(path: string) {
  const name = path.split('/').pop() || path

  if (folderBrowserMode.value === 'change-folder') {
    // Update working folder
    await settingsStore.setWorkingFolder(path)
  }

  // Add to history
  await historyStore.addToHistory(path)

  // Create tab
  tabsStore.createTab(path, name)
  showFolderBrowser.value = false
}

onMounted(() => {
  init()
  setupShortcuts()
})

onUnmounted(() => {
  cleanupShortcuts()
})
</script>

<template>
  <!-- Loading State -->
  <div v-if="isLoading" class="h-screen bg-gray-900 flex items-center justify-center">
    <div class="text-gray-400">Loading...</div>
  </div>

  <!-- Main App -->
  <div class="h-screen flex bg-gray-900 text-gray-100 overflow-hidden">
    <!-- Sidebar -->
    <Sidebar @change-folder="openFolderBrowserForChange" />

    <!-- Main Content -->
    <MainContent @open-folder-browser="openFolderBrowserForNewTab" />

    <!-- Folder Browser Modal -->
    <FolderBrowser
      :is-open="showFolderBrowser"
      :title="folderBrowserMode === 'change-folder' ? 'Change Working Folder' : 'Open Folder'"
      :select-button-text="folderBrowserMode === 'change-folder' ? 'Select' : 'Open'"
      @close="showFolderBrowser = false"
      @select="handleFolderSelect"
    />

    <!-- Update Notification -->
    <UpdateNotification />
  </div>
</template>
