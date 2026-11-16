#!/usr/bin/env node
/**
 * Re-resolves every live slot's link + fallback_links from its channel_ids via iptv-org,
 * keeping only HTTPS, non-adult, actually playable streams (max MAX_LINKS per slot).
 * Current links stay first while they still work, so diffs only appear when something broke.
 * Run: node scripts/refresh-streams.js [plan files...]   (default: src/storage/plan_*.json)
 * Exit 1 if any slot ended up with no playable stream (its old links are then left untouched).
 */
import { readFileSync, writeFileSync, readdirSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { loadIptvOrg, rejectReason, checkStream } from './lib/iptv.js'

const MAX_LINKS = 3
const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const storage = join(root, 'src/storage')
const files = process.argv.slice(2).length
  ? process.argv.slice(2)
  : readdirSync(storage).filter((f) => /^plan_\d{4}\.json$/.test(f)).map((f) => join(storage, f))

const api = await loadIptvOrg()
/** @type {Map<string, Promise<string|null>>} */
const checked = new Map()
const check = (url) => (checked.has(url) ? checked.get(url) : checked.set(url, checkStream(url)).get(url))

/** @type {Map<string, Promise<string[]>>} slot key -> resolved links */
const resolved = new Map()
let unresolved = 0

async function resolve(movie) {
  const current = [movie.link, ...(movie.fallback_links ?? [])]
  const fromApi = movie.channel_ids.flatMap((id) =>
    api.streams.filter((s) => s.channel === id && !s.user_agent && !s.referrer).map((s) => s.url),
  )
  const candidates = [...new Set([...current, ...fromApi])].filter((u) => {
    const why = rejectReason(u, movie.channel_ids, api)
    if (why && current.includes(u)) console.warn(`  drop ${u}: ${why}`)
    return !why
  })
  // Preferred channel first (channel_ids order); stable sort keeps current links first within a channel.
  const rank = (u) => movie.channel_ids.indexOf(api.urlToChannel.get(u))
  candidates.sort((a, b) => rank(a) - rank(b))
  const results = await Promise.all(candidates.map(async (u) => [u, await check(u)]))
  for (const [u, why] of results) if (why && current.includes(u)) console.warn(`  dead ${u}: ${why}`)
  return results.filter(([, why]) => !why).map(([u]) => u).slice(0, MAX_LINKS)
}

for (const file of files) {
  const raw = readFileSync(file, 'utf8')
  const plan = JSON.parse(raw)
  for (const day of plan.calendar) {
    for (const movie of day.movies ?? []) {
      if (!movie.channel_ids?.length) continue
      const key = `${movie.title}|${movie.channel_ids.join(',')}`
      if (!resolved.has(key)) {
        console.log(`Resolving ${key}`)
        resolved.set(key, resolve(movie))
      }
      const links = await resolved.get(key)
      if (!links.length) {
        unresolved++
        continue
      }
      movie.link = links[0]
      movie.fallback_links = links.slice(1)
    }
  }
  writeFileSync(file, JSON.stringify(plan, null, '\t') + (raw.endsWith('\n') ? '\n' : ''))
  console.log(`Wrote ${file}`)
}

for (const [key, p] of resolved) {
  const links = await p
  console.log(`${links.length ? 'OK  ' : 'NONE'} ${key} -> ${links.length} link(s)`)
}
if (unresolved) console.error(`\n${unresolved} slot entries have no playable stream; old links kept.`)
process.exit(unresolved ? 1 : 0)
