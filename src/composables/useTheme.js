import { onMounted } from 'vue'

/**
 * Composable to apply the dark theme permanently.
 */
export default function useTheme() {
  onMounted(() => {
    document.documentElement.classList.add('dark')
  })
}
