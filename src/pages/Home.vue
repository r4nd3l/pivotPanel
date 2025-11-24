<template>
    <div class="flex flex-col items-center justify-start w-[1080px] h-full mx-auto bg-linear-to-br from-gray-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-8">
      <div v-if="scheduleData" class="w-full">
          <ScheduleDisplay :data="scheduleData" />
          <WeekDisplay :data="scheduleData" />
      </div>
      <div v-else class="flex flex-col items-center justify-center h-full">
          <div class="flex flex-col items-center gap-6">
            <div class="animate-spin rounded-full h-24 w-24 border-t-4 border-b-4 border-blue-600"></div>
            <p class="text-4xl font-semibold text-gray-700 dark:text-gray-300">Loading data…</p>
          </div>
      </div>
    </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import ScheduleDisplay from '../components/ScheduleDisplay.vue'
import WeekDisplay from '../components/WeekDisplay.vue'
import useSchedule from '../composables/useSchedule.js'

const router = useRouter()
const route = useRoute()

// Get schedule path from URL
const url = new URL(window.location.href)
const schedulePath = url.searchParams.get("schedule")

// Initialize schedule composable
const { scheduleData, fetchSchedule } = useSchedule(schedulePath)

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

  fetchSchedule()
})
</script>


