<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { fetchSiteNotify, type SiteNotifyItem } from '../../api/messageApi'
import { readMemberAuthState } from '../../auth/memberSession'
import MfunsRichText from '../../components/MfunsRichText.vue'
import { useMemberAuth } from '../../composables/useMemberAuth'
import { refreshNotifyCount } from '../../composables/useNotifyCount'
import { formatRelativeTime } from '../../utils/mfunsTime'

const router = useRouter()
const { isLoggedIn } = useMemberAuth()

const list = ref<SiteNotifyItem[]>([])
const loading = ref(true)

function requireAuth(): string | null {
  const { token, isLogin } = readMemberAuthState()
  if (!isLogin || !token) {
    router.replace('/member/login')
    return null
  }
  return token
}

async function load() {
  const token = requireAuth()
  if (!token) return
  loading.value = true
  try {
    const res = await fetchSiteNotify(1, token)
    if (res.code === 1 && Array.isArray(res.data)) {
      list.value = res.data
    }
    void refreshNotifyCount()
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (!isLoggedIn.value) {
    router.replace('/member/login')
    return
  }
  void load()
})
</script>

<template>
  <div class="message-subpage">
    <v-progress-linear v-if="loading" indeterminate color="primary" />
    <div v-else-if="list.length === 0" class="message-subpage__empty">暂无通知</div>
    <template v-else>
      <v-card
        v-for="item in list"
        :key="item.id"
        class="mb-3"
        elevation="0"
      >
        <v-card-title v-if="item.title">{{ item.title }}</v-card-title>
        <v-card-subtitle>{{ formatRelativeTime(item.created_at) }}</v-card-subtitle>
        <v-card-text>
          <MfunsRichText :type="1" :text="item.content" />
        </v-card-text>
      </v-card>
    </template>
  </div>
</template>

<style scoped>
.message-subpage {
  min-height: 25vh;
  padding: 8px 12px 24px;
}

.message-subpage__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  color: rgba(var(--v-theme-on-surface), 0.6);
}
</style>
