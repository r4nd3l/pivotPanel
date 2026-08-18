#!/usr/bin/env node
/**
 * Validates all movie links in plan_2026.json (oEmbed for YouTube, manifest for HLS).
 * Run: node scripts/validate-schedule.js
 */
import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const planPath = join(root, 'src/storage/plan_2026.json')

/** @type {import('../src/types/schedule.js').ScheduleApiResponse} */
const plan = JSON.parse(readFileSync(planPath, 'utf8'))

/**
 * @param {string} url
 * @returns {string}
 */
function toWatchUrl(url) {
  const embed = url.match(/embed\/([a-zA-Z0-9_-]{11})/)
  if (embed) return `https://www.youtube.com/watch?v=${embed[1]}`
  return url
}

/**
 * @param {string} url
 */
async function checkYouTube(url) {
  const watch = toWatchUrl(url)
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(watch)}&format=json`,
    )
    return res.ok
  } catch {
    return false
  }
}

/**
 * @param {string} url
 */
async function checkHls(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
    const text = await res.text()
    return res.ok && text.includes('#EXTM3U')
  } catch {
    return false
  }
}

/**
 * @param {string} url
 */
async function checkLink(url) {
  if (url.includes('.m3u8')) return checkHls(url)
  if (url.includes('youtube') || url.includes('youtu.be')) return checkYouTube(url)
  return true
}

/** @type {Array<{date:string,time:string,title:string,url:string,role:string,ok:boolean}>} */
const results = []
const seen = new Set()

for (const day of plan.calendar) {
  for (const movie of day.movies ?? []) {
    const all = [movie.link, ...(movie.fallback_links ?? [])]
    for (const url of all) {
      const key = url
      if (seen.has(key)) continue
      seen.add(key)
      const ok = await checkLink(url)
      results.push({
        date: day.date,
        time: movie.time,
        title: movie.title,
        url,
        role: url === movie.link ? 'primary' : 'fallback',
        ok,
      })
      await new Promise((r) => setTimeout(r, 100))
    }
  }
}

const failed = results.filter((r) => !r.ok)
const passed = results.filter((r) => r.ok)

console.log('\n=== Schedule link validation ===')
console.log('Unique URLs checked:', results.length)
console.log('OK:', passed.length)
console.log('FAILED:', failed.length)

if (failed.length) {
  console.log('\nFailed links:')
  failed.forEach((r) => {
    console.log(`  [${r.role}] ${r.title}`)
    console.log(`    ${r.url}`)
  })
}

const reportPath = join(root, 'e2e/schedule-validation.json')
writeFileSync(reportPath, JSON.stringify({ checked: results.length, passed: passed.length, failed: failed.length, results }, null, 2))
console.log('\nReport:', reportPath)

process.exit(failed.length ? 1 : 0)
