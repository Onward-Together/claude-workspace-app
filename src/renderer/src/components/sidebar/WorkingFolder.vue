<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { useSettingsStore } from '../../stores/settings'
import { useTabsStore } from '../../stores/tabs'

const emit = defineEmits<{
  changeFolder: []
}>()

const settingsStore = useSettingsStore()
const tabsStore = useTabsStore()

function openWorkingFolder() {
  if (settingsStore.workingFolder) {
    tabsStore.createTab(settingsStore.workingFolder, settingsStore.workingFolderName)
  }
}
</script>

<template>
  <div class="p-3 border-b border-gray-800">
    <div class="flex items-center justify-between mb-2">
      <span class="text-xs font-medium text-gray-500 uppercase tracking-wider">Working Folder</span>
      <button
        class="p-1 rounded hover:bg-gray-700 text-gray-500 hover:text-gray-300 transition-colors"
        title="Change folder"
        @click="emit('changeFolder')"
      >
        <Icon icon="lucide:folder-edit" class="w-4 h-4" />
      </button>
    </div>

    <!-- Current Folder -->
    <div v-if="settingsStore.workingFolder">
      <button
        class="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-800 text-left transition-colors group"
        @click="openWorkingFolder"
      >
        <Icon icon="lucide:folder" class="w-4 h-4 text-yellow-500 flex-shrink-0" />
        <div class="flex-1 min-w-0">
          <div class="text-sm text-gray-300 truncate">{{ settingsStore.workingFolderName }}</div>
          <div class="text-xs text-gray-600 truncate">{{ settingsStore.workingFolder }}</div>
        </div>
        <Icon
          icon="lucide:terminal"
          class="w-3.5 h-3.5 text-gray-600 group-hover:text-gray-400 flex-shrink-0"
        />
      </button>
    </div>

    <!-- No Folder Selected -->
    <div v-else class="text-center py-4">
      <Icon icon="lucide:folder-x" class="w-8 h-8 text-gray-700 mx-auto mb-2" />
      <p class="text-xs text-gray-600 mb-2">No folder selected</p>
      <button
        class="text-xs text-blue-500 hover:text-blue-400 transition-colors"
        @click="emit('changeFolder')"
      >
        Select a folder
      </button>
    </div>
  </div>
</template>
