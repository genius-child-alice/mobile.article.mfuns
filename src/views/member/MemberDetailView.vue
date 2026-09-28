<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MemberCard from '../../components/MemberCard.vue'
import MemberUserArticlePanel from '../../components/MemberUserArticlePanel.vue'
import MemberUserPlaylistPanel from '../../components/MemberUserPlaylistPanel.vue'
import FeedTimelineList from '../../components/FeedTimelineList.vue'
import { fetchUserById, type MemberUserInfo } from '../../api/memberUserApi'
import { readMemberAuthState } from '../../auth/memberSession'
import {
  resetMemberPageTabs,
  setMemberPageTitle,
  setMemberPageUserId,
  useMemberPageTabs,
} from '../../composables/useMemberPageTabs'

const route = useRoute()
const router = useRouter()
const { tabIndex } = useMemberPageTabs()

const user = ref<MemberUserInfo | null>(null)
const loading = ref(true)

const userId = computed(() => {
  const raw = route.params.id
  const value = Array.isArray(raw) ? raw[0] : raw
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? n : 0
})

async function loadUser() {
  if (!userId.value) {
    router.replace('/404')
    return
  }
  loading.value = true
  try {
    const { token } = readMemberAuthState()
    const res = await fetchUserById(userId.value, token)
    if (res.code === 404) {
      router.replace('/404')
      return
    }
    if (res.code !== 1 || !res.data) {
      user.value = null
      return
    }
    user.value = res.data
    setMemberPageTitle(res.data.name ?? '用户')
    setMemberPageUserId(res.data.id)
  } finally {
    loading.value = false
  }
}

watch(userId, () => {
  tabIndex.value = 0
  void loadUser()
})

onMounted(() => {
  void loadUser()
})

onUnmounted(() => {
  resetMemberPageTabs()
})
</script>

<template>
  <div class="member-detail background-image">
    <v-progress-linear v-if="loading" indeterminate color="primary" />

    <template v-else-if="user">
      <v-window v-model="tabIndex" class="member-detail__window">
        <v-window-item :value="0">
          <v-container class="member-detail__panel py-2" fluid>
            <div class="member-detail__panel-body">
              <FeedTimelineList :user-id="user.id" :follow="false">
                <MemberCard :user="user" class="mb-2" />
              </FeedTimelineList>
            </div>
          </v-container>
        </v-window-item>

        <v-window-item :value="1">
          <v-container class="member-detail__panel py-2" fluid>
            <div class="member-detail__panel-body">
              <MemberUserArticlePanel :user-id="user.id" />
            </div>
          </v-container>
        </v-window-item>

        <v-window-item :value="2">
          <v-container class="member-detail__panel py-2" fluid>
            <div class="member-detail__panel-body">
              <MemberUserPlaylistPanel :user-id="user.id" />
            </div>
          </v-container>
        </v-window-item>
      </v-window>
    </template>
  </div>
</template>

<style scoped>
.member-detail {
  --member-detail-fill-height: calc(
    100dvh - var(--mfuns-app-bar-height, 48px) - var(--mfuns-bottom-nav-height, 0px) -
      env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px)
  );
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: none;
  min-height: var(--member-detail-fill-height);
}

.member-detail__window {
  flex: 1 1 auto;
  width: 100%;
  min-height: var(--member-detail-fill-height);
}

.member-detail__window :deep(.v-window__container) {
  width: 100%;
  min-height: var(--member-detail-fill-height);
  height: 100%;
}

.member-detail__window :deep(.v-window-item) {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: var(--member-detail-fill-height);
  height: 100%;
}

.member-detail__panel {
  box-sizing: border-box;
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  width: 100%;
  max-width: none !important;
  height: 100%;
  min-height: 0;
  --member-detail-edge: 0px;
  padding-inline: calc(var(--member-detail-edge) + env(safe-area-inset-left, 0px))
    calc(var(--member-detail-edge) + env(safe-area-inset-right, 0px)) !important;
}

.member-detail__panel-body {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
}

.member-detail__panel-body > :deep(*) {
  flex: 1 1 auto;
  width: 100%;
  min-height: 100%;
}

.member-detail__panel-body :deep(.pull-refresh) {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 100%;
}

.member-detail__panel-body :deep(.member-user-playlists) {
  flex: 1 1 auto;
  height: 100%;
  min-height: 100%;
}

@media (orientation: landscape) {
  .member-detail__panel {
    --member-detail-edge: 12px;
  }
}

@media (orientation: landscape) and (min-width: 600px) {
  .member-detail__panel {
    --member-detail-edge: 16px;
  }
}

@media (orientation: landscape) and (min-width: 960px) {
  .member-detail__panel {
    --member-detail-edge: 240px;
  }
}

</style>
