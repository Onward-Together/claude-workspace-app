<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { Icon } from '@iconify/vue'
import type { DirectoryItem } from '../../types'

const props = defineProps<{
  isOpen: boolean
  title?: string
  selectButtonText?: string
}>()

const emit = defineEmits<{
  close: []
  select: [path: string]
}>()

const currentPath = ref('')
const directories = ref<DirectoryItem[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)

const breadcrumbs = computed(() => {
  if (!currentPath.value) return []
  const parts = currentPath.value.split('/').filter(Boolean)
  const crumbs: { name: string; path: string }[] = []

  let path = ''
  for (const part of parts) {
    path += '/' + part
    crumbs.push({ name: part, path })
  }

  return crumbs
})

async function loadDirectory(path: string) {
  isLoading.value = true
  error.value = null

  try {
    directories.value = await window.api.fs.browse(path, false)
    currentPath.value = path
  } catch (e) {
    error.value = 'Failed to load directory'
    console.error(e)
  } finally {
    isLoading.value = false
  }
}

async function navigateTo(path: string) {
  await loadDirectory(path)
}

async function goUp() {
  const parts = currentPath.value.split('/')
  parts.pop()
  const parentPath = parts.join('/') || '/'
  await loadDirectory(parentPath)
}

function handleSelect() {
  emit('select', currentPath.value)
}

function handleClose() {
  emit('close')
}

function handleBackdropClick(e: MouseEvent) {
  if (e.target === e.currentTarget) {
    handleClose()
  }
}

onMounted(async () => {
  const home = await window.api.fs.home()
  await loadDirectory(home)
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      @click="handleBackdropClick"
    >
      <div class="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <!-- Header -->
        <div class="flex items-center justify-between px-4 py-3 border-b border-gray-700">
          <h2 class="text-lg font-semibold text-white">{{ title || 'Select Folder' }}</h2>
          <button
            class="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
            @click="handleClose"
          >
            <Icon icon="lucide:x" class="w-5 h-5" />
          </button>
        </div>

        <!-- Breadcrumb -->
        <div class="flex items-center gap-1 px-4 py-2 bg-gray-900 border-b border-gray-700 overflow-x-auto">
          <button
            class="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors flex-shrink-0"
            title="Go up"
            :disabled="currentPath === '/'"
            @click="goUp"
          >
            <Icon icon="lucide:arrow-up" class="w-4 h-4" />
          </button>

          <button
            class="px-2 py-1 rounded hover:bg-gray-700 text-gray-300 text-sm transition-colors flex-shrink-0"
            @click="navigateTo('/')"
          >
            <Icon icon="lucide:hard-drive" class="w-4 h-4" />
          </button>

          <template v-for="(crumb, index) in breadcrumbs" :key="crumb.path">
            <Icon icon="lucide:chevron-right" class="w-4 h-4 text-gray-600 flex-shrink-0" />
            <button
              :class="[
                'px-2 py-1 rounded text-sm transition-colors flex-shrink-0 truncate max-w-32',
                index === breadcrumbs.length - 1
                  ? 'bg-gray-700 text-white'
                  : 'hover:bg-gray-700 text-gray-300'
              ]"
              @click="navigateTo(crumb.path)"
            >
              {{ crumb.name }}
            </button>
          </template>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto p-2 min-h-64">
          <!-- Loading -->
          <div v-if="isLoading" class="flex items-center justify-center h-full text-gray-500">
            <Icon icon="lucide:loader-2" class="w-6 h-6 animate-spin" />
          </div>

          <!-- Error -->
          <div v-else-if="error" class="flex items-center justify-center h-full text-red-400">
            {{ error }}
          </div>

          <!-- Empty -->
          <div v-else-if="directories.length === 0" class="flex items-center justify-center h-full text-gray-500">
            No folders found
          </div>

          <!-- Directory List -->
          <div v-else class="space-y-0.5">
            <button
              v-for="dir in directories"
              :key="dir.path"
              class="w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-700 transition-colors text-left"
              @click="navigateTo(dir.path)"
            >
              <Icon icon="lucide:folder" class="w-5 h-5 text-yellow-500 flex-shrink-0" />
              <span class="text-gray-200 truncate">{{ dir.name }}</span>
            </button>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-between px-4 py-3 border-t border-gray-700 bg-gray-850">
          <div class="text-sm text-gray-400 truncate max-w-md">
            {{ currentPath }}
          </div>
          <div class="flex items-center gap-2">
            <button
              class="px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
              @click="handleClose"
            >
              Cancel
            </button>
            <button
              class="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors"
              @click="handleSelect"
            >
              {{ selectButtonText || 'Select' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
