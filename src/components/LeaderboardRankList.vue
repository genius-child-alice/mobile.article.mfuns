<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import ArticleContentBar from './ArticleContentBar.vue'
import {
  fetchLeaderboardByCategory,
  fetchLeaderboardSite,
  homeContentPath,
  type HomeCategory,
  type HomeContentItem,
} from '../api/homeApi'
import type { MemberHistoryResource } from '../api/memberUserApi'

const props = defineProps<{
  /** true=全站 /leaderboards/site */
  site?: boolean
  cate?: HomeCategory | null
}>()

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
    const res = props.site
      ? await fetchLeaderboardSite()
      : props.cate?.id
        ? await fetchLeaderboardByCategory(props.cate.id)
        : null
    if (res && res.code === 1 && Array.isArray(res.data)) {
      list.value = res.data
    } else {
      list.value = []
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void load()
})

watch(
  () => [props.site, props.cate?.id] as const,
  () => {
    void load()
  },
)

defineExpose({ reload: load })
</script>

<template>
  <!-- 参考 RankList：cols 12 sm 6 + ContentBar rank -->
  <div class="leaderboard-rank-list">
    <v-progress-linear v-if="loading" indeterminate color="primary" />
    <v-container v-else class="pt-2" fluid>
      <v-row dense>
        <v-col v-for="(item, index) in list" :key="item.id" cols="12" sm="6">
          <ArticleContentBar
            :data="toBarData(item)"
            :rank="index + 1"
            @click="router.push(homeContentPath(item))"
          />
        </v-col>
      </v-row>
      <div
        v-if="!loading && list.length === 0"
        class="text-center text-medium-emphasis py-12"
      >
        暂无排行数据
      </div>
    </v-container>
  </div>
</template>
