/**
 * A scheduled movie entry
 */
export interface Movie {
  time: string
  title: string
  link: string
  type?: 'youtube' | 'live' | 'external' | 'subscription'
  platform?: string
  /** HH:MM – auto-close time for live/external slots */
  end_time?: string
  fallback_links?: string[]
}

/**
 * Calendar day entry from the schedule API
 */
export interface CalendarDay {
  date: string
  year: number
  month_name: string
  day_name: string
  week_number: number
  week_type: string
  type: string
  bank_holiday: string
  medicine?: string
  hand_creme?: string
  phone?: string
  lunch?: string
  adrienn_afternoon?: string
  adrienn_beforenoon?: string
  ildiko?: string
  magdi_day?: string
  movies?: Movie[]
}

/**
 * Schedule API response structure
 */
export interface ScheduleApiResponse {
  api_version: string
  data_start: string
  data_end: string
  calendar: CalendarDay[]
}
