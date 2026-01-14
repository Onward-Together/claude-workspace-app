<script setup lang="ts">
import { Icon } from '@iconify/vue'

defineProps<{
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

function handleConfirm() {
  emit('confirm')
}

function handleCancel() {
  emit('cancel')
}

function handleBackdropClick(e: MouseEvent) {
  if (e.target === e.currentTarget) {
    handleCancel()
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      @click="handleBackdropClick"
    >
      <div class="bg-gray-800 rounded-lg shadow-xl w-full max-w-sm">
        <!-- Header -->
        <div class="flex items-center gap-3 px-4 py-3 border-b border-gray-700">
          <div
            :class="[
              'p-2 rounded-full',
              variant === 'danger' ? 'bg-red-900/50' : variant === 'warning' ? 'bg-yellow-900/50' : 'bg-blue-900/50'
            ]"
          >
            <Icon
              :icon="variant === 'danger' ? 'lucide:alert-triangle' : variant === 'warning' ? 'lucide:alert-circle' : 'lucide:info'"
              :class="[
                'w-5 h-5',
                variant === 'danger' ? 'text-red-400' : variant === 'warning' ? 'text-yellow-400' : 'text-blue-400'
              ]"
            />
          </div>
          <h2 class="text-lg font-semibold text-white">{{ title }}</h2>
        </div>

        <!-- Content -->
        <div class="p-4">
          <p class="text-gray-300">{{ message }}</p>
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-700">
          <button
            class="px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
            @click="handleCancel"
          >
            {{ cancelText || 'Cancel' }}
          </button>
          <button
            :class="[
              'px-4 py-2 text-sm rounded transition-colors',
              variant === 'danger'
                ? 'bg-red-600 hover:bg-red-500 text-white'
                : variant === 'warning'
                  ? 'bg-yellow-600 hover:bg-yellow-500 text-white'
                  : 'bg-blue-600 hover:bg-blue-500 text-white'
            ]"
            @click="handleConfirm"
          >
            {{ confirmText || 'Confirm' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
