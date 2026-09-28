<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { FeedExtra, FeedUser } from '../api/feedsApi'
import { stripHtml } from '../utils/mfunsPlainText'
import { mfunsImageUrl } from '../utils/mfunsImageUrl'
import MfunsRichText from './MfunsRichText.vue'

interface DynamicExtraParams extends FeedExtra {
  resource?: {
    id?: number
    title?: string
    cover?: string
    summary?: string
    content?: string
    content_type?: number
    duration?: number
    extra?: { images?: string[] }
  }
  user?: FeedUser
}

const props = withDefaults(
  defineProps<{
    type?: number
    params?: DynamicExtraParams | null
    maxImage?: number
  }>(),
  {
    type: 0,
    params: null,
    maxImage: 0,
  },
)

const router = useRouter()
const previewOpen = ref(false)
const previewIndex = ref(0)

const images = computed(() => props.params?.images?.filter(Boolean) ?? [])
const displayImages = computed(() => {
  if (props.maxImage > 0) return images.value.slice(0, props.maxImage)
  return images.value
})

const resource = computed(() => props.params?.resource)
const user = computed(() => props.params?.user)

const forwardId = computed(
  () => resource.value?.id ?? props.params?.id ?? props.params?.resource_id ?? 0,
)
const forwardContent = computed(() => {
  const raw = resource.value?.content ?? props.params?.content ?? ''
  return stripHtml(raw)
})
const forwardImages = computed(
  () => resource.value?.extra?.images?.filter(Boolean) ?? props.params?.images?.filter(Boolean) ?? [],
)
const previewList = computed(() => {
  const list = props.type === 1 ? forwardImages.value : images.value
  return list.map((img) => mfunsImageUrl(img, 1500))
})

const articleTitle = computed(() => resource.value?.title ?? props.params?.title ?? '')
const articleCover = computed(() => resource.value?.cover ?? props.params?.cover ?? '')
const articleSummary = computed(
  () => resource.value?.summary ?? stripHtml(props.params?.content) ?? '',
)

function openPreview(index: number) {
  previewIndex.value = index
  previewOpen.value = true
}

function goFeed() {
  if (!forwardId.value) return
  router.push(`/feed/${forwardId.value}`)
}

function goArticle() {
  if (!forwardId.value) return
  router.push(`/article/${forwardId.value}`)
}

function goVideo() {
  if (!forwardId.value) return
  router.push(`/video/${forwardId.value}`)
}
</script>

<template>
  <div class="dynamic-extra">
    <!-- type 0: 图片网格 -->
    <div v-if="type === 0 && displayImages.length" class="dynamic-extra__grid">
      <v-img
        v-for="(img, idx) in displayImages"
        :key="`${img}-${idx}`"
        :src="mfunsImageUrl(img, 600)"
        aspect-ratio="1"
        cover
        class="dynamic-extra__img rounded"
        role="button"
        @click.stop="openPreview(idx)"
      >
        <div
          v-if="maxImage > 0 && idx === maxImage - 1 && images.length > maxImage"
          class="dynamic-extra__more"
        >
          +{{ images.length - maxImage }}
        </div>
      </v-img>
    </div>

    <!-- type 1: 转发动态 -->
    <v-card
      v-else-if="type === 1"
      class="dynamic-extra__card pa-2"
      variant="outlined"
      color="rgba(128,128,128,0.08)"
      elevation="0"
      @click.stop="goFeed"
    >
      <div class="d-flex align-center mb-2">
        <v-avatar size="28" color="grey-lighten-2" class="me-2">
          <v-img v-if="user?.avatar" :src="mfunsImageUrl(user.avatar, 80)" cover />
          <v-icon v-else icon="mdi-account" size="18" />
        </v-avatar>
        <span class="text-body-2 text-link">@{{ user?.name || '喵友' }}</span>
        <span class="text-body-2 text-medium-emphasis ms-1">的动态</span>
      </div>
      <MfunsRichText
        v-if="forwardContent"
        class="mb-1"
        :text="forwardContent"
        :type="resource?.content_type ?? 0"
        :max-line="4"
      />
      <div v-if="forwardImages.length" class="dynamic-extra__grid dynamic-extra__grid--nested">
        <v-img
          v-for="(img, idx) in forwardImages.slice(0, maxImage || 9)"
          :key="`fwd-${idx}`"
          :src="mfunsImageUrl(img, 400)"
          aspect-ratio="1"
          cover
          class="dynamic-extra__img rounded"
          @click.stop="openPreview(idx)"
        />
      </div>
    </v-card>

    <!-- type 2: 文章卡 -->
    <v-card
      v-else-if="type === 2"
      class="dynamic-extra__card"
      variant="outlined"
      elevation="0"
      @click.stop="goArticle"
    >
      <v-img
        v-if="articleCover"
        :src="mfunsImageUrl(articleCover, 600)"
        height="150"
        cover
      />
      <v-card-text>
        <div class="text-body-2 text-medium-emphasis mb-1">
          <span class="text-link">{{ user?.name || '喵友' }}</span>
          发布的文章
        </div>
        <div class="text-body-1 mb-1">{{ articleTitle || '未命名' }}</div>
        <div v-if="articleSummary" class="text-body-2 text-medium-emphasis text-truncate-2">
          {{ articleSummary }}
        </div>
      </v-card-text>
    </v-card>

    <!-- type 3: 视频卡 stub -->
    <v-card
      v-else-if="type === 3"
      class="dynamic-extra__card pa-2"
      variant="outlined"
      elevation="0"
      @click.stop="goVideo"
    >
      <div class="text-body-2 text-medium-emphasis mb-1">
        <span class="text-link">{{ user?.name || '喵友' }}</span>
        的投稿
      </div>
      <v-img
        v-if="articleCover"
        :src="mfunsImageUrl(articleCover, 600)"
        :aspect-ratio="16 / 9"
        cover
        class="rounded mb-1"
      >
        <div class="d-flex justify-end align-end fill-height pa-1">
          <v-chip v-if="resource?.duration" size="x-small" color="black" variant="flat">
            视频
          </v-chip>
        </div>
      </v-img>
      <div class="text-body-1">{{ articleTitle || '视频内容' }}</div>
    </v-card>

    <!-- type 6: 失效 -->
    <v-card v-else-if="type === 6" variant="flat" color="rgba(128,128,128,0.1)" elevation="0">
      <v-card-text>原内容已失效</v-card-text>
    </v-card>

    <v-dialog v-model="previewOpen" max-width="900">
      <v-card color="black">
        <v-img
          v-if="previewList[previewIndex]"
          :src="previewList[previewIndex]"
          max-height="90vh"
          contain
        />
        <v-card-actions>
          <v-btn
            variant="text"
            color="white"
            :disabled="previewIndex <= 0"
            @click="previewIndex--"
          >
            上一张
          </v-btn>
          <v-spacer />
          <span class="text-white text-caption">{{ previewIndex + 1 }} / {{ previewList.length }}</span>
          <v-spacer />
          <v-btn
            variant="text"
            color="white"
            :disabled="previewIndex >= previewList.length - 1"
            @click="previewIndex++"
          >
            下一张
          </v-btn>
          <v-btn variant="text" color="white" @click="previewOpen = false">关闭</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.dynamic-extra__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 4px;
  margin-top: 8px;
}

.dynamic-extra__grid--nested {
  margin-top: 4px;
}

.dynamic-extra__img {
  cursor: pointer;
  max-height: 140px;
  position: relative;
}

.dynamic-extra__more {
  position: absolute;
  right: 4px;
  bottom: 4px;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  font-size: 12px;
  line-height: 12px;
  padding: 2px 4px;
  border-radius: 2px;
}

.dynamic-extra__card {
  cursor: pointer;
  margin-top: 8px;
}

.text-link {
  color: rgb(var(--v-theme-link));
}

.text-truncate-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
