<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import type { FeedItem } from '../api/feedsApi'
import MfunsBadge from './MfunsBadge.vue'
import { formatRelativeUnixTime } from '../utils/mfunsTime'
import { mfunsImageUrl } from '../utils/mfunsImageUrl'

const props = defineProps<{
  data: FeedItem
}>()

const router = useRouter()

const avatarSrc = computed(() => mfunsImageUrl(props.data.user?.avatar, 96))
const timeLabel = computed(() => formatRelativeUnixTime(props.data.created_at))
const likeCount = computed(() => props.data.like_status?.like?.count ?? 0)
const images = computed(() => props.data.extra?.images?.filter(Boolean) ?? [])
const badgeIds = computed(() => props.data.user?.badges ?? [])

function openFeed() {
  router.push(`/feed/${props.data.id}`)
}
</script>

<template>
  <v-card
    class="feed-dynamic-card rounded-lg"
    variant="flat"
    role="button"
    tabindex="0"
    @click="openFeed"
    @keydown.enter="openFeed"
  >
    <div class="feed-dynamic-card__head d-flex align-start pa-3 pb-2">
      <v-avatar size="40" color="grey-lighten-2" class="me-3 flex-shrink-0">
        <v-img v-if="avatarSrc" :src="avatarSrc" cover />
        <v-icon v-else icon="mdi-account" size="24" />
      </v-avatar>
      <div class="min-width-0 flex-grow-1">
        <div class="d-flex align-center flex-wrap ga-1">
          <span class="text-subtitle-2 font-weight-medium text-truncate">
            {{ data.user?.name || '喵友' }}
          </span>
          <MfunsBadge v-for="badgeId in badgeIds" :key="badgeId" :id="badgeId" />
        </div>
        <div class="text-caption text-medium-emphasis">
          {{ timeLabel }}
          <template v-if="data.views != null"> · {{ data.views }} 浏览</template>
        </div>
      </div>
    </div>

    <div
      v-if="data.content"
      class="feed-dynamic-card__body text-body-2 px-3 pb-2 feed-dynamic-card__html"
      v-html="data.content"
    />

    <div v-if="images.length" class="feed-dynamic-card__images px-3 pb-2">
      <v-img
        v-for="(img, idx) in images.slice(0, 9)"
        :key="`${data.id}-img-${idx}`"
        :src="mfunsImageUrl(img, 600)"
        aspect-ratio="1"
        cover
        class="feed-dynamic-card__img rounded"
        @click.stop
      />
    </div>

    <v-divider />

    <div class="feed-dynamic-card__foot d-flex align-center text-caption text-medium-emphasis px-3 py-2">
      <v-icon icon="mdi-thumb-up-outline" size="16" class="me-1" />
      {{ likeCount }}
      <span v-if="data.floor_count != null" class="ms-4">
        {{ data.floor_count }} 回复
      </span>
    </div>
  </v-card>
</template>

<style scoped>
.feed-dynamic-card {
  background: rgb(var(--v-theme-surface));
  cursor: pointer;
}

.feed-dynamic-card__html :deep(p) {
  margin: 0 0 0.5em;
}

.feed-dynamic-card__html :deep(p:last-child) {
  margin-bottom: 0;
}

.feed-dynamic-card__images {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 4px;
}

.feed-dynamic-card__img {
  max-height: 120px;
}
</style>
