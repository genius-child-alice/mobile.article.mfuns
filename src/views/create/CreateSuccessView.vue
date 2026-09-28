<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

function goCreate() {
  router.replace('/create')
}

function goHome() {
  router.replace('/home')
}
</script>

<template>
  <div class="create-success-page text-center pa-6">
    <v-icon icon="mdi-check-circle" color="success" size="96" class="mb-4" />
    <div class="text-h6 mb-2">投稿成功，正在审核中。</div>
    <div class="d-flex justify-center ga-3 mt-6">
      <v-btn color="link" variant="tonal" @click="goHome">返回首页</v-btn>
      <v-btn color="primary" variant="flat" @click="goCreate">再投一稿</v-btn>
    </div>
  </div>
</template>
