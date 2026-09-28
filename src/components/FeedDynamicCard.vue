<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'
import { deleteFeed, type FeedItem, type FeedUser } from '../api/feedsApi'
import { readMemberAuthState } from '../auth/memberSession'
import { useLikeToggle } from '../composables/useLikeToggle'
import { useMemberAuth } from '../composables/useMemberAuth'
import { useMemberProfile } from '../composables/useMemberProfile'
import { formatMfunsFeedDevice } from '../utils/mfunsFeedDevice'
import { mfunsImageUrl } from '../utils/mfunsImageUrl'
import { numberToSimplerText } from '../utils/mfunsNumber'
import { mfunsResourcePath } from '../utils/mfunsResourceUrl'
import { formatRelativeUnixTime } from '../utils/mfunsTime'
import DynamicExtra from './DynamicExtra.vue'
import ForwardTool from './ForwardTool.vue'
import MfunsBadge from './MfunsBadge.vue'
import MfunsRichText from './MfunsRichText.vue'
import ReportsDialog from './ReportsDialog.vue'

const props = defineProps<{
  data: FeedItem
}>()

const router = useRouter()
const { xs } = useDisplay()
const { isLoggedIn } = useMemberAuth()
const { memberInfo } = useMemberProfile()

const deleteDialog = ref(false)
const reportsRef = ref<InstanceType<typeof ReportsDialog> | null>(null)
const shareRef = ref<InstanceType<typeof ForwardTool> | null>(null)

const { likeStatus, like, dislike, applyStatus } = useLikeToggle(
  () => props.data.id,
  3,
  props.data.like_status,
)

const isForward = computed(() => props.data.content === '')

const displayUser = computed((): FeedUser => {
  if (isForward.value && props.data.extra?.user) {
    return props.data.extra.user
  }
  return props.data.user ?? { id: 0, name: '喵友' }
})

/** 举报/统计等用动态 id；正文与 extra 仍用接口原始字段 */
const contentData = computed(() => props.data)

const cardTitle = computed(() => {
  if (props.data.resource_type === 3 && props.data.extra?.resource?.title) {
    return props.data.extra.resource.title
  }
  return props.data.title
})

const richContent = computed(() => {
  if (isForward.value) return ''
  return props.data.content ?? ''
})

const richContentType = computed(() => props.data.content_type ?? 1)

const userSubtitle = computed(() => {
  if (isForward.value) {
    const r = props.data.extra?.resource
    const time = formatRelativeUnixTime(r?.created_at ?? props.data.created_at)
    const device = formatMfunsFeedDevice(r?.device)
    return `${time} 发布于${device}`
  }
  const time = formatRelativeUnixTime(props.data.created_at)
  const device = formatMfunsFeedDevice(props.data.device)
  return `${time} 发布于${device}`
})

const imagesMax = computed(() => (xs.value ? 3 : 4))
const avatarSrc = computed(() => mfunsImageUrl(displayUser.value.avatar, 80))
const forwardTime = computed(() => formatRelativeUnixTime(props.data.created_at))
const forwardAvatar = computed(() => mfunsImageUrl(props.data.user?.avatar, 100))

const isOwner = computed(
  () =>
    isLoggedIn.value &&
    memberInfo.value?.id != null &&
    props.data.user?.id === memberInfo.value.id,
)

const shareUrl = computed(() =>
  typeof window !== 'undefined' ? `${window.location.origin}/feed/${props.data.id}` : '',
)

function nameColorClass(raw: string | undefined): string | undefined {
  const color = raw?.trim()
  if (!color) return undefined
  if (color.includes('--text')) return color
  return `${color}--text`
}

function goMember(userId?: number, ev?: Event) {
  ev?.stopPropagation()
  if (!userId) return
  router.push(`/member/${userId}`)
}

function openCard() {
  const rt = props.data.resource_type
  const rid = props.data.resource_id ?? props.data.id
  if (rt != null && rid) {
    router.push(mfunsResourcePath(rt, rid))
    return
  }
  router.push(`/feed/${props.data.id}`)
}

async function confirmDelete() {
  const token = readMemberAuthState().token
  if (!token) return
  const res = await deleteFeed(props.data.id, token)
  deleteDialog.value = false
  if (res.code === 1) {
    window.location.reload()
  }
}

onMounted(() => {
  applyStatus(props.data.like_status)
})
</script>

<template>
  <v-sheet class="dynamic-card" tile elevation="0" role="button" tabindex="0" @click="openCard">
    <div
      v-if="isForward"
      class="dynamic-card__forward pl-4 pt-2"
      @click="goMember(data.user?.id, $event)"
    >
      <v-avatar size="26" class="me-2">
        <v-img v-if="forwardAvatar" :src="forwardAvatar" cover />
        <v-icon v-else icon="mdi-account" size="16" />
      </v-avatar>
      <span class="text-link dynamic-card__forward-text">
        @{{ data.user?.name || '喵友' }} 转发了
        <span class="text-disabled"> • </span>
        {{ forwardTime }}
      </span>
    </div>

    <div class="dynamic-card__body pa-4 pt-3">
      <div class="d-flex">
        <v-avatar
          size="44"
          class="dynamic-card__avatar flex-shrink-0 me-3"
          @click="goMember(displayUser.id, $event)"
        >
          <v-img v-if="avatarSrc" :src="avatarSrc" cover />
          <v-icon v-else icon="mdi-account" />
        </v-avatar>

        <div class="flex-grow-1 min-width-0">
          <div class="d-flex align-start mb-2">
            <div class="flex-grow-1 min-width-0">
              <div class="dynamic-card__username d-flex align-center flex-wrap">
                <span
                  class="text-body-1"
                  :class="nameColorClass(displayUser.name_color)"
                  @click="goMember(displayUser.id, $event)"
                >
                  {{ displayUser.name || '喵友' }}
                </span>
                <MfunsBadge
                  v-for="badgeId in displayUser.badges ?? []"
                  :key="badgeId"
                  :id="badgeId"
                  class="dynamic-card__badge"
                />
              </div>
              <div class="text-caption text-medium-emphasis dynamic-card__subtitle">
                {{ userSubtitle }}
              </div>
            </div>
            <v-menu location="bottom end" @click.stop>
              <template #activator="{ props: menuProps }">
                <v-btn v-bind="menuProps" icon variant="text" size="small" @click.stop>
                  <v-icon icon="mdi-dots-vertical" size="18" style="opacity: 0.4" />
                </v-btn>
              </template>
              <v-list density="compact">
                <v-list-item v-if="isOwner" title="删除动态" @click="deleteDialog = true" />
                <v-list-item
                  title="举报不当内容"
                  @click="reportsRef?.show(contentData.id, 3)"
                />
              </v-list>
            </v-menu>
          </div>

          <div v-if="cardTitle" class="text-subtitle-1 mb-1">
            {{ cardTitle }}
          </div>

          <MfunsRichText
            v-if="richContent"
            class="text-body-1"
            :text="richContent"
            :type="richContentType"
            :max-line="4"
          />

          <DynamicExtra
            v-if="data.extra_type != null || data.extra"
            class="my-2"
            :max-image="imagesMax"
            :params="data.extra || {}"
            :type="data.extra_type ?? 0"
          />

          <div v-if="data.tags?.length" class="dynamic-card__tags">
            <span v-for="tag in data.tags" :key="tag" class="pe-1">
              <a
                class="text-link text-body-2"
                href="#"
                @click.prevent.stop="router.push(`/tag/${tag}`)"
              >
                #{{ tag }}
              </a>
            </span>
          </div>

          <div class="d-flex justify-space-between justify-md-start mt-3 dynamic-card__actions">
            <v-btn
              variant="text"
              class="text-medium-emphasis px-1"
              density="comfortable"
              @click.stop="like()"
            >
              <v-icon
                class="me-1"
                size="18"
                :color="likeStatus.like?.is_active ? 'error' : undefined"
                :icon="likeStatus.like?.is_active ? 'mdi-thumb-up' : 'mdi-thumb-up-outline'"
              />
              <span v-if="likeStatus.like?.count">
                {{ numberToSimplerText(likeStatus.like?.count) }}
              </span>
            </v-btn>
            <v-btn
              variant="text"
              class="text-medium-emphasis px-1"
              density="comfortable"
              @click.stop="dislike()"
            >
              <v-icon
                class="me-1"
                size="18"
                :color="likeStatus.dislike?.is_active ? 'error' : undefined"
                :icon="
                  likeStatus.dislike?.is_active ? 'mdi-thumb-down' : 'mdi-thumb-down-outline'
                "
              />
              <span v-if="likeStatus.dislike?.count">
                {{ numberToSimplerText(likeStatus.dislike?.count) }}
              </span>
            </v-btn>
            <v-btn variant="text" class="text-medium-emphasis px-1" density="comfortable">
              <v-icon class="me-1" size="18" icon="mdi-comment-outline" />
              <span v-if="contentData.floor_count">
                {{ numberToSimplerText(contentData.floor_count) }}
              </span>
            </v-btn>
            <v-btn variant="text" class="text-medium-emphasis px-1" density="comfortable">
              <v-icon class="me-1" size="18" icon="mdi-eye-outline" />
              <span v-if="contentData.views">
                {{ numberToSimplerText(contentData.views) }}
              </span>
            </v-btn>
            <v-btn
              variant="text"
              class="text-medium-emphasis px-1"
              density="comfortable"
              @click.stop="shareRef?.show()"
            >
              <v-icon class="me-1" size="18" icon="mdi-share-variant" />
            </v-btn>
          </div>
        </div>
      </div>
    </div>

    <ForwardTool
      ref="shareRef"
      :id="data.id"
      :type="3"
      :title="displayUser.name || ''"
      :content="shareUrl"
    />
    <ReportsDialog ref="reportsRef" />

    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title>提示</v-card-title>
        <v-card-text>是否删除动态</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" color="link" @click="deleteDialog = false">手滑了</v-btn>
          <v-btn variant="text" color="error" @click="confirmDelete">确认删除</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-sheet>
</template>

<style scoped>
.dynamic-card {
  background: rgb(var(--v-theme-surface));
  cursor: pointer;
}

.dynamic-card__forward-text {
  font-size: 0.875rem;
  opacity: 0.8;
}

.dynamic-card__avatar {
  cursor: pointer;
  align-self: flex-start;
}

.dynamic-card__username {
  gap: 2px;
  line-height: 1.3;
}

.dynamic-card__badge {
  height: 22px;
}

.dynamic-card__subtitle {
  line-height: 1.35;
}

.dynamic-card__actions {
  min-height: 36px;
}

.dynamic-card__actions :deep(.v-btn) {
  min-width: 0;
  letter-spacing: 0;
}
</style>
