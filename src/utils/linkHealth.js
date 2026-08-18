import { getPlayerMode, isYouTubeUrl } from './moviePlayerMode.js'
/** @typedef {import('../types/schedule.js').Movie} Movie */

/**
 * @param {string} url
 * @returns {string}
 */
export function toYouTubeWatchUrl(url) {
  try {
    const parsed = new URL(url)
    if (parsed.hostname.includes('youtu.be')) {
      return `https://www.youtube.com/watch?v=${parsed.pathname.slice(1)}`
    }
    if (parsed.pathname.startsWith('/embed/')) {
      const id = parsed.pathname.split('/embed/')[1]?.split('?')[0]
      if (id) return `https://www.youtube.com/watch?v=${id}`
    }
    if (parsed.searchParams.get('v')) return url
  } catch {
    // fall through
  }
  const match = url.match(/(?:v=|\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  return match ? `https://www.youtube.com/watch?v=${match[1]}` : url
}

/**
 * @param {string} url
 * @returns {Promise<boolean>}
 */
export async function checkYouTubeEmbeddable(url) {
  if (!isYouTubeUrl(url) && !url.includes('youtube-nocookie.com/embed')) {
    return false
  }
  const watchUrl = toYouTubeWatchUrl(url)
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(watchUrl)}&format=json`,
    )
    return res.ok
  } catch {
    return false
  }
}

/**
 * @param {string} url
 * @returns {Promise<boolean>}
 */
export async function checkHlsUrl(url) {
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
 * @returns {Promise<boolean>}
 */
export async function checkStreamUrl(url) {
  if (url.includes('.m3u8')) return checkHlsUrl(url)
  if (url.includes('youtube-nocookie.com/embed') || url.includes('videa.hu/player')) {
    return checkYouTubeEmbeddable(url)
  }
  return true
}

/**
 * @param {Movie} movie
 * @returns {Promise<boolean>}
 */
export async function checkLinkForMovie(movie) {
  const mode = getPlayerMode(movie)
  if (mode === 'youtube') return checkYouTubeEmbeddable(movie.link)
  if (mode === 'stream') return checkStreamUrl(movie.link)
  return true
}

/**
 * @param {Movie} movie
 * @returns {Promise<string|null>}
 */
export async function resolvePlayableLink(movie) {
  const candidates = [movie.link, ...(movie.fallback_links || [])].filter(Boolean)
  for (const url of candidates) {
    const candidate = { ...movie, link: url }
    if (await checkLinkForMovie(candidate)) return url
  }
  return candidates[0] ?? null
}

/**
 * @param {Movie} movie
 * @returns {string[]}
 */
export function allCandidateLinks(movie) {
  return [movie.link, ...(movie.fallback_links || [])].filter(Boolean)
}
