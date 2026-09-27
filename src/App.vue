<script setup lang="ts">
import { RouterView } from 'vue-router'
import { useMfunsTheme } from './composables/useMfunsTheme'

useMfunsTheme()
</script>

<template>
  <RouterView />
</template>
