<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import FeedDynamicCard from './FeedDynamicCard.vue'
import {
  fetchFeedList,
  fetchFeedNewReplyList,
  fetchFeedUserList,
  type FeedItem,
} from '../api/feedsApi'
import { readMemberAuthState } from '../auth/memberSession'
import { filterTimelineFeeds } from '../utils/feedTimelineFilter'

const SCROLL_THRESHOLD_PX = 240

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
const listRootRef = ref<HTMLElement | null>(null)
const loadMoreSentinel = ref<HTMLElement | null>(null)

const scrollTargets = new Set<HTMLElement | Window>()
let loadMoreObserver: IntersectionObserver | null = null
let loadSeq = 0

function authToken(): string | null {
  return readMemberAuthState().token
}

function isListVisible(): boolean {
  const el = listRootRef.value
  if (!el) return false
  return el.getClientRects().length > 0
}

function canLoadMore(): boolean {
  return (
    isListVisible() &&
    !loading.value &&
    !loadingMore.value &&
    !notMore.value &&
    list.value.length > 0
  )
}

function collectScrollTargets(start: HTMLElement | null): Array<HTMLElement | Window> {
  const targets: Array<HTMLElement | Window> = []
  const seen = new Set<HTMLElement | Window>()

  const add = (t: HTMLElement | Window | null | undefined) => {
    if (!t || seen.has(t)) return
    seen.add(t)
    targets.push(t)
  }

  let el: HTMLElement | null = start
  while (el) {
    const { overflowY } = getComputedStyle(el)
    if (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') {
      add(el)
    }
    el = el.parentElement
  }

  const mainScroller = document.querySelector('.v-main__scroller')
  if (mainScroller instanceof HTMLElement) add(mainScroller)

  add(window)
  return targets
}

function isNearBottom(target: HTMLElement | Window): boolean {
  if (target === window) {
    const doc = document.documentElement
    const top = window.scrollY || doc.scrollTop || 0
    return doc.scrollHeight - top - window.innerHeight < SCROLL_THRESHOLD_PX
  }
  const el = target as HTMLElement
  return el.scrollHeight - el.scrollTop - el.clientHeight < SCROLL_THRESHOLD_PX
}

function anyTargetNearBottom(): boolean {
  for (const t of scrollTargets) {
    if (isNearBottom(t)) return true
  }
  if (scrollTargets.size === 0) {
    const doc = document.documentElement
    const top = window.scrollY || doc.scrollTop || 0
    return doc.scrollHeight - top - window.innerHeight < SCROLL_THRESHOLD_PX
  }
  return false
}

function tryLoadMoreFromScroll() {
  if (!canLoadMore()) return
  if (!anyTargetNearBottom()) return
  void load(false)
}

function onScroll(ev?: Event) {
  if (!canLoadMore()) return
  const t = ev?.target
  if (t instanceof HTMLElement && isNearBottom(t)) {
    void load(false)
    return
  }
  if (isNearBottom(window) || anyTargetNearBottom()) {
    void load(false)
  }
}

function unbindScrollListeners() {
  document.removeEventListener('scroll', onScroll, true)
  for (const t of scrollTargets) {
    if (t === window) {
      window.removeEventListener('scroll', onScroll)
    } else {
      t.removeEventListener('scroll', onScroll)
    }
  }
  scrollTargets.clear()
}

function bindScrollListeners() {
  unbindScrollListeners()
  // 捕获阶段可收到任意滚动容器的 scroll（含 .v-main__scroller）
  document.addEventListener('scroll', onScroll, { passive: true, capture: true })
  scrollTargets.add(window)
  for (const t of collectScrollTargets(listRootRef.value)) {
    if (t === window) continue
    scrollTargets.add(t)
    t.addEventListener('scroll', onScroll, { passive: true })
  }
  window.addEventListener('scroll', onScroll, { passive: true })
}

function resolveObserverRoot(): Element | null {
  let el = loadMoreSentinel.value?.parentElement ?? listRootRef.value
  while (el) {
    const { overflowY } = getComputedStyle(el)
    if (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') {
      if (el.scrollHeight > el.clientHeight + 2) return el
    }
    el = el.parentElement
  }
  const mainScroller = document.querySelector('.v-main__scroller')
  if (
    mainScroller instanceof HTMLElement &&
    mainScroller.scrollHeight > mainScroller.clientHeight + 2
  ) {
    return mainScroller
  }
  return null
}

function onLoadMoreIntersect(entries: IntersectionObserverEntry[]) {
  if (!entries.some((e) => e.isIntersecting)) return
  if (!canLoadMore()) return
  void load(false)
}

function unbindLoadMoreObserver() {
  loadMoreObserver?.disconnect()
  loadMoreObserver = null
}

function bindLoadMoreObserver() {
  unbindLoadMoreObserver()
  const sentinel = loadMoreSentinel.value
  if (!sentinel || notMore.value || list.value.length === 0) return

  loadMoreObserver = new IntersectionObserver(onLoadMoreIntersect, {
    root: resolveObserverRoot(),
    threshold: 0,
    rootMargin: '0px 0px 240px 0px',
  })
  loadMoreObserver.observe(sentinel)
}

async function rebindInfiniteLoad() {
  await nextTick()
  bindScrollListeners()
  bindLoadMoreObserver()
  tryLoadMoreFromScroll()
}

async function load(reset = false) {
  if (reset) {
    list.value = []
    lastId.value = -1
    page.value = 1
    notMore.value = false
  }

  if (notMore.value) return false
  if (!reset && (loading.value || loadingMore.value)) return false

  const seq = ++loadSeq
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

    if (seq !== loadSeq) return false

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
      // 本页全被过滤：继续拉下一页，避免卡在空结果
      loading.value = false
      loadingMore.value = false
      return load(false)
    }

    return true
  } finally {
    if (seq === loadSeq) {
      loading.value = false
      loadingMore.value = false
      await rebindInfiniteLoad()
    }
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

onUnmounted(() => {
  loadSeq += 1
  unbindScrollListeners()
  unbindLoadMoreObserver()
})

defineExpose({ reload: () => load(true) })
</script>

<template>
  <div ref="listRootRef" class="feed-timeline-list">
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

    <div
      v-if="list.length > 0 && !notMore"
      ref="loadMoreSentinel"
      class="feed-timeline-list__more py-3 text-center"
    >
      <v-progress-circular
        v-if="loadingMore"
        indeterminate
        color="link"
        size="24"
        width="2"
      />
      <v-btn
        v-else
        variant="text"
        color="link"
        :disabled="loading"
        @click="load(false)"
      >
        加载更多
      </v-btn>
    </div>
    <div
      v-else-if="list.length > 0 && notMore"
      class="text-body-2 text-medium-emphasis text-center py-3"
    >
      没有更多了
    </div>
  </div>
</template>

<style scoped>
.feed-timeline-list {
  min-width: 0;
}

.feed-timeline-list__more {
  min-height: 48px;
}
</style>
