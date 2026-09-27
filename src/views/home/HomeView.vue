<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useDisplay } from 'vuetify'
import HomeCategoryPanel from '../../components/HomeCategoryPanel.vue'
import HomeCategorySelect from '../../components/HomeCategorySelect.vue'
import HomeHotPanel from '../../components/HomeHotPanel.vue'
import HomeRecommendList from '../../components/HomeRecommendList.vue'
import { useHomeTabs } from '../../composables/useHomeTabs'

const { mdAndUp, lgAndUp, xs } = useDisplay()
const { tabIndex } = useHomeTabs()

const categoryId = ref(-1)
const isLandscape = ref(false)

/** lg+ 或横屏 md+：左侧分区侧栏（与参考站一致，便于与内容网格顶对齐） */
const showCategorySidebar = computed(
  () => lgAndUp.value || (mdAndUp.value && isLandscape.value),
)

/** 分区侧栏 + 内容 + 热门榜同时出现（三栏首页） */
const isHomeThreeColumn = computed(
  () => mdAndUp.value && showCategorySidebar.value,
)

function syncLandscape() {
  isLandscape.value = window.matchMedia('(orientation: landscape)').matches
}

onMounted(() => {
  syncLandscape()
  window.addEventListener('resize', syncLandscape, { passive: true })
  window.matchMedia('(orientation: landscape)').addEventListener('change', syncLandscape)
})

onUnmounted(() => {
  window.removeEventListener('resize', syncLandscape)
  window.matchMedia('(orientation: landscape)').removeEventListener('change', syncLandscape)
})
</script>

<template>
  <div class="home-page background-image">
    <v-container
      fluid
      class="home-page__container pt-0 pt-sm-1"
      :class="{ 'pa-0': xs }"
    >
      <v-window v-model="tabIndex" class="home-page__window">
        <v-window-item :value="0">
          <div
            class="home-page__recommend d-flex overflow-hidden min-height-0"
            :class="{ 'home-page__recommend--with-sidebar': showCategorySidebar }"
          >
            <HomeCategorySelect
              v-if="showCategorySidebar"
              v-model="categoryId"
              layout="sidebar"
            />
            <div class="home-page__recommend-main flex-grow-1 min-width-0">
              <HomeRecommendList
                class="home-page__feed"
                :category-id="categoryId"
                :three-column="isHomeThreeColumn"
              >
                <HomeCategorySelect
                  v-if="!showCategorySidebar"
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
  --home-fill-height: calc(
    100dvh - var(--mfuns-app-bar-height, 48px) - var(--mfuns-bottom-nav-height, 0px) -
      env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px)
  );
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: var(--home-fill-height);
  max-height: var(--home-fill-height);
  min-height: 0;
  overflow: hidden;
}

.home-page__container {
  box-sizing: border-box;
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  max-width: 1400px;
  width: 100%;
  height: 100%;
  max-height: 100%;
  min-height: 0;
  margin-inline: auto;
  overflow: hidden;
  padding-bottom: 0 !important;
}

@media (min-width: 600px) {
  .home-page__container {
    padding-inline: 12px !important;
  }
}

.home-page__window {
  background: transparent;
  flex: 1 1 auto;
  height: 100%;
  max-height: 100%;
  min-height: 0;
}

.home-page__recommend {
  width: 100%;
  max-width: 100%;
  height: 100%;
  max-height: 100%;
  min-width: 0;
  min-height: 0;
}

.home-page__window :deep(.v-window__container) {
  height: 100%;
  width: 100%;
  max-width: 100%;
  min-width: 0;
}

.home-page__window :deep(.v-window-item) {
  height: 100%;
  width: 100%;
  max-width: 100%;
  min-width: 0;
}

.home-page__recommend-main {
  width: 100%;
  max-width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.home-page__feed {
  width: 100%;
  max-width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
}

.home-page__hot-rail--md {
  width: 340px;
}

.home-page__hot-rail--lg {
  width: 400px;
}

/* 横屏侧栏分区：内容网格顶与侧栏 pa-2 第一个按钮顶对齐（侧栏 8px，网格原 ma-1 仅 4px） */
@media (orientation: landscape) {
  .home-page__recommend--with-sidebar :deep(.home-recommend-list__scroll) {
    padding-top: 8px;
    box-sizing: border-box;
  }

  .home-page__recommend--with-sidebar :deep(.home-recommend-list__scroll > .v-row) {
    margin-top: 0 !important;
  }
}
</style>
