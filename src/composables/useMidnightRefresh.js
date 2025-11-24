import { onMounted, onUnmounted } from 'vue'

/**
 * Composable to schedule page reload at midnight (Hungarian timezone)
 * @returns {Object} Object with cleanup function
 */
export default function useMidnightRefresh() {
  let timeoutId = null

  /**
   * Get milliseconds until next midnight in Hungarian timezone
   * @returns {number} Milliseconds until next midnight
   */
  const getMsUntilMidnight = () => {
    const now = new Date()
    
    // Get current time in Hungarian timezone
    const hungarianTimeString = now.toLocaleString('en-US', {
      timeZone: 'Europe/Budapest',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })
    
    // Parse: "MM/DD/YYYY, HH:MM:SS"
    const [datePart, timePart] = hungarianTimeString.split(', ')
    const [month, day, year] = datePart.split('/')
    const [hours, minutes, seconds] = timePart.split(':')
    
    // Create date objects for current time and next midnight in Hungarian timezone
    const hungarianNow = new Date(`${year}-${month}-${day}T${hours}:${minutes}:${seconds}`)
    const nextMidnight = new Date(hungarianNow)
    nextMidnight.setDate(nextMidnight.getDate() + 1)
    nextMidnight.setHours(0, 0, 0, 0)
    
    // Calculate difference
    return nextMidnight.getTime() - hungarianNow.getTime()
  }

  /**
   * Schedule the midnight refresh
   */
  const scheduleMidnightRefresh = () => {
    // Clear any existing timeout
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    const msUntilMidnight = getMsUntilMidnight()
    
    // Schedule reload at midnight
    timeoutId = setTimeout(() => {
      window.location.reload()
      scheduleMidnightRefresh() // Schedule next refresh
    }, msUntilMidnight)
  }

  /**
   * Cleanup function to clear the timeout
   */
  const cleanup = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  }

  onMounted(() => {
    scheduleMidnightRefresh()
  })

  onUnmounted(() => {
    cleanup()
  })

  return {
    cleanup
  }
}

