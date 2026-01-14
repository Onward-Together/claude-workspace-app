<script setup lang="ts">
import { ref } from 'vue'
import { Icon } from '@iconify/vue'
import { useSettingsStore } from '../../stores/settings'
import { useTabsStore } from '../../stores/tabs'
import { useHistoryStore } from '../../stores/history'
import FolderBrowser from '../modals/FolderBrowser.vue'

const emit = defineEmits<{
  complete: []
}>()

const settingsStore = useSettingsStore()
const tabsStore = useTabsStore()
const historyStore = useHistoryStore()

const selectedFolder = ref<string | null>(null)
const selectedFolderName = ref('')
const showFolderBrowser = ref(false)

function handleFolderSelect(path: string) {
  selectedFolder.value = path
  selectedFolderName.value = path.split('/').pop() || path
  showFolderBrowser.value = false
}

function clearSelection() {
  selectedFolder.value = null
  selectedFolderName.value = ''
}

async function handleComplete() {
  if (selectedFolder.value) {
    // Save working folder and complete setup
    await settingsStore.completeFirstTimeSetup(selectedFolder.value)

    // Add to history
    await historyStore.addToHistory(selectedFolder.value)

    // Open tab with selected folder
    tabsStore.createTab(selectedFolder.value, selectedFolderName.value)
  } else {
    // Just complete setup without folder
    await settingsStore.updateSettings({ firstTimeSetupCompleted: true })
  }

  emit('complete')
}

async function handleSkip() {
  await settingsStore.updateSettings({ firstTimeSetupCompleted: true })
  emit('complete')
}
</script>

<template>
  <div class="min-h-screen bg-gray-900 flex items-center justify-center p-8">
    <div class="max-w-xl w-full">
      <!-- Header -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
          <Icon icon="lucide:terminal" class="w-8 h-8 text-white" />
        </div>
        <h1 class="text-3xl font-bold text-white mb-2">Welcome to Claude Workspace</h1>
        <p class="text-gray-400">
          Select a folder to start working with Claude Code.
        </p>
      </div>

      <!-- Folder Selection -->
      <div class="bg-gray-800 rounded-lg p-4 mb-6">
        <h2 class="text-sm font-medium text-gray-300 mb-3">Working Folder</h2>

        <!-- Selected Folder -->
        <div v-if="selectedFolder" class="flex items-center gap-3 p-3 bg-gray-900 rounded-lg mb-4">
          <Icon icon="lucide:folder" class="w-5 h-5 text-yellow-500 flex-shrink-0" />
          <div class="flex-1 min-w-0">
            <div class="text-gray-200 text-sm font-medium">{{ selectedFolderName }}</div>
            <div class="text-xs text-gray-500 truncate">{{ selectedFolder }}</div>
          </div>
          <button
            class="p-1.5 rounded hover:bg-gray-800 text-gray-500 hover:text-red-400 transition-colors"
            title="Remove selection"
            @click="clearSelection"
          >
            <Icon icon="lucide:x" class="w-4 h-4" />
          </button>
        </div>

        <!-- Empty State / Select Button -->
        <div v-else class="text-center py-6 text-gray-500 mb-4">
          <Icon icon="lucide:folder-open" class="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p class="text-sm">No folder selected</p>
        </div>

        <!-- Browse Button -->
        <button
          class="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white rounded-lg transition-colors"
          @click="showFolderBrowser = true"
        >
          <Icon icon="lucide:folder-search" class="w-4 h-4" />
          <span>{{ selectedFolder ? 'Change Folder' : 'Browse Folder' }}</span>
        </button>
      </div>

      <!-- Actions -->
      <div class="flex items-center justify-between">
        <button
          class="px-4 py-2 text-gray-400 hover:text-white transition-colors"
          @click="handleSkip"
        >
          Skip for now
        </button>
        <button
          :class="[
            'px-6 py-2 rounded-lg transition-colors flex items-center gap-2',
            selectedFolder
              ? 'bg-blue-600 hover:bg-blue-500 text-white'
              : 'bg-gray-700 text-gray-400 cursor-not-allowed'
          ]"
          :disabled="!selectedFolder"
          @click="handleComplete"
        >
          <span>Get Started</span>
          <Icon icon="lucide:arrow-right" class="w-4 h-4" />
        </button>
      </div>

      <!-- Tips -->
      <div class="mt-8 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
        <h3 class="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
          <Icon icon="lucide:lightbulb" class="w-4 h-4 text-yellow-500" />
          Quick Tips
        </h3>
        <ul class="text-sm text-gray-400 space-y-1">
          <li>• The app will remember your last working folder</li>
          <li>• Press <kbd class="px-1.5 py-0.5 bg-gray-700 rounded text-xs">Cmd+T</kbd> to open a new terminal tab</li>
          <li>• Check history in sidebar to switch to previous folders</li>
        </ul>
      </div>
    </div>

    <!-- Folder Browser Modal -->
    <FolderBrowser
      :is-open="showFolderBrowser"
      title="Select Working Folder"
      @close="showFolderBrowser = false"
      @select="handleFolderSelect"
    />
  </div>
</template>
