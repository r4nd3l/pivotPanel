import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'

export default function useTimePhase() {
  const { t } = useI18n()
  const phase = ref('default')

  const hour = new Date().getHours()

  if (hour >= 0 && hour < 6) phase.value = 'hajnal'
  else if (hour >= 6 && hour < 9) phase.value = 'reggel'
  else if (hour >= 9 && hour < 12) phase.value = 'delelo'
  else if (hour >= 12 && hour < 15) phase.value = 'delutan'
  else if (hour >= 15 && hour < 18) phase.value = 'keso_delutan'
  else if (hour >= 18 && hour < 21) phase.value = 'este'
  else phase.value = 'ejszaka'

  const phaseLabel = computed(() => t(`phases.${phase.value}`))

  return {
    phase,
    phaseLabel
  }
}
