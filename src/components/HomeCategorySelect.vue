<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { fetchAllCategories, type HomeCategory } from '../api/homeApi'

const props = defineProps<{
  modelValue: number
  layout?: 'sidebar' | 'chips'
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const categories = ref<HomeCategory[]>([])

const items = computed(() => [{ id: -1, name: '推荐' }, ...categories.value])

onMounted(async () => {
  const res = await fetchAllCategories()
  if (res.code === 1 && Array.isArray(res.data)) {
    categories.value = res.data
  }
})

function pick(id: number) {
  emit('update:modelValue', id)
}
</script>

<template>
  <div
    v-if="layout === 'sidebar'"
    class="home-category-select home-category-select--sidebar pa-2 scroll-y-style d-flex flex-column"
  >
    <v-sheet
      v-for="item in items"
      :key="item.id"
      v-ripple
      class="pa-3 d-flex align-center justify-center mb-3"
      rounded
      :variant="modelValue === item.id ? 'flat' : 'outlined'"
      :color="modelValue === item.id ? 'primary' : undefined"
      style="cursor: pointer"
      @click="pick(item.id)"
    >
      {{ item.name }}
    </v-sheet>
  </div>

  <v-chip-group
    v-else
    class="home-category-select home-category-select--chips"
    :model-value="modelValue"
    mandatory
    @update:model-value="pick($event as number)"
  >
    <v-chip
      v-for="item in items"
      :key="item.id"
      :value="item.id"
      rounded
      :variant="modelValue === item.id ? 'flat' : 'outlined'"
      :color="modelValue === item.id ? 'primary' : undefined"
      @click="pick(item.id)"
    >
      {{ item.name }}
    </v-chip>
  </v-chip-group>
</template>

<style scoped>
.home-category-select--sidebar {
  width: 200px;
  flex-shrink: 0;
  height: 100%;
}

/* 与内容网格 padding: 4px 左缘对齐 */
.home-category-select--chips {
  overflow-x: auto;
  white-space: nowrap;
  scrollbar-width: none;
  padding-inline: 4px;
  box-sizing: border-box;
}

.home-category-select--chips::-webkit-scrollbar {
  display: none;
}

.home-category-select--chips :deep(.v-slide-group__content) {
  padding-inline: 0;
}
</style>
