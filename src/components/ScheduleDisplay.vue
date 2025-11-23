<template>
  <div class="w-full">
    <div class="flex flex-row items-center justify-around w-full">
      <h2 class="text-[4rem] capitalize m-0 p-0">{{ phaseLabel }}</h2>
      <h3 class="text-[6rem]">{{ currentTime }}</h3>
    </div>
    <div class="flex flex-row items-center justify-center w-full">
      <p class="text-[4rem] capitalize">{{ currentDate }}</p>
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
  const seconds = String(now.getSeconds()).padStart(2, '0')
  return `${hours}:${minutes}:${seconds}`
}

const formatDate = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.toLocaleDateString('hu-HU', { month: 'long' })
  const day = now.toLocaleDateString('hu-HU', { weekday: 'long' })
  return `${year} - ${month} - ${day}`
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