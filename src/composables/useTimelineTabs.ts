import { computed, ref, watch } from 'vue'
import { useMemberAuth } from './useMemberAuth'

const tabIndex = ref(0)

export function useTimelineTabs() {
  const { isLoggedIn } = useMemberAuth()

  const tabLabels = computed(() =>
    isLoggedIn.value ? (['时间线', '关注'] as const) : (['时间线'] as const),
  )

  watch(isLoggedIn, () => {
    tabIndex.value = 0
  })

  watch(tabLabels, (labels) => {
    if (tabIndex.value >= labels.length) tabIndex.value = 0
  })

  return { tabIndex, tabLabels }
}
