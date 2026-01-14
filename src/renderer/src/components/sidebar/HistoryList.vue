<script setup lang="ts">
import { ref } from 'vue'
import { Icon } from '@iconify/vue'
import { useHistoryStore } from '../../stores/history'
import { useTabsStore } from '../../stores/tabs'
import { useSettingsStore } from '../../stores/settings'
import SidebarSection from './SidebarSection.vue'

const historyStore = useHistoryStore()
const tabsStore = useTabsStore()
const settingsStore = useSettingsStore()

const editingId = ref<string | null>(null)
const editingTitle = ref('')

function openFromHistory(path: string, name: string) {
  if (editingId.value) return
  // Update working folder
  settingsStore.setWorkingFolder(path)
  // Open tab with resume mode (continue previous conversation)
  tabsStore.createTab({
    path,
    name,
    resume: true,
    skipHistory: true // Already in history, don't duplicate
  })
}

function startEditing(id: string, currentTitle: string, event: Event) {
  event.stopPropagation()
  editingId.value = id
  editingTitle.value = currentTitle || ''
}

async function saveTitle() {
  if (editingId.value) {
    await historyStore.updateTitle(editingId.value, editingTitle.value.trim() || 'Untitled')
  }
  editingId.value = null
  editingTitle.value = ''
}

function cancelEdit() {
  editingId.value = null
  editingTitle.value = ''
}
</script>

<template>
  <SidebarSection title="History" icon="lucide:history">
    <!-- History Items -->
    <div v-if="historyStore.sortedHistory.length > 0" class="space-y-0.5 px-1 max-h-64 overflow-y-auto">
      <div
        v-for="item in historyStore.sortedHistory"
        :key="item.id"
        class="flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-gray-800 transition-colors group"
        @click="openFromHistory(item.path, item.name)"
      >
        <Icon icon="lucide:message-square" class="w-4 h-4 text-gray-500 flex-shrink-0" />
        <div class="flex-1 min-w-0">
          <!-- Editing mode -->
          <div v-if="editingId === item.id" class="flex items-center gap-1" @click.stop>
            <input
              v-model="editingTitle"
              type="text"
              class="flex-1 px-1 py-0.5 text-sm bg-gray-800 text-gray-200 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
              placeholder="Enter title..."
              @keyup.enter="saveTitle"
              @keyup.escape="cancelEdit"
              @blur="saveTitle"
              autofocus
            />
          </div>
          <!-- Display mode -->
          <template v-else>
            <div class="flex items-center gap-1">
              <span class="text-sm text-gray-300 truncate flex-1">{{ item.title || 'Untitled' }}</span>
              <button
                class="p-0.5 text-gray-600 hover:text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
                @click="startEditing(item.id, item.title, $event)"
                title="Edit title"
              >
                <Icon icon="lucide:pencil" class="w-3 h-3" />
              </button>
            </div>
            <div class="text-xs text-gray-600 truncate">{{ item.name }} · {{ historyStore.formatTimestamp(item.timestamp) }}</div>
          </template>
        </div>
        <Icon
          icon="lucide:terminal"
          class="w-3.5 h-3.5 text-gray-700 group-hover:text-gray-500 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
        />
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="px-3 py-4 text-center">
      <Icon icon="lucide:clock" class="w-8 h-8 text-gray-700 mx-auto mb-2" />
      <p class="text-xs text-gray-600">No history yet</p>
    </div>

    <!-- Clear History Button -->
    <button
      v-if="historyStore.sortedHistory.length > 0"
      class="mx-2 mt-2 w-[calc(100%-16px)] flex items-center justify-center gap-1 px-3 py-1.5 text-sm text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded transition-colors"
      @click="historyStore.clearHistory()"
    >
      <Icon icon="lucide:trash-2" class="w-3 h-3" />
      <span>Clear History</span>
    </button>
  </SidebarSection>
</template>
