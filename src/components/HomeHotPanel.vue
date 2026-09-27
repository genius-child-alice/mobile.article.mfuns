<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import ArticleContentBar from './ArticleContentBar.vue'
import {
  fetchLeaderboardHot,
  homeContentPath,
  type HomeContentItem,
} from '../api/homeApi'
import type { MemberHistoryResource } from '../api/memberUserApi'

withDefaults(
  defineProps<{
    /** md+ 侧栏 HotList2 */
    compact?: boolean
  }>(),
  { compact: false },
)

const router = useRouter()

const list = ref<HomeContentItem[]>([])
const loading = ref(false)

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

async function load() {
  loading.value = true
  try {
    const res = await fetchLeaderboardHot()
    if (res.code === 1 && Array.isArray(res.data)) {
      list.value = res.data
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void load()
})
</script>

<template>
  <v-sheet
    class="home-hot-panel background-image"
    :class="{ 'home-hot-panel--sidebar scroll-y-style': compact }"
    elevation="0"
  >
    <v-container class="d-flex px-3 py-2 align-center" :fluid="compact">
      <span>当前热门榜</span>
      <v-spacer />
      <RouterLink class="link--text d-flex align-center py-2" to="/leaderboard">
        全站排行
        <v-icon icon="mdi-chevron-right" color="link" />
      </RouterLink>
    </v-container>
    <v-divider />
    <v-progress-linear v-if="loading" indeterminate color="primary" />
    <v-container v-else :fluid="compact">
      <v-row dense>
        <v-col
          v-for="(item, index) in list"
          :key="item.id"
          cols="12"
          :md="compact ? 12 : 6"
        >
          <ArticleContentBar
            :data="toBarData(item)"
            :rank="index + 1"
            @click="router.push(homeContentPath(item))"
          />
        </v-col>
      </v-row>
    </v-container>
  </v-sheet>
</template>

<style scoped>
.home-hot-panel {
  background: transparent;
}

.home-hot-panel--sidebar {
  height: 100%;
  overflow-y: auto;
}
</style>
