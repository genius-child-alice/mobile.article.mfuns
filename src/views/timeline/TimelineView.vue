<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useDisplay } from 'vuetify'
import FeedTimelineList from '../../components/FeedTimelineList.vue'
import FeedUserListPanel from '../../components/FeedUserListPanel.vue'
import { fetchFeedFollowUsers, type FeedFollowUserEntry } from '../../api/feedsApi'
import { readMemberAuthState } from '../../auth/memberSession'
import { useMemberAuth } from '../../composables/useMemberAuth'
import { useMemberProfile } from '../../composables/useMemberProfile'
import { useTimelineTabs } from '../../composables/useTimelineTabs'

const { mdAndUp, smAndDown } = useDisplay()
const { isLoggedIn } = useMemberAuth()
const { memberInfo, refreshMemberProfile } = useMemberProfile()
const { tabIndex } = useTimelineTabs()

const followUsers = ref<FeedFollowUserEntry[]>([])
const selectUserId = ref(0)

const followFeedUserId = ref(-1)
const followFeedFollow = ref(false)

function syncFollowFeedParams() {
  const memberId = memberInfo.value?.id
  if (!memberId) {
    followFeedUserId.value = -1
    return
  }
  if (selectUserId.value === 0) {
    followFeedUserId.value = memberId
    followFeedFollow.value = true
  } else {
    followFeedUserId.value = selectUserId.value
    followFeedFollow.value = false
  }
}

async function loadFollowUsers() {
  const { token, isLogin } = readMemberAuthState()
  if (!isLogin || !token) {
    followUsers.value = []
    return
  }
  const res = await fetchFeedFollowUsers(token)
  if (res.code === 1 && Array.isArray(res.data?.list)) {
    followUsers.value = res.data.list
  }
}

function onSelectUser(userId: number) {
  selectUserId.value = userId
  syncFollowFeedParams()
  tabIndex.value = 1
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

watch([isLoggedIn, memberInfo, selectUserId], () => {
  syncFollowFeedParams()
})

watch(isLoggedIn, (loggedIn) => {
  if (loggedIn) {
    void refreshMemberProfile()
    void loadFollowUsers()
  } else {
    followUsers.value = []
    selectUserId.value = 0
  }
})

watch(tabIndex, (idx) => {
  if (idx === 0) selectUserId.value = 0
})

onMounted(() => {
  if (isLoggedIn.value) {
    void refreshMemberProfile()
    void loadFollowUsers()
  }
  syncFollowFeedParams()
})
</script>

<template>
  <div class="timeline-page">
    <v-container fluid class="timeline-page__container py-2 px-2 px-sm-3">
      <v-row dense>
        <v-col cols="12" md="8" lg="7" offset-lg="1">
          <v-window v-model="tabIndex" class="timeline-page__window">
            <v-window-item :value="0">
              <FeedTimelineList new-reply />
              <v-btn
                class="timeline-page__fab"
                color="pink"
                size="large"
                elevation="4"
                :to="{ path: isLoggedIn ? '/create/feed' : '/member/login' }"
                aria-label="发布动态"
                icon
              >
                <v-icon icon="mdi-circle-edit-outline" />
              </v-btn>
            </v-window-item>

            <v-window-item v-if="isLoggedIn" :value="1">
              <FeedTimelineList
                v-if="followFeedUserId > 0"
                :key="`${followFeedUserId}-${followFeedFollow}`"
                :user-id="followFeedUserId"
                :follow="followFeedFollow"
              >
                <FeedUserListPanel
                  v-if="smAndDown"
                  v-model="selectUserId"
                  class="mb-2"
                  :users="followUsers"
                  @select="syncFollowFeedParams"
                />
              </FeedTimelineList>
            </v-window-item>
          </v-window>
        </v-col>

        <v-col v-if="mdAndUp" cols="12" md="4" lg="3">
          <FeedUserListPanel
            v-if="isLoggedIn"
            v-model="selectUserId"
            :users="followUsers"
            @select="onSelectUser"
          />
          <v-sheet
            v-else
            class="timeline-page__guest rounded-lg pa-5 py-10 text-center"
            elevation="0"
          >
            <div class="text-h6">你还没有登录呢</div>
            <div class="text-body-2 text-medium-emphasis mt-2">
              请登录或注册之后访问全部的功能
            </div>
            <v-btn
              class="mt-4"
              color="primary"
              elevation="0"
              :to="{ path: '/member/login' }"
            >
              登录/注册
            </v-btn>
          </v-sheet>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<style scoped>
.timeline-page {
  width: 100%;
  min-height: calc(
    100dvh - var(--mfuns-app-bar-height, 48px) - var(--mfuns-bottom-nav-height, 0px) -
      env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px)
  );
}

.timeline-page__window {
  background: transparent;
}

.timeline-page__guest {
  background: rgb(var(--v-theme-surface));
  position: sticky;
  top: calc(var(--mfuns-app-bar-height, 48px) + 8px);
}

.timeline-page__fab {
  position: fixed;
  right: 16px;
  bottom: calc(var(--mfuns-bottom-nav-height, 0px) + env(safe-area-inset-bottom, 0px) + 72px);
  z-index: 4;
}

@media (min-width: 960px) {
  .timeline-page__fab {
    bottom: calc(env(safe-area-inset-bottom, 0px) + 24px);
  }
}
</style>
