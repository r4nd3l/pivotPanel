/**
 * @fileoverview Type definitions for schedule API (v1.3)
 */

/**
 * A scheduled movie entry
 * @typedef {Object} Movie
 * @property {string} time - Scheduled playback time in "HH:MM" format (e.g. "14:00", "19:00")
 * @property {string} title - Movie/channel title
 * @property {string} link - YouTube or famelack.com URL
 * @property {'youtube'|'live'} [type] - Entry type; omit or 'youtube' for YouTube, 'live' for a live TV stream
 * @property {string} [end_time] - HH:MM auto-close time; only present on 'live' entries
 */

/**
 * Calendar day entry from the schedule API
 * @typedef {Object} CalendarDay
 * @property {string} date - YYYY-MM-DD
 * @property {number} year
 * @property {string} month_name - Hungarian (e.g. "Január", "Február")
 * @property {string} day_name - Hungarian (e.g. "Hétfő", "Szombat")
 * @property {number} week_number
 * @property {string} week_type - "páros" | "páratlan"
 * @property {string} type - "Hétköznap" | "Hétvége"
 * @property {string} bank_holiday - Empty string or holiday name (e.g. "Újév", "Nemzeti ünnep")
 * @property {string} medicine - Daily medicine reminder (e.g. "XY gyógyszer 2x1")
 * @property {string} hand_creme - Daily hand creme reminder (e.g. "Kenőcs 2x1")
 * @property {string} phone - Daily phone check reminder (e.g. "Telefon töltöttség ellőrzése!")
 * @property {string} lunch - Daily lunch time info (e.g. "11:30 - 12:30 között ebéd várható!")
 * @property {string} [work] - If present: "yes" | "no" for appointment day (API v1.2 sample omits this)
 * @property {string} [marcsi_day] - When present: message for Marcsi (e.g. "09:00-kor Marcsi, (rendrakás) várható!")
 * @property {string} [ilona_day] - When present: message for Ilona (e.g. "Délelőtt Ilona, (takarítás) várható!")
 * @property {Movie[]} [movies] - Array of scheduled movies for the day
 */

/**
 * Schedule API response structure
 * @typedef {Object} ScheduleApiResponse
 * @property {string} api_version - e.g. "1.2"
 * @property {string} data_start - YYYY-MM-DD
 * @property {string} data_end - YYYY-MM-DD
 * @property {CalendarDay[]} calendar
 */

