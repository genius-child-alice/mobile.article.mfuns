<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { fetchAllCategories, type HomeCategory } from '../api/homeApi'

const router = useRouter()
const categories = ref<HomeCategory[]>([])
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    const res = await fetchAllCategories()
    if (res.code === 1 && Array.isArray(res.data)) {
      categories.value = res.data
    }
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="home-category-panel">
    <v-progress-linear v-if="loading" indeterminate color="primary" />
    <v-row v-else dense>
      <v-col v-for="cat in categories" :key="cat.id" cols="4" sm="3" md="2">
        <v-sheet
          v-ripple
          class="home-category-panel__cell pa-3 d-flex align-center justify-center text-center rounded"
          variant="outlined"
          role="button"
          tabindex="0"
          @click="router.push(`/category/${cat.id}`)"
          @keydown.enter="router.push(`/category/${cat.id}`)"
        >
          <span class="text-body-2">{{ cat.name }}</span>
        </v-sheet>
      </v-col>
    </v-row>
  </div>
</template>

<style scoped>
/* 与 MainNavSideRail `.mfuns-side-rail` 右边框一致 */
.home-category-panel__cell {
  --home-category-border-color: rgba(var(--v-theme-on-surface), 0.12);
  cursor: pointer;
  min-height: 56px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid var(--home-category-border-color) !important;
  border-width: 1px !important;
}
</style>
