<template>
    <div class="flex flex-col items-center justify-start w-[1080px] h-[1920px] mx-auto border border-red-500">
      <div v-if="scheduleData" class="w-full">
          <ScheduleDisplay :data="scheduleData" class="border-b border-gray-500" />
      </div>
      <div v-else>
          Loading data…
      </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import ScheduleDisplay from '../components/ScheduleDisplay.vue'

const router = useRouter()
const route = useRoute()
const scheduleData = ref(null)

onMounted(() => {
  const currentPath = route.path
  if (currentPath !== '/' && currentPath !== '/missing') {
    router.push("/missing")
    return
  }

  const url = new URL(window.location.href)
  const schedulePath = url.searchParams.get("schedule")

  if (!schedulePath || !schedulePath.trim()) {
    router.push("/missing")
    return
  }

  fetch(schedulePath)
    .then(r => {
      if (!r.ok) {
        throw new Error(`HTTP error! status: ${r.status}`)
      }
      return r.json()
    })
    .then(data => {
      scheduleData.value = data
    })
    .catch(err => {
      console.error("Failed to load schedule:", err)
      router.push("/missing")
    })
})
</script>


