<script lang="ts" setup>
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import { useSettingsStore } from '../../stores/settings'
import WorkingFolder from '../sidebar/WorkingFolder.vue'
import HistoryList from '../sidebar/HistoryList.vue'

const emit = defineEmits<{
  changeFolder: []
}>()

const settingsStore = useSettingsStore()

const isCollapsed = computed(() => settingsStore.settings.sidebarCollapsed)

function toggleSidebar() {
  settingsStore.toggleSidebar()
}
</script>

<template>
  <aside
    :class="[
      'h-full bg-gray-900 border-r border-gray-700 flex flex-col transition-all duration-300',
      isCollapsed ? 'w-12' : 'w-64'
    ]"
  >
    <!-- Header -->
    <div class="flex items-center justify-between h-10 !px-1 border-b border-gray-700">
      <span v-if="!isCollapsed" class="text-sm font-semibold text-gray-200">Claude Workspace</span>
      <button
        class="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-gray-200 transition-colors"
        @click="toggleSidebar"
      >
        <Icon
          :icon="isCollapsed ? 'lucide:panel-left-open' : 'lucide:panel-left-close'"
          class="w-5 h-5"
        />
      </button>
    </div>

    <!-- Content -->
    <div v-if="!isCollapsed" class="flex-1 overflow-y-auto">
      <WorkingFolder @change-folder="emit('changeFolder')" />
      <HistoryList />
    </div>

    <!-- Collapsed icons -->
    <div v-else class="flex-1 flex flex-col items-center gap-2 py-4">
      <button
        class="p-2 rounded hover:bg-gray-700 text-gray-400 hover:text-gray-200 transition-colors"
        title="Working Folder"
        @click="toggleSidebar"
      >
        <Icon class="w-5 h-5" icon="lucide:folder" />
      </button>
      <button
        class="p-2 rounded hover:bg-gray-700 text-gray-400 hover:text-gray-200 transition-colors"
        title="History"
        @click="toggleSidebar"
      >
        <Icon class="w-5 h-5" icon="lucide:history" />
      </button>
    </div>
  </aside>
</template>
