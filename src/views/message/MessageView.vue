<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'
import { fetchMessageList, type MessageThreadItem } from '../../api/messageApi'
import { readMemberAuthState } from '../../auth/memberSession'
import FeedMemberInfoRow from '../../components/FeedMemberInfoRow.vue'
import { useMemberAuth } from '../../composables/useMemberAuth'
import { refreshNotifyCount, useNotifyCount } from '../../composables/useNotifyCount'
import { formatRelativeUnixTime } from '../../utils/mfunsTime'

const route = useRoute()
const router = useRouter()
const { mdAndUp } = useDisplay()
const { isLoggedIn } = useMemberAuth()
const { counts } = useNotifyCount()

const list = ref<MessageThreadItem[]>([])
const loading = ref(true)
let pollTimer: ReturnType<typeof setInterval> | null = null

/** 当前是否在消息子页（提及/点赞/通知/私信等） */
const hasChild = computed(() => route.path !== '/message' && route.path.startsWith('/message/'))

/** 横板始终显示列表；竖屏仅在消息中心首页显示列表 */
const showList = computed(() => mdAndUp.value || !hasChild.value)

/** 横板始终显示右侧内容区；竖屏进入子页时全宽显示子页 */
const showContent = computed(() => mdAndUp.value || hasChild.value)

const shortcuts = computed(() => [
  {
    key: 'mention',
    label: '提及',
    to: '/message/mention',
    icon: 'mdi-at',
    color: 'green',
    count: counts.value.mention ?? 0,
  },
  {
    key: 'comment',
    label: '回复',
    to: '/message/comment',
    icon: 'mdi-message',
    color: 'orange',
    count: counts.value.comment ?? 0,
  },
  {
    key: 'like',
    label: '点赞',
    to: '/message/like',
    icon: 'mdi-thumb-up',
    color: 'blue',
    count: counts.value.like ?? 0,
  },
  {
    key: 'notify',
    label: '通知',
    to: '/message/notify',
    icon: 'mdi-bell',
    color: 'pink',
    count: counts.value.system ?? 0,
  },
])

function requireAuth(): string | null {
  const { token, isLogin } = readMemberAuthState()
  if (!isLogin || !token) {
    router.replace('/member/login')
    return null
  }
  return token
}

async function loadList() {
  const token = requireAuth()
  if (!token) return
  try {
    const res = await fetchMessageList(token)
    if (res.code === 1 && Array.isArray(res.data)) {
      list.value = res.data.map((item) => ({
        ...item,
        time: formatRelativeUnixTime(item.last_msg?.data?.time),
      }))
    }
  } finally {
    loading.value = false
  }
}

async function refreshAll() {
  await Promise.all([loadList(), refreshNotifyCount()])
}

function openThread(item: MessageThreadItem) {
  const uid = item.user?.id
  if (!uid) return
  router.push(`/message/${uid}`)
}

function go(path: string) {
  router.push(path)
}

function isThreadActive(uid: number | undefined) {
  if (!uid) return false
  return route.path === `/message/${uid}`
}

onMounted(() => {
  if (!isLoggedIn.value) {
    router.replace('/member/login')
    return
  }
  void refreshAll()
  pollTimer = setInterval(() => {
    void refreshAll()
  }, 20_000)
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
})
</script>

<template>
  <!-- 参考 MessageList：左侧消息栏 + 右侧 nuxt-child -->
  <div class="message-page background-image pt-2">
    <div class="message-container">
      <div v-show="showList" class="message-list" :class="{ fill: !mdAndUp }">
        <v-card class="message-list-bar" elevation="0">
          <v-card-text>
            <v-row class="text-center" dense>
              <v-col
                v-for="item in shortcuts"
                :key="item.key"
                cols="3"
                v-ripple
                class="message-page__shortcut"
                @click="go(item.to)"
              >
                <v-badge
                  :content="item.count"
                  :model-value="item.count > 0"
                  color="red"
                  overlap
                >
                  <v-avatar :color="item.color" size="42">
                    <v-icon :icon="item.icon" color="white" />
                  </v-avatar>
                </v-badge>
                <div class="mt-1 text-body-2">{{ item.label }}</div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <v-progress-linear v-if="loading" indeterminate color="primary" />

        <div v-else-if="list.length === 0" class="message-page__empty d-flex align-center justify-center">
          你还没有私信消息哦
        </div>

        <div v-else class="message-list-user mt-2">
          <v-card elevation="0">
            <template v-for="(item, index) in list" :key="item.user?.id ?? index">
              <div
                v-ripple
                class="message-page__thread px-2"
                :class="{ 'message-page__thread--active': isThreadActive(item.user?.id) }"
                @click="openThread(item)"
              >
                <FeedMemberInfoRow
                  :data="{
                    id: item.user?.id,
                    name: item.user?.name,
                    avatar: item.user?.avatar,
                    name_color: item.user?.name_color,
                    level_id: item.user?.level_id,
                    badges: item.user?.badges,
                    info: item.last_msg?.data?.message || '',
                  }"
                >
                  <div class="d-flex flex-column align-end">
                    <span class="text-medium-emphasis text-caption">{{ item.time }}</span>
                    <v-badge
                      v-if="(item.no_read ?? 0) > 0"
                      :content="item.no_read"
                      color="red"
                      inline
                      class="mt-1"
                    />
                  </div>
                </FeedMemberInfoRow>
              </div>
              <v-divider />
            </template>
          </v-card>
        </div>
      </div>

      <!-- md+：右侧子页；竖屏进入子页时全宽 -->
      <div
        v-if="showContent"
        class="message-content"
        :class="{
          'message-content--pane': mdAndUp,
          'message-content--fill': !mdAndUp,
        }"
      >
        <RouterView v-slot="{ Component }">
          <component :is="Component" v-if="Component" class="message-content__view" />
          <div
            v-else-if="mdAndUp"
            class="message-content__placeholder d-flex align-center justify-center text-medium-emphasis"
          >
            选择一项消息查看
          </div>
        </RouterView>
      </div>
    </div>
  </div>
</template>

<style scoped>
.message-page {
  display: flex;
  flex-direction: column;
  height: calc(
    100vh - var(--mfuns-app-bar-height, 48px) - var(--mfuns-bottom-nav-height, 0px) -
      env(safe-area-inset-bottom, 0px)
  );
  box-sizing: border-box;
}

.message-container {
  display: flex;
  flex: 1;
  flex-direction: row;
  min-height: 0;
  overflow: hidden;
  width: 100%;
}

.message-list {
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  height: 100%;
  width: 400px;
  border-inline-end: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.message-list.fill {
  max-width: none !important;
  width: 100%;
  border-inline-end: none;
}

.message-list-bar {
  height: 100px;
  width: 100%;
  flex-shrink: 0;
}

.message-list-user {
  flex: 1;
  overflow-y: auto;
}

.message-content {
  flex: 1;
  height: 100%;
  min-width: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.message-content--fill {
  width: 100%;
}

.message-content__view {
  flex: 1;
  min-height: 0;
  height: 100%;
  overflow-y: auto;
}

.message-content__placeholder {
  flex: 1;
  width: 100%;
  height: 100%;
}

.message-page__shortcut {
  cursor: pointer;
  border-radius: 8px;
}

.message-page__thread {
  cursor: pointer;
}

.message-page__thread--active {
  background: rgba(var(--v-theme-primary), 0.08);
}

.message-page__empty {
  flex: 1;
  min-height: 200px;
  color: rgba(var(--v-theme-on-surface), 0.6);
}

@media screen and (max-width: 959px) {
  .message-list {
    width: 100% !important;
  }
}
</style>
