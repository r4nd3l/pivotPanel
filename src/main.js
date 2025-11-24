import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import i18n from './i18n'
import '@mdi/font/css/materialdesignicons.css'
import './style.css'
import { applyTheme } from './composables/useTheme.js'

// Apply theme immediately before Vue mounts to prevent flash
applyTheme()

createApp(App).use(router).use(i18n).mount('#app')