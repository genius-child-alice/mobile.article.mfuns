import { ref } from 'vue'
import type { HomeCategory } from '../api/homeApi'

const tabIndex = ref(0)
const tabLabels = ref<string[]>(['全站排行'])
const categories = ref<HomeCategory[]>([])

export function setLeaderboardCategories(list: HomeCategory[]) {
  categories.value = list
  tabLabels.value = ['全站排行', ...list.map((c) => c.name || String(c.id))]
  if (tabIndex.value >= tabLabels.value.length) {
    tabIndex.value = 0
  }
}

export function resetLeaderboardTabs() {
  tabIndex.value = 0
  tabLabels.value = ['全站排行']
  categories.value = []
}

export function useLeaderboardTabs() {
  return {
    tabIndex,
    tabLabels,
    categories,
    setLeaderboardCategories,
    resetLeaderboardTabs,
  }
}
