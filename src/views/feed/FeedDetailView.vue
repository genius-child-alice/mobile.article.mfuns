<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { deleteFeed, fetchFeedGet, type FeedItem } from '../../api/feedsApi'
import { fetchLikeStatus } from '../../api/likeApi'
import { readMemberAuthState } from '../../auth/memberSession'
import CommentSection from '../../components/CommentSection.vue'
import DynamicExtra from '../../components/DynamicExtra.vue'
import FeedMemberInfoRow from '../../components/FeedMemberInfoRow.vue'
import FollowBtn from '../../components/FollowBtn.vue'
import ForwardTool from '../../components/ForwardTool.vue'
import MfunsRichText from '../../components/MfunsRichText.vue'
import ReportsDialog from '../../components/ReportsDialog.vue'
import { useLikeToggle } from '../../composables/useLikeToggle'
import { useMemberAuth } from '../../composables/useMemberAuth'
import { useMemberProfile } from '../../composables/useMemberProfile'
import { stripHtml } from '../../utils/mfunsPlainText'
import { formatRelativeUnixTime } from '../../utils/mfunsTime'

const route = useRoute()
const router = useRouter()
const { isLoggedIn } = useMemberAuth()
const { memberInfo } = useMemberProfile()

const feedId = computed(() => Number(route.params.id))
const loading = ref(true)
const notFound = ref(false)
const data = ref<FeedItem | null>(null)
const deleteDialog = ref(false)
const snackbar = ref({ open: false, text: '', color: 'error' as string })

const shareRef = ref<InstanceType<typeof ForwardTool> | null>(null)
const reportsRef = ref<InstanceType<typeof ReportsDialog> | null>(null)

const { likeStatus, like, dislike, applyStatus } = useLikeToggle(() => feedId.value, 3)

const memberRow = computed(() => {
  const user = data.value?.user
  if (!user) return { name: '喵友' }
  const time = formatRelativeUnixTime(data.value?.created_at)
  const device = data.value?.device ? ` ${data.value.device}` : ''
  const views =
    data.value?.views != null ? ` ${data.value.views}浏览` : ''
  return {
    ...user,
    info: `${time}${device}${views}`.trim(),
  }
})

const isOwner = computed(
  () =>
    isLoggedIn.value &&
    memberInfo.value?.id != null &&
    data.value?.user?.id === memberInfo.value.id,
)

const shareTitle = computed(() => stripHtml(data.value?.content).slice(0, 20))
const pageUrl = computed(() => (typeof window !== 'undefined' ? window.location.href : ''))

function toast(text: string, color = 'error') {
  snackbar.value = { open: true, text, color }
}

function goBack() {
  if (window.history.length > 1) router.back()
  else router.push('/timeline')
}

async function load() {
  loading.value = true
  notFound.value = false
  try {
    const token = readMemberAuthState().token
    const res = await fetchFeedGet(feedId.value, token)
    if (res.code === 404) {
      notFound.value = true
      data.value = null
      return
    }
    if (res.code !== 1 || !res.data) {
      toast(res.msg || '加载失败')
      return
    }
    data.value = res.data
    applyStatus(res.data.like_status)

    if (isLoggedIn.value && token) {
      const st = await fetchLikeStatus(feedId.value, 3, token)
      if (st.code === 1) applyStatus(st.data?.status)
    }
  } finally {
    loading.value = false
  }
}

async function confirmDelete() {
  const token = readMemberAuthState().token
  if (!token) return
  const res = await deleteFeed(feedId.value, token)
  deleteDialog.value = false
  if (res.code === 1) {
    router.back()
  } else {
    toast(res.msg || '删除失败')
  }
}

watch(feedId, () => {
  if (Number.isFinite(feedId.value) && feedId.value > 0) void load()
})

onMounted(async () => {
  if (!Number.isFinite(feedId.value) || feedId.value <= 0) {
    notFound.value = true
    loading.value = false
    return
  }
  await load()
  if (notFound.value) router.replace('/404')
})
</script>

<template>
  <div class="feed-detail">
    <v-app-bar
      fixed
      location="top"
      color="primary"
      density="compact"
      elevation="4"
      class="text-white"
    >
      <v-btn icon variant="text" aria-label="返回" @click="goBack">
        <v-icon icon="mdi-arrow-left" />
      </v-btn>
      <v-toolbar-title>动态详情</v-toolbar-title>
      <v-spacer />
      <v-btn
        variant="text"
        :href="`mfuns://net.mfuns.app.asuka/feed/${feedId}`"
        class="text-none"
      >
        <v-icon icon="mdi-open-in-new" start />
        APP打开
      </v-btn>
    </v-app-bar>

    <div class="feed-detail__main">
    <v-progress-linear v-if="loading" color="pink" indeterminate />

    <div v-else-if="data" class="feed-detail__body">
      <div class="feed-detail__col">
        <v-sheet class="px-3 pt-2">
          <FeedMemberInfoRow :data="memberRow" to-user>
            <FollowBtn v-if="data.user?.id" :user-id="data.user.id" />
          </FeedMemberInfoRow>
        </v-sheet>

        <v-sheet class="pa-4 pt-0">
          <MfunsRichText
            class="py-2"
            :text="data.content"
            :type="data.content_type ?? 1"
          />
          <DynamicExtra :params="data.extra || {}" :type="data.extra_type ?? 0" />

          <v-chip
            v-for="tag in data.tags || []"
            :key="tag"
            class="mt-4 me-2"
            color="link"
            variant="outlined"
            @click="router.push(`/tag/${tag}`)"
          >
            # {{ tag }}
          </v-chip>

          <div class="d-flex mt-3 align-center">
            <div class="d-flex">
              <v-sheet
                class="d-flex justify-center align-center pa-2"
                v-ripple
                role="button"
                @click="like"
              >
                <v-icon
                  class="me-1"
                  size="22"
                  :color="likeStatus.like?.is_active ? 'link' : undefined"
                  :icon="likeStatus.like?.is_active ? 'mdi-thumb-up' : 'mdi-thumb-up-outline'"
                />
                <span class="text-body-1 text-medium-emphasis">
                  {{ likeStatus.like?.count || ' ' }}
                </span>
              </v-sheet>
              <v-sheet
                class="d-flex justify-center align-center pa-2 ms-3"
                style="min-width: 52px"
                v-ripple
                role="button"
                @click="dislike"
              >
                <v-icon
                  class="me-1"
                  size="22"
                  :color="likeStatus.dislike?.is_active ? 'link' : undefined"
                  :icon="
                    likeStatus.dislike?.is_active ? 'mdi-thumb-down' : 'mdi-thumb-down-outline'
                  "
                />
                <span class="text-body-1 text-medium-emphasis">
                  {{ likeStatus.dislike?.count || ' ' }}
                </span>
              </v-sheet>
              <v-sheet
                class="d-flex justify-center align-center pa-2 ms-3"
                style="min-width: 52px"
                v-ripple
                role="button"
                @click="shareRef?.show()"
              >
                <v-icon class="me-1" size="22" icon="mdi-share-variant" />
              </v-sheet>
            </div>
            <v-spacer />
            <v-menu location="bottom">
              <template #activator="{ props: menuProps }">
                <v-btn v-bind="menuProps" icon variant="text">
                  <v-icon icon="mdi-dots-vertical" />
                </v-btn>
              </template>
              <v-list>
                <v-list-item v-if="isOwner" title="删除动态" @click="deleteDialog = true" />
                <v-list-item title="举报不当内容" @click="reportsRef?.show(feedId, 3)" />
              </v-list>
            </v-menu>
          </div>
        </v-sheet>

        <v-divider />

        <v-sheet v-if="data.comment_area_id" class="mt-1">
          <CommentSection :area-id="data.comment_area_id" />
        </v-sheet>
      </div>
    </div>

    <ForwardTool
      ref="shareRef"
      :id="feedId"
      :type="3"
      :title="shareTitle"
      :content="pageUrl"
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

    <v-snackbar v-model="snackbar.open" :color="snackbar.color" timeout="2500">
      {{ snackbar.text }}
    </v-snackbar>
    </div>
  </div>
</template>

<style scoped>
.feed-detail__body {
  width: 100%;
}

.feed-detail__col {
  max-width: 640px;
  margin-inline: auto;
  width: 100%;
}

@media (min-width: 960px) {
  .feed-detail__col {
    max-width: 50%;
  }
}
</style>
