<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useDisplay, useTheme } from 'vuetify'
import { MEMBER_SERVICE_ITEMS } from '../../constants/memberServices'
import { useMemberAuth } from '../../composables/useMemberAuth'

const router = useRouter()
const { xs } = useDisplay()
const theme = useTheme()
const { isLoggedIn } = useMemberAuth()

const guestIconColor = computed(() =>
  theme.global.current.value.dark ? 'high-emphasis' : 'medium-emphasis',
)

/** Placeholder until member API is wired. */
const nekoCoin = computed(() => 0)
const fansCount = computed(() => 0)
const followCount = computed(() => 0)
const memberId = computed(() => 0)

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
          class="member-profile-entry d-flex align-center px-4 pb-2"
        role="button"
        tabindex="0"
        @click="go('/member/profile')"
        @keydown.enter="go('/member/profile')"
      >
        <v-avatar size="48" color="grey-lighten-2" class="me-3">
          <v-icon icon="mdi-account" size="32" />
        </v-avatar>
        <div class="flex-grow-1 min-width-0">
          <div class="text-subtitle-1 font-weight-medium">个人资料</div>
          <div class="text-caption text-medium-emphasis">查看与编辑账号资料</div>
        </div>
        <v-icon icon="mdi-arrow-right" color="medium-emphasis" />
      </div>

      <v-divider />

      <v-card-text class="member-stats d-flex justify-space-between text-center py-4">
        <div class="member-stats__cell flex-fill">
          <div class="text-h6 font-weight-bold text-link">{{ formatCount(nekoCoin) }}</div>
          <div class="text-body-2 text-medium-emphasis">喵币</div>
        </div>
        <div
          class="member-stats__cell flex-fill"
          role="button"
          tabindex="0"
          @click="goLoginRequired(`/follow/fans/${memberId}`)"
        >
          <div class="text-h6 font-weight-bold text-link">{{ formatCount(fansCount) }}</div>
          <div class="text-body-2 text-medium-emphasis">粉丝</div>
        </div>
        <div
          class="member-stats__cell flex-fill"
          role="button"
          tabindex="0"
          @click="goLoginRequired(`/follow/follow/${memberId}`)"
        >
          <div class="text-h6 font-weight-bold text-link">{{ formatCount(followCount) }}</div>
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
        <div class="member-history__scroll px-4 pb-3 text-body-2 text-medium-emphasis">
          暂无浏览记录
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
  max-width: 1400px;
  margin-inline: auto;
  padding: 0;
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
  padding-top: 0;
}

.member-profile-entry:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: -2px;
}

.text-link {
  color: rgb(var(--v-theme-link));
}

.member-history__more {
  text-decoration: none;
  color: rgb(var(--v-theme-link));
}

.member-history__scroll {
  min-height: 48px;
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
