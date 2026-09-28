<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { fetchFollowStatus, followUser, unfollowUser } from '../api/followApi'
import { readMemberAuthState } from '../auth/memberSession'
import { useMemberAuth } from '../composables/useMemberAuth'

const props = withDefaults(
  defineProps<{
    userId: number
    /** -1=未知，需拉取；0=+关注；1=已关注；2=已互关 */
    status?: number
    color?: string
  }>(),
  {
    status: -1,
    color: 'link',
  },
)

const router = useRouter()
const { isLoggedIn } = useMemberAuth()

const statusCode = ref(props.status >= 0 ? props.status : 0)
const loading = ref(false)
const snackbar = ref({ open: false, text: '', color: 'error' as string })

const label = computed(() => {
  switch (statusCode.value) {
    case 1:
      return '已关注'
    case 2:
      return '已互关'
    default:
      return '+ 关注'
  }
})

function toast(text: string, color = 'error') {
  snackbar.value = { open: true, text, color }
}

function requireToken(): string | null {
  if (!isLoggedIn.value) {
    router.push('/member/login')
    return null
  }
  return readMemberAuthState().token
}

async function asyncStatus() {
  const token = requireToken()
  if (!token) return
  const res = await fetchFollowStatus(props.userId, token)
  if (res.code === 1 && typeof res.data?.status === 'number') {
    statusCode.value = res.data.status
  } else {
    statusCode.value = 0
  }
}

async function onClick() {
  const token = requireToken()
  if (!token) return

  loading.value = true
  try {
    if (statusCode.value === 0) {
      const res = await followUser(props.userId, token)
      if (res.code !== 1) toast(res.msg || '关注失败')
      await asyncStatus()
    } else {
      const res = await unfollowUser(props.userId, token)
      if (res.code !== 1) toast(res.msg || '取消失败')
      statusCode.value = 0
    }
  } finally {
    loading.value = false
  }
}

watch(
  () => props.status,
  (v) => {
    if (v >= 0) statusCode.value = v
  },
)

onMounted(async () => {
  statusCode.value = props.status >= 0 ? props.status : 0
  if (isLoggedIn.value && props.status === -1) {
    await asyncStatus()
  }
})
</script>

<template>
  <v-btn
    :color="color"
    :loading="loading"
    variant="text"
    density="comfortable"
    @click.stop="onClick"
  >
    {{ label }}
  </v-btn>

  <v-snackbar v-model="snackbar.open" :color="snackbar.color" timeout="2500">
    {{ snackbar.text }}
  </v-snackbar>
</template>
