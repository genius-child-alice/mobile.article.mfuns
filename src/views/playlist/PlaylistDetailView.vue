<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  fetchFavoriteInfo,
  fetchFavoriteItems,
  type FavoriteContentItem,
  type FavoriteListItem,
} from '../../api/favoriteApi'
import { MFUNS_ARTICLE_RESOURCE_TYPE } from '../../api/memberUserApi'
import { readMemberAuthState } from '../../auth/memberSession'
import ArticleContentBar from '../../components/ArticleContentBar.vue'

const route = useRoute()
const router = useRouter()

const favorite = ref<FavoriteListItem | null>(null)
const ownerName = ref('')
const list = ref<FavoriteContentItem[]>([])
const loading = ref(true)
const loadingMore = ref(false)
const notMore = ref(false)
const lastId = ref(0)
const error = ref('')

const favoriteId = computed(() => Number(route.params.id))

/** 文章类：type / resource_type / resource_info.type === 0 */
function isArticleItem(item: FavoriteContentItem): boolean {
  const t = item.type ?? item.resource_type ?? item.resource_info?.type
  return t === MFUNS_ARTICLE_RESOURCE_TYPE
}

function contentBarData(item: FavoriteContentItem) {
  if (item.resource_info) return item.resource_info
  return item
}

function contentKey(item: FavoriteContentItem, index: number) {
  return item.favorite_id ?? item.id ?? index
}

function openItem(item: FavoriteContentItem) {
  const id = item.resource_info?.id ?? item.id
  if (!id) return
  router.push(`/article/${id}`)
}

async function loadInfo() {
  const token = readMemberAuthState().token
  const res = await fetchFavoriteInfo(favoriteId.value, token)
  if (res.code === 1 && res.data?.favorite) {
    favorite.value = res.data.favorite
    ownerName.value = res.data.user?.name ?? ''
    return true
  }
  error.value = res.msg || '收藏夹不存在或无权访问'
  return false
}

async function loadList(reset = false) {
  if (reset) {
    list.value = []
    lastId.value = 0
    notMore.value = false
  }
  if (notMore.value) return

  const token = readMemberAuthState().token
  const isFirst = list.value.length === 0 || reset
  if (isFirst) loading.value = true
  else loadingMore.value = true

  try {
    const res = await fetchFavoriteItems(favoriteId.value, lastId.value, token)
    if (res.code !== 1 || !Array.isArray(res.data?.list)) {
      notMore.value = true
      return
    }

    const raw = res.data.list
    if (raw.length === 0) {
      notMore.value = true
      return
    }

    const last = raw[raw.length - 1]
    if (last.favorite_id != null) lastId.value = last.favorite_id
    else if (last.id != null) lastId.value = last.id
    else notMore.value = true

    const articles = raw.filter(isArticleItem)
    list.value.push(...articles)

    // 本页全被滤掉时继续拉，避免文章夹看起来“空”
    if (articles.length === 0 && !notMore.value) {
      loading.value = false
      loadingMore.value = false
      await loadList(false)
    }
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

function goBack() {
  if (window.history.length > 1) router.back()
  else router.replace('/playlist/mylist')
}

function share() {
  const url = window.location.href
  void navigator.clipboard?.writeText(url)
}

onMounted(async () => {
  if (!Number.isFinite(favoriteId.value) || favoriteId.value <= 0) {
    error.value = '无效的收藏夹'
    loading.value = false
    return
  }
  const ok = await loadInfo()
  if (ok) await loadList(true)
  else loading.value = false
})
</script>

<template>
  <div class="playlist-detail-page">
    <v-app-bar
      fixed
      location="top"
      color="primary"
      density="compact"
      elevation="4"
      class="text-white"
    >
      <v-btn icon variant="text" aria-label="返回" @click="goBack">
        <v-icon icon="mdi-arrow-left" />
      </v-btn>
      <v-toolbar-title>{{ favorite?.name || '收藏夹' }}</v-toolbar-title>
      <v-spacer />
      <v-btn variant="text" color="white" @click="share">分享</v-btn>
    </v-app-bar>

    <div class="playlist-detail-page__main">
      <v-progress-linear v-if="loading" indeterminate color="primary" />
      <template v-else>
        <v-alert v-if="error" class="ma-3" type="error" variant="tonal">{{ error }}</v-alert>
        <template v-else-if="favorite">
          <div class="px-4 pt-3 pb-2">
            <div class="text-body-2 text-medium-emphasis mb-1">
              {{ favorite.desc || '暂无描述' }}
            </div>
            <div class="text-caption text-medium-emphasis">
              {{ ownerName ? `创建者：${ownerName} · ` : '' }}{{ favorite.count ?? 0 }} 个内容
            </div>
          </div>
          <v-divider />

          <div
            v-if="list.length === 0"
            class="text-medium-emphasis text-center py-10"
          >
            暂无文章内容
          </div>

          <div v-else class="playlist-detail-page__grid">
            <ArticleContentBar
              v-for="(item, index) in list"
              :key="contentKey(item, index)"
              class="playlist-detail-page__item"
              :data="contentBarData(item)"
              @click="openItem(item)"
            />
          </div>

          <div v-if="list.length > 0 && !notMore" class="pa-4 text-center">
            <v-btn
              variant="text"
              color="link"
              :loading="loadingMore"
              @click="loadList(false)"
            >
              加载更多
            </v-btn>
          </div>
          <div
            v-else-if="list.length > 0 && notMore"
            class="text-caption text-medium-emphasis text-center py-3"
          >
            没有更多了
          </div>
        </template>
      </template>
    </div>
  </div>
</template>

<style scoped>
.playlist-detail-page__main {
  padding-top: 48px;
}

.playlist-detail-page__grid {
  box-sizing: border-box;
  width: 100%;
  padding: 8px;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 8px;
}

@media (min-width: 600px) {
  .playlist-detail-page__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.playlist-detail-page__item {
  min-width: 0;
}
</style>
