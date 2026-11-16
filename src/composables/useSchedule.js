import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { getCurrentDateString } from '../utils/dateUtils.js'

// One lazily loaded chunk per year: src/storage/plan_<year>.json
const plans = import.meta.glob('../storage/plan_*.json', { import: 'default' })
/** @typedef {import('../types/schedule.js').CalendarDay} CalendarDay */
/** @typedef {import('../types/schedule.js').ScheduleApiResponse} ScheduleApiResponse */

/**
 * Composable for loading schedule data.
 * Uses the embedded plan_<current year>.json (Budapest time) by default; an optional remote URL can override it.
 * @param {string | null | undefined} schedulePath - Optional URL to fetch schedule data from
 * @returns {{ scheduleData: import('vue').Ref<ScheduleApiResponse | null>, isLoading: import('vue').Ref<boolean>, error: import('vue').Ref<string | null>, fetchSchedule: () => Promise<void> }}
 */
export default function useSchedule(schedulePath) {
  const router = useRouter()
  /** @type {import('vue').Ref<ScheduleApiResponse | null>} */
  const scheduleData = ref(null)
  const isLoading = ref(false)
  const error = ref(null)

  const fetchSchedule = async () => {
    isLoading.value = true
    error.value = null

    try {
      const remotePath = schedulePath?.trim()
      if (remotePath) {
        const response = await fetch(remotePath)

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        /** @type {ScheduleApiResponse} */
        const data = await response.json()
        scheduleData.value = data
      } else {
        const year = getCurrentDateString().slice(0, 4)
        const load = plans[`../storage/plan_${year}.json`]
        if (!load) throw new Error(`No embedded schedule for ${year}`)
        scheduleData.value = await load()
      }
    } catch (err) {
      console.error('Failed to load schedule:', err)
      error.value = err.message
      router.push('/missing')
    } finally {
      isLoading.value = false
    }
  }

  return {
    scheduleData,
    isLoading,
    error,
    fetchSchedule,
  }
}
