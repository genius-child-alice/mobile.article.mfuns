<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { fetchSignRankToday, type SignRankEntry } from '../../api/signApi'
import { readMemberAuthState } from '../../auth/memberSession'
import FeedMemberInfoRow from '../../components/FeedMemberInfoRow.vue'
import { formatRelativeUnixTime } from '../../utils/mfunsTime'

const list = ref<SignRankEntry[]>([])
const loading = ref(true)

onMounted(async () => {
  const token = readMemberAuthState().token
  try {
    const res = await fetchSignRankToday(token)
    if (res.code === 1) {
      const data = res.data
      if (Array.isArray(data)) list.value = data
      else if (data && Array.isArray(data.list)) list.value = data.list
    }
  } finally {
    loading.value = false
  }
})

function rowData(item: SignRankEntry) {
  const user = item.user ?? {}
  const relative = formatRelativeUnixTime(item.time) || '刚刚'
  return {
    ...user,
    info: `${relative}签到，累计签到${item.count ?? 0}天`,
  }
}
</script>

<template>
  <div class="member-sign-rank-page">
    <v-progress-linear v-if="loading" indeterminate color="primary" />
    <v-list v-else bg-color="transparent">
      <v-list-item v-for="(item, index) in list" :key="item.user?.id ?? index">
        <FeedMemberInfoRow :data="rowData(item)" to-user>
          <span class="text-caption text-medium-emphasis">第 {{ index + 1 }} 名</span>
        </FeedMemberInfoRow>
      </v-list-item>
      <div
        v-if="!loading && list.length === 0"
        class="text-center text-medium-emphasis py-10"
      >
        暂无排行数据
      </div>
    </v-list>
  </div>
</template>
