import { ref, computed, onUnmounted } from 'vue'
import { getCurrentDateString } from '../utils/dateUtils.js'
import { getPlayerMode, getPlatformLabel } from '../utils/moviePlayerMode.js'
import { resolvePlayableLink, allCandidateLinks } from '../utils/linkHealth.js'
/** @typedef {import('../types/schedule.js').ScheduleApiResponse} ScheduleApiResponse */
/** @typedef {import('../types/schedule.js').Movie} Movie */

/**
 * @param {string} time - HH:MM
 * @returns {number} minutes since midnight
 */
function toMinutes(time) {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

/** @type {Window|null} */
let externalWindow = null

/**
 * @param {Movie} movie
 */
function launchExternalWindow(movie) {
  closeExternalWindow()
  const features = `noopener,noreferrer,width=${window.screen.availWidth},height=${window.screen.availHeight},left=0,top=0`
  externalWindow = window.open(movie.link, 'pivotpanel-external', features)
  if (externalWindow) {
    externalWindow.focus()
    return
  }
  window.location.assign(movie.link)
}

function closeExternalWindow() {
  if (externalWindow && !externalWindow.closed) {
    try {
      externalWindow.close()
    } catch {
      /* ignore */
    }
  }
  externalWindow = null
}

function isExternalWindowOpen() {
  return Boolean(externalWindow && !externalWindow.closed)
}

/**
 * Composable for managing movie playback with YouTube IFrame API.
 * Supports multiple movies per day, each with its own scheduled time.
 * @param {import('vue').Ref<ScheduleApiResponse | null>} scheduleData
 */
export default function useMoviePlayer(scheduleData) {
  const showMovieModal = ref(false)
  const currentMovieIndex = ref(-1)
  /** @type {import('vue').Ref<Set<number>>} */
  const triggeredIndices = ref(new Set())
  /** @type {import('vue').Ref<YT.Player | null>} */
  const player = ref(null)
  const playerReady = ref(false)
  /** @type {import('vue').Ref<boolean>} */
  const scheduleTriggered = ref(false)
  const externalWindowClosed = ref(false)
  const resolvedLink = ref(null)
  const linkResolving = ref(false)
  let apiReady = false
  let apiLoading = false
  let externalPollTimer = null

  const todayEntry = computed(() => {
    if (!scheduleData.value?.calendar?.length) return null
    const currentDate = getCurrentDateString()
    return scheduleData.value.calendar.find((d) => d.date === currentDate) ?? null
  })

  /** @type {import('vue').ComputedRef<Movie[]>} */
  const movies = computed(() => {
    const entry = todayEntry.value
    if (!entry?.movies?.length) return []
    return entry.movies.filter((m) => m.title?.trim() && m.link?.trim())
  })

  const hasMovies = computed(() => movies.value.length > 0)

  const currentMovie = computed(() => {
    const idx = currentMovieIndex.value
    if (idx < 0 || idx >= movies.value.length) return null
    return movies.value[idx]
  })

  const externalPlatformLabel = computed(() => getPlatformLabel(currentMovie.value))

  const playbackMovie = computed(() => {
    const movie = currentMovie.value
    if (!movie) return null
    if (!resolvedLink.value || resolvedLink.value === movie.link) return movie
    const remaining = allCandidateLinks(movie).filter((url) => url !== resolvedLink.value)
    return { ...movie, link: resolvedLink.value, fallback_links: remaining }
  })

  const usesStreamPlayer = computed(() => getPlayerMode(playbackMovie.value) === 'stream')

  const usesYouTubePlayer = computed(() => getPlayerMode(playbackMovie.value) === 'youtube')

  const usesExternalPlayer = computed(() => getPlayerMode(playbackMovie.value) === 'external')

  function startExternalPoll() {
    clearInterval(externalPollTimer)
    externalPollTimer = setInterval(() => {
      externalWindowClosed.value = !isExternalWindowOpen()
    }, 1000)
  }

  function stopExternalPoll() {
    clearInterval(externalPollTimer)
    externalPollTimer = null
    externalWindowClosed.value = false
  }

  /**
   * @param {string} url
   * @returns {string}
   */
  function extractVideoId(url) {
    try {
      const parsed = new URL(url)
      if (parsed.hostname.includes('youtu.be')) {
        return parsed.pathname.slice(1)
      }
      if (parsed.hostname.includes('youtube.com')) {
        if (parsed.pathname.startsWith('/embed/')) {
          return parsed.pathname.split('/embed/')[1]?.split('?')[0] || ''
        }
        return parsed.searchParams.get('v') || ''
      }
    } catch {
      // fallback: try regex
    }
    const match = url.match(/(?:v=|\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
    return match?.[1] || ''
  }

  function loadYouTubeApi() {
    if (apiReady || apiLoading) return Promise.resolve()
    apiLoading = true
    return new Promise((resolve) => {
      const existingCb = window.onYouTubeIframeAPIReady
      window.onYouTubeIframeAPIReady = () => {
        apiReady = true
        apiLoading = false
        existingCb?.()
        resolve()
      }
      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      document.head.appendChild(tag)
    })
  }

  const PREFERRED_QUALITY = 'large'

  /**
   * Initialize the YT player inside a container element.
   * @param {string} elementId - DOM id of the container div
   */
  async function initPlayer(elementId) {
    playerReady.value = false
    await loadYouTubeApi()
    if (player.value) {
      player.value.destroy()
      player.value = null
    }
    const movie = playbackMovie.value ?? currentMovie.value
    if (!movie) return
    const id = extractVideoId(movie.link)
    if (!id) return
    player.value = new window.YT.Player(elementId, {
      videoId: id,
      width: '100%',
      height: '100%',
      playerVars: {
        autoplay: 1,
        rel: 0,
        modestbranding: 1,
        controls: 1,
        fs: 0,
        iv_load_policy: 3,
        disablekb: 1,
        vq: PREFERRED_QUALITY,
      },
      events: {
        onReady: (event) => {
          event.target.setPlaybackQuality(PREFERRED_QUALITY)
          event.target.playVideo()
          playerReady.value = true
        },
        onPlaybackQualityChange: (event) => {
          if (event.data !== PREFERRED_QUALITY) {
            event.target.setPlaybackQuality(PREFERRED_QUALITY)
          }
        },
        onStateChange: (event) => {
          if (event.data === window.YT.PlayerState.PLAYING) {
            playerReady.value = true
          }
          if (event.data === window.YT.PlayerState.ENDED) {
            closeMovie()
          }
        },
      },
    })
  }

  function reopenExternalWindow() {
    const movie = playbackMovie.value ?? currentMovie.value
    if (!movie) return
    launchExternalWindow(movie)
    externalWindowClosed.value = false
    startExternalPoll()
  }

  /**
   * @param {number} index
   * @param {{ fromSchedule?: boolean }} [options]
   */
  async function openMovie(index, options = {}) {
    if (index < 0 || index >= movies.value.length) return
    const movie = movies.value[index]
    scheduleTriggered.value = options.fromSchedule === true
    playerReady.value = false
    resolvedLink.value = null
    currentMovieIndex.value = index
    linkResolving.value = true

    try {
      resolvedLink.value = await resolvePlayableLink(movie)
    } finally {
      linkResolving.value = false
    }

    if (!resolvedLink.value) return

    showMovieModal.value = true
    const active = { ...movie, link: resolvedLink.value }

    if (getPlayerMode(active) === 'external') {
      launchExternalWindow(active)
      startExternalPoll()
    }
  }

  function closeMovie() {
    stopExternalPoll()
    closeExternalWindow()
    resolvedLink.value = null
    if (player.value) {
      try { player.value.stopVideo() } catch { /* ignore */ }
      try { player.value.destroy() } catch { /* ignore */ }
      player.value = null
    }
    playerReady.value = false
    scheduleTriggered.value = false
    showMovieModal.value = false
    currentMovieIndex.value = -1
  }

  /**
   * Resume the current time slot if the page loads mid-program.
   */
  function tryResumeCurrentSlot() {
    if (showMovieModal.value || !movies.value.length) return
    const nowMins = toMinutes(
      `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`,
    )
    for (let i = 0; i < movies.value.length; i++) {
      if (triggeredIndices.value.has(i)) continue
      const movie = movies.value[i]
      const start = toMinutes(movie.time)
      const end = movie.end_time ? toMinutes(movie.end_time) : start + 120
      if (nowMins >= start && nowMins < end) {
        triggeredIndices.value.add(i)
        openMovie(i, { fromSchedule: true })
        return
      }
    }
  }

  function checkMovieTime() {
    if (!movies.value.length) return
    const now = new Date()
    const nowHours = now.getHours()
    const nowMinutes = now.getMinutes()

    if (showMovieModal.value && scheduleTriggered.value && currentMovie.value?.end_time) {
      const [endH, endM] = currentMovie.value.end_time.split(':').map(Number)
      if (nowHours > endH || (nowHours === endH && nowMinutes >= endM)) {
        closeMovie()
      }
      return
    }

    if (showMovieModal.value) return

    for (let i = 0; i < movies.value.length; i++) {
      if (triggeredIndices.value.has(i)) continue
      const movie = movies.value[i]
      const [h, m] = movie.time.split(':').map(Number)
      if (nowHours === h && nowMinutes === m) {
        triggeredIndices.value.add(i)
        openMovie(i, { fromSchedule: true })
        return
      }
    }
  }

  onUnmounted(() => {
    closeMovie()
  })

  return {
    showMovieModal,
    movies,
    hasMovies,
    currentMovie,
    playbackMovie,
    linkResolving,
    usesStreamPlayer,
    usesYouTubePlayer,
    usesExternalPlayer,
    externalPlatformLabel,
    externalWindowClosed,
    playerReady,
    openMovie,
    closeMovie,
    reopenExternalWindow,
    initPlayer,
    checkMovieTime,
    tryResumeCurrentSlot,
  }
}
