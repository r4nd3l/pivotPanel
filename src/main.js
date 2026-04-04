import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import i18n from './i18n'
import '@mdi/font/css/materialdesignicons.css'
import './style.css'
// Apply dark theme immediately before Vue mounts to prevent flash
document.documentElement.classList.add('dark')

createApp(App).use(router).use(i18n).mount('#app')