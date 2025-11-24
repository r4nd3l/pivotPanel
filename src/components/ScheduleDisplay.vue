<template>
  <div class="w-full h-fit bg-linear-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-2xl p-8 mb-6 border border-blue-200 dark:border-gray-700">
    <div class="flex flex-row items-center justify-around w-full mb-6">
      <div class="flex flex-col items-center">
        <i class="mdi mdi-weather-sunset text-6xl text-amber-500 mb-2"></i>
        <h2 class="text-5xl font-bold capitalize m-0 p-0 text-gray-800 dark:text-gray-100 tracking-wide">
          {{ phaseLabel }}
        </h2>
      </div>
      <div class="flex flex-row items-center justify-center bg-white dark:bg-gray-800 rounded-2xl px-8 py-6 shadow-lg border-2 border-blue-300 dark:border-blue-600">
        <i class="mdi mdi-clock-outline text-7xl text-blue-600 dark:text-blue-400 mr-6"></i>
        <h3 class="text-7xl font-mono font-bold text-gray-900 dark:text-gray-100 m-0">
          {{ currentTime }}
        </h3>
      </div>
    </div>
    <div class="flex flex-row items-center justify-center w-full bg-white dark:bg-gray-800 rounded-xl px-6 py-4 shadow-md">
      <i class="mdi mdi-calendar-text text-5xl text-indigo-600 dark:text-indigo-400 mr-4"></i>
      <p class="text-4xl font-semibold capitalize text-gray-700 dark:text-gray-200 m-0">
        {{ currentDate }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import useTimePhase from '../composables/useTimePhase.js'

const { phaseLabel } = useTimePhase()
const currentTime = ref('')
const currentDate = ref('')

const formatTime = () => {
  const now = new Date()
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  // const seconds = String(now.getSeconds()).padStart(2, '0')
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

let interval = null

onMounted(() => {
  updateTime()
  interval = setInterval(updateTime, 1000)
})

onUnmounted(() => {
  if (interval) {
    clearInterval(interval)
  }
})
</script>