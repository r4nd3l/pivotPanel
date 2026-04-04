import { ref, computed, onUnmounted } from 'vue'
import { getCurrentDateString } from '../utils/dateUtils.js'
/** @typedef {import('../types/schedule.js').ScheduleApiResponse} ScheduleApiResponse */

/**
 * Composable for managing movie playback with YouTube IFrame API.
 * Supports auto-trigger at 19:00 and manual start via click.
 * @param {import('vue').Ref<ScheduleApiResponse | null>} scheduleData
 */
export default function useMoviePlayer(scheduleData) {
  const showMovieModal = ref(false)
  const movieTriggered = ref(false)
  /** @type {import('vue').Ref<YT.Player | null>} */
  const player = ref(null)
  let apiReady = false
  let apiLoading = false

  const todayEntry = computed(() => {
    if (!scheduleData.value?.calendar?.length) return null
    const currentDate = getCurrentDateString()
    return scheduleData.value.calendar.find((d) => d.date === currentDate) ?? null
  })

  const movieTitle = computed(() => todayEntry.value?.movie_title?.trim() || '')
  const movieLink = computed(() => todayEntry.value?.movie_link?.trim() || '')

  const embedUrl = computed(() => {
    const link = movieLink.value
    if (!link) return ''
    const id = extractVideoId(link)
    return id ? `https://www.youtube.com/embed/${id}?enablejsapi=1&autoplay=1&rel=0&vq=large` : ''
  })

  /**
   * Extract YouTube video ID from various URL formats
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
   * Initialize the YT player on a given iframe element.
   * Call this from the component after the iframe is mounted.
   * @param {string} iframeId - DOM id of the iframe element
   */
  async function initPlayer(iframeId) {
    await loadYouTubeApi()
    if (player.value) {
      player.value.destroy()
      player.value = null
    }
    player.value = new window.YT.Player(iframeId, {
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

  function openMovie() {
    if (!embedUrl.value) return
    showMovieModal.value = true
  }

  function closeMovie() {
    if (player.value) {
      try { player.value.stopVideo() } catch { /* ignore */ }
      try { player.value.destroy() } catch { /* ignore */ }
      player.value = null
    }
    showMovieModal.value = false
  }

  /**
   * Call from the 1-second interval to auto-trigger at 19:00.
   * Only triggers once per session.
   */
  function checkMovieTime() {
    if (movieTriggered.value || showMovieModal.value) return
    if (!movieLink.value) return
    const now = new Date()
    if (now.getHours() === 19 && now.getMinutes() === 0) {
      movieTriggered.value = true
      openMovie()
    }
  }

  onUnmounted(() => {
    closeMovie()
  })

  return {
    showMovieModal,
    movieTitle,
    movieLink,
    embedUrl,
    openMovie,
    closeMovie,
    initPlayer,
    checkMovieTime,
  }
}
