import { ref } from 'vue'
import { useRouter } from 'vue-router'
/** @typedef {import('../types/schedule.js').CalendarDay} CalendarDay */
/** @typedef {import('../types/schedule.js').ScheduleApiResponse} ScheduleApiResponse */

/**
 * Composable for fetching schedule data from API
 * @param {string} schedulePath - The URL path to fetch schedule data from
 * @returns {{ scheduleData: import('vue').Ref<ScheduleApiResponse | null>, isLoading: import('vue').Ref<boolean>, error: import('vue').Ref<string | null> }}
 */
export default function useSchedule(schedulePath) {
  const router = useRouter()
  /** @type {import('vue').Ref<ScheduleApiResponse | null>} */
  const scheduleData = ref(null)
  const isLoading = ref(false)
  const error = ref(null)

  const fetchSchedule = async () => {
    if (!schedulePath || !schedulePath.trim()) {
      router.push("/missing")
      return
    }

    isLoading.value = true
    error.value = null

    try {
      const response = await fetch(schedulePath)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      /** @type {ScheduleApiResponse} */
      const data = await response.json()
      scheduleData.value = data
    } catch (err) {
      console.error("Failed to load schedule:", err)
      error.value = err.message
      router.push("/missing")
    } finally {
      isLoading.value = false
    }
  }

  return {
    scheduleData,
    isLoading,
    error,
    fetchSchedule
  }
}

