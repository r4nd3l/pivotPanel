#!/usr/bin/env node
/**
 * Generates src/storage/plan_<year>.json from the previous year's plan.
 * Daily texts (medicine, lunch, Adrienn, Ildikó, …) and the movie/channel slots are copied
 * from the last day of the previous plan; one-off fields (e.g. magdi_day) are not carried over.
 * Run: node scripts/generate-plan.js 2027
 *
 * Rules (derived from plan_2026.json): ISO week number, week_type by its parity,
 * type/lunch by Mon–Fri vs weekend, Ildikó every Tuesday.
 */
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Hungarian bridge days come from a yearly ministry decree (Mt. 102. § (5)); add them here when published.
// 2027: no decree was published by the 2026-10-31 deadline, so there are none.
const EXTRA_DAYS = {
  // '2028-MM-DD': 'Áthelyezett munkanap' | 'Pihenőnap',
}

const MONTHS = ['Január', 'Február', 'Március', 'Április', 'Május', 'Június', 'Július', 'Augusztus', 'Szeptember', 'Október', 'November', 'December']
const DAYS = ['Vasárnap', 'Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek', 'Szombat']

const pad = (n) => String(n).padStart(2, '0')
const iso = (d) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
const addDays = (d, n) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + n))

/** Gregorian Easter Sunday (Anonymous/Meeus algorithm). */
export function easter(y) {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(Date.UTC(y, month - 1, day))
}

/** Hungarian statutory holidays (Mt. 102. § (1)), labelled like plan_2026.json. */
export function holidays(y) {
  const e = easter(y)
  return {
    [`${y}-01-01`]: 'Újév',
    [`${y}-03-15`]: 'Nemzeti ünnep',
    [iso(addDays(e, -2))]: 'Nagypéntek',
    [iso(e)]: 'Húsvét Vasárnap',
    [iso(addDays(e, 1))]: 'Húsvét Hétfő',
    [`${y}-05-01`]: 'A munka ünnepe',
    [iso(addDays(e, 49))]: 'Pünkösd Vasárnap',
    [iso(addDays(e, 50))]: 'Pünkösd Hétfő',
    [`${y}-08-20`]: 'Államalapítás ünnepe',
    [`${y}-10-23`]: '1956-os forradalom ünnepe',
    [`${y}-11-01`]: 'Mindenszentek',
    [`${y}-12-24`]: 'Karácsony előestéje', // statutory holiday since 2026
    [`${y}-12-25`]: 'Karácsony 1. napja',
    [`${y}-12-26`]: 'Karácsony 2. napja',
  }
}

/** ISO-8601 week number. */
function isoWeek(d) {
  const t = addDays(d, 3 - ((d.getUTCDay() + 6) % 7)) // Thursday of this week decides the year
  return 1 + Math.floor((t - Date.UTC(t.getUTCFullYear(), 0, 1)) / 864e5 / 7)
}

export function generate(year, prev) {
  const last = prev.calendar.at(-1)
  const tuesday = prev.calendar.find((d) => d.ildiko)
  const weekday = prev.calendar.find((d) => d.lunch)
  const special = { ...holidays(year), ...EXTRA_DAYS }
  const calendar = []
  for (let d = new Date(Date.UTC(year, 0, 1)); d.getUTCFullYear() === year; d = addDays(d, 1)) {
    const dow = d.getUTCDay()
    const isWeekday = dow >= 1 && dow <= 5
    const week = isoWeek(d)
    const day = {
      date: iso(d),
      year,
      medicine: last.medicine,
      hand_creme: last.hand_creme,
      phone: last.phone,
      ...(isWeekday && { lunch: weekday.lunch }),
      month_name: MONTHS[d.getUTCMonth()],
      day_name: DAYS[dow],
      week_number: week,
      week_type: week % 2 === 0 ? 'páros' : 'páratlan',
      type: isWeekday ? 'Hétköznap' : 'Hétvége',
      bank_holiday: special[iso(d)] ?? '',
      movies: structuredClone(last.movies),
      adrienn_afternoon: last.adrienn_afternoon,
      ...(dow === 2 && { ildiko: tuesday.ildiko }),
      adrienn_beforenoon: last.adrienn_beforenoon,
    }
    calendar.push(day)
  }
  return { api_version: prev.api_version, data_start: `${year}-01-01`, data_end: `${year}-12-31`, calendar }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const year = Number(process.argv[2])
  if (!Number.isInteger(year)) throw new Error('Usage: node scripts/generate-plan.js <year>')
  const storage = join(dirname(fileURLToPath(import.meta.url)), '../src/storage')
  const prevPath = join(storage, `plan_${year - 1}.json`)
  const outPath = join(storage, `plan_${year}.json`)
  if (!existsSync(prevPath)) throw new Error(`Missing template ${prevPath}`)
  if (existsSync(outPath) && !process.argv.includes('--force')) throw new Error(`${outPath} exists; pass --force to overwrite`)
  const plan = generate(year, JSON.parse(readFileSync(prevPath, 'utf8')))
  writeFileSync(outPath, JSON.stringify(plan, null, '\t') + '\n')
  console.log(`Wrote ${outPath} (${plan.calendar.length} days)`)
  for (const d of plan.calendar) if (d.bank_holiday) console.log(`  ${d.date} ${d.day_name}: ${d.bank_holiday}`)
}
