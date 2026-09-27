<script setup lang="ts">
import { computed, ref } from 'vue'
import { useDisplay } from 'vuetify'
import HomeCategoryPanel from '../../components/HomeCategoryPanel.vue'
import HomeCategorySelect from '../../components/HomeCategorySelect.vue'
import HomeHotPanel from '../../components/HomeHotPanel.vue'
import HomeRecommendList from '../../components/HomeRecommendList.vue'
import { useHomeTabs } from '../../composables/useHomeTabs'

const { mdAndUp, lgAndUp, xs } = useDisplay()
const { tabIndex } = useHomeTabs()

const categoryId = ref(-1)

const desktopRecommendHeight = computed(() => {
  if (!mdAndUp.value) return undefined
  return `calc(100dvh - var(--mfuns-app-bar-height, 48px))`
})
</script>

<template>
  <div class="home-page background-image">
    <v-container
      fluid
      class="home-page__container pt-0 pt-sm-1"
      :class="{ 'pa-0': xs }"
    >
      <v-window
        v-model="tabIndex"
        class="home-page__window"
        :style="desktopRecommendHeight ? { height: desktopRecommendHeight } : undefined"
      >
        <v-window-item :value="0">
          <div
            class="home-page__recommend d-flex overflow-hidden min-height-0"
            :style="desktopRecommendHeight ? { height: desktopRecommendHeight } : undefined"
          >
            <HomeCategorySelect
              v-if="lgAndUp"
              v-model="categoryId"
              layout="sidebar"
            />
            <div class="home-page__recommend-main flex-grow-1 min-width-0">
              <HomeRecommendList
                class="home-page__feed"
                :category-id="categoryId"
              >
                <HomeCategorySelect
                  v-if="!lgAndUp"
                  v-model="categoryId"
                  layout="chips"
                  class="mt-2"
                />
              </HomeRecommendList>
            </div>
            <HomeHotPanel
              v-if="mdAndUp"
              compact
              class="home-page__hot-rail flex-shrink-0"
              :class="lgAndUp ? 'home-page__hot-rail--lg' : 'home-page__hot-rail--md'"
            />
          </div>
        </v-window-item>

        <v-window-item v-if="!mdAndUp" :value="1">
          <HomeHotPanel />
        </v-window-item>

        <v-window-item v-if="!mdAndUp" :value="2">
          <HomeCategoryPanel />
        </v-window-item>
      </v-window>
    </v-container>
  </div>
</template>

<style scoped>
.home-page {
  width: 100%;
  min-height: calc(
    100dvh - var(--mfuns-app-bar-height, 48px) - var(--mfuns-bottom-nav-height, 0px) -
      env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px)
  );
}

.home-page__container {
  max-width: 1400px;
  margin-inline: auto;
  overflow: hidden;
}

@media (min-width: 600px) {
  .home-page__container {
    padding-inline: 12px !important;
  }
}

.home-page__window {
  background: transparent;
}

.home-page__window :deep(.v-window__container) {
  height: 100%;
}

.home-page__window :deep(.v-window-item) {
  height: 100%;
}

.home-page__recommend-main {
  height: 100%;
  min-height: 0;
}

.home-page__feed {
  height: 100%;
  min-height: 0;
}

.home-page__hot-rail--md {
  width: 340px;
}

.home-page__hot-rail--lg {
  width: 400px;
}
</style>
