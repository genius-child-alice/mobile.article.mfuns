import { computed, ref, shallowReadonly } from 'vue'
import { fetchNotifyCount, type NotifyCountData } from '../api/messageApi'
import { readMemberAuthState } from '../auth/memberSession'

const counts = ref<NotifyCountData>({
  comment: 0,
  like: 0,
  mention: 0,
  system: 0,
})

const badgeTotal = computed(() => {
  const c = counts.value
  return (c.comment ?? 0) + (c.like ?? 0) + (c.mention ?? 0) + (c.system ?? 0)
})

export function useNotifyCount() {
  return {
    counts: shallowReadonly(counts),
    badgeTotal,
  }
}

export async function refreshNotifyCount(): Promise<void> {
  const { token, isLogin } = readMemberAuthState()
  if (!isLogin || !token) {
    counts.value = { comment: 0, like: 0, mention: 0, system: 0 }
    return
  }
  try {
    const res = await fetchNotifyCount(token)
    if (res.code === 1 && res.data) {
      counts.value = {
        comment: res.data.comment ?? 0,
        like: res.data.like ?? 0,
        mention: res.data.mention ?? 0,
        system: res.data.system ?? 0,
      }
    }
  } catch {
    /* keep previous */
  }
}
