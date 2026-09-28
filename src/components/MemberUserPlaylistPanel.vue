<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { fetchMyFavoriteLists, type FavoriteListItem } from '../api/favoriteApi'
import { readMemberAuthState } from '../auth/memberSession'

const props = defineProps<{
  userId: number
}>()

const router = useRouter()
const list = ref<FavoriteListItem[]>([])
const loading = ref(false)

function listStatus(status?: number): string {
  switch (status) {
    case 1:
      return '公开'
    case 2:
      return '私有'
    case 3:
      return '仅链接访问'
    default:
      return ''
  }
}

async function load() {
  if (!props.userId) return
  loading.value = true
  try {
    const { token } = readMemberAuthState()
    const res = await fetchMyFavoriteLists(props.userId, token ?? '')
    if (res.code === 1 && Array.isArray(res.data?.list)) {
      list.value = res.data.list.filter((item) => item.status === 1)
    } else {
      list.value = []
    }
  } finally {
    loading.value = false
  }
}

watch(
  () => props.userId,
  () => {
    void load()
  },
  { immediate: true },
)
</script>

<template>
  <div class="member-user-playlists">
    <v-progress-linear v-if="loading" indeterminate color="primary" />
    <v-list v-else-if="list.length" lines="two" class="bg-transparent">
      <v-list-item
        v-for="item in list"
        :key="item.id"
        :title="item.name"
        :subtitle="item.desc || `${item.count ?? 0} 个内容 · ${listStatus(item.status)}`"
        @click="router.push(`/playlist/${item.id}`)"
      />
    </v-list>
    <div v-else class="text-center text-medium-emphasis py-12">暂无公开收藏夹</div>
  </div>
</template>
