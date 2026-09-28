import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import {
  cancelLikeResource,
  dislikeResource,
  likeResource,
  type MfunsLikeResourceType,
} from '../api/likeApi'
import type { FeedLikeStatus } from '../api/feedsApi'
import { readMemberAuthState } from '../auth/memberSession'
import { useMemberAuth } from './useMemberAuth'

function side(status: FeedLikeStatus, key: 'like' | 'dislike') {
  if (!status[key]) status[key] = { count: 0, is_active: false }
  return status[key]!
}

export function useLikeToggle(
  getId: () => number,
  type: MfunsLikeResourceType,
  initial?: FeedLikeStatus,
) {
  const router = useRouter()
  const { isLoggedIn } = useMemberAuth()
  const likeStatus = reactive<FeedLikeStatus>({
    like: { count: initial?.like?.count ?? 0, is_active: Boolean(initial?.like?.is_active) },
    dislike: {
      count: initial?.dislike?.count ?? 0,
      is_active: Boolean(initial?.dislike?.is_active),
    },
  })

  function requireLogin(): string | null {
    if (!isLoggedIn.value) {
      router.push('/member/login')
      return null
    }
    return readMemberAuthState().token
  }

  function applyStatus(next?: FeedLikeStatus | null) {
    if (!next) return
    likeStatus.like = {
      count: next.like?.count ?? 0,
      is_active: Boolean(next.like?.is_active),
    }
    likeStatus.dislike = {
      count: next.dislike?.count ?? 0,
      is_active: Boolean(next.dislike?.is_active),
    }
  }

  async function like() {
    const token = requireLogin()
    if (!token) return
    const id = getId()
    const L = side(likeStatus, 'like')
    const D = side(likeStatus, 'dislike')
    if (D.is_active) {
      D.is_active = false
      D.count = Math.max(0, (D.count ?? 0) - 1)
    }
    if (L.is_active) {
      L.is_active = false
      L.count = Math.max(0, (L.count ?? 0) - 1)
      await cancelLikeResource(id, type, token)
    } else {
      L.is_active = true
      L.count = (L.count ?? 0) + 1
      await likeResource(id, type, token)
    }
  }

  async function dislike() {
    const token = requireLogin()
    if (!token) return
    const id = getId()
    const L = side(likeStatus, 'like')
    const D = side(likeStatus, 'dislike')
    if (L.is_active) {
      L.is_active = false
      L.count = Math.max(0, (L.count ?? 0) - 1)
    }
    if (D.is_active) {
      D.is_active = false
      D.count = Math.max(0, (D.count ?? 0) - 1)
      await cancelLikeResource(id, type, token)
    } else {
      D.is_active = true
      D.count = (D.count ?? 0) + 1
      await dislikeResource(id, type, token)
    }
  }

  return { likeStatus, like, dislike, applyStatus }
}
