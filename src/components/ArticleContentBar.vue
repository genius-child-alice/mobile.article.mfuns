<script setup lang="ts">
import { computed } from 'vue'
import type { MemberHistoryResource } from '../api/memberUserApi'
import { mfunsImageUrl } from '../utils/mfunsImageUrl'

const props = defineProps<{
  data?: MemberHistoryResource | null
  rank?: number
  /** 热门榜等铺底纹场景：卡片底透明 */
  transparent?: boolean
}>()

const emit = defineEmits<{
  click: []
}>()

const coverSrc = computed(() => mfunsImageUrl(props.data?.cover, 300))

const firstTag = computed(() => props.data?.tag?.[0])

const showDuration = computed(
  () => props.data?.duration != null && props.data.duration !== 0,
)

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}
</script>

<template>
  <v-card
    class="article-content-bar list d-flex overflow-hidden"
    :class="{ 'article-content-bar--transparent': transparent }"
    elevation="0"
    :color="transparent ? 'rgba(0, 0, 0, 0)' : undefined"
    ripple
    @click="emit('click')"
  >
    <div class="article-content-bar__cover-wrap flex-shrink-0">
      <div class="article-content-bar__cover img">
        <v-img v-if="coverSrc" :src="coverSrc" cover width="130" height="90" />
        <div v-else class="article-content-bar__cover-placeholder d-flex align-center justify-center">
          <v-icon icon="mdi-image-off-outline" size="28" color="medium-emphasis" />
        </div>
        <div v-if="firstTag" class="tag-info">
          <span class="tag">{{ firstTag }}</span>
        </div>
        <span v-if="showDuration" class="duration">
          {{ formatDuration(data!.duration!) }}
        </span>
      </div>
    </div>

    <div class="article-content-bar__body ms-2 d-flex flex-column flex-grow-1 justify-space-between min-width-0">
      <div class="article-content-bar__title d-flex align-start ga-1">
        <span v-if="rank != null" class="article-content-bar__rank flex-shrink-0">{{ rank }}</span>
        <span class="min-width-0">{{ data?.title || '未命名' }}</span>
      </div>
      <div class="article-content-bar__author text-truncate">
        {{ data?.user?.name || '' }}
      </div>
      <div class="article-content-bar__stats d-flex align-center flex-wrap">
        <span v-if="data?.like_count != null">{{ data.like_count }}点赞&nbsp;</span>
        <span v-if="data?.comment_count != null">{{ data.comment_count }}评论&nbsp;</span>
        <span v-if="data?.view_count != null">{{ data.view_count }}浏览&nbsp;</span>
      </div>
    </div>
  </v-card>
</template>

<style scoped>
.article-content-bar {
  width: 100%;
  cursor: pointer;
}

.article-content-bar--transparent {
  background: transparent !important;
}

.article-content-bar__cover {
  position: relative;
  width: 130px;
  height: 90px;
  border-radius: 6px;
  overflow: hidden;
  background-color: #f9f9f9;
  background-image: linear-gradient(
    45deg,
    rgba(0, 0, 0, 0.02) 16.67%,
    #f9f9f9 0,
    #f9f9f9 50%,
    rgba(0, 0, 0, 0.02) 0,
    rgba(0, 0, 0, 0.02) 66.67%,
    #f9f9f9 0,
    #f9f9f9
  );
  background-size: 16px 16px;
}

.article-content-bar__cover-placeholder {
  width: 130px;
  height: 90px;
}

.article-content-bar__rank {
  color: rgb(var(--v-theme-primary));
  font-weight: 700;
  min-width: 1.25rem;
}

.article-content-bar__title {
  height: 40px;
  overflow: hidden;
  font-size: 0.87rem;
  line-height: 1.25rem;
}

.article-content-bar__title > span:last-child {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.article-content-bar__author {
  font-size: 0.87rem;
  line-height: 1.125rem;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
}

.article-content-bar__stats {
  min-height: 18px;
  font-size: 0.87rem;
  line-height: 1rem;
  color: rgba(var(--v-theme-on-surface), var(--v-disabled-opacity));
}

.tag-info {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
}

.tag,
.duration {
  background-color: rgba(0, 0, 0, 0.4);
  border-radius: 4px;
  color: #fff;
  font-size: 11px;
}

.tag {
  margin-left: 4px;
  margin-top: 4px;
  padding: 2px 4px;
  display: inline-block;
}

.duration {
  position: absolute;
  bottom: 4px;
  right: 4px;
  padding: 0 4px;
}

@media (prefers-color-scheme: dark) {
  .article-content-bar__cover {
    background-color: rgba(var(--v-theme-on-surface), 0.08);
    background-image: none;
  }
}
</style>
