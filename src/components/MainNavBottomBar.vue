<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const items = [
  { value: 'home', to: '/home', label: '首页', icon: 'mdi-home-variant-outline' },
  { value: 'timeline', to: '/timeline', label: '动态', icon: 'mdi-creation' },
  { value: 'member', to: '/member', label: '我的', icon: 'mdi-account-outline' },
] as const

const activeValue = computed(() => {
  const p = route.path
  if (p === '/home' || p === '/') return 'home'
  if (p.startsWith('/timeline')) return 'timeline'
  if (p === '/member') return 'member'
  return undefined
})
</script>

<template>
  <!-- DOM/classes from m.mfuns layout (Vuetify 2 bottom-navigation + shift) -->
  <div
    class="v-item-group v-bottom-navigation bottom-bar mfuns-bottom-nav theme--light v-bottom-navigation--grow v-bottom-navigation--fixed v-bottom-navigation--shift link--text"
    role="tablist"
  >
    <RouterLink
      v-for="item in items"
      :key="item.value"
      v-ripple
      :to="item.to"
      class="v-btn v-btn--router v-btn--is-elevated v-btn--has-bg theme--light v-size--default"
      :class="{ 'v-btn--active': activeValue === item.value }"
      role="tab"
      :aria-selected="activeValue === item.value"
    >
      <span class="v-btn__content">
        <span class="mfuns-bottom-nav__label">{{ item.label }}</span>
        <i
          class="v-icon notranslate mdi theme--light"
          :class="item.icon"
          aria-hidden="true"
        />
      </span>
    </RouterLink>
  </div>
</template>
