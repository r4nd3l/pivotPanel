import { createRouter, createWebHistory } from 'vue-router'

import Home from './pages/Home.vue'
import MissingSchedule from './pages/MissingSchedule.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', component: Home },
    { path: '/missing', component: MissingSchedule },
    { path: '/:pathMatch(.*)*', redirect: '/missing' },
  ],
})

export default router
