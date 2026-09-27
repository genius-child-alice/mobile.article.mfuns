<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'
import HomePublishMenu from './HomePublishMenu.vue'
import type { MfunsAppBarConfig } from '../router/resolveAppBar'

const props = defineProps<{
  config: MfunsAppBarConfig
  extended: boolean
  showHomeExtensionTabs: boolean
  showHomeInlineTabs: boolean
  showBackExtensionTabs: boolean
}>()

const route = useRoute()
const router = useRouter()
const { mobile } = useDisplay()

const homeTabIndex = ref(0)
const timelineTabIndex = ref(0)
const backExtensionTabIndex = ref(0)
const searchQuery = ref('')
const createDialogOpen = ref(false)
const createMenuOpen = ref(false)

/** Placeholder until notify API is wired. */
const notifyCount = ref(0)

const pageTitle = computed(() => {
  if (props.config.variant !== 'back') return ''
  if (route.path.startsWith('/message/')) return ''
  if (props.config.title) return props.config.title
  return (route.meta.title as string | undefined) ?? ''
})

function goBack() {
  if (window.history.length > 1) router.back()
  else router.push('/home')
}
</script>

<template>
  <v-app-bar
    v-if="config.visible"
    app
    fixed
    color="primary"
    density="compact"
    elevation="4"
    :extended="extended"
    :extension-height="extended ? 48 : undefined"
    class="mfuns-app-bar text-white"
  >
    <template #default>
      <!-- home -->
      <div v-if="config.variant === 'home'" class="mfuns-app-bar__row">
        <img class="mfuns-logo" src="/mfuns_logo.png" height="28" width="auto" alt="mfuns logo" />
        <v-spacer />
        <v-tabs
          v-if="showHomeInlineTabs"
          v-model="homeTabIndex"
          align-tabs="center"
          class="mfuns-home-tabs mfuns-home-tabs--inline flex-shrink-0"
          color="white"
          hide-slider
        >
          <v-tab v-for="(label, i) in config.inlineTabs" :key="`home-inline-${label}`" :value="i">
            {{ label }}
          </v-tab>
        </v-tabs>
        <v-spacer />
        <v-btn icon variant="text" color="white" :to="{ path: '/search' }" aria-label="搜索">
          <v-icon icon="mdi-magnify" />
        </v-btn>
        <v-btn icon variant="text" color="white" :to="{ path: '/message' }" aria-label="私信">
          <v-badge
            :model-value="notifyCount > 0"
            :content="notifyCount"
            color="red"
            overlap
          >
            <v-icon icon="mdi-email" />
          </v-badge>
        </v-btn>
        <v-btn
          v-if="mobile"
          icon
          variant="text"
          color="white"
          aria-label="发布作品"
          @click="createDialogOpen = true"
        >
          <v-icon icon="mdi-plus-circle" />
        </v-btn>
        <v-menu v-else v-model="createMenuOpen" location="bottom end" :close-on-content-click="false">
          <template #activator="{ props: menuProps }">
            <v-btn v-bind="menuProps" icon variant="text" color="white" aria-label="发布作品">
              <v-icon icon="mdi-plus-circle" />
            </v-btn>
          </template>
          <HomePublishMenu v-model="createMenuOpen" />
        </v-menu>
      </div>

      <!-- timeline（参考站：v-tabs-slider 白色下划线，非 hide-slider） -->
      <v-tabs
        v-else-if="config.variant === 'timeline'"
        v-model="timelineTabIndex"
        align-tabs="center"
        height="48"
        class="mfuns-home-tabs mfuns-home-tabs--timeline"
        color="white"
      >
        <v-tab v-for="(label, i) in config.inlineTabs" :key="`tl-${label}`" :value="i">
          {{ label }}
        </v-tab>
      </v-tabs>

      <!-- search -->
      <div v-else-if="config.variant === 'search'" class="mfuns-app-bar__row mfuns-app-bar__row--search">
        <v-text-field
          v-model="searchQuery"
          class="mfuns-search-field"
          density="compact"
          variant="solo-filled"
          flat
          hide-details
          placeholder="搜索你感兴趣的内容QvQ"
          type="search"
          bg-color="rgba(255,255,255,0.15)"
          color="white"
          base-color="white"
        />
        <v-btn variant="text" color="white" class="mfuns-search-cancel" @click="goBack"> 取消 </v-btn>
      </div>

      <!-- member 个人中心 -->
      <template v-else-if="config.variant === 'member'">
        <v-toolbar-title class="mfuns-app-bar__title mfuns-app-bar__title--member">
          {{ config.title }}
        </v-toolbar-title>
        <v-spacer />
        <v-btn icon variant="text" color="white" :to="{ path: '/settings' }" aria-label="设置">
          <v-icon icon="mdi-cog" />
        </v-btn>
        <v-btn icon variant="text" color="white" :to="{ path: '/settings/themes' }" aria-label="主题">
          <v-icon icon="mdi-theme-light-dark" />
        </v-btn>
      </template>

      <!-- back + title -->
      <template v-else-if="config.variant === 'back'">
        <v-btn icon variant="text" color="white" aria-label="返回" @click="goBack">
          <v-icon icon="mdi-arrow-left" />
        </v-btn>
        <v-toolbar-title class="mfuns-app-bar__title">{{ pageTitle }}</v-toolbar-title>
        <v-spacer />
        <v-btn
          v-if="config.trailing === 'member-register'"
          variant="text"
          color="white"
          :to="{ path: '/member/register' }"
        >
          用户注册
        </v-btn>
        <template v-else-if="config.trailing === 'create-article-actions'">
          <v-btn icon variant="text" color="white" aria-label="保存">
            <v-icon icon="mdi-content-save" />
          </v-btn>
          <v-btn icon variant="text" color="white" aria-label="发布">
            <v-icon icon="mdi-send" />
          </v-btn>
        </template>
        <v-btn v-else-if="config.trailing === 'playlist-new'" icon variant="text" color="white" aria-label="新建">
          <v-icon icon="mdi-plus" />
        </v-btn>
      </template>
    </template>

    <template v-if="extended" #extension>
      <v-tabs
        v-if="config.variant === 'home' && showHomeExtensionTabs"
        v-model="homeTabIndex"
        align-tabs="center"
        grow
        class="mfuns-home-tabs mfuns-home-tabs--extension"
        color="white"
        hide-slider
      >
        <v-tab v-for="(label, i) in config.extensionTabs" :key="`home-ext-${label}`" :value="i">
          {{ label }}
        </v-tab>
      </v-tabs>
      <v-tabs
        v-else-if="config.variant === 'back' && showBackExtensionTabs"
        v-model="backExtensionTabIndex"
        grow
        class="mfuns-home-tabs mfuns-home-tabs--extension"
        color="white"
        hide-slider
      >
        <v-tab v-for="(label, i) in config.extensionTabs" :key="`back-ext-${label}`" :value="i">
          {{ label }}
        </v-tab>
      </v-tabs>
    </template>
  </v-app-bar>

  <v-dialog v-model="createDialogOpen" class="mfuns-publish-dialog" max-width="350">
    <HomePublishMenu v-model="createDialogOpen" />
  </v-dialog>
</template>

<style scoped>
.mfuns-app-bar :deep(.v-toolbar__content),
.mfuns-app-bar :deep(.v-toolbar__extension) {
  box-shadow: none;
}

.mfuns-app-bar {
  box-shadow:
    0 2px 4px -1px rgba(0, 0, 0, 0.2),
    0 4px 5px 0 rgba(0, 0, 0, 0.14),
    0 1px 10px 0 rgba(0, 0, 0, 0.12);
}

.mfuns-app-bar :deep(.v-toolbar__content) {
  padding-inline: 4px;
}

.mfuns-app-bar__row {
  display: flex;
  align-items: center;
  width: 100%;
  min-height: 48px;
  padding-inline: max(4px, env(safe-area-inset-right));
  gap: 8px;
}

.mfuns-app-bar__row--search {
  gap: 4px;
  padding-inline: 8px max(4px, env(safe-area-inset-right));
}

.mfuns-app-bar__title {
  font-size: 1.125rem;
  font-weight: 500;
  padding-inline-start: 0;
}

.mfuns-app-bar__title--member {
  font-size: 1.25rem;
  padding-inline-start: 8px;
}

.mfuns-logo {
  display: block;
  flex-shrink: 0;
  margin-inline-start: 4px;
}

.mfuns-home-tabs--inline {
  width: 280px;
  max-width: min(280px, 42vw);
}

.mfuns-home-tabs--timeline {
  width: 100%;
  flex: 1 1 auto;
}

.mfuns-app-bar:has(.mfuns-home-tabs--timeline) :deep(.v-toolbar__content) {
  padding-inline: 0;
  display: flex;
  justify-content: center;
}

.mfuns-home-tabs--timeline :deep(.v-tab) {
  flex: 0 0 auto;
  min-width: 72px;
  max-width: 360px;
  width: auto;
}

/* V2 v-tabs-slider on primary app bar */
.mfuns-home-tabs--timeline :deep(.v-tab__slider) {
  height: 2px;
  opacity: 1;
  background-color: rgb(255, 255, 255);
}

.mfuns-home-tabs :deep(.v-tab) {
  min-width: 72px;
  text-transform: none;
  letter-spacing: 0;
  font-size: 0.875rem;
}

.mfuns-home-tabs :deep(.v-tab--selected) {
  opacity: 1;
}

.mfuns-search-field {
  flex: 1;
  min-width: 0;
}

.mfuns-search-field :deep(.v-field) {
  border-radius: 4px;
  min-height: 35px;
}

.mfuns-search-field :deep(.v-field__input) {
  min-height: 35px;
  padding-top: 0;
  padding-bottom: 0;
  font-size: 0.875rem;
}

.mfuns-search-field :deep(input::placeholder) {
  color: rgba(255, 255, 255, 0.75);
  opacity: 1;
}

.mfuns-search-cancel {
  flex-shrink: 0;
  min-width: auto;
  padding-inline: 8px;
  text-transform: none;
  letter-spacing: 0;
}
</style>
