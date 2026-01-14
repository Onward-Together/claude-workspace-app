<script setup lang="ts">
import { ref } from 'vue'
import { Icon } from '@iconify/vue'

defineProps<{
  title: string
  icon: string
}>()

const isExpanded = ref(true)

function toggle() {
  isExpanded.value = !isExpanded.value
}
</script>

<template>
  <div class="border-b border-gray-700">
    <!-- Header -->
    <button
      class="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-800 transition-colors text-left"
      @click="toggle"
    >
      <Icon :icon="icon" class="w-4 h-4 text-gray-400" />
      <span class="flex-1 text-sm font-medium text-gray-300">{{ title }}</span>
      <Icon
        :icon="isExpanded ? 'lucide:chevron-down' : 'lucide:chevron-right'"
        class="w-4 h-4 text-gray-500"
      />
    </button>

    <!-- Content -->
    <div v-show="isExpanded" class="pb-2">
      <slot></slot>
    </div>
  </div>
</template>
