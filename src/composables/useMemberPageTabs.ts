import { ref } from 'vue'

const tabIndex = ref(0)
const tabLabels = ['首页', '文章', '收藏'] as const
const pageTitle = ref('')
const pageUserId = ref(0)

export function setMemberPageTitle(title: string) {
  pageTitle.value = title
}

export function setMemberPageUserId(id: number) {
  pageUserId.value = id
}

export function resetMemberPageTabs() {
  tabIndex.value = 0
  pageTitle.value = ''
  pageUserId.value = 0
}

export function useMemberPageTabs() {
  return {
    tabIndex,
    tabLabels,
    pageTitle,
    pageUserId,
    setMemberPageTitle,
    setMemberPageUserId,
    resetMemberPageTabs,
  }
}
