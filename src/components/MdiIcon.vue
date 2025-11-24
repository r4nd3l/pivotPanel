<template>
  <i :class="`mdi mdi-${icon}`" :style="iconStyle"></i>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  icon: {
    type: String,
    required: true
  },
  size: {
    type: [String, Number],
    default: 24
  },
  color: {
    type: String,
    default: 'currentColor'
  }
})

const iconStyle = computed(() => {
  const sizeValue = typeof props.size === 'number' ? `${props.size}px` : props.size
  return {
    fontSize: sizeValue,
    color: props.color,
    display: 'inline-block',
    lineHeight: 1
  }
})
</script>

