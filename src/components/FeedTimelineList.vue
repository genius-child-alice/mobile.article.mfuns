<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import FeedDynamicCard from './FeedDynamicCard.vue'
import {
  fetchFeedList,
  fetchFeedNewReplyList,
  fetchFeedUserList,
  type FeedItem,
} from '../api/feedsApi'
import { readMemberAuthState } from '../auth/memberSession'
import { filterTimelineFeeds } from '../utils/feedTimelineFilter'

const props = defineProps<{
  newReply?: boolean
  userId?: number
  follow?: boolean
}>()

const list = ref<FeedItem[]>([])
const loading = ref(false)
const loadingMore = ref(false)
const notMore = ref(false)
const lastId = ref(-1)
const page = ref(1)

function authToken(): string | null {
  return readMemberAuthState().token
}

async function load(reset = false) {
  if (reset) {
    list.value = []
    lastId.value = -1
    page.value = 1
    notMore.value = false
  }

  if (notMore.value) return false

  const isFirst = list.value.length === 0 || reset
  if (isFirst) loading.value = true
  else loadingMore.value = true

  try {
    const token = authToken()
    let res

    if (props.newReply) {
      res = await fetchFeedNewReplyList(page.value, 20, token)
    } else if (props.userId === -1) {
      res = await fetchFeedList(lastId.value, token)
    } else if (props.userId != null && props.userId > 0) {
      res = await fetchFeedUserList(
        lastId.value,
        props.userId,
        props.follow ? 1 : 0,
        token,
      )
    } else {
      notMore.value = true
      return false
    }

    if (res.code !== 1 || !Array.isArray(res.data)) {
      notMore.value = true
      return false
    }

    if (res.data.length === 0) {
      notMore.value = true
      return false
    }

    const raw = res.data
    const incoming = filterTimelineFeeds(raw)
    list.value.push(...incoming)

    const apiLast = raw[raw.length - 1]
    if (apiLast?.id != null) lastId.value = apiLast.id
    if (props.newReply) page.value += 1

    if (incoming.length === 0) {
      return load(false)
    }

    return true
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

watch(
  () => [props.newReply, props.userId, props.follow] as const,
  () => {
    void load(true)
  },
)

onMounted(() => {
  void load(true)
})

defineExpose({ reload: () => load(true) })
</script>

<template>
  <div class="feed-timeline-list">
    <slot />

    <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-2" />

    <div
      v-else-if="list.length === 0"
      class="text-body-2 text-medium-emphasis text-center py-8 px-4"
    >
      暂无动态
    </div>

    <template v-for="(item, index) in list" :key="item.id">
      <FeedDynamicCard :data="item" />
      <v-divider v-if="index < list.length - 1" class="my-0" />
    </template>

    <div v-if="!loading && list.length > 0 && !notMore" class="py-3 text-center">
      <v-btn variant="text" color="link" :loading="loadingMore" @click="load()">
        加载更多
      </v-btn>
    </div>
  </div>
</template>

<style scoped>
.feed-timeline-list {
  min-width: 0;
}
</style>
