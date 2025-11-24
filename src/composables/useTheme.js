import { onMounted, onUnmounted } from 'vue'
import { getCurrentDateInHungarianTimezone } from '../utils/dateUtils.js'

/**
 * Composable to manage theme (dark/light) based on time of day
 * Switches to dark mode during evening/night hours (18:00 - 6:00)
 * @returns {Object} Theme state and methods
 */
export default function useTheme() {
  let intervalId = null

  /**
   * Check if current time should use dark mode
   * Dark mode: 18:00 (6 PM) to 6:00 (6 AM) in Hungarian timezone
   * @returns {boolean} True if should use dark mode
   */
  const shouldUseDarkMode = () => {
    const now = new Date()
    
    // Get current hour in Hungarian timezone
    const hungarianTimeString = now.toLocaleString('en-US', {
      timeZone: 'Europe/Budapest',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
    
    // Extract hour from format like "18:30"
    const hour = parseInt(hungarianTimeString.split(':')[0])
    
    // Dark mode from 6 PM (18:00) to 6 AM (06:00)
    return hour >= 18 || hour < 6
  }

  /**
   * Apply theme based on time of day
   */
  const applyTheme = () => {
    const isDark = shouldUseDarkMode()
    const htmlElement = document.documentElement
    
    if (isDark) {
      htmlElement.classList.add('dark')
    } else {
      htmlElement.classList.remove('dark')
    }
  }

  /**
   * Start theme monitoring
   */
  const startThemeMonitoring = () => {
    // Apply theme immediately
    applyTheme()
    
    // Check every minute to update theme if needed
    intervalId = setInterval(() => {
      applyTheme()
    }, 60000) // Check every minute
  }

  /**
   * Stop theme monitoring
   */
  const stopThemeMonitoring = () => {
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
  }

  onMounted(() => {
    startThemeMonitoring()
  })

  onUnmounted(() => {
    stopThemeMonitoring()
  })

  return {
    applyTheme,
    shouldUseDarkMode,
    startThemeMonitoring,
    stopThemeMonitoring
  }
}

