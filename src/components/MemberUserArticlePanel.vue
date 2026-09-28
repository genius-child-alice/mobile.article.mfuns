<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import ArticleContentBar from './ArticleContentBar.vue'
import PullRefresh from './PullRefresh.vue'
import { fetchUserArticleList } from '../api/articleApi'
import { filterHomeArticleItems, homeContentPath, type HomeContentItem } from '../api/homeApi'
import type { MemberHistoryResource } from '../api/memberUserApi'
import { readMemberAuthState } from '../auth/memberSession'

const props = defineProps<{
  userId: number
}>()

const router = useRouter()
const list = ref<HomeContentItem[]>([])
const lastAid = ref(0)
const notMore = ref(false)

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

async function load(reset: boolean) {
  if (!props.userId) return
  if (!reset && notMore.value) return
  const { token } = readMemberAuthState()
  const res = await fetchUserArticleList(
    props.userId,
    reset ? 0 : lastAid.value,
    token,
  )
  if (res.code !== 1) {
    if (reset) list.value = []
    notMore.value = true
    return
  }
  const batch = filterHomeArticleItems(Array.isArray(res.data?.list) ? res.data.list : [])
  if (reset) list.value = batch
  else list.value.push(...batch)
  const next = res.data?.last_id ?? batch[batch.length - 1]?.id ?? 0
  if (!batch.length || next === lastAid.value) notMore.value = true
  else lastAid.value = next
}

async function refresh(done: () => void) {
  lastAid.value = 0
  notMore.value = false
  await load(true)
  done()
}

async function download(done: (notHaveMore?: boolean) => void) {
  await load(false)
  done(notMore.value)
}

watch(
  () => props.userId,
  () => {
    lastAid.value = 0
    notMore.value = false
    list.value = []
    void load(true)
  },
  { immediate: true },
)
</script>

<template>
  <PullRefresh class="member-user-articles" @refresh="refresh" @download="download">
    <ArticleContentBar
      v-for="item in list"
      :key="item.id"
      class="mb-1"
      :data="toBarData(item)"
      @click="router.push(homeContentPath(item))"
    />
    <div v-if="list.length === 0" class="text-center text-medium-emphasis py-12">
      暂无文章
    </div>
  </PullRefresh>
</template>
