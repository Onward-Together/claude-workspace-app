<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Icon } from '@iconify/vue'

type UpdateState = 'checking' | 'available' | 'downloading' | 'ready' | 'idle'

const updateState = ref<UpdateState>('idle')
const newVersion = ref('')
const downloadProgress = ref(0)
const showNotification = ref(false)

let cleanupAvailable: (() => void) | null = null
let cleanupProgress: (() => void) | null = null
let cleanupDownloaded: (() => void) | null = null

function handleDownload() {
  updateState.value = 'downloading'
  window.api.update.download()
}

function handleInstall() {
  window.api.update.install()
}

function handleDismiss() {
  showNotification.value = false
}

function setupUpdateListeners() {
  cleanupAvailable = window.api.update.onAvailable((info) => {
    console.log('Update available:', info.version)
    newVersion.value = info.version
    updateState.value = 'available'
    showNotification.value = true
  })

  cleanupProgress = window.api.update.onDownloadProgress((progress) => {
    console.log('Download progress:', progress.percent)
    downloadProgress.value = Math.round(progress.percent)
  })

  cleanupDownloaded = window.api.update.onDownloaded((info) => {
    console.log('Update downloaded:', info.version)
    updateState.value = 'ready'
    downloadProgress.value = 100
  })
}

function cleanupListeners() {
  cleanupAvailable?.()
  cleanupProgress?.()
  cleanupDownloaded?.()
}

onMounted(() => {
  setupUpdateListeners()
})

onUnmounted(() => {
  cleanupListeners()
})
</script>

<template>
  <Teleport to="body">
    <!-- Notification Toast -->
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="translate-y-[-100%] opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="translate-y-[-100%] opacity-0"
    >
      <div
        v-if="showNotification"
        class="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4"
      >
        <div class="bg-gray-800 rounded-lg shadow-2xl border border-gray-700 overflow-hidden">
          <!-- Header -->
          <div class="flex items-center justify-between px-4 py-3 border-b border-gray-700">
            <div class="flex items-center gap-3">
              <div class="p-2 rounded-full bg-blue-900/50">
                <Icon
                  :icon="
                    updateState === 'downloading'
                      ? 'lucide:download'
                      : updateState === 'ready'
                        ? 'lucide:check-circle'
                        : 'lucide:arrow-up-circle'
                  "
                  :class="[
                    'w-5 h-5',
                    updateState === 'ready' ? 'text-green-400' : 'text-blue-400'
                  ]"
                />
              </div>
              <div>
                <h3 class="text-sm font-semibold text-white">
                  {{
                    updateState === 'downloading'
                      ? 'Downloading Update'
                      : updateState === 'ready'
                        ? 'Update Ready'
                        : 'Update Available'
                  }}
                </h3>
                <p class="text-xs text-gray-400">Version {{ newVersion }}</p>
              </div>
            </div>
            <button
              class="p-1 hover:bg-gray-700 rounded transition-colors"
              @click="handleDismiss"
            >
              <Icon icon="lucide:x" class="w-4 h-4 text-gray-400" />
            </button>
          </div>

          <!-- Content -->
          <div class="px-4 py-3">
            <!-- Available State -->
            <p v-if="updateState === 'available'" class="text-sm text-gray-300">
              A new version is available. Download now to get the latest features and improvements.
            </p>

            <!-- Downloading State -->
            <div v-else-if="updateState === 'downloading'" class="space-y-2">
              <p class="text-sm text-gray-300">Downloading update...</p>
              <div class="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                <div
                  class="bg-blue-500 h-full transition-all duration-300 ease-out"
                  :style="{ width: `${downloadProgress}%` }"
                ></div>
              </div>
              <p class="text-xs text-gray-400 text-right">{{ downloadProgress }}%</p>
            </div>

            <!-- Ready State -->
            <p v-else-if="updateState === 'ready'" class="text-sm text-gray-300">
              Update downloaded successfully. Restart the app to install.
            </p>
          </div>

          <!-- Actions -->
          <div class="flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-700">
            <button
              v-if="updateState === 'available'"
              class="px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
              @click="handleDismiss"
            >
              Later
            </button>
            <button
              v-if="updateState === 'available'"
              class="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors"
              @click="handleDownload"
            >
              Download
            </button>

            <button
              v-if="updateState === 'ready'"
              class="px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
              @click="handleDismiss"
            >
              Later
            </button>
            <button
              v-if="updateState === 'ready'"
              class="px-4 py-2 text-sm bg-green-600 hover:bg-green-500 text-white rounded transition-colors"
              @click="handleInstall"
            >
              Restart & Install
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
