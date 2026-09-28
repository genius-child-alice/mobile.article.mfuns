<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import MainNavBottomBar from '../components/MainNavBottomBar.vue'
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
  showMemberPageInlineTabs,
  appBarExtended,
  shellStyle,
  mdAndUp,
} = useMfunsShellLayout({
  appBar: appBarConfig,
  showBottomNav,
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
      :show-member-page-inline-tabs="showMemberPageInlineTabs"
    />

    <v-main
      class="mfuns-main background-image"
      :class="{
        'mfuns-main--wide':
          mdAndUp && !route.meta.shellFullBleed && !route.meta.shellStretchMain,
        'mfuns-main--full-bleed': route.meta.shellFullBleed,
        'mfuns-main--stretch': route.meta.shellStretchMain,
      }"
    >
      <div
        class="mfuns-main__inner"
        :class="{
          'mfuns-main__inner--full-bleed': route.meta.shellFullBleed,
          'mfuns-main__inner--stretch': route.meta.shellStretchMain,
        }"
      >
        <router-view />
      </div>
    </v-main>

    <MainNavBottomBar v-if="showMainNavBottom" />
  </v-app>
</template>

<style scoped>
.mfuns-main {
  --v-layout-top: var(--mfuns-app-bar-height, 48px);
  padding-bottom: calc(
    var(--mfuns-bottom-nav-height, 0px) + env(safe-area-inset-bottom, 0px)
  );
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

.mfuns-main--wide .mfuns-main__inner {
  max-width: 960px;
  margin-inline: auto;
  width: 100%;
}

.mfuns-main__inner--full-bleed {
  max-width: none;
  margin-inline: 0;
  width: 100%;
  padding-inline: 0;
}

.mfuns-main__inner--full-bleed > :deep(*) {
  width: 100%;
  max-width: none;
}

.mfuns-main__inner--stretch {
  max-width: none;
  margin-inline: 0;
  width: 100%;
  padding-inline: 0;
}

.mfuns-main--wide .mfuns-main__inner--full-bleed {
  max-width: none;
  margin-inline: 0;
  width: 100%;
}

.mfuns-main--full-bleed {
  width: 100%;
  max-width: none;
}
</style>
