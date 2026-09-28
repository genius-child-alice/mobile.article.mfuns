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

function contentTypeLabel(t: number | undefined): string {
  switch (t) {
    case 0:
      return '文章'
    case 1:
      return '视频'
    case 2:
      return '插画'
    case 3:
      return '动态'
    case 4:
      return '评论'
    default:
      return '内容'
  }
}

function requireAuth(): string | null {
  const { token, isLogin } = readMemberAuthState()
  if (!isLogin || !token) {
    router.replace('/member/login')
    return null
  }
  return token
}

function mapItems(items: NotifyListItem[]): NotifyCardData[] {
  return items.map((e) => {
    const count = e.notify_params?.count ?? 1
    const info =
      count === 1
        ? `点赞了你的${contentTypeLabel(e.content_type)}`
        : `等${count}人点赞了你的${contentTypeLabel(e.content_type)}`
    return {
      user: e.user,
      info,
      content: e.notify_params?.text,
      time: e.created_at,
      resource_id: e.content_id,
      resource_type: e.content_type,
    }
  })
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
    const res = await fetchNotifyList(1, page.value, token)
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
    <div v-else-if="list.length === 0" class="message-subpage__empty">暂无点赞</div>
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
