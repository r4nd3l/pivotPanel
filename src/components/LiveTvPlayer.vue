<template>
  <div class="relative w-full h-full bg-black flex items-center justify-center overflow-hidden">

    <!-- Loading state -->
    <div
      v-if="status === 'loading'"
      class="absolute inset-0 flex flex-col items-center justify-center gap-6 text-white z-10"
    >
      <div class="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-blue-400"></div>
      <p class="text-3xl font-medium tracking-wide">{{ t('live_loading') }}</p>
      <p class="text-xl text-gray-400">{{ movie.title }}</p>
    </div>

    <!-- Error / unavailable state -->
    <div
      v-else-if="status === 'error'"
      class="absolute inset-0 flex flex-col items-center justify-center gap-6 text-white z-10 px-12 text-center"
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
    </div>

    <!-- HLS video player (m3u8 streams) -->
    <video
      v-if="isHLS && videoReady"
      ref="videoEl"
      class="absolute inset-0 w-full h-full transition-opacity duration-500"
      :class="status === 'playing' ? 'opacity-100' : 'opacity-0'"
      playsinline
      controls
    ></video>

    <!-- YouTube-nocookie iframe (M1 fallback) -->
    <iframe
      v-else-if="!isHLS && iframeSrc"
      :src="iframeSrc"
      class="absolute inset-0 w-full h-full transition-opacity duration-500"
      :class="status === 'playing' ? 'opacity-100' : 'opacity-0 pointer-events-none'"
      frameborder="0"
      allow="autoplay; fullscreen; encrypted-media"
      allowfullscreen
      @load="onIframeLoad"
    ></iframe>

  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import Hls from 'hls.js'
/** @typedef {import('../types/schedule.js').Movie} Movie */

const props = defineProps({
  /** @type {Movie} */
  movie: { type: Object, required: true },
})

const { t } = useI18n()

const IFRAME_LOAD_TIMEOUT_MS = 10_000
const RETRY_SECONDS = 15

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

const isHLS = computed(() => props.movie.link.includes('.m3u8'))
const progressPercent = computed(
  () => ((RETRY_SECONDS - retryCountdown.value) / RETRY_SECONDS) * 100,
)

function startLoad() {
  clearTimeout(iframeLoadTimer)
  clearInterval(retryTimer)
  destroyHls()

  status.value = 'loading'
  videoReady.value = false
  iframeSrc.value = null

  // Small delay ensures a destroyed/old iframe or video element is removed from DOM first
  setTimeout(() => {
    if (isHLS.value) {
      startHls()
    } else {
      iframeSrc.value = props.movie.link
      iframeLoadTimer = setTimeout(onStreamError, IFRAME_LOAD_TIMEOUT_MS)
    }
  }, 80)
}

async function startHls() {
  videoReady.value = true
  await nextTick()

  if (!videoEl.value) {
    onStreamError()
    return
  }

  if (Hls.isSupported()) {
    hls = new Hls({ lowLatencyMode: true, enableWorker: true })
    hls.loadSource(props.movie.link)
    hls.attachMedia(videoEl.value)

    hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
      // Lock quality to the level closest to 480p (without going over if possible)
      if (data.levels.length > 1) {
        const TARGET_HEIGHT = 480
        let bestIdx = 0
        let bestScore = Infinity
        data.levels.forEach((level, i) => {
          const h = level.height || 0
          // Prefer levels at or below target; penalise levels above target heavily
          const score = h <= TARGET_HEIGHT ? TARGET_HEIGHT - h : (h - TARGET_HEIGHT) * 10
          if (score < bestScore) { bestScore = score; bestIdx = i }
        })
        hls.currentLevel = bestIdx
      }
      status.value = 'playing'
      videoEl.value?.play().catch(() => {})
    })

    hls.on(Hls.Events.ERROR, (_, data) => {
      if (data.fatal) onStreamError()
    })
  } else if (videoEl.value.canPlayType('application/vnd.apple.mpegurl')) {
    // Native HLS — Safari
    videoEl.value.src = props.movie.link
    videoEl.value.addEventListener('loadedmetadata', () => {
      status.value = 'playing'
      videoEl.value?.play().catch(() => {})
    }, { once: true })
    videoEl.value.addEventListener('error', onStreamError, { once: true })
  } else {
    onStreamError()
  }
}

function onIframeLoad() {
  clearTimeout(iframeLoadTimer)
  status.value = 'playing'
}

function onStreamError() {
  destroyHls()
  videoReady.value = false
  iframeSrc.value = null
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
}

onMounted(startLoad)

onUnmounted(() => {
  clearTimeout(iframeLoadTimer)
  clearInterval(retryTimer)
  destroyHls()
})
</script>
