import { ref, computed, onUnmounted } from 'vue'
import { getCurrentDateString } from '../utils/dateUtils.js'
/** @typedef {import('../types/schedule.js').ScheduleApiResponse} ScheduleApiResponse */
/** @typedef {import('../types/schedule.js').Movie} Movie */

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
  let apiReady = false
  let apiLoading = false

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
   * Uses the currently selected movie's video ID.
   * @param {string} elementId - DOM id of the container div
   */
  async function initPlayer(elementId) {
    await loadYouTubeApi()
    if (player.value) {
      player.value.destroy()
      player.value = null
    }
    const movie = currentMovie.value
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
        controls: 0,
        fs: 0,
        iv_load_policy: 3,
        disablekb: 1,
        vq: PREFERRED_QUALITY,
      },
      events: {
        onReady: (event) => {
          event.target.setPlaybackQuality(PREFERRED_QUALITY)
          event.target.playVideo()
        },
        onPlaybackQualityChange: (event) => {
          if (event.data !== PREFERRED_QUALITY) {
            event.target.setPlaybackQuality(PREFERRED_QUALITY)
          }
        },
        onStateChange: (event) => {
          if (event.data === window.YT.PlayerState.ENDED) {
            closeMovie()
          }
        },
      },
    })
  }

  /**
   * Open a specific movie by its index in the movies array.
   * @param {number} index
   */
  function openMovie(index) {
    if (index < 0 || index >= movies.value.length) return
    currentMovieIndex.value = index
    showMovieModal.value = true
  }

  function closeMovie() {
    if (player.value) {
      try { player.value.stopVideo() } catch { /* ignore */ }
      try { player.value.destroy() } catch { /* ignore */ }
      player.value = null
    }
    showMovieModal.value = false
    currentMovieIndex.value = -1
  }

  /**
   * Called every second from the interval timer.
   * For live streams: auto-closes the modal when end_time is reached.
   * For all types: auto-triggers a movie when its scheduled time matches now.
   * Each movie only triggers once per session.
   */
  function checkMovieTime() {
    if (!movies.value.length) return
    const now = new Date()
    const nowHours = now.getHours()
    const nowMinutes = now.getMinutes()

    // Auto-close a live stream at its end_time
    if (showMovieModal.value && currentMovie.value?.type === 'live') {
      const endTime = currentMovie.value.end_time
      if (endTime) {
        const [endH, endM] = endTime.split(':').map(Number)
        if (nowHours === endH && nowMinutes === endM) {
          closeMovie()
        }
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
        openMovie(i)
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
    openMovie,
    closeMovie,
    initPlayer,
    checkMovieTime,
  }

}
