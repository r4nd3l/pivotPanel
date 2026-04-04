/**
 * @fileoverview Type definitions for schedule API (v1.2)
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
 * @property {string} [movie_title] - Movie title for the day (e.g. "The Matrix")
 * @property {string} [movie_link] - YouTube link for the movie (e.g. "https://www.youtube.com/watch?v=abcd1234")
 */

/**
 * Schedule API response structure
 * @typedef {Object} ScheduleApiResponse
 * @property {string} api_version - e.g. "1.2"
 * @property {string} data_start - YYYY-MM-DD
 * @property {string} data_end - YYYY-MM-DD
 * @property {CalendarDay[]} calendar
 */

