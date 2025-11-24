<template>
    <div class="flex flex-col items-center justify-start w-[1080px] h-full mx-auto bg-linear-to-br from-gray-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-8">
      <div v-if="scheduleData && minimumLoadTimePassed" class="w-full">
          <ScheduleDisplay :data="scheduleData" />
          <WeekDisplay :data="scheduleData" />
      </div>
      <div v-else class="flex flex-col items-center justify-center h-screen">
          <div class="flex flex-col items-center justify-center gap-6 h-full">
            <div class="animate-spin rounded-full h-24 w-24 border-t-4 border-b-4 border-blue-600"></div>
            <p class="text-4xl font-semibold text-gray-700 dark:text-gray-300">{{ t('loading') }}</p>
          </div>
      </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import ScheduleDisplay from '../components/ScheduleDisplay.vue'
import WeekDisplay from '../components/WeekDisplay.vue'
import useSchedule from '../composables/useSchedule.js'

const router = useRouter()
const route = useRoute()
const { t } = useI18n()

// Get schedule path from URL
const url = new URL(window.location.href)
const schedulePath = url.searchParams.get("schedule")

// Initialize schedule composable
const { scheduleData, fetchSchedule } = useSchedule(schedulePath)

// Minimum loading time (3 seconds)
const minimumLoadTimePassed = ref(false)
let loadingTimeout = null

onMounted(() => {
  const currentPath = route.path
  if (currentPath !== '/' && currentPath !== '/missing') {
    router.push("/missing")
    return
  }

  if (!schedulePath || !schedulePath.trim()) {
    router.push("/missing")
    return
  }

  // Start minimum loading timer (3 seconds)
  loadingTimeout = setTimeout(() => {
    minimumLoadTimePassed.value = true
  }, 300000)

  fetchSchedule()
})

onUnmounted(() => {
  if (loadingTimeout) {
    clearTimeout(loadingTimeout)
  }
})
</script>


