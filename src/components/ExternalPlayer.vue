<template>
  <div class="absolute inset-0 flex flex-col items-center justify-center gap-8 text-white px-8 text-center bg-linear-to-br from-gray-900 via-indigo-950 to-black">
    <i class="mdi mdi-television-play text-9xl text-indigo-300"></i>
    <p class="text-4xl font-semibold">{{ t('external_playing_on', { platform: platformLabel }) }}</p>
    <p class="text-3xl text-gray-300 max-w-4xl">{{ movie.title }}</p>
    <p class="text-2xl text-gray-400 max-w-3xl">{{ t('external_hint') }}</p>
    <button
      v-if="windowClosed"
      type="button"
      class="mt-4 px-8 py-4 rounded-2xl bg-white text-gray-900 text-2xl font-bold cursor-pointer hover:scale-105 transition-transform"
      @click="emit('reopen')"
    >
      <i class="mdi mdi-open-in-new mr-2"></i>{{ t('external_reopen') }}
    </button>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
/** @typedef {import('../types/schedule.js').Movie} Movie */

defineProps({
  /** @type {Movie} */
  movie: { type: Object, required: true },
  platformLabel: { type: String, required: true },
  windowClosed: { type: Boolean, default: false },
})

const emit = defineEmits(['reopen'])

const { t } = useI18n()
</script>
