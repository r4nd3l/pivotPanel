import { ref } from 'vue'

/**
 * Composable to manage UI toggles (e.g. overlays / modals)
 */
export default function useToggles() {
  // Phone low-battery overlay
  const showPhoneOverlay = ref(false)

  const openPhoneOverlay = () => {
    showPhoneOverlay.value = true
  }

  const closePhoneOverlay = () => {
    showPhoneOverlay.value = false
  }

  return {
    showPhoneOverlay,
    openPhoneOverlay,
    closePhoneOverlay,
  }
}

