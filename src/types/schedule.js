/**
 * @fileoverview Type definitions for schedule API (v1.3)
 */

/**
 * A scheduled movie entry
 * @typedef {Object} Movie
 * @property {string} time - Scheduled playback time in "HH:MM" format (e.g. "14:00", "19:00")
 * @property {string} title - Movie/channel title
 * @property {string} link - Playable URL or external watch link (YouTube, Videa, Netflix, Max, …)
 * @property {'youtube'|'live'|'external'|'subscription'} [type] - Player routing hint
 * @property {string} [platform] - Display label for external services (e.g. "Netflix", "Max")
 * @property {string} [end_time] - HH:MM auto-close time
 * @property {string[]} [fallback_links] - Backup URLs tried if primary fails pre-flight or playback
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
 * @property {string} [lunch] - Weekday lunch info (e.g. "Ebéd 11:30 - 12:30 óra között várható")
 * @property {string} [adrienn_beforenoon] - Daily Adrienn morning visit (6:00–7:00)
 * @property {string} [adrienn_afternoon] - Daily Adrienn afternoon visit (13:00–14:00)
 * @property {string} [ildiko] - Ildikó cleaning visit (Tuesdays)
 * @property {string} [magdi_day] - One-off Magdi pedicure visit (2026-08-19)
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

