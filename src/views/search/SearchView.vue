<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import ArticleContentBar from '../../components/ArticleContentBar.vue'
import FeedMemberInfoRow from '../../components/FeedMemberInfoRow.vue'
import {
  filterHomeArticleItems,
  homeContentPath,
  type HomeContentItem,
} from '../../api/homeApi'
import {
  searchResource,
  searchUsers,
  type SearchResourceType,
} from '../../api/searchApi'
import type { MemberUserInfo } from '../../api/memberUserApi'
import type { MemberHistoryResource } from '../../api/memberUserApi'
import { readMemberAuthState } from '../../auth/memberSession'
import {
  addSearchHistory,
  clearSearchHistory,
  setActiveSearch,
  useSearchBar,
} from '../../composables/useSearchBar'

const router = useRouter()
const { activeSearch, history } = useSearchBar()

const tab = ref(0)

const resourceList = ref<HomeContentItem[]>([])
const userList = ref<MemberUserInfo[]>([])
const page = ref(1)
const loading = ref(false)
const loadingMore = ref(false)
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

function isUserTab() {
  return tab.value === 2
}

async function loadResource(reset: boolean, type: SearchResourceType) {
  if (!activeSearch.value) return
  if (reset) {
    page.value = 1
    notMore.value = false
    loading.value = true
  } else {
    if (loadingMore.value || notMore.value) return
    loadingMore.value = true
  }
  try {
    const { token } = readMemberAuthState()
    const res = await searchResource(activeSearch.value, page.value, type, 20, 'all', token)
    let batch: HomeContentItem[] = []
    if (res.code === 1 && Array.isArray(res.data?.list)) {
      batch = type === -1 ? filterHomeArticleItems(res.data.list) : res.data.list
    }
    if (reset) resourceList.value = batch
    else resourceList.value.push(...batch)
    if (!batch.length) notMore.value = true
    else page.value += 1
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

async function loadUsers(reset: boolean) {
  if (!activeSearch.value) return
  if (reset) {
    page.value = 1
    notMore.value = false
    loading.value = true
  } else {
    if (loadingMore.value || notMore.value) return
    loadingMore.value = true
  }
  try {
    const { token } = readMemberAuthState()
    const res = await searchUsers(activeSearch.value, page.value, token)
    const batch = res.code === 1 && Array.isArray(res.data?.list) ? res.data.list : []
    if (reset) userList.value = batch
    else userList.value.push(...batch)
    if (!batch.length) notMore.value = true
    else page.value += 1
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

async function reload() {
  resourceList.value = []
  userList.value = []
  if (!activeSearch.value) return
  if (isUserTab()) await loadUsers(true)
  else await loadResource(true, tab.value === 1 ? 0 : -1)
}

function onHistoryClick(text: string) {
  addSearchHistory(text)
  setActiveSearch(text)
}

function onClearHistory() {
  clearSearchHistory()
}

function onScroll() {
  const doc = document.documentElement
  if (doc.scrollHeight - window.scrollY - window.innerHeight > 200) return
  if (isUserTab()) void loadUsers(false)
  else void loadResource(false, tab.value === 1 ? 0 : -1)
}

watch(activeSearch, () => {
  tab.value = 0
  void reload()
})

watch(tab, () => {
  void reload()
})

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  if (activeSearch.value) void reload()
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
})
</script>

<template>
  <div class="search-page background">
    <template v-if="!activeSearch">
      <v-container class="pt-3">
        <div class="d-flex align-center mb-2">
          <span class="text-subtitle-1">搜索历史</span>
          <v-spacer />
          <span class="text-disabled search-page__clear" @click="onClearHistory">清除搜索历史</span>
        </div>
        <div class="d-flex flex-wrap">
          <v-chip
            v-for="(item, i) in history"
            :key="`${item}-${i}`"
            class="me-1 mb-1"
            label
            @click="onHistoryClick(item)"
          >
            {{ item }}
          </v-chip>
        </div>
        <div v-if="history.length === 0" class="text-medium-emphasis py-8 text-center">
          暂无搜索历史
        </div>
      </v-container>
    </template>

    <template v-else>
      <v-tabs v-model="tab" color="link" height="40">
        <v-tab :value="0">综合</v-tab>
        <v-tab :value="1">文章</v-tab>
        <v-tab :value="2">用户</v-tab>
      </v-tabs>
      <v-divider />

      <v-progress-linear v-if="loading" indeterminate color="primary" />

      <div v-if="!isUserTab()" class="pa-1 px-4">
        <ArticleContentBar
          v-for="item in resourceList"
          :key="item.id"
          class="mb-1"
          :data="toBarData(item)"
          @click="router.push(homeContentPath(item))"
        />
        <div
          v-if="!loading && resourceList.length === 0"
          class="text-center text-medium-emphasis py-12"
        >
          暂无结果
        </div>
      </div>

      <div v-else class="pa-md-1 px-md-4">
        <FeedMemberInfoRow
          v-for="user in userList"
          :key="user.id"
          class="py-2"
          to-user
          :data="{
            id: user.id,
            name: user.name,
            avatar: user.avatar,
            name_color: user.name_color,
            level_id: user.level_id,
            badges: user.badges,
          }"
        />
        <div
          v-if="!loading && userList.length === 0"
          class="text-center text-medium-emphasis py-12"
        >
          暂无结果
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.search-page__clear {
  cursor: pointer;
  font-size: 0.875rem;
}
</style>
