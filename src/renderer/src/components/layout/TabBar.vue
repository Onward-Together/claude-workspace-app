<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { useTabsStore } from '../../stores/tabs'

const emit = defineEmits<{
  openFolderBrowser: []
}>()

const tabsStore = useTabsStore()

function handleCloseTab(e: MouseEvent, id: string) {
  e.stopPropagation()
  tabsStore.closeTab(id)
}

function handleNewTab() {
  emit('openFolderBrowser')
}
</script>

<template>
  <div class="flex items-center bg-gray-800 border-b border-gray-700 h-10 px-1">
    <!-- Tabs -->
    <div class="flex-1 flex items-center overflow-x-auto">
      <div
        v-for="(tab, index) in tabsStore.tabs"
        :key="tab.id"
        :class="[
          'flex items-center gap-2 pl-3 pr-1 py-1.5 cursor-pointer border-r border-gray-700 min-w-0 max-w-52',
          'hover:bg-gray-700 transition-colors group relative',
          tab.isActive ? 'bg-gray-900 text-white' : 'bg-gray-800 text-gray-400 hover:text-gray-200'
        ]"
        @click="tabsStore.setActiveTab(tab.id)"
      >
        <Icon icon="lucide:terminal" class="w-4 h-4 flex-shrink-0 text-blue-400" />
        <span class="truncate text-sm flex-1">{{ tab.name }}</span>
        <span v-if="index < 9" class="text-[10px] text-gray-600 flex-shrink-0 font-mono">
          {{ index + 1 }}
        </span>
        <!-- Close Button - Always visible -->
        <button
          :class="[
            'ml-1 p-1 rounded-sm flex-shrink-0 transition-colors',
            tab.isActive
              ? 'text-gray-400 hover:text-white hover:bg-gray-700'
              : 'text-gray-500 hover:text-gray-200 hover:bg-gray-600'
          ]"
          title="Close tab"
          @click="(e) => handleCloseTab(e, tab.id)"
        >
          <Icon icon="lucide:x" class="w-3.5 h-3.5" />
        </button>
      </div>
    </div>

    <!-- New Tab Button -->
    <button
      class="flex items-center justify-center w-10 h-full hover:bg-gray-700 text-gray-400 hover:text-white transition-colors border-l border-gray-700"
      title="New Tab (Cmd+T)"
      @click="handleNewTab"
    >
      <Icon icon="lucide:plus" class="w-4 h-4" />
    </button>
  </div>
</template>
