<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useDisplay } from 'vuetify'
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

const { xs } = useDisplay()
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
  <div class="blackroom-page background">
    <v-progress-linear v-if="loading" indeterminate color="primary" />

    <v-container
      v-else
      class="blackroom-page__container pt-0 pt-sm-1"
      :class="{ 'pa-0': xs }"
    >
      <!-- 信誉卡：对齐参考站 v-sheet > card-text + divider + 双列 -->
      <v-sheet class="mb-2" color="surface">
        <v-card-text class="d-flex pa-6">
          <div>
            <v-avatar color="primary" :size="40" class="mt-1">
              <v-img v-if="isLoggedIn && avatarSrc" :src="avatarSrc" cover />
              <v-icon v-else icon="mdi-account" />
            </v-avatar>
          </div>
          <div class="pl-2">
            <div class="text-h6">
              {{ memberInfo?.name || (isLoggedIn ? '个人资料' : '未登录') }}
            </div>
            <div class="text-medium-emphasis">账户评价：{{ userInfo }}</div>
          </div>
        </v-card-text>
        <v-divider />
        <v-card-text class="d-flex justify-space-around">
          <div class="text-medium-emphasis">
            当前信誉值：
            <span class="link--text text-body-1">{{ myList.credits ?? '—' }}</span>
          </div>
          <v-divider vertical />
          <div class="text-medium-emphasis">
            账户封禁次数：
            <span class="link--text text-body-1">{{ myList.count ?? '—' }}</span>
          </div>
        </v-card-text>
      </v-sheet>

      <div v-if="list.length === 0" class="text-center text-medium-emphasis py-10">
        暂无封禁记录
      </div>

      <v-row v-else dense>
        <v-col
          v-for="(item, index) in list"
          :key="item.info?.id ?? index"
          cols="12"
        >
          <v-sheet color="surface">
            <!-- px-4 = 16px，与 v-card-text 默认左右内边距一致 -->
            <div class="px-4">
              <FeedMemberInfoRow :data="cardMember(item)" to-user />
            </div>
            <v-card-text>
              <MfunsRichText :text="item.info?.info" :type="1" :max-line="10" />
            </v-card-text>
          </v-sheet>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<style scoped>
.blackroom-page.background {
  background-color: #eceff1;
  min-height: 100%;
  min-height: calc(
    100dvh - var(--mfuns-app-bar-height, 48px) - var(--mfuns-bottom-nav-height, 0px)
  );
}

html.mfuns-theme-dark .blackroom-page.background {
  background-color: rgb(var(--v-theme-background));
}

.blackroom-page__container {
  max-width: 1400px;
}
</style>
