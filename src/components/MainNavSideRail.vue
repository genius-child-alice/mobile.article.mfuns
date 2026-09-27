<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const items = [
  { value: 'home', to: '/home', label: '首页', icon: 'mdi-home-variant-outline' },
  { value: 'timeline', to: '/timeline', label: '动态', icon: 'mdi-creation' },
  { value: 'member', to: '/member', label: '我的', icon: 'mdi-account-outline' },
] as const

function isActive(path: string) {
  if (path === '/home') return route.path === '/home' || route.path === '/'
  if (path === '/member') return route.path === '/member'
  return route.path.startsWith(path)
}

const activeValue = computed(() => {
  if (isActive('/home')) return 'home'
  if (isActive('/timeline')) return 'timeline'
  if (isActive('/member')) return 'member'
  return undefined
})
</script>

<template>
  <v-sheet class="mfuns-side-rail" border="end" rounded="0">
    <RouterLink
      v-for="item in items"
      :key="item.value"
      v-ripple
      :to="item.to"
      class="mfuns-side-rail__link"
      :class="{ 'mfuns-side-rail__link--active': activeValue === item.value }"
    >
      <v-icon :icon="item.icon" size="24" />
      <span>{{ item.label }}</span>
    </RouterLink>
  </v-sheet>
</template>

<style scoped>
.mfuns-side-rail {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1003;
  width: 74px;
  height: 100vh;
  height: 100dvh;
  padding-top: env(safe-area-inset-top, 0px);
  padding-bottom: env(safe-area-inset-bottom, 0px);
  display: flex;
  flex-direction: column;
  align-items: stretch;
  background: rgb(var(--v-theme-surface));
  border-left: none;
  border-top: none;
  border-bottom: none;
}

.mfuns-side-rail__link {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  width: 74px;
  height: 74px;
  text-decoration: none;
  color: rgba(var(--v-theme-on-surface), 0.87);
  gap: 2px;
}

.mfuns-side-rail__link span {
  font-size: 12px;
  line-height: 1.2;
  color: #333;
}

.mfuns-side-rail__link--active,
.mfuns-side-rail__link--active span {
  color: rgb(var(--v-theme-link)) !important;
}

.mfuns-side-rail__link--active :deep(.v-icon) {
  color: rgb(var(--v-theme-link)) !important;
}
</style>
