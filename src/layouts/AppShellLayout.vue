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
    />

    <v-main
      class="mfuns-main background-image"
      :class="{
        'mfuns-main--wide': mdAndUp && !route.meta.shellFullBleed,
        'mfuns-main--full-bleed': route.meta.shellFullBleed,
      }"
    >
      <div
        class="mfuns-main__inner"
        :class="{ 'mfuns-main__inner--full-bleed': route.meta.shellFullBleed }"
      >
        <router-view />
      </div>
    </v-main>

    <MainNavBottomBar v-if="showMainNavBottom" />
  </v-app>
</template>

<style scoped>
.mfuns-app--left-rail :deep(.v-app-bar) {
  left: var(--mfuns-left-nav-width, 74px) !important;
  width: calc(100% - var(--mfuns-left-nav-width, 74px)) !important;
  max-width: calc(100% - var(--mfuns-left-nav-width, 74px)) !important;
  right: auto !important;
}

/* Side rail is fixed (not Vuetify layout drawer); align main with app bar. */
.mfuns-app--left-rail .mfuns-main {
  margin-inline-start: var(--mfuns-left-nav-width, 74px);
  width: calc(100% - var(--mfuns-left-nav-width, 74px));
  max-width: calc(100% - var(--mfuns-left-nav-width, 74px));
  padding-inline-start: 0;
}

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
