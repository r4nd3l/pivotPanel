<template>
  <div>
    <h2>Current Phase: {{ phase }}</h2>
    <ul>
      <li v-for="(item, i) in currentItems" :key="i">{{ item }}</li>
    </ul>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import useTimePhase from '../composables/useTimePhase.js'

const props = defineProps({
  data: Object
})

const phase = useTimePhase()

const currentItems = computed(() => {
  return props.data[phase.value] ?? []
})
</script>

