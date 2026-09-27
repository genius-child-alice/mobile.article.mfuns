<script setup lang="ts">
import { computed } from 'vue'
import type { HomeContentItem } from '../api/homeApi'
import { mfunsImageUrl } from '../utils/mfunsImageUrl'

const props = defineProps<{
  data: HomeContentItem
}>()

const emit = defineEmits<{
  click: []
}>()

const coverSrc = computed(() => mfunsImageUrl(props.data.cover, 300))
const avatarSrc = computed(() => mfunsImageUrl(props.data.user?.avatar, 48))

function formatCount(value: number | undefined): string {
  if (value == null) return ''
  if (value >= 10000) return `${(value / 10000).toFixed(1)}万`
  return String(value)
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

const showDuration = computed(
  () => props.data.duration != null && props.data.duration !== 0,
)
</script>

<template>
  <v-card
    class="content-block home-content-card overflow-hidden rounded w-100"
    elevation="0"
    color="rgba(0,0,0,0)"
    ripple
    @click="emit('click')"
  >
    <div class="home-content-card__cover rounded-lg overflow-hidden">
      <v-img v-if="coverSrc" :src="coverSrc" cover aspect-ratio="1.7778" />
      <div v-else class="home-content-card__cover-placeholder d-flex align-center justify-center">
        <v-icon icon="mdi-image-off-outline" color="medium-emphasis" />
      </div>
      <div v-if="data.tag?.length" class="tag-info">
        <span v-for="(tag, index) in data.tag" :key="`${tag}-${index}`" class="tag">{{ tag }}</span>
      </div>
      <div class="content-info">
        <template v-if="data.like_count != null">
          <v-icon icon="mdi-heart" size="small" color="white" />
          <span class="ml-1 mr-2">{{ formatCount(data.like_count) }}</span>
        </template>
        <template v-if="data.view_count != null">
          <v-icon icon="mdi-eye" size="small" color="white" />
          <span class="ml-1 mr-2">{{ formatCount(data.view_count) }}</span>
        </template>
        <div class="flex-fill" />
        <span v-if="showDuration" class="ml-1 mr-2">{{ formatDuration(data.duration!) }}</span>
      </div>
    </div>
    <div class="home-content-card__body py-2 px-0">
      <div class="card-title">
        {{ data.title }}
      </div>
      <div class="home-content-card__author d-flex align-center mt-1 text-disabled min-width-0">
        <v-avatar size="24" class="flex-shrink-0">
          <v-img v-if="avatarSrc" :src="avatarSrc" cover />
          <v-icon v-else icon="mdi-account" size="16" />
        </v-avatar>
        <span
          v-if="data.user?.name"
          class="text-truncate ml-1 min-width-0"
          :class="data.user.name_color ? `${data.user.name_color}--text` : undefined"
          style="font-size: 14px"
        >
          {{ data.user.name }}
        </span>
      </div>
    </div>
  </v-card>
</template>

<style scoped>
.home-content-card {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow: hidden;
}

.home-content-card__cover {
  position: relative;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow: hidden;
  background: #f9f9f9;
}

.home-content-card__cover :deep(.v-img),
.home-content-card__cover :deep(.v-responsive),
.home-content-card__cover :deep(img) {
  width: 100% !important;
  max-width: 100% !important;
  min-width: 0 !important;
}

.home-content-card__cover-placeholder {
  width: 100%;
  aspect-ratio: 16 / 9;
}

.home-content-card__body {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow: hidden;
}

.home-content-card__author {
  width: 100%;
}

.home-content-card .card-title,
.home-content-card .text-truncate {
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
}
</style>
