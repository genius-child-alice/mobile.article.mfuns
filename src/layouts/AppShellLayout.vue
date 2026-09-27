<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import MfunsAppBar from '../components/MfunsAppBar.vue'
import MainNavSideRail from '../components/MainNavSideRail.vue'
import { useMfunsShellLayout } from '../composables/useMfunsShellLayout'
import { resolveAppBarConfig } from '../router/resolveAppBar'

const route = useRoute()

const showBottomNav = computed(() => Boolean(route.meta.showBottomNav))
const appBarConfig = computed(() => resolveAppBarConfig(route.path))

const {
  showMainNavBottom,
  showMainNavLeft,
  showHomeExtensionTabs,
  showHomeInlineTabs,
  showBackExtensionTabs,
  appBarExtended,
  shellStyle,
  mdAndUp,
} = useMfunsShellLayout({
  appBar: appBarConfig,
  showBottomNav,
})

const bottomNavValue = computed(() => {
  const p = route.path
  if (p === '/home' || p === '/') return 'home'
  if (p.startsWith('/timeline')) return 'timeline'
  if (p === '/member') return 'member'
  return undefined
})
</script>

<template>
  <v-app
    class="global-app background"
    :class="{ 'mfuns-app--left-rail': showMainNavLeft }"
    :style="shellStyle"
  >
    <MainNavSideRail v-if="showMainNavLeft" />

    <MfunsAppBar
      :config="appBarConfig"
      :extended="appBarExtended"
      :show-home-extension-tabs="showHomeExtensionTabs"
      :show-home-inline-tabs="showHomeInlineTabs"
      :show-back-extension-tabs="showBackExtensionTabs"
    />

    <v-main class="mfuns-main background-image" :class="{ 'mfuns-main--wide': mdAndUp }">
      <div class="mfuns-main__inner">
        <router-view />
      </div>
    </v-main>

    <v-bottom-navigation
      v-if="showMainNavBottom"
      app
      grow
      shift
      color="link"
      class="bottom-bar mfuns-bottom-nav"
      :model-value="bottomNavValue"
    >
      <v-btn value="home" :to="{ path: '/home' }">
        <span>首页</span>
        <v-icon icon="mdi-home-variant-outline" />
      </v-btn>
      <v-btn value="timeline" :to="{ path: '/timeline' }">
        <span>动态</span>
        <v-icon icon="mdi-creation" />
      </v-btn>
      <v-btn value="member" :to="{ path: '/member' }">
        <span>我的</span>
        <v-icon icon="mdi-account-outline" />
      </v-btn>
    </v-bottom-navigation>
  </v-app>
</template>

<style scoped>
.mfuns-app--left-rail :deep(.v-app-bar) {
  left: var(--mfuns-left-nav-width, 74px) !important;
  width: calc(100% - var(--mfuns-left-nav-width, 74px)) !important;
  max-width: calc(100% - var(--mfuns-left-nav-width, 74px)) !important;
  right: auto !important;
}

.mfuns-main {
  --v-layout-top: var(--mfuns-app-bar-height, 48px);
}

.mfuns-main__inner {
  min-height: calc(
    100vh - var(--mfuns-app-bar-height, 48px) - var(--mfuns-bottom-nav-height, 0px) -
      env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px)
  );
  min-height: calc(
    100dvh - var(--mfuns-app-bar-height, 48px) - var(--mfuns-bottom-nav-height, 0px) -
      env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px)
  );
  padding-inline: env(safe-area-inset-right, 0px);
}

.mfuns-app--left-rail .mfuns-main__inner {
  padding-left: 0;
}

.mfuns-main--wide .mfuns-main__inner {
  max-width: 960px;
  margin-inline: auto;
  width: 100%;
}

.mfuns-bottom-nav {
  --mfuns-bottom-nav-height: 56px;
  height: calc(56px + env(safe-area-inset-bottom, 0px)) !important;
  min-height: calc(56px + env(safe-area-inset-bottom, 0px));
  padding-bottom: env(safe-area-inset-bottom, 0px);
  padding-inline: env(safe-area-inset-left, 0px) env(safe-area-inset-right, 0px);
}
</style>
