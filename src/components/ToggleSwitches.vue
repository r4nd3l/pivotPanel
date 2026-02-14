<template>
  <div class="w-full">
    <!-- Toggle row -->
    <div
      class="flex items-center justify-end gap-4 w-full px-4 pb-2"
    >
      <!-- Phone toggle -->
      <button
        type="button"
        class="flex items-center justify-center w-10 h-10 rounded-full bg-white/80 dark:bg-gray-800/80 border border-blue-200 dark:border-blue-600 shadow-md hover:bg-blue-600 hover:text-white dark:hover:bg-blue-500 transition-colors cursor-pointer"
        @click="openPhoneOverlay"
      >
        <i class="mdi mdi-cellphone text-[20px] leading-none"></i>
      </button>

      <!-- Future toggles can be added here -->
    </div>

    <!-- Full-screen phone low-battery overlay -->
    <div
      v-if="showPhoneOverlay"
      class="fixed inset-0 z-50 flex items-center justify-center bg-red-700/95"
    >
      <div class="relative w-full h-full flex items-center justify-center">
        <!-- Close button -->
        <button
          type="button"
          class="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full bg-red-800 hover:bg-red-900 text-white shadow-lg cursor-pointer"
          @click="closePhoneOverlay"
          aria-label="Close"
        >
          <i class="mdi mdi-close text-2xl"></i>
        </button>

        <!-- Content -->
        <div class="flex flex-col items-center gap-6 px-6 text-center">
          <i class="mdi mdi-battery-alert-variant-outline text-white text-8xl md:text-9xl drop-shadow-lg"></i>
          <p class="text-white text-8xl font-bold drop-shadow-md">
            A telefonod le van merülve, rakd fel tölteni! 
            <br>
            Valamint, ha nincs bekapcsolva, kapcsold be!
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import useToggles from '../composables/useToggles.js'

const { showPhoneOverlay, openPhoneOverlay, closePhoneOverlay } = useToggles()
</script>

<style scoped>
</style>

