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
  const res = await fetchSiteNotify(1, token)
  if (res.code === 1 && Array.isArray(res.data)) {
    list.value = res.data
  }
  void refreshNotifyCount()
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
  <!-- 参考 Notify：scrollbar + v-card 列表 -->
  <div class="scrollbar">
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
  </div>
</template>

<style scoped>
.scrollbar {
  height: 100%;
  overflow-y: auto;
}
</style>
