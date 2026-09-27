import { ref, watch } from 'vue'
import { useDisplay } from 'vuetify'

const tabIndex = ref(0)

export function useHomeTabs() {
  const { mdAndUp } = useDisplay()

  watch(mdAndUp, (wide) => {
    if (wide) tabIndex.value = 0
  })

  return { tabIndex }
}
