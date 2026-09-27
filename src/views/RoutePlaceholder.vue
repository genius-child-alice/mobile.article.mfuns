<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const title = computed(() => (route.meta.title as string) ?? route.path)
</script>

<template>
  <v-container class="route-placeholder py-8">
    <p class="text-caption text-medium-emphasis mb-1">路由占位</p>
    <h1 class="text-h6 mb-2">{{ title }}</h1>
    <p class="text-body-2 text-medium-emphasis">{{ route.path }}</p>
  </v-container>
</template>
