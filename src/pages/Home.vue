<template>
    <div class="flex flex-col items-center justify-start w-full h-screen mx-auto bg-linear-to-br from-gray-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <div v-if="scheduleData && minimumLoadTimePassed" class="w-full flex flex-col gap-4 flex-1 min-h-0">
          <ToggleSwitches />
          <div class="flex flex-row gap-4 flex-1 min-h-0">
            <!-- Left panel: time / date / phase -->
            <div class="flex flex-col items-center justify-between gap-6 flex-1 basis-0 min-w-0 bg-linear-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-2xl p-8 border border-blue-200 dark:border-gray-700">
              <div class="flex flex-col items-center">
                <i class="mdi mdi-weather-sunset text-[12rem] text-amber-500 mb-4"></i>
                <h2 class="text-8xl font-bold capitalize m-0 p-0 text-gray-800 dark:text-gray-100 tracking-wide">
                  {{ t("today_now") }} 
                  <span class="text-8xl px-6 py-3 rounded-lg font-medium text-white bg-white/20">{{ phaseLabel }}</span>
                  {{ t("today_now_is") }}
                </h2>
              </div>
              <div class="flex flex-row items-center justify-center bg-white dark:bg-gray-800 rounded-2xl px-10 py-8 shadow-lg border-2 border-blue-300 dark:border-blue-600">
                <i class="mdi mdi-clock-outline text-[10rem] text-blue-600 dark:text-blue-400 mr-8"></i>
                <h3 class="text-[10rem] font-mono font-bold text-gray-900 dark:text-gray-100 m-0 leading-none">
                  {{ currentTime }}
                </h3>
              </div>
              <div class="flex flex-row items-center justify-center w-full bg-white dark:bg-gray-800 rounded-xl px-8 py-6 shadow-md">
                <i class="mdi mdi-calendar-text text-8xl text-indigo-600 dark:text-indigo-400 mr-6 shrink-0"></i>
                <p class="text-6xl font-semibold capitalize text-gray-700 dark:text-gray-200 m-0 wrap-break-word">
                  {{ currentDate }}
                </p>
              </div>
            </div>
            <!-- Right panel: today card -->
            <WeekDisplay :data="scheduleData" class="flex-1 basis-0 min-w-0" />
          </div>
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
import WeekDisplay from '../components/WeekDisplay.vue'
import ToggleSwitches from '../components/ToggleSwitches.vue'
import useTimePhase from '../composables/useTimePhase.js'
import useSchedule from '../composables/useSchedule.js'

const router = useRouter()
const route = useRoute()
const { t } = useI18n()
const { phaseLabel } = useTimePhase()

const currentTime = ref('')
const currentDate = ref('')

const formatTime = () => {
  const now = new Date()
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

const formatDate = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.toLocaleDateString('hu-HU', { month: 'long' })
  const date = now.getDate()
  const day = now.toLocaleDateString('hu-HU', { weekday: 'long' })
  return `${year} - ${month} - ${date} - ${day}`
}

const updateTime = () => {
  currentTime.value = formatTime()
  currentDate.value = formatDate()
}

// Get schedule path from URL
const url = new URL(window.location.href)
const schedulePath = url.searchParams.get("schedule")

const { scheduleData, fetchSchedule } = useSchedule(schedulePath)

const minimumLoadTimePassed = ref(false)
let loadingTimeout = null
let timeInterval = null

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

  loadingTimeout = setTimeout(() => {
    minimumLoadTimePassed.value = true
  }, 3000)

  fetchSchedule()

  updateTime()
  timeInterval = setInterval(updateTime, 1000)
})

onUnmounted(() => {
  if (loadingTimeout) {
    clearTimeout(loadingTimeout)
  }
  if (timeInterval) {
    clearInterval(timeInterval)
  }
})
</script>
