<template>
  <router-view />
</template>

<script setup>
import useMidnightRefresh from './composables/useMidnightRefresh.js'
import useTheme from './composables/useTheme.js'

// Schedule page reload at midnight (Hungarian timezone)
useMidnightRefresh()

// Apply dark/light theme based on time of day
useTheme()
</script>
