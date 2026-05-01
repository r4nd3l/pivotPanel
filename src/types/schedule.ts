/**
 * A scheduled movie entry
 */
export interface Movie {
  time: string
  title: string
  link: string
  /** 'live' for a famelack TV stream, omit or 'youtube' for a YouTube video */
  type?: 'youtube' | 'live'
  /** HH:MM – only present on live entries; the time the stream auto-closes */
  end_time?: string
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
  work?: string
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

