<script lang="ts" setup>
import { ref, toRef, watch, onMounted } from 'vue'
import { useTerminal } from '../../composables/useTerminal'
import type { Tab } from '../../types'

const props = defineProps<{
  tab: Tab
  isVisible: boolean
}>()

const containerRef = ref<HTMLElement | null>(null)
const tabRef = toRef(props, 'tab')

const { focusTerminal, isReady } = useTerminal(tabRef, containerRef)

// Focus terminal when it becomes visible
watch(
  () => props.isVisible,
  (visible) => {
    if (visible && isReady.value) {
      setTimeout(focusTerminal, 50)
    }
  }
)

onMounted(() => {
  if (props.isVisible && isReady.value) {
    focusTerminal()
  }
})
</script>

<template>
  <div ref="containerRef" :class="['absolute inset-0 p-2', isVisible ? 'block' : 'hidden']"></div>
</template>

<style>
@import '@xterm/xterm/css/xterm.css';
</style>
