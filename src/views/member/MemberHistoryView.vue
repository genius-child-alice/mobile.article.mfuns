<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import ArticleContentBar from '../../components/ArticleContentBar.vue'
import {
  fetchMemberHistory,
  MFUNS_ARTICLE_RESOURCE_TYPE,
  type MemberHistoryItem,
} from '../../api/memberUserApi'
import { readMemberAuthState } from '../../auth/memberSession'
import { useMemberAuth } from '../../composables/useMemberAuth'

const router = useRouter()
const { isLoggedIn } = useMemberAuth()

const list = ref<MemberHistoryItem[]>([])
const loading = ref(false)
const loadingMore = ref(false)
const notMore = ref(false)
const lastStartTime = ref(0)

async function loadHistory(reset = false) {
  if (!isLoggedIn.value) {
    router.replace('/member/login')
    return
  }

  const { token } = readMemberAuthState()
  if (!token) {
    router.replace('/member/login')
    return
  }

  if (reset) {
    list.value = []
    lastStartTime.value = 0
    notMore.value = false
  }

  if (notMore.value) return

  const isFirst = list.value.length === 0 || reset
  if (isFirst) loading.value = true
  else loadingMore.value = true

  try {
    const res = await fetchMemberHistory(
      token,
      lastStartTime.value,
      MFUNS_ARTICLE_RESOURCE_TYPE,
    )

    if (res.code !== 1 || !Array.isArray(res.data)) {
      notMore.value = true
      return
    }

    if (res.data.length === 0) {
      notMore.value = true
      return
    }

    list.value.push(...res.data)
    const last = res.data[res.data.length - 1]
    if (last.time != null) {
      lastStartTime.value = last.time
    } else {
      notMore.value = true
    }
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

function openItem(item: MemberHistoryItem) {
  const id = item.resource_info?.id
  if (!id) return
  router.push(`/article/${id}`)
}

onMounted(() => {
  void loadHistory(true)
})
</script>

<template>
  <div class="member-history-page">
    <v-progress-linear v-if="loading" indeterminate color="primary" />

    <div
      v-else-if="list.length === 0"
      class="member-history-page__empty px-4 py-8 text-body-2 text-medium-emphasis text-center"
    >
      暂无浏览记录
    </div>

    <div v-else class="member-history-page__grid">
      <ArticleContentBar
        v-for="item in list"
        :key="item.id"
        class="member-history-page__item"
        :data="item.resource_info"
        @click="openItem(item)"
      />
    </div>

    <div v-if="!loading && list.length > 0 && !notMore" class="pa-4 text-center">
      <v-btn variant="text" color="link" :loading="loadingMore" @click="loadHistory()">
        加载更多
      </v-btn>
    </div>
  </div>
</template>

<style scoped>
.member-history-page {
  width: 100%;
  min-height: calc(
    100dvh - var(--mfuns-app-bar-height, 48px) - var(--mfuns-bottom-nav-height, 0px) -
      env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px)
  );
  background: rgb(var(--v-theme-surface));
}

.member-history-page__grid {
  box-sizing: border-box;
  width: 100%;
  padding: 8px;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 8px;
}

/* 与参考 ContentBarList：cols=12 sm=6 */
@media (min-width: 600px) {
  .member-history-page__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (orientation: landscape) and (min-width: 480px) {
  .member-history-page__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.member-history-page__item {
  min-width: 0;
}
</style>
