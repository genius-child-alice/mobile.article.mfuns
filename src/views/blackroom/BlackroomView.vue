<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  fetchBlackRoomList,
  fetchBlackRoomMyList,
  type BlackRoomItem,
  type BlackRoomMyListData,
} from '../../api/blackRoomApi'
import { readMemberAuthState } from '../../auth/memberSession'
import FeedMemberInfoRow from '../../components/FeedMemberInfoRow.vue'
import MfunsRichText from '../../components/MfunsRichText.vue'
import { useMemberAuth } from '../../composables/useMemberAuth'
import { useMemberProfile } from '../../composables/useMemberProfile'
import { formatRelativeUnixTime } from '../../utils/mfunsTime'
import { mfunsImageUrl } from '../../utils/mfunsImageUrl'

const { isLoggedIn } = useMemberAuth()
const { memberInfo, refreshMemberProfile } = useMemberProfile()

const myList = ref<BlackRoomMyListData>({})
const list = ref<BlackRoomItem[]>([])
const loading = ref(true)

const avatarSrc = computed(() => mfunsImageUrl(memberInfo.value?.avatar, 80))

const userInfo = computed(() => {
  const credits = myList.value.credits ?? 0
  if (credits >= 90) return '五星好市民'
  if (credits >= 80) return '信用优秀'
  if (credits >= 70) return '信用良好'
  if (credits >= 60) return '信用一般'
  if (credits >= 40) return '信用较低，已禁用部分功能'
  return '信用极差, 可以考虑重开了'
})

function banDays(item: BlackRoomItem): number {
  const created = item.info?.created_at
  const unblock = item.info?.unblock_time
  if (created == null || unblock == null) return 1
  let ms = (unblock - created) * 1000
  if (ms < 86_400_000) ms = 86_400_000
  return Math.floor(ms / 86_400_000)
}

function cardMember(item: BlackRoomItem) {
  const user = item.user ?? {}
  return {
    ...user,
    info: `${formatRelativeUnixTime(item.info?.created_at)} 封禁${banDays(item)}天`,
  }
}

onMounted(async () => {
  const token = readMemberAuthState().token
  if (isLoggedIn.value) await refreshMemberProfile()

  try {
    const [mine, rooms] = await Promise.all([
      fetchBlackRoomMyList(token),
      fetchBlackRoomList(token),
    ])
    if (mine.code === 1 && mine.data) myList.value = mine.data
    if (rooms.code === 1 && Array.isArray(rooms.data?.list)) {
      list.value = rooms.data.list
    }
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="blackroom-page">
    <v-progress-linear v-if="loading" indeterminate color="primary" />

    <template v-else>
      <v-container class="py-3" style="max-width: 960px">
        <v-sheet class="blackroom-page__credit pa-4 mb-4" rounded="lg" elevation="1">
          <div class="d-flex align-center">
            <v-avatar size="48" color="grey-lighten-2">
              <v-img v-if="isLoggedIn && avatarSrc" :src="avatarSrc" cover />
              <v-icon v-else icon="mdi-account" />
            </v-avatar>
            <div class="ms-3 min-width-0">
              <div class="text-subtitle-1 text-truncate">
                {{ memberInfo?.name || (isLoggedIn ? '个人资料' : '未登录') }}
              </div>
              <div class="text-body-2">账户评价：{{ userInfo }}</div>
            </div>
          </div>
          <div class="d-flex mt-4 text-body-2">
            <div class="flex-grow-1">
              当前信誉值
              <div class="text-h6">{{ myList.credits ?? '—' }}</div>
            </div>
            <div class="flex-grow-1">
              账户封禁次数
              <div class="text-h6">{{ myList.count ?? '—' }}</div>
            </div>
          </div>
        </v-sheet>

        <div v-if="list.length === 0" class="text-center text-medium-emphasis py-10">
          暂无封禁记录
        </div>

        <v-row dense>
          <v-col v-for="(item, index) in list" :key="item.info?.id ?? index" cols="12" md="6">
            <v-sheet class="blackroom-page__card pa-3 mb-2" rounded="lg" elevation="1">
              <FeedMemberInfoRow :data="cardMember(item)" to-user />
              <div class="mt-2">
                <MfunsRichText :text="item.info?.info" :type="1" :max-line="10" />
              </div>
            </v-sheet>
          </v-col>
        </v-row>
      </v-container>
    </template>
  </div>
</template>

<style scoped>
.blackroom-page {
  background: #eceff1;
  min-height: calc(
    100dvh - var(--mfuns-app-bar-height, 48px) - var(--mfuns-bottom-nav-height, 0px)
  );
}

html.mfuns-theme-dark .blackroom-page {
  background: rgb(var(--v-theme-background));
}

.blackroom-page__credit,
.blackroom-page__card {
  background: rgb(var(--v-theme-surface));
}
</style>
