<script setup lang="ts">
import { useTabsStore } from '../../stores/tabs'
import TabBar from './TabBar.vue'
import TerminalContainer from '../terminal/TerminalContainer.vue'

const emit = defineEmits<{
  openFolderBrowser: []
}>()

const tabsStore = useTabsStore()
</script>

<template>
  <div class="flex-1 flex flex-col h-full bg-gray-900">
    <!-- Tab Bar -->
    <TabBar @open-folder-browser="emit('openFolderBrowser')" />

    <!-- Terminal Area -->
    <div class="flex-1 relative">
      <TerminalContainer v-if="tabsStore.tabs.length > 0" />

      <!-- Empty State -->
      <div
        v-else
        class="absolute inset-0 flex flex-col items-center justify-center text-gray-500"
      >
        <div class="text-6xl mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="4 17 10 11 4 5"></polyline>
            <line x1="12" y1="19" x2="20" y2="19"></line>
          </svg>
        </div>
        <p class="text-lg mb-2">No terminal tabs open</p>
        <p class="text-sm text-gray-600">
          Press <kbd class="px-2 py-1 bg-gray-800 rounded text-gray-400">Cmd+T</kbd> or click
          <kbd class="px-2 py-1 bg-gray-800 rounded text-gray-400">+</kbd> to open a new tab
        </p>
      </div>
    </div>
  </div>
</template>
