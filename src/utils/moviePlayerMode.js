/** @typedef {import('../types/schedule.js').Movie} Movie */

/** @type {readonly string[]} */
export const EXTERNAL_HOSTS = [
  'netflix.com',
  'play.max.com',
  'max.com',
  'rtlplusz.hu',
  'plus.rtl.de',
  'disneyplus.com',
  'primevideo.com',
  'amazon.com',
  'tv2play.hu',
  'hbogo.hu',
]

/**
 * @param {string} url
 * @returns {boolean}
 */
export function isYouTubeUrl(url) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '')
    return host === 'youtu.be' || host.endsWith('youtube.com')
  } catch {
    return /youtu\.be|youtube\.com/.test(url)
  }
}

/**
 * @param {string} url
 * @returns {boolean}
 */
export function isExternalUrl(url) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '')
    return EXTERNAL_HOSTS.some(
      (domain) => host === domain || host.endsWith(`.${domain}`),
    )
  } catch {
    return false
  }
}

/**
 * @param {Movie|null|undefined} movie
 * @returns {'stream'|'youtube'|'external'|null}
 */
export function getPlayerMode(movie) {
  if (!movie?.link?.trim()) return null
  if (movie.type === 'external' || movie.type === 'subscription') return 'external'
  if (isExternalUrl(movie.link)) return 'external'
  if (movie.type === 'youtube' || isYouTubeUrl(movie.link)) return 'youtube'
  return 'stream'
}

/**
 * @param {Movie|null|undefined} movie
 * @returns {string}
 */
export function getPlatformLabel(movie) {
  if (!movie) return ''
  if (movie.platform?.trim()) return movie.platform.trim()
  try {
    const host = new URL(movie.link).hostname.replace(/^www\./, '')
    if (host.includes('netflix')) return 'Netflix'
    if (host.includes('max.com') || host.includes('hbogo')) return 'Max'
    if (host.includes('rtl')) return 'RTL+'
    if (host.includes('disney')) return 'Disney+'
    if (host.includes('primevideo') || host.includes('amazon')) return 'Prime Video'
    if (host.includes('tv2')) return 'TV2 Play'
    return host
  } catch {
    return movie.type ?? 'Streaming'
  }
}
