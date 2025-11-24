import { onMounted, onUnmounted } from 'vue'

/**
 * Check if current time should use dark mode
 * Dark mode: 18:00 (6 PM) to 6:00 (6 AM) in Hungarian timezone
 * @returns {boolean} True if should use dark mode
 */
export function shouldUseDarkMode() {
  try {
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
    const isDark = hour >= 18 || hour < 6
    
    // Debug logging (can be removed in production)
    console.log(`[Theme] Hungarian time: ${hungarianTimeString}, Hour: ${hour}, Dark mode: ${isDark}`)
    
    return isDark
  } catch (error) {
    console.error('[Theme] Error checking time:', error)
    // Fallback: use system time if timezone detection fails
    const hour = new Date().getHours()
    return hour >= 18 || hour < 6
  }
}

/**
 * Apply theme based on time of day
 */
export function applyTheme() {
  try {
    const isDark = shouldUseDarkMode()
    const htmlElement = document.documentElement
    
    if (!htmlElement) {
      console.warn('[Theme] HTML element not found')
      return
    }
    
    if (isDark) {
      htmlElement.classList.add('dark')
      console.log('[Theme] Applied dark mode')
    } else {
      htmlElement.classList.remove('dark')
      console.log('[Theme] Applied light mode')
    }
  } catch (error) {
    console.error('[Theme] Error applying theme:', error)
  }
}

/**
 * Composable to manage theme (dark/light) based on time of day
 * Switches to dark mode during evening/night hours (18:00 - 6:00)
 * @returns {Object} Theme state and methods
 */
export default function useTheme() {
  let intervalId = null

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
