/**
 * @fileoverview Type definitions for schedule API
 */

/**
 * Calendar day entry from the schedule API
 * @typedef {Object} CalendarDay
 * @property {string} date
 * @property {number} year
 * @property {string} month_name
 * @property {string} day_name
 * @property {number} week_number
 * @property {string} week_type
 * @property {string} type
 * @property {string} bank_holiday
 */

/**
 * Schedule API response structure
 * @typedef {Object} ScheduleApiResponse
 * @property {string} api_version
 * @property {string} data_start
 * @property {string} data_end
 * @property {CalendarDay[]} calendar
 */

