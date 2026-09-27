<script setup lang="ts">
import { computed, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useDisplay, useTheme } from 'vuetify'
import { MEMBER_SERVICE_ITEMS } from '../../constants/memberServices'
import { useMemberAuth } from '../../composables/useMemberAuth'
import { useMemberProfile } from '../../composables/useMemberProfile'
import { mfunsImageUrl } from '../../utils/mfunsImageUrl'

const router = useRouter()
const { xs } = useDisplay()
const theme = useTheme()
const { isLoggedIn } = useMemberAuth()
const {
  memberInfo,
  history,
  nekoCoin,
  fansCount,
  followCount,
  memberId,
  profileSubtitle,
  refreshMemberProfile,
} = useMemberProfile()

const guestIconColor = computed(() =>
  theme.global.current.value.dark ? 'high-emphasis' : 'medium-emphasis',
)

const avatarSrc = computed(() => mfunsImageUrl(memberInfo.value?.avatar, 96))

watch(
  isLoggedIn,
  (loggedIn) => {
    if (loggedIn) void refreshMemberProfile()
  },
  { immediate: true },
)

function formatCount(value: number): string {
  if (value >= 10000) return `${(value / 10000).toFixed(1)}万`
  return String(value)
}

function go(to: string) {
  router.push(to)
}

function goLoginRequired(to: string) {
  if (!isLoggedIn.value) {
    router.push('/member/login')
    return
  }
  router.push(to)
}

function historyCover(item: (typeof history.value)[number]): string {
  return mfunsImageUrl(item.resource_info?.cover, 200)
}
</script>

<template>
  <div class="member-page">
    <div class="member-view" :class="{ 'member-view--xs': xs }">
      <!-- 未登录（参考站 Member 页 v-main 分支） -->
      <div v-if="!isLoggedIn" class="member-guest">
        <div class="member-guest__icon d-flex justify-center mt-16">
          <v-icon icon="mdi-account-circle" size="80" :color="guestIconColor" />
        </div>
        <div class="member-guest__text d-flex flex-column align-center mt-6 text-center px-4">
          <div class="text-h6">你还没有登录呢</div>
          <div class="member-guest__hint">请登录或注册之后访问全部的功能</div>
          <v-btn
            class="mt-2"
            color="primary"
            elevation="0"
            :to="{ path: '/member/login' }"
          >
            登录/注册
          </v-btn>
        </div>
      </div>

      <!-- 已登录 -->
      <div v-else class="member-panel">
        <div
          class="member-profile-entry d-flex align-center px-4 py-4"
        role="button"
        tabindex="0"
        @click="go('/member/profile')"
        @keydown.enter="go('/member/profile')"
      >
        <v-avatar size="48" color="grey-lighten-2" class="me-3">
          <v-img v-if="avatarSrc" :src="avatarSrc" cover />
          <v-icon v-else icon="mdi-account" size="32" />
        </v-avatar>
        <div class="flex-grow-1 min-width-0">
          <div class="text-subtitle-1 font-weight-medium text-truncate">
            {{ memberInfo?.name || '个人资料' }}
          </div>
          <div class="text-caption text-medium-emphasis text-truncate">
            {{ profileSubtitle }}
          </div>
        </div>
        <v-icon icon="mdi-arrow-right" color="medium-emphasis" />
      </div>

      <v-divider />

      <v-card-text class="member-stats d-flex justify-space-between text-center py-4">
        <div class="member-stats__cell flex-fill">
          <div class="member-stats__value text-link">{{ formatCount(nekoCoin) }}</div>
          <div class="text-body-2 text-medium-emphasis">喵币</div>
        </div>
        <div
          class="member-stats__cell flex-fill"
          role="button"
          tabindex="0"
          @click="goLoginRequired(`/follow/fans/${memberId}`)"
        >
          <div class="member-stats__value text-link">{{ formatCount(fansCount) }}</div>
          <div class="text-body-2 text-medium-emphasis">粉丝</div>
        </div>
        <div
          class="member-stats__cell flex-fill"
          role="button"
          tabindex="0"
          @click="goLoginRequired(`/follow/follow/${memberId}`)"
        >
          <div class="member-stats__value text-link">{{ formatCount(followCount) }}</div>
          <div class="text-body-2 text-medium-emphasis">关注</div>
        </div>
      </v-card-text>

      <v-divider />

      <div class="member-history">
        <div class="d-flex align-center pa-4 py-3">
          <span>历史记录</span>
          <v-spacer />
          <RouterLink class="member-history__more link--text text-body-2" to="/member/history">
            查看全部
          </RouterLink>
        </div>
        <div
          v-if="history.length === 0"
          class="member-history__scroll px-4 pb-3 text-body-2 text-medium-emphasis"
        >
          暂无浏览记录
        </div>
        <div v-else class="member-history__row px-4 pb-3 d-flex">
          <div
            v-for="item in history"
            :key="item.id"
            class="member-history__card flex-shrink-0 me-4"
          >
            <v-card elevation="0" class="member-history__cover">
              <v-img
                v-if="historyCover(item)"
                :src="historyCover(item)"
                cover
                aspect-ratio="1.7778"
              />
              <div v-else class="member-history__cover-placeholder d-flex align-center justify-center">
                <v-icon icon="mdi-image-off-outline" color="medium-emphasis" />
              </div>
            </v-card>
            <div class="member-history__title text-body-2 mt-1">
              {{ item.resource_info?.title || '未命名' }}
            </div>
            <div class="text-body-2 text-medium-emphasis text-truncate">
              {{ item.resource_info?.user?.name || '' }}
            </div>
          </div>
        </div>
      </div>

      <v-divider />

      <v-card-text class="pb-6">
        <div class="mb-3">
          <span>推荐服务</span>
        </div>
        <v-row dense>
          <v-col
            v-for="item in MEMBER_SERVICE_ITEMS"
            :key="item.to"
            cols="3"
            class="member-service-col"
          >
            <button
              type="button"
              class="member-service-item"
              @click="goLoginRequired(item.to)"
            >
              <v-icon :icon="item.icon" :color="item.color" size="28" />
              <span class="member-service-item__label mt-2">{{ item.text }}</span>
            </button>
          </v-col>
        </v-row>
      </v-card-text>
      </div>
    </div>
  </div>
</template>

<style scoped>
.member-page {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: none;
  align-self: stretch;
  min-height: calc(
    100vh - var(--mfuns-app-bar-height, 48px) - var(--mfuns-bottom-nav-height, 0px) -
      env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px)
  );
  min-height: calc(
    100dvh - var(--mfuns-app-bar-height, 48px) - var(--mfuns-bottom-nav-height, 0px) -
      env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px)
  );
  background: rgb(var(--v-theme-surface));
}

.member-view {
  box-sizing: border-box;
  flex: 1 1 auto;
  width: 100%;
  max-width: none;
  margin-inline: 0;
  padding: 0;
  align-self: stretch;
}

.member-view--xs {
  padding-inline: 0;
}

.member-guest {
  box-sizing: border-box;
  width: 100%;
  padding-bottom: 24px;
}

.member-guest__hint {
  font-size: 1rem;
  font-weight: 400;
  line-height: 1.5;
  letter-spacing: 0.03125em;
  color: rgba(var(--v-theme-on-surface), var(--v-high-emphasis-opacity));
}

.member-guest__text .text-h6 {
  font-size: 1.25rem;
  font-weight: 500;
  line-height: 2rem;
  letter-spacing: 0.0125em;
  margin-bottom: 0;
}

.member-panel {
  width: 100%;
}

.member-profile-entry {
  cursor: pointer;
}

.member-profile-entry:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: -2px;
}

.text-link {
  color: rgb(var(--v-theme-link));
}

.member-stats__value {
  font-size: 1.2rem;
  font-weight: 700;
  line-height: 1.334;
  letter-spacing: 0;
}

.member-history__more {
  text-decoration: none;
  color: rgb(var(--v-theme-link));
}

.member-history__scroll {
  min-height: 48px;
}

.member-history__row {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.member-history__row::-webkit-scrollbar {
  display: none;
}

.member-history__card {
  width: 140px;
}

.member-history__cover {
  overflow: hidden;
  border-radius: 4px;
}

.member-history__cover-placeholder {
  aspect-ratio: 16 / 9;
  background: rgba(var(--v-theme-on-surface), 0.06);
}

.member-history__title {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 40px;
}

.member-service-col {
  display: flex;
  justify-content: center;
}

.member-service-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  padding: 8px 4px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: inherit;
  font: inherit;
}

.member-service-item__label {
  font-size: 0.8125rem;
  line-height: 1.25;
  text-align: center;
}

.member-service-item:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  border-radius: 4px;
}
</style>
