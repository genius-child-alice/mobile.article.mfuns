<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useDisplay } from 'vuetify'
import {
  fetchMediaLibrary,
  sha256HexOfFile,
  uploadMediaBySha1,
  uploadMediaImage,
  uploadMediaImageUrl,
  type MfunsMediaFile,
} from '../api/mediaApi'
import { readMemberAuthState } from '../auth/memberSession'
import { mfunsImageUrl } from '../utils/mfunsImageUrl'

const props = withDefaults(
  defineProps<{
    title?: string
  }>(),
  { title: '加载媒体' },
)

const emit = defineEmits<{
  select: [filePath: string]
}>()

const { xs, smAndUp } = useDisplay()

const dialog = ref(false)
const tab = ref(0)
const maxCount = ref(1)
const action = ref('select')

const picking = ref(false)
const uploadError = ref('')
const uploadProgress = ref(0)
const pendingFiles = ref<File[]>([])
const previewUrls = ref<string[]>([])

const library = ref<MfunsMediaFile[]>([])
const libraryLoading = ref(false)
const libraryLoadingMore = ref(false)
const libraryNotMore = ref(false)
const previewItem = ref<MfunsMediaFile | null>(null)
const previewOpen = ref(false)

const externalUrl = ref('')
const externalLoading = ref(false)
const externalError = ref('')

const fullscreen = computed(() => xs.value)
const cardHeight = computed(() => (smAndUp.value ? '500px' : '100%'))

function requireToken(): string | null {
  return readMemberAuthState().token
}

function revokePreviews() {
  for (const url of previewUrls.value) URL.revokeObjectURL(url)
  previewUrls.value = []
}

function close() {
  dialog.value = false
}

function emitSelect(filePath: string) {
  if (!filePath) return
  emit('select', filePath)
  close()
}

async function loadLibrary(reset = false) {
  const token = requireToken()
  if (!token) return

  if (reset) {
    library.value = []
    libraryNotMore.value = false
  }
  if (libraryNotMore.value) return

  const isFirst = library.value.length === 0 || reset
  if (isFirst) libraryLoading.value = true
  else libraryLoadingMore.value = true

  try {
    const lastId = reset ? 0 : (library.value[library.value.length - 1]?.id ?? 0)
    const res = await fetchMediaLibrary(token, lastId)
    if (res.code !== 1 || !Array.isArray(res.data?.images)) {
      libraryNotMore.value = true
      return
    }
    if (res.data.images.length === 0) {
      libraryNotMore.value = true
      return
    }
    library.value.push(...res.data.images)
  } finally {
    libraryLoading.value = false
    libraryLoadingMore.value = false
  }
}

function open(nextAction = 'select', nextMaxCount = 100) {
  action.value = nextAction || 'select'
  maxCount.value = nextMaxCount
  tab.value = 0
  uploadError.value = ''
  externalError.value = ''
  externalUrl.value = ''
  picking.value = false
  uploadProgress.value = 0
  pendingFiles.value = []
  revokePreviews()
  previewItem.value = null
  previewOpen.value = false
  dialog.value = true
  void loadLibrary(true)
}

function openPreview(item: MfunsMediaFile) {
  previewItem.value = item
  previewOpen.value = true
}

function onPickFiles(ev: Event) {
  const input = ev.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  input.value = ''
  if (!files.length) return

  const accept = files.filter((f) =>
    /image\/(png|jpeg|jpg|gif|webp|svg\+xml)/i.test(f.type) ||
    /\.(png|jpe?g|gif|webp|svg)$/i.test(f.name),
  )
  if (!accept.length) {
    uploadError.value = '仅支持 png / jpeg / gif / webp / svg'
    return
  }

  const limited = accept.slice(0, maxCount.value)
  for (const file of limited) {
    if (file.type === 'image/gif' && file.size > 2 * 1024 * 1024) {
      uploadError.value = 'GIF 不能超过 2MB'
      return
    }
  }

  revokePreviews()
  pendingFiles.value = limited
  previewUrls.value = limited.map((f) => URL.createObjectURL(f))
  uploadError.value = ''
}

async function startUpload() {
  const token = requireToken()
  if (!token) {
    uploadError.value = '请先登录'
    return
  }
  if (!pendingFiles.value.length) {
    uploadError.value = '请先选择图片'
    return
  }

  picking.value = true
  uploadError.value = ''
  uploadProgress.value = 0

  try {
    for (const file of pendingFiles.value) {
      const hash = await sha256HexOfFile(file)
      const shaRes = await uploadMediaBySha1(token, hash, file.name)
      const shaPath = shaRes.data?.file?.file_path
      if (shaRes.code === 1 && shaPath) {
        emitSelect(shaPath)
        return
      }

      const upRes = await uploadMediaImage(token, file, (r) => {
        uploadProgress.value = r
      })
      const path = upRes.data?.file?.file_path
      if (upRes.code === 1 && path) {
        emitSelect(path)
        return
      }
      uploadError.value = upRes.msg || shaRes.msg || '上传失败'
    }
  } catch (e) {
    uploadError.value = e instanceof Error ? e.message : '上传失败'
  } finally {
    picking.value = false
  }
}

async function insertExternal() {
  const url = externalUrl.value.trim()
  if (!url.startsWith('https://')) {
    externalError.value = '仅允许使用 https:// 开头的链接'
    return
  }
  const token = requireToken()
  if (!token) {
    externalError.value = '请先登录'
    return
  }

  externalLoading.value = true
  externalError.value = ''
  try {
    const res = await uploadMediaImageUrl(token, url)
    const path = res.data?.file?.file_path
    if (res.code === 1 && path) {
      emitSelect(path)
    } else {
      externalError.value = res.msg || '插入失败'
    }
  } catch (e) {
    externalError.value = e instanceof Error ? e.message : '插入失败'
  } finally {
    externalLoading.value = false
  }
}

function selectFromLibrary(item: MfunsMediaFile) {
  if (!item.file_path) return
  previewOpen.value = false
  emitSelect(item.file_path)
}

watch(dialog, (open) => {
  if (!open) {
    revokePreviews()
    pendingFiles.value = []
    previewItem.value = null
    previewOpen.value = false
  }
})

watch(previewOpen, (open) => {
  if (!open) previewItem.value = null
})

defineExpose({ open, close })
</script>

<template>
  <v-dialog
    v-model="dialog"
    :fullscreen="fullscreen"
    max-width="500"
    persistent
    transition="slide-y-reverse-transition"
  >
    <v-card :height="cardHeight" class="media-library d-flex flex-column">
      <v-toolbar color="primary" density="compact" elevation="1">
        <v-btn icon variant="text" color="white" aria-label="关闭" @click="close">
          <v-icon icon="mdi-close" />
        </v-btn>
        <v-toolbar-title class="text-white">{{ title }}</v-toolbar-title>
        <template #extension>
          <v-tabs v-model="tab" color="white" align-tabs="title" bg-color="primary">
            <v-tab :value="0">上传文件</v-tab>
            <v-tab :value="1">媒体库</v-tab>
            <v-tab :value="2">外部url</v-tab>
          </v-tabs>
        </template>
      </v-toolbar>

      <v-tabs-window v-model="tab" class="media-library__body flex-grow-1">
        <!-- 上传 -->
        <v-tabs-window-item :value="0" class="pa-3">
          <input
            id="media-library-file"
            type="file"
            class="d-none"
            accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml,.png,.jpg,.jpeg,.gif,.webp,.svg"
            :multiple="maxCount > 1"
            @change="onPickFiles"
          />
          <label for="media-library-file" class="media-library__drop text-center d-block pa-6">
            <v-icon icon="mdi-cloud-upload" size="40" class="mb-2" />
            <div class="text-body-2">点击选择图片</div>
            <div class="text-caption text-medium-emphasis mt-1">
              支持 png / jpeg / gif / webp / svg
              <template v-if="maxCount === 1">（最多 1 张）</template>
            </div>
          </label>

          <div v-if="previewUrls.length" class="media-library__previews d-flex flex-wrap ga-2 mt-3">
            <v-img
              v-for="(url, i) in previewUrls"
              :key="url"
              :src="url"
              width="96"
              height="96"
              cover
              class="rounded"
              :alt="pendingFiles[i]?.name || 'preview'"
            />
          </div>

          <v-progress-linear
            v-if="picking"
            :model-value="uploadProgress * 100"
            color="primary"
            class="mt-3"
          />
          <v-alert v-if="uploadError" type="error" density="compact" variant="tonal" class="mt-3">
            {{ uploadError }}
          </v-alert>
          <v-btn
            class="mt-3"
            color="primary"
            block
            :loading="picking"
            :disabled="!pendingFiles.length"
            @click="startUpload"
          >
            开始上传
          </v-btn>
        </v-tabs-window-item>

        <!-- 媒体库 -->
        <v-tabs-window-item :value="1" class="pa-2 media-library__lib">
          <v-progress-linear v-if="libraryLoading" indeterminate color="primary" />
          <div v-else-if="library.length === 0" class="text-center text-medium-emphasis py-8">
            暂无媒体
          </div>
          <div v-else class="media-library__grid">
            <button
              v-for="item in library"
              :key="item.id ?? item.file_path"
              type="button"
              class="media-library__thumb"
              @click="openPreview(item)"
            >
              <v-img
                :src="mfunsImageUrl(item.file_path, 300)"
                aspect-ratio="1"
                cover
                class="rounded"
              />
            </button>
          </div>
          <div v-if="library.length > 0 && !libraryNotMore" class="text-center py-2">
            <v-btn
              variant="text"
              color="link"
              :loading="libraryLoadingMore"
              @click="loadLibrary()"
            >
              加载更多
            </v-btn>
          </div>
        </v-tabs-window-item>

        <!-- 外部 URL -->
        <v-tabs-window-item :value="2" class="pa-3">
          <p class="text-body-2 text-medium-emphasis mb-3">
            插入外部文件 url，仅允许使用 https:// 开头的链接
          </p>
          <v-text-field
            v-model="externalUrl"
            label="https://…"
            variant="outlined"
            density="comfortable"
            hide-details="auto"
            :disabled="externalLoading"
          />
          <v-alert
            v-if="externalError"
            type="error"
            density="compact"
            variant="tonal"
            class="mt-3"
          >
            {{ externalError }}
          </v-alert>
          <v-btn
            class="mt-3"
            color="primary"
            block
            :loading="externalLoading"
            @click="insertExternal"
          >
            插入
          </v-btn>
        </v-tabs-window-item>
      </v-tabs-window>
    </v-card>

    <v-dialog v-model="previewOpen" max-width="420">
      <v-card v-if="previewItem">
        <v-img :src="mfunsImageUrl(previewItem.file_path, 1000)" max-height="320" contain />
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="previewOpen = false">取消</v-btn>
          <v-btn color="success" variant="text" @click="selectFromLibrary(previewItem)">
            选择此图片
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-dialog>
</template>

<style scoped>
.media-library__body {
  min-height: 0;
  overflow: auto;
}

.media-library__drop {
  border: 1px dashed rgba(var(--v-theme-on-surface), 0.24);
  border-radius: 8px;
  cursor: pointer;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
}

.media-library__drop:hover {
  border-color: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-primary));
}

.media-library__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.media-library__thumb {
  border: none;
  padding: 0;
  background: transparent;
  cursor: pointer;
  border-radius: 6px;
  overflow: hidden;
}
</style>
