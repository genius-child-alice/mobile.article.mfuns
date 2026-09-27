<script setup lang="ts">
import { useRouter } from 'vue-router'

defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const router = useRouter()

const items = [
  { label: '视频', icon: 'mdi-upload', to: '/create/video' },
  { label: '文章', icon: 'mdi-text-long', to: '/create/article' },
  { label: '动态', icon: 'mdi-circle-edit-outline', to: '/create/feed' },
] as const

function go(to: string) {
  emit('update:modelValue', false)
  router.push(to)
}
</script>

<template>
  <v-sheet class="mfuns-publish-sheet pa-6 pb-12 pt-6" width="350">
    <div class="text-center pb-6 text-body-1">发布作品</div>
    <div class="d-flex">
      <button
        v-for="item in items"
        :key="item.to"
        type="button"
        class="mfuns-publish-sheet__item flex-fill"
        @click="go(item.to)"
      >
        <div class="d-flex justify-center">
          <div class="mfuns-publish-sheet__icon">
            <v-icon :icon="item.icon" size="28" />
          </div>
        </div>
        <div class="text-center text-body-2">{{ item.label }}</div>
      </button>
    </div>
  </v-sheet>
</template>

<style scoped>
.mfuns-publish-sheet__item {
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 4px;
  color: inherit;
}

.mfuns-publish-sheet__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(var(--v-theme-primary), 0.12);
  color: rgb(var(--v-theme-primary));
  margin-bottom: 8px;
}
</style>
