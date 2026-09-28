<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchFavoriteInfo, type FavoriteListItem } from '../../api/favoriteApi'
import { readMemberAuthState } from '../../auth/memberSession'

const route = useRoute()
const router = useRouter()

const favorite = ref<FavoriteListItem | null>(null)
const ownerName = ref('')
const loading = ref(true)
const error = ref('')

const favoriteId = computed(() => Number(route.params.id))

onMounted(async () => {
  if (!Number.isFinite(favoriteId.value) || favoriteId.value <= 0) {
    error.value = '无效的收藏夹'
    loading.value = false
    return
  }
  const token = readMemberAuthState().token
  try {
    const res = await fetchFavoriteInfo(favoriteId.value, token)
    if (res.code === 1 && res.data?.favorite) {
      favorite.value = res.data.favorite
      ownerName.value = res.data.user?.name ?? ''
    } else {
      error.value = res.msg || '收藏夹不存在或无权访问'
    }
  } finally {
    loading.value = false
  }
})

function goBack() {
  if (window.history.length > 1) router.back()
  else router.replace('/playlist/mylist')
}
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
    </v-app-bar>

    <div class="playlist-detail-page__main">
      <v-progress-linear v-if="loading" indeterminate color="primary" />
      <v-container v-else>
        <v-alert v-if="error" type="error" variant="tonal">{{ error }}</v-alert>
        <template v-else-if="favorite">
          <div class="text-body-2 text-medium-emphasis mb-2">
            {{ favorite.desc || '暂无描述' }}
          </div>
          <div class="text-caption text-medium-emphasis mb-4">
            {{ ownerName ? `创建者：${ownerName} · ` : '' }}{{ favorite.count ?? 0 }} 个内容
          </div>
          <div class="text-medium-emphasis text-center py-8">
            收藏内容列表稍后完善
          </div>
        </template>
      </v-container>
    </div>
  </div>
</template>

<style scoped>
.playlist-detail-page__main {
  padding-top: 48px;
}
</style>
