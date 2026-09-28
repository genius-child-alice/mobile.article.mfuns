<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { fetchNotifyList, type NotifyListItem } from '../../api/messageApi'
import { readMemberAuthState } from '../../auth/memberSession'
import NotifyCard, { type NotifyCardData } from '../../components/NotifyCard.vue'
import { useMemberAuth } from '../../composables/useMemberAuth'
import { refreshNotifyCount } from '../../composables/useNotifyCount'

const router = useRouter()
const { isLoggedIn } = useMemberAuth()

const list = ref<NotifyCardData[]>([])
const page = ref(1)
const notMore = ref(false)
const loading = ref(false)
const loadingMore = ref(false)

function requireAuth(): string | null {
  const { token, isLogin } = readMemberAuthState()
  if (!isLogin || !token) {
    router.replace('/member/login')
    return null
  }
  return token
}

function mapItems(items: NotifyListItem[]): NotifyCardData[] {
  return items.map((e) => ({
    user: e.user,
    info: `${e.notify_params?.type ?? ''}了你`,
    content: e.notify_params?.text,
    time: e.created_at,
    resource_id: e.content_id,
    resource_type: e.content_type,
  }))
}

async function load(reset = false) {
  const token = requireAuth()
  if (!token) return
  if (reset) {
    list.value = []
    page.value = 1
    notMore.value = false
  }
  if (notMore.value) return
  if (reset) loading.value = true
  else loadingMore.value = true
  try {
    const res = await fetchNotifyList(3, page.value, token)
    if (res.code === 1 && Array.isArray(res.data)) {
      if (res.data.length === 0) notMore.value = true
      else {
        list.value.push(...mapItems(res.data))
        page.value += 1
      }
    } else {
      notMore.value = true
    }
    void refreshNotifyCount()
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

onMounted(() => {
  if (!isLoggedIn.value) {
    router.replace('/member/login')
    return
  }
  void load(true)
})
</script>

<template>
  <div class="message-subpage">
    <v-progress-linear v-if="loading" indeterminate color="primary" />
    <div v-else-if="list.length === 0" class="message-subpage__empty">暂无提及</div>
    <template v-else>
      <NotifyCard v-for="(item, i) in list" :key="i" :data="item" />
      <div class="text-center py-4">
        <v-btn
          variant="text"
          block
          :disabled="notMore"
          :loading="loadingMore"
          @click="load(false)"
        >
          {{ notMore ? '没有更多了' : '加载更多' }}
        </v-btn>
      </div>
    </template>
  </div>
</template>

<style scoped>
.message-subpage {
  min-height: 25vh;
  padding-bottom: 24px;
}

.message-subpage__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  color: rgba(var(--v-theme-on-surface), 0.6);
}
</style>
