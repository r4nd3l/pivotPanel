import { ref } from 'vue'

export default function useTimePhase() {
  const phase = ref('default')

  const hour = new Date().getHours()

  if (hour >= 6 && hour < 12) phase.value = 'morning'
  else if (hour >= 12 && hour < 18) phase.value = 'afternoon'
  else phase.value = 'evening'

  return phase
}
