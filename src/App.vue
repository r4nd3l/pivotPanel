<template>
  <router-view />
</template>

<script setup>
import useMidnightRefresh from './composables/useMidnightRefresh.js'

// Schedule page reload at midnight (Hungarian timezone)
useMidnightRefresh()
</script>
