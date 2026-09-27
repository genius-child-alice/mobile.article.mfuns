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
  <v-sheet
    class="mfuns-side-rail theme--light"
    border="end"
    rounded="0"
    elevation="0"
  >
    <RouterLink
      v-for="item in items"
      :key="item.value"
      v-ripple
      :to="item.to"
      class="mfuns-nuxt-link"
      :class="{ 'mfuns-nuxt-link--active': activeValue === item.value }"
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
</style>
