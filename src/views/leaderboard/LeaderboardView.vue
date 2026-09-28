<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import LeaderboardRankList from '../../components/LeaderboardRankList.vue'
import { fetchAllCategories } from '../../api/homeApi'
import {
  resetLeaderboardTabs,
  setLeaderboardCategories,
  useLeaderboardTabs,
} from '../../composables/useLeaderboardTabs'

const { tabIndex, categories } = useLeaderboardTabs()

onMounted(async () => {
  try {
    const res = await fetchAllCategories()
    if (res.code === 1 && Array.isArray(res.data)) {
      setLeaderboardCategories(res.data)
    }
  } catch {
    /* keep default 全站排行 tab */
  }
})

onUnmounted(() => {
  resetLeaderboardTabs()
})
</script>

<template>
  <!-- 参考 LeaderboardAll：顶栏 Tab 由 AppBar 驱动，此处仅内容区 -->
  <div class="leaderboard-page background-image">
    <v-window v-model="tabIndex">
      <v-window-item :value="0">
        <LeaderboardRankList site />
      </v-window-item>
      <v-window-item
        v-for="(cate, i) in categories"
        :key="cate.id"
        :value="i + 1"
      >
        <LeaderboardRankList :cate="cate" />
      </v-window-item>
    </v-window>
  </div>
</template>
