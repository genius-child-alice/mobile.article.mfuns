<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ArticleContentBar from '../../components/ArticleContentBar.vue'
import PullRefresh from '../../components/PullRefresh.vue'
import { homeContentPath, type HomeContentItem } from '../../api/homeApi'
import { fetchTagArticleList } from '../../api/tagApi'
import type { MemberHistoryResource } from '../../api/memberUserApi'
import { readMemberAuthState } from '../../auth/memberSession'

const route = useRoute()
const router = useRouter()

const tag = computed(() => {
  const raw = route.params.tag
  const value = Array.isArray(raw) ? raw[0] : raw
  return value ? decodeURIComponent(String(value)) : ''
})

const articleList = ref<HomeContentItem[]>([])
const articleLastId = ref(0)
const articleNotMore = ref(false)

function toBarData(item: HomeContentItem): MemberHistoryResource {
  return {
    id: item.id,
    title: item.title,
    cover: item.cover,
    summary: item.summary,
    user: item.user,
    like_count: item.like_count,
    comment_count: item.comment_count,
    view_count: item.view_count,
    duration: item.duration,
    tag: item.tag,
    cover_meta: item.cover_meta,
    type: item.type,
  }
}

function normalizeList<T>(data: { list?: T[] } | T[] | undefined): T[] {
  if (!data) return []
  if (Array.isArray(data)) return data
  return Array.isArray(data.list) ? data.list : []
}

function normalizeLastId(
  data: { last_id?: number } | unknown,
  fallback: number,
): number {
  if (data && typeof data === 'object' && 'last_id' in data) {
    const id = (data as { last_id?: number }).last_id
    if (typeof id === 'number' && id > 0) return id
  }
  return fallback
}

async function loadArticles(reset: boolean) {
  if (!tag.value) return
  if (!reset && articleNotMore.value) return
  const { token } = readMemberAuthState()
  const res = await fetchTagArticleList(
    tag.value,
    reset ? undefined : articleLastId.value || undefined,
    token,
  )
  if (res.code !== 1) {
    if (reset) articleList.value = []
    articleNotMore.value = true
    return
  }
  const batch = normalizeList<HomeContentItem>(res.data).filter((i) => i.type !== 1)
  if (reset) articleList.value = batch
  else articleList.value.push(...batch)
  const nextId = normalizeLastId(
    res.data,
    batch.length ? batch[batch.length - 1].id : 0,
  )
  if (!batch.length || nextId === articleLastId.value) articleNotMore.value = true
  else articleLastId.value = nextId
}

async function refreshArticles(done: () => void) {
  articleLastId.value = 0
  articleNotMore.value = false
  await loadArticles(true)
  done()
}

async function downloadArticles(done: (notHaveMore?: boolean) => void) {
  await loadArticles(false)
  done(articleNotMore.value)
}

async function bootstrap() {
  if (!tag.value) {
    router.replace('/404')
    return
  }
  articleLastId.value = 0
  articleNotMore.value = false
  articleList.value = []
  await loadArticles(true)
}

watch(
  () => route.params.tag,
  () => {
    void bootstrap()
  },
)

onMounted(() => {
  void bootstrap()
})
</script>

<template>
  <div class="tag-page ma-2">
    <PullRefresh @refresh="refreshArticles" @download="downloadArticles">
      <ArticleContentBar
        v-for="item in articleList"
        :key="item.id"
        class="mb-1"
        :data="toBarData(item)"
        @click="router.push(homeContentPath(item))"
      />
      <div
        v-if="articleList.length === 0"
        class="text-center text-medium-emphasis py-12"
      >
        暂无帖子
      </div>
    </PullRefresh>
  </div>
</template>
