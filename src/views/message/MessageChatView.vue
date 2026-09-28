<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  fetchMessageAsync,
  fetchMessageHistory,
  fetchMessageRecord,
  sendMessage,
  type MessageRecordItem,
} from '../../api/messageApi'
import { fetchUserById, type MemberUserInfo } from '../../api/memberUserApi'
import { readMemberAuthState } from '../../auth/memberSession'
import MessageBubble from '../../components/MessageBubble.vue'
import {
  clearMessageChatTitle,
  setMessageChatTitle,
} from '../../composables/useMessageChatTitle'
import { useMemberAuth } from '../../composables/useMemberAuth'
import { refreshMemberProfile, useMemberProfile } from '../../composables/useMemberProfile'

const route = useRoute()
const router = useRouter()
const { isLoggedIn } = useMemberAuth()
const { memberInfo } = useMemberProfile()

const historyMsg = ref<MessageRecordItem[]>([])
const peer = ref<MemberUserInfo | null>(null)
const inputText = ref('')
const sending = ref(false)
const loading = ref(true)
const snackbar = ref({ open: false, text: '', color: 'error' as string })
const messageEl = ref<HTMLElement | null>(null)
const sentinelEl = ref<HTMLElement | null>(null)
let pollTimer: ReturnType<typeof setInterval> | null = null
let asyncLoading = false
let historyLoading = false
let loadOlderObserver: IntersectionObserver | null = null

const peerUid = computed(() => {
  const raw = route.params.uid
  const n = Number(Array.isArray(raw) ? raw[0] : raw)
  return Number.isFinite(n) ? n : 0
})

const canSend = computed(() => inputText.value.trim().length > 0 && !sending.value)

const myAvatar = computed(() => memberInfo.value?.avatar ?? '')

function toast(text: string, color = 'error') {
  snackbar.value = { open: true, text, color }
}

function requireAuth(): string | null {
  const { token, isLogin } = readMemberAuthState()
  if (!isLogin || !token) {
    router.replace('/member/login')
    return null
  }
  return token
}

function toDeltaJson(text: string): string {
  return JSON.stringify({ ops: [{ insert: `${text}\n` }] })
}

function scrollToBottom() {
  void nextTick(() => {
    const el = messageEl.value
    if (el) el.scrollTop = el.scrollHeight
  })
}

async function loadPeer(uid: number, token: string) {
  const res = await fetchUserById(uid, token)
  if (res.code === 1 && res.data) {
    peer.value = res.data
    setMessageChatTitle(res.data.name || '私信')
  } else {
    setMessageChatTitle('私信')
  }
}

async function init() {
  const token = requireAuth()
  if (!token) return
  const uid = peerUid.value
  if (!uid) {
    router.replace('/message')
    return
  }

  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }

  loading.value = true
  historyMsg.value = []
  try {
    const [msgRes] = await Promise.all([
      fetchMessageRecord(uid, token),
      loadPeer(uid, token),
      refreshMemberProfile(),
    ])
    if (msgRes.code === 1 && Array.isArray(msgRes.data)) {
      historyMsg.value = msgRes.data
    }
    scrollToBottom()
    await nextTick()
    bindLoadOlderObserver()
    pollTimer = setInterval(() => {
      void pollNew()
    }, 10_000)
  } finally {
    loading.value = false
  }
}

async function pollNew() {
  const token = requireAuth()
  if (!token || asyncLoading) return
  const uid = peerUid.value
  if (!uid) return
  asyncLoading = true
  try {
    const last = historyMsg.value[historyMsg.value.length - 1]
    if (!last) {
      const res = await fetchMessageRecord(uid, token)
      if (res.code === 1 && Array.isArray(res.data)) {
        historyMsg.value = res.data
        scrollToBottom()
      }
      return
    }
    const res = await fetchMessageAsync(uid, last.msg_id, token)
    if (res.code === 0) return
    if (res.code === 1 && Array.isArray(res.data) && res.data.length) {
      historyMsg.value.push(...res.data)
      scrollToBottom()
    }
  } finally {
    asyncLoading = false
  }
}

async function loadOlder() {
  const token = requireAuth()
  if (!token || historyLoading || historyMsg.value.length === 0) return
  const uid = peerUid.value
  if (!uid) return
  historyLoading = true
  const el = messageEl.value
  const prevHeight = el?.scrollHeight ?? 0
  try {
    const first = historyMsg.value[0]
    const res = await fetchMessageHistory(uid, first.msg_id, token)
    if (res.code === 1 && Array.isArray(res.data) && res.data.length) {
      historyMsg.value.unshift(...res.data)
      await nextTick()
      if (el) el.scrollTop = el.scrollHeight - prevHeight
    }
  } finally {
    historyLoading = false
  }
}

function bindLoadOlderObserver() {
  loadOlderObserver?.disconnect()
  loadOlderObserver = null
  const root = messageEl.value
  const target = sentinelEl.value
  if (!root || !target) return
  loadOlderObserver = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) void loadOlder()
    },
    { root, threshold: 0, rootMargin: '40px 0px 0px 0px' },
  )
  loadOlderObserver.observe(target)
}

async function onSend() {
  const token = requireAuth()
  if (!token || !canSend.value) return
  const uid = peerUid.value
  const text = inputText.value.trim()
  if (!uid || !text) return
  sending.value = true
  try {
    const res = await sendMessage(uid, toDeltaJson(text), token)
    if (res.code === 1) {
      inputText.value = ''
      await pollNew()
    } else {
      toast(res.msg || '发送失败')
    }
  } catch (e) {
    toast(e instanceof Error ? e.message : '发送失败')
  } finally {
    sending.value = false
  }
}

watch(peerUid, () => {
  void init()
})

onMounted(() => {
  if (!isLoggedIn.value) {
    router.replace('/member/login')
    return
  }
  void init()
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
  loadOlderObserver?.disconnect()
  clearMessageChatTitle()
})
</script>

<template>
  <div class="message-window">
    <v-progress-linear v-if="loading" indeterminate color="primary" class="message-window__loading" />
    <div ref="messageEl" class="message">
      <div ref="sentinelEl" class="message__sentinel" />
      <MessageBubble
        v-for="item in historyMsg"
        :key="item.msg_id"
        :mine="item.uid !== peerUid"
        :msg="item.data?.message"
        :time="item.data?.time"
        :avatar-url="item.uid === peerUid ? peer?.avatar : myAvatar"
      />
    </div>

    <v-sheet class="sender message-input d-flex pa-3 align-center" width="100%">
      <v-textarea
        v-model="inputText"
        class="flex-fill"
        density="compact"
        variant="outlined"
        hide-details
        rows="1"
        auto-grow
        max-rows="4"
        placeholder="输入消息"
        @keydown.enter.exact.prevent="onSend"
      />
      <v-btn
        class="ms-2"
        color="link"
        :disabled="!canSend"
        :loading="sending"
        @click="onSend"
      >
        发送
      </v-btn>
    </v-sheet>

    <v-snackbar v-model="snackbar.open" :color="snackbar.color" timeout="2500">
      {{ snackbar.text }}
    </v-snackbar>
  </div>
</template>

<style scoped>
.message-window {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 0;
}

.message-window__loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 2;
}

.message {
  height: 100%;
  width: 100%;
  overflow-y: auto;
  padding-bottom: 78px;
}

.message__sentinel {
  height: 1px;
}

.sender {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
}

.message-input {
  padding-bottom: max(12px, env(safe-area-inset-bottom, 0px));
}
</style>
