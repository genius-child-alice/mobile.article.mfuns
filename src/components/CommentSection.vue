<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useDisplay } from 'vuetify'
import { useRouter } from 'vue-router'
import {
  createComment,
  createCommentReply,
  deleteComment,
  fetchCommentAreaInfo,
  fetchCommentById,
  fetchCommentList,
  fetchCommentReplyList,
  pinComment,
  type CommentAreaInfo,
  type CommentItem as CommentItemData,
} from '../api/commentApi'
import { readMemberAuthState } from '../auth/memberSession'
import { useMemberAuth } from '../composables/useMemberAuth'
import { useMemberProfile } from '../composables/useMemberProfile'
import { plainTextToHtml } from '../utils/mfunsPlainText'
import { formatRelativeUnixTime } from '../utils/mfunsTime'
import { mfunsImageUrl } from '../utils/mfunsImageUrl'
import AuthRouter from './AuthRouter.vue'
import CommentItem from './CommentItem.vue'
import MediaLibrary from './MediaLibrary.vue'
import ReportsDialog from './ReportsDialog.vue'

const props = defineProps<{
  areaId: number
}>()

const router = useRouter()
const { xs, smAndUp } = useDisplay()
const { isLoggedIn } = useMemberAuth()
const { memberInfo } = useMemberProfile()

const loading = ref(true)
const commentList = ref<CommentItemData[]>([])
const commentInfo = ref<CommentAreaInfo>({})
const error = ref('暂时没有回复')
const downloadLoading = ref(false)
const page = ref(2)
const listNone = ref(false)
const order = ref<'desc' | 'asc'>('desc')
const pin = ref<CommentItemData | null>(null)

const commentDialog = ref(false)
const commentLoading = ref(false)
const commentText = ref('')
const commentImages = ref<string[]>([])

const replyDialog = ref(false)
const sendReplyDialog = ref(false)
const replayCommentId = ref(0)
const replayIndex = ref(0)
const replayList = ref<CommentItemData[]>([])
const replayUser = ref('')
const replyText = ref('')
const sendReplayLoading = ref(false)
const replayPage = ref(1)
const replayNoMore = ref(false)
const replayMoreLoading = ref(false)

const deleteDialog = ref(false)
const deleteCommentId = ref(0)
const deleteCommentIndex = ref(0)
const deleteIsReplay = ref(false)

const snackbar = ref({ open: false, text: '', color: 'success' as string })
const mediaLibraryRef = ref<InstanceType<typeof MediaLibrary> | null>(null)
const reportsRef = ref<InstanceType<typeof ReportsDialog> | null>(null)
const sentinelRef = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

const fullscreen = computed(() => xs.value)

function toast(text: string, color = 'success') {
  snackbar.value = { open: true, text, color }
}

function requireToken(): string | null {
  if (!isLoggedIn.value) {
    router.push('/member/login')
    return null
  }
  return readMemberAuthState().token
}

function mapComment(item: CommentItemData, index = 0, isReply = false): CommentItemData {
  const next = { ...item, user_info: item.user_info ? { ...item.user_info } : undefined }
  if (!next.user_info) next.user_info = { id: next.user_id ?? 0 }
  const relative = formatRelativeUnixTime(next.created_at) || '刚刚'
  if (isReply) {
    next.user_info.info = `${relative} ${index + 1}F`
  } else if (next.floor_num) {
    next.user_info.info = `${relative} ${next.floor_num}F`
  } else {
    next.user_info.info = relative
  }
  return next
}

async function loadInfo() {
  const token = readMemberAuthState().token
  const res = await fetchCommentAreaInfo(props.areaId, token)
  if (res.code === 1 && res.data) commentInfo.value = res.data
  else error.value = res.msg || '暂时没有回复'
}

async function loadPin() {
  const pinId = commentInfo.value.pin_floor_id
  if (!pinId) {
    pin.value = null
    return
  }
  const token = readMemberAuthState().token
  const res = await fetchCommentById(pinId, token)
  if (res.code === 1 && res.data?.comment) {
    pin.value = mapComment(res.data.comment)
  }
}

async function refresh() {
  loading.value = true
  try {
    await loadPin()
    const token = readMemberAuthState().token
    const res = await fetchCommentList(props.areaId, 1, order.value, token)
    const next: CommentItemData[] = []
    if (pin.value) next.push(pin.value)
    if (res.code === 1 && Array.isArray(res.data)) {
      for (const raw of res.data) {
        const mapped = mapComment(raw)
        if (pin.value && mapped.id === pin.value.id) continue
        next.push(mapped)
      }
    }
    commentList.value = next
    page.value = 2
    listNone.value = false
    if (!next.length) error.value = '暂时没有回复'
  } finally {
    loading.value = false
  }
}

async function nextPage() {
  const token = readMemberAuthState().token
  const res = await fetchCommentList(props.areaId, page.value, order.value, token)
  if (res.code === 1 && Array.isArray(res.data)) {
    commentList.value.push(...res.data.map((item) => mapComment(item)))
    page.value += 1
    if (res.data.length === 0) listNone.value = true
  }
}

async function onScrollIntersect(entries?: IntersectionObserverEntry[]) {
  const hit = !entries || entries.some((e) => e.isIntersecting)
  if (!hit || downloadLoading.value || listNone.value || loading.value) return
  downloadLoading.value = true
  try {
    await nextPage()
  } finally {
    downloadLoading.value = false
  }
}

function toggleOrder() {
  order.value = order.value === 'desc' ? 'asc' : 'desc'
  void refresh()
}

function openCreateComment() {
  if (!isLoggedIn.value) {
    router.push('/member/login')
    return
  }
  commentText.value = ''
  commentImages.value = []
  commentDialog.value = true
}

function openMediaLibrary() {
  mediaLibraryRef.value?.open('select', 1)
}

function onMediaSelect(filePath: string) {
  commentImages.value = [filePath]
}

async function submitComment() {
  const token = requireToken()
  if (!token) return

  const html = plainTextToHtml(commentText.value)
  if (!html && commentImages.value.length === 0) {
    toast('评论太短', 'error')
    return
  }

  commentLoading.value = true
  try {
    const res = await createComment(props.areaId, html, commentImages.value, token)
    if (res.code !== 1 || !res.data) {
      toast(res.msg || '评论失败', 'error')
      return
    }
    toast('评论成功')
    commentDialog.value = false
    commentInfo.value.floor_count = (commentInfo.value.floor_count ?? 0) + 1
    const floorNum = res.data.floor_num ?? (commentInfo.value.floor_num ?? 0) + 1
    const data: CommentItemData = {
      ...res.data,
      floor_num: floorNum,
      like_status: {
        like: { count: 0, is_active: false },
        dislike: { count: 0, is_active: false },
      },
      reply_count: 0,
      second_reply: [],
      user_info: {
        id: memberInfo.value?.id ?? 0,
        name: memberInfo.value?.name,
        avatar: memberInfo.value?.avatar,
        name_color: memberInfo.value?.name_color,
        level_id: memberInfo.value?.level_id,
        badges: memberInfo.value?.badges,
        info: `刚刚 ${floorNum}F`,
      },
    }
    commentList.value.unshift(data)
  } finally {
    commentLoading.value = false
  }
}

async function replayDialogOpen(commentId: number, index: number) {
  replayIndex.value = index
  replyDialog.value = true
  replayList.value = []
  replayCommentId.value = commentId
  replayNoMore.value = false
  replayPage.value = 1
  await replayLoad()
}

async function replayLoad() {
  replayMoreLoading.value = true
  try {
    const token = readMemberAuthState().token
    const res = await fetchCommentReplyList(replayCommentId.value, replayPage.value, token)
    if (res.code === 1 && Array.isArray(res.data)) {
      if (res.data.length === 0) {
        replayNoMore.value = true
      } else {
        replayList.value.push(
          ...res.data.map((item, i) => mapComment(item, replayList.value.length + i, true)),
        )
        replayPage.value += 1
      }
    }
  } finally {
    replayMoreLoading.value = false
  }
}

function openSendReply(commentId: number, index: number, userName?: string) {
  if (!isLoggedIn.value) {
    router.push('/member/login')
    return
  }
  if (typeof window !== 'undefined' && window.getSelection()?.toString()) return
  replayCommentId.value = commentId
  replayUser.value = userName || ''
  replayIndex.value = index
  replyText.value = ''
  sendReplyDialog.value = true
}

async function sendReplay() {
  const token = requireToken()
  if (!token) return
  const html = plainTextToHtml(replyText.value)
  if (!html) {
    toast('评论太短', 'error')
    return
  }

  sendReplayLoading.value = true
  try {
    const res = await createCommentReply(replayCommentId.value, html, token)
    if (res.code !== 1) {
      toast(res.msg || '回复失败', 'error')
      return
    }
    sendReplyDialog.value = false
    toast('回复成功')
    setTimeout(() => {
      void replayDialogOpen(replayCommentId.value, replayIndex.value)
    }, 200)
  } finally {
    sendReplayLoading.value = false
  }
}

function deleteFloor(index: number) {
  deleteCommentId.value = commentList.value[index]?.id ?? 0
  deleteCommentIndex.value = index
  deleteIsReplay.value = false
  deleteDialog.value = true
}

function deleteReplay(index: number) {
  deleteCommentId.value = replayList.value[index]?.id ?? 0
  deleteCommentIndex.value = index
  deleteIsReplay.value = true
  deleteDialog.value = true
}

async function confirmDelete() {
  const token = requireToken()
  if (!token) return
  const res = await deleteComment(deleteCommentId.value, token)
  if (res.code === 1) {
    if (deleteIsReplay.value) replayList.value.splice(deleteCommentIndex.value, 1)
    else commentList.value.splice(deleteCommentIndex.value, 1)
  } else {
    toast(res.msg || '删除失败', 'error')
  }
  deleteDialog.value = false
}

async function onPin(index: number) {
  const token = requireToken()
  if (!token) return
  const id = commentList.value[index]?.id
  if (!id) return
  const res = await pinComment(id, token, false)
  if (res.code === 1) {
    await loadInfo()
    await refresh()
  } else {
    toast(res.msg || '置顶失败', 'error')
  }
}

async function onCancelPin() {
  const token = requireToken()
  if (!token) return
  const id = commentInfo.value.pin_floor_id
  if (!id) return
  const res = await pinComment(id, token, true)
  if (res.code === 1) {
    await loadInfo()
    await refresh()
  } else {
    toast(res.msg || '取消失败', 'error')
  }
}

function bindObserver() {
  observer?.disconnect()
  if (!sentinelRef.value) return
  observer = new IntersectionObserver(
    (entries) => {
      void onScrollIntersect(entries)
    },
    { threshold: 0.5, rootMargin: '0px 0px 50px 0px' },
  )
  observer.observe(sentinelRef.value)
}

watch(
  () => props.areaId,
  async () => {
    loading.value = true
    await loadInfo()
    await refresh()
  },
)

onMounted(async () => {
  await loadInfo()
  await refresh()
  bindObserver()
})

onBeforeUnmount(() => {
  observer?.disconnect()
})
</script>

<template>
  <v-sheet elevation="0" class="comment-section">
    <div class="pa-4 d-flex align-center">
      <span class="text-body-1">评论</span>
      <span v-if="!loading" class="text-medium-emphasis ms-2">
        {{ commentInfo.floor_count ?? 0 }}
      </span>
      <v-progress-circular
        v-if="loading"
        class="ms-2"
        indeterminate
        size="16"
        width="2"
      />
      <v-spacer />
      <span class="text-body-2 text-medium-emphasis" role="button" @click="toggleOrder">
        {{ order === 'desc' ? '↓ 降序' : '↑ 升序' }}
      </span>
    </div>
    <v-divider />

    <div
      v-for="(item, index) in commentList"
      :key="item.id"
      class="d-flex flex-column"
      @click="openSendReply(item.id, index, item.user_info?.name)"
    >
      <CommentItem
        v-if="!item.is_delete"
        :source="item"
        show-second-reply
        :pin="item.id === commentInfo.pin_floor_id"
        :comment-info="commentInfo"
        @pin="onPin(index)"
        @cancel-pin="onCancelPin"
        @delete="deleteFloor(index)"
        @report="reportsRef?.show(item.id, 4)"
        @click="replayDialogOpen(item.id, index)"
      />
    </div>

    <div v-if="commentList.length === 0 && !loading" class="pa-4 text-medium-emphasis">
      {{ error }}
    </div>

    <div v-if="listNone" class="d-flex justify-center py-2">
      <span class="text-medium-emphasis">没有更多了</span>
    </div>
    <template v-if="downloadLoading">
      <div class="d-flex justify-center py-2">
        <span class="text-medium-emphasis">正在加载中</span>
      </div>
      <v-progress-linear color="link" indeterminate />
    </template>

    <div ref="sentinelRef" style="height: 20px" />

    <div class="comment-section__fab">
      <AuthRouter login>
        <v-btn color="pink" icon size="large" elevation="4" @click.stop="openCreateComment">
          <v-icon icon="mdi-pencil-plus-outline" />
        </v-btn>
      </AuthRouter>
    </div>

    <!-- 发表评论 -->
    <v-dialog
      v-model="commentDialog"
      :fullscreen="fullscreen"
      max-width="600"
      transition="slide-y-reverse-transition"
    >
      <v-card :height="smAndUp ? '520px' : '100%'">
        <v-toolbar color="primary" density="comfortable">
          <v-btn icon variant="text" @click="commentDialog = false">
            <v-icon icon="mdi-close" />
          </v-btn>
          <v-toolbar-title>发表一个评论</v-toolbar-title>
          <v-spacer />
          <v-btn variant="text" :loading="commentLoading" @click="submitComment">提交</v-btn>
        </v-toolbar>
        <v-card-text class="mt-2 px-3 overflow-auto">
          <v-textarea
            v-model="commentText"
            variant="outlined"
            color="link"
            rows="6"
            placeholder="说点什么…"
            hide-details
            auto-grow
          />
          <div class="d-flex align-center mt-3 ga-2">
            <v-btn variant="tonal" color="link" prepend-icon="mdi-image" @click="openMediaLibrary">
              添加图片
            </v-btn>
            <v-chip
              v-if="commentImages[0]"
              closable
              size="small"
              @click:close="commentImages = []"
            >
              已选 1 张
            </v-chip>
          </div>
          <v-img
            v-if="commentImages[0]"
            class="mt-3 rounded"
            :src="mfunsImageUrl(commentImages[0], 400)"
            max-height="160"
            max-width="160"
            cover
          />
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- 回复列表 -->
    <v-dialog
      v-if="commentList.length"
      v-model="replyDialog"
      :fullscreen="fullscreen"
      max-width="500"
      scrollable
      transition="slide-y-reverse-transition"
    >
      <v-card>
        <v-toolbar color="primary" density="compact" style="position: sticky; top: 0; z-index: 2">
          <v-btn icon variant="text" @click="replyDialog = false">
            <v-icon icon="mdi-close" />
          </v-btn>
          <v-toolbar-title>回复列表</v-toolbar-title>
        </v-toolbar>
        <v-card-text class="pa-0">
          <div
            v-ripple
            @click="
              openSendReply(
                replayCommentId,
                replayIndex,
                commentList[replayIndex]?.user_info?.name,
              )
            "
          >
            <CommentItem
              v-if="commentList[replayIndex]"
              :key="`main-${replayIndex}`"
              :source="commentList[replayIndex]!"
              @delete="replyDialog = false; deleteFloor(replayIndex)"
              @report="reportsRef?.show(commentList[replayIndex]!.id, 4)"
            />
          </div>
          <v-divider />
          <div class="pa-2 ms-2">楼层回复</div>
          <v-divider />
          <div
            v-for="(reply, rIndex) in replayList"
            :key="reply.id"
            v-ripple
            @click="openSendReply(replayCommentId, replayIndex, reply.user_info?.name)"
          >
            <CommentItem
              v-if="!reply.is_delete"
              replay
              :source="reply"
              @delete="deleteReplay(rIndex)"
              @report="reportsRef?.show(reply.id, 4)"
            />
          </div>
          <v-btn
            block
            variant="text"
            color="link"
            :disabled="replayNoMore"
            :loading="replayMoreLoading"
            @click="replayLoad"
          >
            {{ replayNoMore ? '已经没有了' : '加载更多' }}
          </v-btn>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- 发表回复 bottom sheet -->
    <v-bottom-sheet v-model="sendReplyDialog" max-width="500">
      <v-card>
        <div class="pa-4">
          {{ replayUser ? `回复给 ${replayUser}` : '发表回复' }}
        </div>
        <v-divider />
        <v-textarea
          v-model="replyText"
          class="mx-4 mt-2"
          variant="outlined"
          color="link"
          rows="3"
          hide-details
          auto-grow
          placeholder="写下你的回复…"
        />
        <v-divider />
        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="text"
            color="error"
            @click="
              replyText = '';
              sendReplyDialog = false
            "
          >
            取消
          </v-btn>
          <v-btn
            variant="text"
            color="link"
            :disabled="!replyText.trim()"
            :loading="sendReplayLoading"
            @click="sendReplay"
          >
            发表
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-bottom-sheet>

    <v-dialog v-model="deleteDialog" max-width="360">
      <v-card>
        <v-card-title>确认删除此评论？</v-card-title>
        <v-card-text>删除后无法恢复</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" color="link" @click="deleteDialog = false">取消</v-btn>
          <v-btn variant="text" color="error" @click="confirmDelete">删除</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <ReportsDialog ref="reportsRef" />
    <MediaLibrary ref="mediaLibraryRef" @select="onMediaSelect" />

    <v-snackbar v-model="snackbar.open" :color="snackbar.color" timeout="2500">
      {{ snackbar.text }}
    </v-snackbar>
  </v-sheet>
</template>

<style scoped>
.comment-section {
  position: relative;
}

.comment-section__fab {
  position: fixed;
  right: 16px;
  bottom: 24px;
  z-index: 5;
  width: auto;
}

.comment-section__fab :deep(.auth-router) {
  width: auto;
  display: inline-block;
}
</style>
