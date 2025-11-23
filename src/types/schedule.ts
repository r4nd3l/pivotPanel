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

