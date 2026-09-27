<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  fetchActiveLoginSessions,
  fetchMemberSecurityInfo,
  type LoginSessionDevice,
  type MemberSecurityInfo,
} from '../../api/memberSecurityApi'
import { readMemberAuthState } from '../../auth/memberSession'
import { useMemberAuth } from '../../composables/useMemberAuth'

const router = useRouter()
const { isLoggedIn } = useMemberAuth()

const loading = ref(true)
const info = ref<MemberSecurityInfo>({ phone: null, email: null })
const sessions = ref<LoginSessionDevice[]>([])
const currentSession = ref<LoginSessionDevice | undefined>()

const phoneLabel = computed(() => info.value.phone || '未绑定')
const emailLabel = computed(() => info.value.email || '未绑定')

onMounted(async () => {
  if (!isLoggedIn.value) {
    router.replace('/member/login')
    return
  }

  const { token } = readMemberAuthState()
  if (!token) {
    router.replace('/member/login')
    return
  }

  try {
    const [infoRes, sessionRes] = await Promise.all([
      fetchMemberSecurityInfo(token),
      fetchActiveLoginSessions(token),
    ])
    if (infoRes.code === 1 && infoRes.data) {
      info.value = infoRes.data
    }
    if (sessionRes.code === 1 && sessionRes.data) {
      sessions.value = sessionRes.data.devices ?? []
      currentSession.value = sessionRes.data.current
    }
  } finally {
    loading.value = false
  }
})

function isOnline(lastActive?: number): boolean {
  if (!lastActive) return false
  return (Date.now() - lastActive * 1000) / 1000 <= 300
}

function deviceIcon(device?: string): string {
  const text = device ?? ''
  if (text.includes('Android')) return 'mdi-android'
  if (text.includes('Windows')) return 'mdi-microsoft-windows'
  if (text.includes('iPhone') || text.includes('iPad')) return 'mdi-apple'
  return 'mdi-cellphone'
}

function goResetPassword() {
  router.push('/member/reset_password')
}
</script>

<template>
  <div class="settings-page">
    <v-progress-linear v-if="loading" indeterminate color="primary" />

    <v-list v-else class="settings-list" bg-color="surface" rounded="0">
      <v-list-subheader>账号绑定</v-list-subheader>

      <v-list-item lines="two" ripple disabled>
        <template #prepend>
          <v-avatar color="transparent">
            <v-icon icon="mdi-cellphone" color="green" />
          </v-avatar>
        </template>
        <v-list-item-title>手机号绑定</v-list-item-title>
        <v-list-item-subtitle>{{ phoneLabel }}</v-list-item-subtitle>
      </v-list-item>

      <v-list-item lines="two" ripple disabled>
        <template #prepend>
          <v-avatar color="transparent">
            <v-icon icon="mdi-email" color="blue" />
          </v-avatar>
        </template>
        <v-list-item-title>邮箱绑定</v-list-item-title>
        <v-list-item-subtitle>{{ emailLabel }}</v-list-item-subtitle>
      </v-list-item>

      <v-list-subheader>密码安全</v-list-subheader>

      <v-list-item lines="two" ripple @click="goResetPassword">
        <template #prepend>
          <v-avatar color="transparent">
            <v-icon icon="mdi-key-variant" color="amber-darken-2" />
          </v-avatar>
        </template>
        <v-list-item-title>重置密码</v-list-item-title>
        <v-list-item-subtitle>点击重置密码</v-list-item-subtitle>
      </v-list-item>

      <v-list-subheader>会话管理</v-list-subheader>

      <v-list-item
        v-for="(session, index) in sessions"
        :key="session.id ?? index"
        lines="two"
      >
        <template #prepend>
          <v-avatar color="transparent">
            <v-icon :icon="deviceIcon(session.device)" color="link" />
          </v-avatar>
        </template>
        <v-list-item-title>
          {{ session.device || '未知设备' }}
          <span v-if="currentSession?.id === session.id" class="text-caption text-link">
            [当前会话]
          </span>
        </v-list-item-title>
        <v-list-item-subtitle>
          {{ session.ip || '—' }}
          ·
          {{ isOnline(session.last_active) ? '在线' : '离线' }}
        </v-list-item-subtitle>
      </v-list-item>

      <v-list-item v-if="sessions.length === 0" class="text-medium-emphasis">
        <v-list-item-title>暂无其他登录会话</v-list-item-title>
      </v-list-item>
    </v-list>
  </div>
</template>

<style scoped>
@import '../../styles/settings-page.css';
</style>
