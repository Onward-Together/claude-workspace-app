import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { addCollection } from '@iconify/vue'
import lucide from '@iconify-json/lucide/icons.json'
import App from './App.vue'

// Load lucide icons locally (no API fetch needed)
addCollection(lucide)

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.mount('#app')
