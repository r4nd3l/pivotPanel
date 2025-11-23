/**
 * Get current date in YYYY-MM-DD format using Hungarian timezone (Europe/Budapest)
 * This ensures date matching with the API which appears to be Hungarian-based
 * @returns {string} Date string in YYYY-MM-DD format
 */
export function getCurrentDateString() {
  // Use Hungarian timezone for date comparison
  const now = new Date()
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Budapest',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
  
  return formatter.format(now)
}

/**
 * Get current date object in Hungarian timezone
 * @returns {Date} Date object representing current time in Europe/Budapest
 */
export function getCurrentDateInHungarianTimezone() {
  const now = new Date()
  // Convert to Hungarian timezone string and parse back
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
  
  // Parse the Hungarian time string
  const [datePart, timePart] = hungarianTimeString.split(', ')
  const [month, day, year] = datePart.split('/')
  const [hours, minutes, seconds] = timePart.split(':')
  
  return new Date(`${year}-${month}-${day}T${hours}:${minutes}:${seconds}`)
}

