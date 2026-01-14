<script setup lang="ts">
import { useTabsStore } from '../../stores/tabs'
import TerminalTab from './TerminalTab.vue'

const tabsStore = useTabsStore()
</script>

<template>
  <div class="relative h-full w-full">
    <TerminalTab
      v-for="tab in tabsStore.tabs"
      :key="tab.id"
      :tab="tab"
      :is-visible="tab.id === tabsStore.activeTabId"
    />
  </div>
</template>
