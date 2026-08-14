<template>
  <div class="relative w-full h-full bg-black flex items-center justify-center overflow-hidden pointer-events-none">

    <!-- Loading state -->
    <div
      v-if="status === 'loading'"
      class="absolute inset-0 flex flex-col items-center justify-center gap-6 text-white z-20 pointer-events-auto"
    >
      <div class="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-blue-400"></div>
      <p class="text-3xl font-medium tracking-wide">{{ t('live_loading') }}</p>
      <p class="text-xl text-gray-400">{{ movie.title }}</p>
    </div>

    <!-- Error / unavailable state -->
    <div
      v-else-if="status === 'error'"
      class="absolute inset-0 flex flex-col items-center justify-center gap-6 text-white z-20 px-12 text-center pointer-events-auto"
    >
      <i class="mdi mdi-wifi-off text-9xl text-red-400"></i>
      <p class="text-4xl font-semibold">{{ t('live_unavailable') }}</p>
      <p class="text-2xl text-gray-300">{{ movie.title }}</p>
      <p class="text-xl text-gray-400">{{ t('live_retry', { n: retryCountdown }) }}</p>
      <div class="w-72 h-3 bg-white/20 rounded-full overflow-hidden mt-2">
        <div
          class="h-full bg-blue-500 rounded-full transition-all duration-1000 ease-linear"
          :style="{ width: progressPercent + '%' }"
        ></div>
      </div>
      <button
        type="button"
        class="mt-4 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xl font-medium transition-colors cursor-pointer border border-white/20"
        @click="startLoad"
      >
        <i class="mdi mdi-refresh mr-2"></i>{{ t('live_retry_now') }}
      </button>
      <button
        type="button"
        class="mt-2 px-6 py-3 rounded-xl bg-white text-gray-900 text-xl font-bold transition-colors cursor-pointer"
        @click="emit('close')"
      >
        <i class="mdi mdi-close mr-2"></i>{{ t('player_close') }}
      </button>
    </div>

    <!-- HLS video player (m3u8 streams) -->
    <video
      v-if="isHLS && videoReady"
      ref="videoEl"
      class="absolute inset-0 w-full h-full object-contain bg-black transition-opacity duration-500 pointer-events-auto"
      :class="status === 'playing' ? 'opacity-100 z-10' : 'opacity-0 z-0'"
      playsinline
      autoplay
      controls
    ></video>

    <!-- Videa / YouTube-nocookie iframe (visible once src is set; loading overlay covers until ready) -->
    <iframe
      v-if="!isHLS && iframeSrc"
      :src="iframeSrc"
      class="absolute inset-0 w-full h-full bg-black z-10 pointer-events-auto"
      frameborder="0"
      allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
      allowfullscreen
      referrerpolicy="no-referrer-when-downgrade"
      @load="onIframeLoad"
    ></iframe>

  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, onUnmounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import Hls from 'hls.js'
/** @typedef {import('../types/schedule.js').Movie} Movie */

const props = defineProps({
  /** @type {Movie} */
  movie: { type: Object, required: true },
})

const emit = defineEmits(['failed', 'close'])

const { t } = useI18n()

const IFRAME_LOAD_TIMEOUT_MS = 12_000
const VIDEA_LOAD_TIMEOUT_MS = 25_000
const VIDEA_PLAY_DELAY_MS = 1_500
const RETRY_SECONDS = 15
const MAX_RETRIES = 3

/** @type {import('vue').Ref<'loading'|'playing'|'error'>} */
const status = ref('loading')
const retryCountdown = ref(RETRY_SECONDS)
const videoReady = ref(false)
const iframeSrc = ref(null)
/** @type {import('vue').Ref<HTMLVideoElement|null>} */
const videoEl = ref(null)

/** @type {Hls|null} */
let hls = null
let retryTimer = null
let iframeLoadTimer = null
let playDelayTimer = null
let retryAttempts = 0

const isHLS = computed(() => props.movie.link.includes('.m3u8'))
const isVidea = computed(() => props.movie.link.includes('videa.hu/player'))
const progressPercent = computed(
  () => ((RETRY_SECONDS - retryCountdown.value) / RETRY_SECONDS) * 100,
)

function clearTimers() {
  clearTimeout(iframeLoadTimer)
  clearTimeout(playDelayTimer)
  clearInterval(retryTimer)
}

function startLoad() {
  clearTimers()
  destroyHls()

  status.value = 'loading'
  videoReady.value = false
  iframeSrc.value = null

  setTimeout(() => {
    if (isHLS.value) {
      startHls()
    } else {
      iframeSrc.value = props.movie.link
      const timeout = isVidea.value ? VIDEA_LOAD_TIMEOUT_MS : IFRAME_LOAD_TIMEOUT_MS
      iframeLoadTimer = setTimeout(onStreamError, timeout)
    }
  }, 80)
}

async function startHls() {
  videoReady.value = true
  await nextTick()

  const el = videoEl.value
  if (!el) {
    onStreamError()
    return
  }

  const markPlaying = () => {
    status.value = 'playing'
    retryAttempts = 0
  }

  el.onplaying = markPlaying
  el.onerror = () => onStreamError()

  if (Hls.isSupported()) {
    hls = new Hls({ lowLatencyMode: true, enableWorker: true })
    hls.loadSource(props.movie.link)
    hls.attachMedia(el)

    hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
      if (data.levels.length > 1) {
        const TARGET_HEIGHT = 480
        let bestIdx = 0
        let bestScore = Infinity
        data.levels.forEach((level, i) => {
          const h = level.height || 0
          const score = h <= TARGET_HEIGHT ? TARGET_HEIGHT - h : (h - TARGET_HEIGHT) * 10
          if (score < bestScore) { bestScore = score; bestIdx = i }
        })
        hls.currentLevel = bestIdx
      }
      el.play().catch(() => {})
    })

    hls.on(Hls.Events.ERROR, (_, data) => {
      if (data.fatal) onStreamError()
    })
  } else if (el.canPlayType('application/vnd.apple.mpegurl')) {
    el.src = props.movie.link
    el.addEventListener('loadedmetadata', () => {
      el.play().catch(() => {})
    }, { once: true })
  } else {
    onStreamError()
  }
}

function onIframeLoad() {
  clearTimeout(iframeLoadTimer)
  const delay = isVidea.value ? VIDEA_PLAY_DELAY_MS : 1_500
  playDelayTimer = setTimeout(() => {
    status.value = 'playing'
    retryAttempts = 0
  }, delay)
}

function onStreamError() {
  clearTimers()
  destroyHls()
  videoReady.value = false
  iframeSrc.value = null
  retryAttempts++

  if (retryAttempts >= MAX_RETRIES) {
    status.value = 'error'
    emit('failed')
    return
  }

  status.value = 'error'
  retryCountdown.value = RETRY_SECONDS
  startRetryCountdown()
}

function startRetryCountdown() {
  clearInterval(retryTimer)
  retryTimer = setInterval(() => {
    retryCountdown.value--
    if (retryCountdown.value <= 0) {
      clearInterval(retryTimer)
      startLoad()
    }
  }, 1000)
}

function destroyHls() {
  if (hls) {
    hls.destroy()
    hls = null
  }
  if (videoEl.value) {
    videoEl.value.onplaying = null
    videoEl.value.onerror = null
  }
}

onMounted(startLoad)

onUnmounted(() => {
  clearTimers()
  destroyHls()
})

watch(() => props.movie.link, () => {
  retryAttempts = 0
  startLoad()
})
</script>
