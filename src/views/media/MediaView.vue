<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'
import {
  deleteMediaItem,
  fetchMediaLibrary,
  sha256HexOfFile,
  uploadMediaBySha1,
  uploadMediaImage,
  type MfunsMediaFile,
} from '../../api/mediaApi'
import { readMemberAuthState } from '../../auth/memberSession'
import { useMemberAuth } from '../../composables/useMemberAuth'
import { formatUnixDatetime } from '../../utils/mfunsTime'
import { mfunsImageUrl } from '../../utils/mfunsImageUrl'

const MAX_COUNT = 100
const MAX_FILE_BYTES = 8 * 1024 * 1024
const MAX_GIF_BYTES = 2 * 1024 * 1024

const router = useRouter()
const { xs } = useDisplay()
const { isLoggedIn } = useMemberAuth()

const pending = ref<{ key: string; file: File; url: string; progress: number; error: string }[]>(
  [],
)
const uploading = ref(false)

const library = ref<MfunsMediaFile[]>([])
const loading = ref(false)
const loadingMore = ref(false)
const notMore = ref(false)

const detailOpen = ref(false)
const current = ref<MfunsMediaFile | null>(null)
const deleteOpen = ref(false)
const deleting = ref(false)

const snackbar = ref({ open: false, text: '', color: 'success' as string })

const uploadLabel = computed(() => `上传媒体 ( ${pending.value.length} / ${MAX_COUNT} )`)

function toast(text: string, color = 'success') {
  snackbar.value = { open: true, text, color }
}

function requireToken(): string | null {
  const { token, isLogin } = readMemberAuthState()
  if (!isLogin || !token) {
    router.replace('/member/login')
    return null
  }
  return token
}

function thumb(path?: string, size = 300) {
  return mfunsImageUrl(path, size) || ''
}

async function loadLibrary(reset = false) {
  const token = requireToken()
  if (!token) return

  if (reset) {
    library.value = []
    notMore.value = false
  }
  if (notMore.value) return

  const isFirst = library.value.length === 0 || reset
  if (isFirst) loading.value = true
  else loadingMore.value = true

  try {
    const lastId = reset ? 0 : (library.value[library.value.length - 1]?.id ?? 0)
    const res = await fetchMediaLibrary(token, lastId)
    if (res.code !== 1 || !Array.isArray(res.data?.images)) {
      notMore.value = true
      return
    }
    if (res.data.images.length === 0) {
      notMore.value = true
      return
    }
    library.value.push(...res.data.images)
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

function onPickFiles(ev: Event) {
  const input = ev.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  input.value = ''
  if (!files.length) return

  const accept = files.filter(
    (f) =>
      /image\/(png|jpeg|jpg|gif|webp|svg\+xml)/i.test(f.type) ||
      /\.(png|jpe?g|gif|webp|svg)$/i.test(f.name),
  )
  if (!accept.length) {
    toast('仅支持 png / jpeg / gif / webp / svg', 'error')
    return
  }

  const room = MAX_COUNT - pending.value.length
  for (const file of accept.slice(0, Math.max(0, room))) {
    if (file.type === 'image/gif' && file.size > MAX_GIF_BYTES) {
      toast('GIF 不能超过 2MB', 'error')
      continue
    }
    if (file.size > MAX_FILE_BYTES) {
      toast('单文件不能超过 8MB', 'error')
      continue
    }
    pending.value.push({
      key: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
      file,
      url: URL.createObjectURL(file),
      progress: 0,
      error: '',
    })
  }
}

function removePending(key: string) {
  const idx = pending.value.findIndex((x) => x.key === key)
  if (idx < 0) return
  URL.revokeObjectURL(pending.value[idx].url)
  pending.value.splice(idx, 1)
}

async function startUpload() {
  const token = requireToken()
  if (!token) return
  if (!pending.value.length) {
    toast('请先选择图片', 'error')
    return
  }

  uploading.value = true
  try {
    for (const item of pending.value) {
      item.error = ''
      try {
        const hash = await sha256HexOfFile(item.file)
        const shaRes = await uploadMediaBySha1(token, hash, item.file.name)
        if (shaRes.code === 1 && shaRes.data?.file?.file_path) {
          item.progress = 1
          continue
        }
        const upRes = await uploadMediaImage(token, item.file, (r) => {
          item.progress = r
        })
        if (upRes.code !== 1 || !upRes.data?.file?.file_path) {
          item.error = upRes.msg || shaRes.msg || '上传失败'
        } else {
          item.progress = 1
        }
      } catch (e) {
        item.error = e instanceof Error ? e.message : '上传失败'
      }
    }
    const ok = pending.value.every((x) => !x.error && x.progress >= 1)
    if (ok) {
      for (const x of pending.value) URL.revokeObjectURL(x.url)
      pending.value = []
      toast('上传完成')
      await loadLibrary(true)
    } else {
      toast('部分文件上传失败', 'error')
    }
  } finally {
    uploading.value = false
  }
}

function openDetail(item: MfunsMediaFile) {
  current.value = item
  detailOpen.value = true
}

async function confirmDelete() {
  const token = requireToken()
  const id = current.value?.id
  if (!token || id == null) return
  deleting.value = true
  try {
    const res = await deleteMediaItem(token, id)
    if (res.code === 1) {
      toast('已删除')
      deleteOpen.value = false
      detailOpen.value = false
      library.value = library.value.filter((x) => x.id !== id)
    } else {
      toast(res.msg || '删除失败', 'error')
    }
  } finally {
    deleting.value = false
  }
}

onMounted(() => {
  if (!isLoggedIn.value) {
    router.replace('/member/login')
    return
  }
  void loadLibrary(true)
})
</script>

<template>
  <div class="media-page">
    <v-container fluid class="media-page__container py-3">
      <v-card class="mb-3" elevation="1">
        <v-card-subtitle class="pt-3">{{ uploadLabel }}</v-card-subtitle>
        <v-card-text>
          <div class="media-page__grid">
            <div v-for="item in pending" :key="item.key" class="media-page__cell">
              <v-img :src="item.url" cover aspect-ratio="1" class="rounded">
                <div v-if="item.progress > 0 && item.progress < 1" class="media-page__progress">
                  <v-progress-linear :model-value="item.progress * 100" color="link" height="4" />
                </div>
              </v-img>
              <v-btn
                class="media-page__remove"
                icon
                size="x-small"
                variant="flat"
                color="error"
                @click="removePending(item.key)"
              >
                <v-icon icon="mdi-close" size="14" />
              </v-btn>
              <div v-if="item.error" class="text-caption text-error mt-1">{{ item.error }}</div>
            </div>

            <label v-if="pending.length < MAX_COUNT" class="media-page__add">
              <v-icon icon="mdi-plus" size="32" />
              <input
                type="file"
                accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
                multiple
                hidden
                @change="onPickFiles"
              />
            </label>
          </div>

          <v-btn
            class="mt-3"
            color="link"
            variant="flat"
            :loading="uploading"
            :disabled="!pending.length"
            @click="startUpload"
          >
            开始上传
          </v-btn>
        </v-card-text>
      </v-card>

      <v-card elevation="1">
        <v-card-title class="text-body-1">媒体库</v-card-title>
        <v-card-text>
          <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-2" />
          <div v-else-if="library.length === 0" class="text-medium-emphasis text-center py-8">
            暂无媒体
          </div>
          <div v-else class="media-page__grid">
            <button
              v-for="item in library"
              :key="item.id"
              type="button"
              class="media-page__cell media-page__cell--link"
              @click="openDetail(item)"
            >
              <v-img :src="thumb(item.file_path)" cover aspect-ratio="1" class="rounded" />
            </button>
          </div>
          <div class="text-center mt-3">
            <v-btn
              v-if="!notMore && library.length"
              variant="text"
              color="link"
              :loading="loadingMore"
              @click="loadLibrary(false)"
            >
              加载更多
            </v-btn>
            <span v-else-if="library.length" class="text-caption text-medium-emphasis">
              没有更多了
            </span>
          </div>
        </v-card-text>
      </v-card>
    </v-container>

    <v-dialog v-model="detailOpen" :fullscreen="xs" :max-width="560" scrollable>
      <v-card v-if="current">
        <v-img :src="thumb(current.file_path, 1000)" max-height="360" contain />
        <v-card-text>
          <div>上传时间：{{ formatUnixDatetime(current.created_at) }}</div>
          <div>文件名：{{ current.file_name || '—' }}</div>
          <div>
            尺寸：{{ current.width ?? '—' }} × {{ current.height ?? '—' }}
          </div>
        </v-card-text>
        <v-card-actions>
          <v-btn color="error" variant="text" @click="deleteOpen = true">删除文件</v-btn>
          <v-spacer />
          <v-btn variant="text" @click="detailOpen = false">关闭</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteOpen" max-width="300">
      <v-card>
        <v-card-title class="text-body-1">确认删除？</v-card-title>
        <v-card-text>
          删除后，引用该文件的内容可能无法正常显示。
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteOpen = false">取消</v-btn>
          <v-btn color="error" variant="text" :loading="deleting" @click="confirmDelete">
            删除
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.open" :color="snackbar.color" timeout="2500">
      {{ snackbar.text }}
    </v-snackbar>
  </div>
</template>

<style scoped>
.media-page__container {
  max-width: 1400px;
}

.media-page__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 8px;
}

.media-page__cell {
  position: relative;
  min-width: 0;
}

.media-page__cell--link {
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
}

.media-page__add {
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 1;
  border: 1px dashed rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 4px;
  cursor: pointer;
  color: rgba(var(--v-theme-on-surface), 0.54);
}

.media-page__remove {
  position: absolute !important;
  top: 2px;
  right: 2px;
}

.media-page__progress {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
}
</style>
