<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'
import HomeContentCard from './HomeContentCard.vue'
import {
  fetchCategoryFeed,
  fetchRecommend,
  homeContentPath,
  type HomeContentItem,
} from '../api/homeApi'

const SCROLL_THRESHOLD_PX = 160

const props = defineProps<{
  categoryId: number
  /** 左侧分区 + 中间列表 + 右侧热门同时展示 */
  threeColumn?: boolean
}>()

const router = useRouter()
const { mdAndUp } = useDisplay()

const scrollRef = ref<HTMLElement | null>(null)
const isPortrait = ref(true)

/** CSS Grid 列数：三栏→3；竖屏→2；其余按宽度递进 */
const gridColumnCount = computed(() => {
  if (props.threeColumn) return 3
  if (isPortrait.value) return 2
  if (typeof window !== 'undefined' && window.innerWidth >= 1920) return 4
  return 3
})

const list = ref<HomeContentItem[]>([])
const page = ref(1)
const loading = ref(false)
const loadingMore = ref(false)
const notMore = ref(false)

let scrollTarget: HTMLElement | Window | null = null

function syncPortrait() {
  isPortrait.value = window.matchMedia('(orientation: portrait)').matches
}

function pageSize(): number {
  return mdAndUp.value ? 14 : 10
}

function canLoadMore(): boolean {
  return !loading.value && !loadingMore.value && !notMore.value
}

function findScrollTarget(start: HTMLElement | null): HTMLElement | Window {
  let el = start
  while (el) {
    const { overflowY } = getComputedStyle(el)
    const scrollable =
      overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay'
    if (scrollable && el.scrollHeight > el.clientHeight + 2) {
      return el
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

  return window
}

function isNearBottom(target: HTMLElement | Window): boolean {
  if (target === window) {
    const doc = document.documentElement
    return doc.scrollHeight - window.scrollY - window.innerHeight < SCROLL_THRESHOLD_PX
  }
  const el = target as HTMLElement
  return el.scrollHeight - el.scrollTop - el.clientHeight < SCROLL_THRESHOLD_PX
}

function tryLoadMoreFromScroll() {
  if (!canLoadMore()) return
  if (list.value.length === 0) return
  if (!scrollTarget) return
  if (!isNearBottom(scrollTarget)) return
  void load()
}

function onScroll() {
  tryLoadMoreFromScroll()
}

function bindScrollListener() {
  unbindScrollListener()
  scrollTarget = findScrollTarget(scrollRef.value)
  if (scrollTarget === window) {
    window.addEventListener('scroll', onScroll, { passive: true })
  } else {
    scrollTarget.addEventListener('scroll', onScroll, { passive: true })
  }
}

function unbindScrollListener() {
  if (!scrollTarget) return
  if (scrollTarget === window) {
    window.removeEventListener('scroll', onScroll)
  } else {
    scrollTarget.removeEventListener('scroll', onScroll)
  }
  scrollTarget = null
}

async function load(reset = false) {
  if (reset) {
    list.value = []
    page.value = 1
    notMore.value = false
  }
  if (notMore.value) return
  if (!reset && (loading.value || loadingMore.value)) return

  const isFirst = list.value.length === 0 || reset
  if (isFirst) loading.value = true
  else loadingMore.value = true

  try {
    const size = pageSize()
    let res

    if (props.categoryId === -1) {
      res = await fetchRecommend(props.categoryId, size)
      if (res.code !== 1 || !Array.isArray(res.data?.list)) {
        notMore.value = true
        return
      }
      const batch = res.data.list
      if (batch.length === 0) {
        notMore.value = true
        return
      }
      if (reset) list.value = []
      const known = new Set(list.value.map((item) => item.id))
      const novel = batch.filter((item) => !known.has(item.id))
      if (novel.length === 0) {
        notMore.value = true
        return
      }
      list.value.push(...novel)
      notMore.value = batch.length < size
      return
    }

    res = await fetchCategoryFeed(props.categoryId, page.value, size)

    if (res.code !== 1 || !Array.isArray(res.data?.list)) {
      notMore.value = true
      return
    }
    if (res.data.list.length === 0) {
      notMore.value = true
      return
    }

    if (reset) list.value = []
    list.value.push(...res.data.list)
    page.value += 1
    notMore.value = res.data.list.length < size
  } finally {
    loading.value = false
    loadingMore.value = false
    nextTick(() => {
      bindScrollListener()
      tryLoadMoreFromScroll()
    })
  }
}

function openItem(item: HomeContentItem) {
  router.push(homeContentPath(item))
}

watch(
  () => props.categoryId,
  () => {
    void load(true)
  },
  { immediate: true },
)

watch(mdAndUp, () => {
  nextTick(bindScrollListener)
})

onMounted(() => {
  syncPortrait()
  window.addEventListener('resize', syncPortrait, { passive: true })
  window.matchMedia('(orientation: portrait)').addEventListener('change', syncPortrait)
  nextTick(bindScrollListener)
})

onUnmounted(() => {
  unbindScrollListener()
  window.removeEventListener('resize', syncPortrait)
  window.matchMedia('(orientation: portrait)').removeEventListener('change', syncPortrait)
})

defineExpose({ reload: () => load(true) })
</script>

<template>
  <div class="home-recommend-list" :class="{ 'home-recommend-list--desktop': mdAndUp }">
    <div ref="scrollRef" class="home-recommend-list__scroll scroll-y-style">
      <slot />

      <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-2" />

      <div v-else-if="list.length === 0" class="text-center text-medium-emphasis py-8">
        暂无内容
      </div>

      <div
        v-else
        class="home-recommend-list__grid"
        :style="{ '--home-grid-cols': String(gridColumnCount) }"
      >
        <HomeContentCard
          v-for="(item, index) in list"
          :key="`${item.id}-${index}`"
          :data="item"
          @click="openItem(item)"
        />
      </div>

      <v-progress-linear
        v-if="loadingMore"
        indeterminate
        color="primary"
        class="my-2"
      />

      <div
        v-else-if="!loading && list.length > 0 && notMore"
        class="text-center text-medium-emphasis text-caption py-4"
      >
        没有更多了
      </div>

      <div class="home-recommend-list__scroll-tail" aria-hidden="true" />
    </div>
  </div>
</template>

<style scoped>
.home-recommend-list {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  position: relative;
  overflow: hidden;
}

.home-recommend-list__scroll {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

.home-recommend-list--desktop {
  height: 100%;
  min-height: 0;
}

.home-recommend-list--desktop .home-recommend-list__scroll {
  height: 100%;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
}

.home-recommend-list__grid {
  display: grid;
  /* minmax(0, 1fr) 才能随容器变窄，避免被图片/文字撑开 */
  grid-template-columns: repeat(var(--home-grid-cols, 2), minmax(0, 1fr));
  gap: 8px;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
  padding: 4px;
}

.home-recommend-list__grid > :deep(*) {
  min-width: 0;
  max-width: 100%;
}

.home-recommend-list__scroll-tail {
  height: 1px;
}
</style>
