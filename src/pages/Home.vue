<template>
    <div class="flex flex-col items-center justify-start w-[1080px] h-[1920px] mx-auto border border-red-500">
      <div v-if="scheduleData" class="w-full">
          <ScheduleDisplay :data="scheduleData" />
          <WeekDisplay :data="scheduleData" />
      </div>
      <div v-else>
          Loading data…
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


