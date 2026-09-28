import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  fetchNotifyList,
  type NotifyListItem,
  type NotifyListType,
} from '../api/messageApi'
import { readMemberAuthState } from '../auth/memberSession'
import type { NotifyCardData } from '../components/NotifyCard.vue'
import { useMemberAuth } from './useMemberAuth'
import { refreshNotifyCount } from './useNotifyCount'

export function useNotifyList(
  type: NotifyListType,
  mapItem: (item: NotifyListItem) => NotifyCardData,
) {
  const router = useRouter()
  const { isLoggedIn } = useMemberAuth()

  const list = ref<NotifyCardData[]>([])
  const page = ref(1)
  const notMore = ref(false)

  function requireAuth(): string | null {
    const { token, isLogin } = readMemberAuthState()
    if (!isLogin || !token) {
      router.replace('/member/login')
      return null
    }
    return token
  }

  async function load(reset = false) {
    const token = requireAuth()
    if (!token) return
    if (reset) {
      list.value = []
      page.value = 1
      notMore.value = false
    }
    if (notMore.value && !reset) return

    const res = await fetchNotifyList(type, page.value, token)
    if (res.code === 1 && Array.isArray(res.data)) {
      if (res.data.length === 0) notMore.value = true
      else {
        list.value.push(...res.data.map(mapItem))
        page.value += 1
      }
    } else {
      notMore.value = true
    }
    void refreshNotifyCount()
  }

  async function refresh(done: () => void) {
    await load(true)
    done()
  }

  async function showMore(done: (notHaveMore?: boolean) => void) {
    if (notMore.value) {
      done(true)
      return
    }
    await load(false)
    done(notMore.value)
  }

  onMounted(() => {
    if (!isLoggedIn.value) {
      router.replace('/member/login')
    }
    // 初始加载由 PullRefresh created→download 触发，与参考站一致
  })

  return { list, notMore, refresh, showMore }
}
