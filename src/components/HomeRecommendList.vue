<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'
import HomeContentCard from './HomeContentCard.vue'
import {
  fetchCategoryFeed,
  fetchRecommend,
  homeContentPath,
  type HomeContentItem,
} from '../api/homeApi'

const props = defineProps<{
  categoryId: number
}>()

const router = useRouter()
const { mdAndUp } = useDisplay()

const list = ref<HomeContentItem[]>([])
const page = ref(1)
const loading = ref(false)
const loadingMore = ref(false)
const notMore = ref(false)

function pageSize(): number {
  return mdAndUp.value ? 14 : 10
}

async function load(reset = false) {
  if (reset) {
    list.value = []
    page.value = 1
    notMore.value = false
  }
  if (notMore.value) return

  const isFirst = list.value.length === 0 || reset
  if (isFirst) loading.value = true
  else loadingMore.value = true

  try {
    const size = pageSize()
    let res

    if (props.categoryId === -1) {
      const requestSize = reset ? size : list.value.length + size
      res = await fetchRecommend(props.categoryId, requestSize)
      if (res.code === 1 && Array.isArray(res.data?.list)) {
        list.value = res.data.list
        notMore.value = res.data.list.length < requestSize
      } else {
        notMore.value = true
      }
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
  } finally {
    loading.value = false
    loadingMore.value = false
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

defineExpose({ reload: () => load(true) })
</script>

<template>
  <div class="home-recommend-list" :class="{ 'home-recommend-list--desktop': mdAndUp }">
    <div class="home-recommend-list__scroll scroll-y-style">
      <slot />

      <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-2" />

      <div v-else-if="list.length === 0" class="text-center text-medium-emphasis py-8">
        暂无内容
      </div>

      <v-row v-else dense class="ma-1">
        <v-col
          v-for="(item, index) in list"
          :key="`${item.id}-${index}`"
          cols="6"
          sm="4"
          md="4"
          lg="4"
          xl="3"
        >
          <HomeContentCard :data="item" @click="openItem(item)" />
        </v-col>
      </v-row>

      <div v-if="!loading && list.length > 0 && !notMore" class="py-3 text-center">
        <v-btn variant="text" color="link" :loading="loadingMore" @click="load()"> 加载更多 </v-btn>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-recommend-list {
  min-width: 0;
  position: relative;
}

.home-recommend-list--desktop {
  height: 100%;
}

.home-recommend-list--desktop .home-recommend-list__scroll {
  height: 100%;
  overflow-y: auto;
}
</style>
