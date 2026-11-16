/**
 * Shared iptv-org helpers for refresh-streams.js and validate-schedule.js.
 * Source of truth: https://github.com/iptv-org/api (channels.json flags NSFW, streams.json maps URL -> channel id).
 */

const API = 'https://iptv-org.github.io/api'
// Origin the kiosk page is served from; streams must allow it (CORS) for hls.js to play them.
const ORIGIN = 'https://r4nd3l.github.io'
// Likely-unlicensed rebroadcasters of paid channels; never use, even over HTTPS.
export const BLOCKED_HOSTS = ['antik.sk', '88.212.']

/** @returns {Promise<{ channels: Map<string, any>, streams: any[], urlToChannel: Map<string, string> }>} */
export async function loadIptvOrg() {
  const get = async (f) => {
    const res = await fetch(`${API}/${f}`, { signal: AbortSignal.timeout(60_000) })
    if (!res.ok) throw new Error(`iptv-org ${f}: HTTP ${res.status}`)
    return res.json()
  }
  const [channelList, streams] = await Promise.all([get('channels.json'), get('streams.json')])
  const channels = new Map(channelList.map((c) => [c.id, c]))
  const urlToChannel = new Map(streams.map((s) => [s.url, s.channel]))
  return { channels, streams, urlToChannel }
}

/** @param {any} channel */
export function isAdult(channel) {
  return Boolean(channel?.is_nsfw || channel?.categories?.includes('xxx'))
}

/**
 * Why a URL may not be scheduled, or null if allowed.
 * Allow-list: the URL must be a known iptv-org stream of a non-adult channel listed in the slot's channel_ids.
 * @param {string} url
 * @param {string[] | undefined} channelIds
 * @param {Awaited<ReturnType<typeof loadIptvOrg>>} api
 */
export function rejectReason(url, channelIds, api) {
  if (!url.startsWith('https://')) return 'not HTTPS (blocked as mixed content on github.io)'
  if (BLOCKED_HOSTS.some((h) => url.includes(h))) return 'blocked host'
  const id = api.urlToChannel.get(url)
  if (!id) return 'not an iptv-org stream'
  if (isAdult(api.channels.get(id))) return `ADULT channel ${id}`
  if (channelIds && !channelIds.includes(id)) return `channel ${id} not in slot channel_ids`
  return null
}

const HEADERS = { 'User-Agent': 'Mozilla/5.0', Origin: ORIGIN }

/** @param {string} url */
async function get(url, bytes) {
  const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(15_000) })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const cors = res.headers.get('access-control-allow-origin')
  if (cors !== '*' && cors !== ORIGIN) throw new Error('no CORS for kiosk origin')
  if (!bytes) return res.text()
  const reader = res.body.getReader()
  let n = 0
  while (n < bytes) {
    const { done, value } = await reader.read()
    if (done) break
    n += value.length
  }
  await reader.cancel()
  return n
}

const uris = (text) => text.split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'))

/**
 * Follows master -> variant -> last media segment, like hls.js would.
 * @param {string} url
 * @returns {Promise<string | null>} null when playable, otherwise the failure reason
 */
export async function checkStream(url) {
  try {
    let u = url
    let text = await get(u)
    if (!text.includes('#EXTM3U')) return 'not an HLS playlist'
    while (text.includes('#EXT-X-STREAM-INF')) {
      u = new URL(uris(text)[0], u).href
      text = await get(u)
    }
    const segs = uris(text)
    if (!segs.length) return 'empty playlist'
    const got = await get(new URL(segs.at(-1), u).href, 20_000)
    return got >= 10_000 ? null : `segment too small (${got}B)`
  } catch (e) {
    return e.message
  }
}

// ponytail: self-check of the allow-list logic, run with `node scripts/lib/iptv.js`
if (import.meta.url === `file://${process.argv[1]}`) {
  const fake = {
    channels: new Map([['Good.hu', {}], ['Bad.hu', { is_nsfw: true }], ['Xxx.hu', { categories: ['xxx'] }]]),
    urlToChannel: new Map([['https://a/x.m3u8', 'Good.hu'], ['https://b/x.m3u8', 'Bad.hu'], ['https://c/x.m3u8', 'Xxx.hu'], ['https://antik.sk/x.m3u8', 'Good.hu']]),
  }
  const assert = (c, m) => { if (!c) throw new Error(m) }
  assert(rejectReason('https://a/x.m3u8', ['Good.hu'], fake) === null, 'good allowed')
  assert(rejectReason('https://b/x.m3u8', ['Bad.hu'], fake).startsWith('ADULT'), 'nsfw blocked')
  assert(rejectReason('https://c/x.m3u8', undefined, fake).startsWith('ADULT'), 'xxx blocked')
  assert(rejectReason('https://a/x.m3u8', ['Other.hu'], fake).includes('not in slot'), 'foreign channel blocked')
  assert(rejectReason('https://antik.sk/x.m3u8', ['Good.hu'], fake) === 'blocked host', 'blocked host')
  assert(rejectReason('http://a/x.m3u8', ['Good.hu'], fake).startsWith('not HTTPS'), 'http blocked')
  assert(rejectReason('https://z/x.m3u8', ['Good.hu'], fake) === 'not an iptv-org stream', 'unknown blocked')
  console.log('iptv.js self-check OK')
}
