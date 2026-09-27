import { computed, ref, shallowReadonly } from 'vue'
import {
  fetchMemberHistory,
  fetchMemberLevelSection,
  fetchMemberUserInfo,
  type MemberHistoryItem,
  type MemberUserInfo,
} from '../api/memberUserApi'
import { readMemberAuthState } from '../auth/memberSession'

const memberInfo = ref<MemberUserInfo | null>(null)
const history = ref<MemberHistoryItem[]>([])
/** level_id → experience threshold (aligned with m.mfuns member_data.level_cache). */
const levelExpByLevelId = ref<number[]>([])
const loading = ref(false)
let inflight: Promise<void> | null = null

function buildLevelCache(sections: { level_id: number; experience: number }[]): number[] {
  const cache: number[] = []
  for (const item of sections) {
    cache[item.level_id] = item.experience
  }
  return cache
}

export function clearMemberProfile() {
  memberInfo.value = null
  history.value = []
  levelExpByLevelId.value = []
}

export async function refreshMemberProfile(): Promise<void> {
  const { token, isLogin } = readMemberAuthState()
  if (!isLogin || !token) {
    clearMemberProfile()
    return
  }

  if (inflight) return inflight

  inflight = (async () => {
    loading.value = true
    try {
      const [infoRes, historyRes, levelRes] = await Promise.all([
        fetchMemberUserInfo(token),
        fetchMemberHistory(token, 0),
        fetchMemberLevelSection(token),
      ])

      if (infoRes.code === 1 && infoRes.data?.user) {
        memberInfo.value = infoRes.data.user
      }

      if (levelRes.code === 1 && Array.isArray(levelRes.data)) {
        levelExpByLevelId.value = buildLevelCache(levelRes.data)
      }

      if (historyRes.code === 1 && Array.isArray(historyRes.data)) {
        history.value = historyRes.data
      } else if (historyRes.code !== 1) {
        history.value = []
      }
    } finally {
      loading.value = false
      inflight = null
    }
  })()

  return inflight
}

export function useMemberProfile() {
  const nekoCoin = computed(() => memberInfo.value?.neko_coin ?? 0)
  const fansCount = computed(() => memberInfo.value?.follow?.fans ?? 0)
  const followCount = computed(() => memberInfo.value?.follow?.follow ?? 0)
  const memberId = computed(() => memberInfo.value?.id ?? 0)

  const profileSubtitle = computed(() => {
    const user = memberInfo.value
    if (!user?.id) return ''

    const cache = levelExpByLevelId.value
    let nextLevelIndex = (user.level_id ?? 0) + 1
    if (nextLevelIndex >= cache.length) {
      nextLevelIndex = Math.max(0, cache.length - 1)
    }
    const expCap = cache[nextLevelIndex] ?? 0
    const exp = user.exp ?? 0

    return `UID: ${user.id} EXP: ${exp}/${expCap}`
  })

  return {
    memberInfo: shallowReadonly(memberInfo),
    history: shallowReadonly(history),
    loading: shallowReadonly(loading),
    nekoCoin,
    fansCount,
    followCount,
    memberId,
    profileSubtitle,
    refreshMemberProfile,
    clearMemberProfile,
  }
}
