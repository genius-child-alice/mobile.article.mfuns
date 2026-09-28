<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { CommentAreaInfo, CommentItem as CommentItemData } from '../api/commentApi'
import { useLikeToggle } from '../composables/useLikeToggle'
import { useMemberAuth } from '../composables/useMemberAuth'
import { useMemberProfile } from '../composables/useMemberProfile'
import { mfunsImageUrl } from '../utils/mfunsImageUrl'
import FeedMemberInfoRow from './FeedMemberInfoRow.vue'
import MfunsBadge from './MfunsBadge.vue'
import MfunsRichText from './MfunsRichText.vue'

const props = withDefaults(
  defineProps<{
    source: CommentItemData
    replay?: boolean
    showSecondReply?: boolean
    pin?: boolean
    commentInfo?: CommentAreaInfo
  }>(),
  {
    replay: false,
    showSecondReply: false,
    pin: false,
    commentInfo: () => ({}),
  },
)

const emit = defineEmits<{
  pin: []
  'cancel-pin': []
  delete: []
  report: []
  click: []
}>()

const { isLoggedIn } = useMemberAuth()
const { memberInfo } = useMemberProfile()

const item = ref<CommentItemData>({ ...props.source })
const previewOpen = ref(false)
const previewIndex = ref(0)

const { likeStatus, like, dislike, applyStatus } = useLikeToggle(
  () => item.value.id,
  4,
  props.source.like_status,
)

const memberData = computed(() => {
  const info = item.value.user_info
  const baseInfo = info?.info || ''
  return {
    id: info?.id,
    name: info?.name,
    name_color: info?.name_color,
    avatar: info?.avatar,
    level_id: info?.level_id,
    badges: info?.badges,
    info: props.pin && baseInfo && !baseInfo.includes('置顶') ? `${baseInfo} 置顶` : baseInfo,
  }
})

const images = computed(() => item.value.content_ext?.images?.filter(Boolean) ?? [])
const previewList = computed(() => images.value.map((img) => mfunsImageUrl(img, 1500)))

const isOwner = computed(
  () => isLoggedIn.value && memberInfo.value?.id != null && item.value.user_info?.id === memberInfo.value.id,
)
const isAreaOwner = computed(
  () =>
    isLoggedIn.value &&
    memberInfo.value?.id != null &&
    props.commentInfo?.user_id != null &&
    memberInfo.value.id === props.commentInfo.user_id,
)

watch(
  () => props.source,
  (next) => {
    item.value = { ...next }
    applyStatus(next.like_status)
  },
)

function openPreview(index: number) {
  previewIndex.value = index
  previewOpen.value = true
}

function onLike(e: Event) {
  e.stopPropagation()
  void like()
}

function onDislike(e: Event) {
  e.stopPropagation()
  void dislike()
}
</script>

<template>
  <div class="comment-item">
    <div class="d-flex align-center px-2">
      <FeedMemberInfoRow class="flex-grow-1 min-width-0" :data="memberData" to-user />
      <v-menu location="bottom end">
        <template #activator="{ props: menuProps }">
          <v-btn v-bind="menuProps" icon size="x-small" variant="text" @click.stop>
            <v-icon icon="mdi-dots-vertical" class="text-medium-emphasis" />
          </v-btn>
        </template>
        <v-list density="compact">
          <v-list-item v-if="isOwner" title="删除此评论" @click="emit('delete')" />
          <template v-if="isAreaOwner">
            <v-list-item v-if="pin" title="取消置顶" @click="emit('cancel-pin')" />
            <v-list-item v-else title="置顶" @click="emit('pin')" />
          </template>
          <v-list-item title="举报此评论" @click="emit('report')" />
        </v-list>
      </v-menu>
    </div>

    <MfunsRichText
      class="comment-item__content ml-13 px-5 text-body-2"
      :text="item.content || ''"
      :type="item.content_type ?? 1"
      :max-line="4"
    />

    <div v-if="images.length" class="comment-item__images">
      <div v-if="images.length === 1" class="ml-13 px-5 mt-1">
        <v-img
          class="rounded"
          :src="mfunsImageUrl(images[0], 700)"
          max-height="400"
          max-width="400"
          @click.stop="openPreview(0)"
        />
      </div>
      <v-row v-else class="ml-13 px-4 mt-1" density="compact">
        <v-col v-for="(img, idx) in images" :key="img" cols="6">
          <v-img
            :src="mfunsImageUrl(img, 300)"
            aspect-ratio="1"
            cover
            class="rounded"
            @click.stop="openPreview(idx)"
          />
        </v-col>
      </v-row>
    </div>

    <div
      v-if="showSecondReply && item.second_reply?.length"
      class="ml-13 px-5 mt-4"
      @click.stop="emit('click')"
    >
      <v-sheet class="pa-2" color="rgba(128,128,128,0.1)" style="border-radius: 4px">
        <div
          v-for="reply in item.second_reply"
          :key="reply.id"
          class="d-flex mb-2"
        >
          <v-avatar size="24" class="me-2" color="grey-lighten-2">
            <v-img
              v-if="reply.user_info?.avatar"
              :src="mfunsImageUrl(reply.user_info.avatar, 80)"
              cover
            />
          </v-avatar>
          <div class="min-width-0">
            <div class="d-flex align-center flex-wrap ga-1">
              <span
                class="text-body-2"
                :class="
                  reply.user_info?.name_color
                    ? reply.user_info.name_color.includes('--text')
                      ? reply.user_info.name_color
                      : `${reply.user_info.name_color}--text`
                    : undefined
                "
              >
                {{ reply.user_info?.name || '喵友' }}
              </span>
              <MfunsBadge
                v-for="badgeId in reply.user_info?.badges ?? []"
                :key="badgeId"
                :id="badgeId"
              />
            </div>
            <MfunsRichText
              class="text-body-2 text-medium-emphasis"
              :text="reply.content || ''"
              :type="1"
              :max-line="2"
            />
          </div>
        </div>
        <div class="text-link mt-1 text-body-2" style="margin-left: 32px">
          共{{ item.reply_count || 0 }}条回复
        </div>
      </v-sheet>
    </div>

    <div class="d-flex pl-16 mt-4 align-center">
      <div class="d-flex pa-1 text-medium-emphasis" style="width: 72px">
        <v-icon
          class="me-1"
          size="18"
          :icon="likeStatus.like?.is_active ? 'mdi-thumb-up' : 'mdi-thumb-up-outline'"
          :color="likeStatus.like?.is_active ? 'pink' : '#999'"
          @click="onLike"
        />
        <span :class="{ 'text-pink': likeStatus.like?.is_active }">
          {{ likeStatus.like?.count ?? 0 }}
        </span>
      </div>
      <div class="d-flex pa-1 text-medium-emphasis" style="width: 72px">
        <v-icon
          class="me-1"
          size="18"
          :icon="likeStatus.dislike?.is_active ? 'mdi-thumb-down' : 'mdi-thumb-down-outline'"
          :color="likeStatus.dislike?.is_active ? 'pink' : '#999'"
          @click="onDislike"
        />
        <span :class="{ 'text-pink': likeStatus.dislike?.is_active }">
          {{ likeStatus.dislike?.count ?? 0 }}
        </span>
      </div>
      <div v-if="!replay" class="d-flex pa-1 text-medium-emphasis" style="width: 72px">
        <v-icon class="me-1" icon="mdi-message-outline" size="18" color="#999" />
        <span v-if="item.reply_count">{{ item.reply_count }}</span>
      </div>
      <v-spacer />
      <span class="me-4 text-disabled text-caption" style="opacity: 0.6">
        No.{{ item.id }}
      </span>
    </div>
    <v-divider />

    <v-dialog v-model="previewOpen" max-width="900">
      <v-card color="black">
        <v-img v-if="previewList[previewIndex]" :src="previewList[previewIndex]" max-height="90vh" contain />
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" color="white" @click="previewOpen = false">关闭</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.comment-item__content {
  margin-top: 2px;
}

.text-link {
  color: rgb(var(--v-theme-link));
}

.text-pink {
  color: #e91e63;
}

.min-width-0 {
  min-width: 0;
}
</style>
