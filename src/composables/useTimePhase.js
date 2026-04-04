import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'

function getPhaseForHour(hour) {
  if (hour >= 0 && hour < 6) return 'hajnal'
  if (hour >= 6 && hour < 9) return 'reggel'
  if (hour >= 9 && hour < 12) return 'delelo'
  if (hour >= 12 && hour < 15) return 'delutan'
  if (hour >= 15 && hour < 18) return 'keso_delutan'
  if (hour >= 18 && hour < 21) return 'este'
  return 'ejszaka'
}

export default function useTimePhase() {
  const { t } = useI18n()
  const phase = ref(getPhaseForHour(new Date().getHours()))
  let intervalId = null

  onMounted(() => {
    intervalId = setInterval(() => {
      phase.value = getPhaseForHour(new Date().getHours())
    }, 60000)
  })

  onUnmounted(() => {
    if (intervalId) clearInterval(intervalId)
  })

  const phaseLabel = computed(() => t(`phases.${phase.value}`))

  return {
    phase,
    phaseLabel
  }
}
