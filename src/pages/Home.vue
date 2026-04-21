<template>
    <div class="flex flex-col items-center justify-start w-full h-screen mx-auto bg-linear-to-br from-gray-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <div v-if="scheduleData && minimumLoadTimePassed" class="w-full flex flex-col gap-4 flex-1 min-h-0">
          <ToggleSwitches />
          <div class="flex flex-row gap-4 flex-1 min-h-0">
            <!-- Left panel: time / date / phase -->
            <div class="flex flex-col items-center justify-around gap-6 h-full flex-1 basis-0 min-w-0 bg-linear-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-2xl p-6 border border-blue-200 dark:border-gray-700">
              <div class="flex flex-col items-center justify-center gap-8">
                <i class="mdi mdi-weather-sunset text-8xl text-amber-500"></i>
                <h2 class="text-5xl font-bold m-0 p-0 text-gray-800 dark:text-gray-100 tracking-wide">
                  {{ t("today_now") }} 
                  <span class="text-5xl px-4 py-2 rounded-lg font-medium text-white bg-white/20">{{ phaseLabel }}</span>
                  {{ t("today_now_is") }}
                </h2>
              </div>
              <div class="flex flex-row items-center justify-center bg-white dark:bg-gray-800 rounded-2xl px-8 py-6 shadow-lg border-2 border-blue-300 dark:border-blue-600">
                <i class="mdi mdi-clock-outline text-8xl text-blue-600 dark:text-blue-400 mr-6"></i>
                <h3 class="text-9xl font-mono font-bold text-gray-900 dark:text-gray-100 m-0 leading-none">
                  {{ currentTime }}
                </h3>
              </div>
              <div v-if="hasMovies" class="flex flex-col items-center justify-between w-full bg-white dark:bg-gray-800 rounded-xl px-6 py-4 shadow-md gap-3">
                <div class="flex flex-row items-center justify-center w-full">
                  <i class="mdi mdi-television-classic text-5xl text-indigo-600 dark:text-indigo-400 mr-4 shrink-0"></i>
                  <p class="text-4xl font-semibold text-gray-700 dark:text-gray-200 m-0 wrap-break-word">
                    {{ t("today_movie") }} 
                  </p>
                </div>
                <div v-for="(movie, index) in movies" :key="index" class="flex flex-row items-center justify-center gap-3 w-full">
                  <span class="text-3xl font-mono font-bold text-indigo-400 dark:text-indigo-300 shrink-0">{{ movie.time }}</span>
                  <button
                    type="button"
                    class="text-3xl font-semibold text-indigo-600 dark:text-indigo-300 m-0 wrap-break-word underline decoration-2 underline-offset-4 hover:text-indigo-800 dark:hover:text-indigo-100 transition-colors cursor-pointer bg-transparent border-none p-0 text-left"
                    @click="openMovie(index)"
                  >
                    {{ movie.title }}
                  </button>
                </div>
              </div>
              <div v-else class="flex flex-row items-center justify-center w-full bg-white dark:bg-gray-800 rounded-xl px-6 py-4 shadow-md gap-3">
                <i class="mdi mdi-television-off text-5xl text-gray-400 dark:text-gray-500 shrink-0"></i>
                <p class="text-4xl font-semibold text-gray-400 dark:text-gray-500 m-0 wrap-break-word">
                  {{ t("today_movie_nope") }}
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

      <!-- Full-screen movie modal -->
      <div
        v-if="showMovieModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black"
      >
        <button
          type="button"
          class="absolute top-4 right-4 z-10 w-12 h-12 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/40 text-white shadow-lg cursor-pointer transition-colors"
          @click="closeMovie"
          aria-label="Close"
        >
          <i class="mdi mdi-close text-3xl"></i>
        </button>
        <div id="yt-player" class="w-full h-full"></div>
      </div>
    </div>
</template>

<script setup>
import { ref, nextTick, watch, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import WeekDisplay from '../components/WeekDisplay.vue'
import ToggleSwitches from '../components/ToggleSwitches.vue'
import useTimePhase from '../composables/useTimePhase.js'
import useSchedule from '../composables/useSchedule.js'
import useMoviePlayer from '../composables/useMoviePlayer.js'

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
  checkMovieTime()
}

// Get schedule path from URL
const url = new URL(window.location.href)
const schedulePath = url.searchParams.get("schedule")

const { scheduleData, fetchSchedule } = useSchedule(schedulePath)
const {
  showMovieModal, movies, hasMovies,
  openMovie, closeMovie, initPlayer, checkMovieTime,
} = useMoviePlayer(scheduleData)

watch(showMovieModal, async (visible) => {
  if (visible) {
    await nextTick()
    initPlayer('yt-player')
  }
})

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
