import { computed, onMounted, onUnmounted, ref, shallowReadonly } from 'vue'
import { readMemberAuthState, type MemberAuthState } from '../auth/memberSession'

const state = ref<MemberAuthState>({ token: null, isLogin: false })

function syncMemberAuth() {
  state.value = readMemberAuthState()
}

let listenerCount = 0

function onExternalAuthChange() {
  syncMemberAuth()
}

function bindStorageListeners() {
  if (typeof window === 'undefined') return
  if (listenerCount === 0) {
    window.addEventListener('storage', onExternalAuthChange)
    window.addEventListener('focus', onExternalAuthChange)
  }
  listenerCount += 1
}

function unbindStorageListeners() {
  if (typeof window === 'undefined') return
  listenerCount = Math.max(0, listenerCount - 1)
  if (listenerCount === 0) {
    window.removeEventListener('storage', onExternalAuthChange)
    window.removeEventListener('focus', onExternalAuthChange)
  }
}

export function useMemberAuth() {
  onMounted(() => {
    syncMemberAuth()
    bindStorageListeners()
  })

  onUnmounted(() => {
    unbindStorageListeners()
  })

  const isLoggedIn = computed(() => state.value.isLogin)

  return {
    auth: shallowReadonly(state),
    isLoggedIn,
    refreshMemberAuth: syncMemberAuth,
  }
}

/** Call once before app mount so first paint matches cookie state. */
export function initMemberAuthFromStorage() {
  syncMemberAuth()
}

/** Update auth reactive state after login/logout in the same tab. */
export function refreshMemberAuth() {
  syncMemberAuth()
}
