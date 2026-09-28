<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { createFeed } from '../../api/feedsApi'
import { readMemberAuthState } from '../../auth/memberSession'
import CreateRichEditor from '../../components/CreateRichEditor.vue'
import CreateTagDialog from '../../components/CreateTagDialog.vue'
import MediaLibrary from '../../components/MediaLibrary.vue'
import { useMemberAuth } from '../../composables/useMemberAuth'
import { registerCreateFeedPublish } from '../../composables/useCreateActions'
import { mfunsImageUrl } from '../../utils/mfunsImageUrl'
import { quillPlainText } from '../../utils/quillContent'

const MAX_IMAGES = 30

const router = useRouter()
const { isLoggedIn } = useMemberAuth()

const content = ref('')
const images = ref<string[]>([])
const tagList = ref<string[]>([])
const publishDialog = ref(false)
const publishLoading = ref(false)
const tagOpen = ref(false)
const mediaRef = ref<InstanceType<typeof MediaLibrary> | null>(null)
const snackbar = ref({ open: false, text: '', color: 'success' as string })

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

function plainText(raw: string) {
  return quillPlainText(raw)
}

function addTag(name: string) {
  const n = name.replace(/^#|#$/g, '').trim()
  if (!n || tagList.value.includes(n)) return
  if (tagList.value.length >= 10) {
    toast('最好不要超过10个话题', 'error')
    return
  }
  tagList.value.push(n)
}

function removeTag(index: number) {
  tagList.value.splice(index, 1)
}

function onImage(path: string) {
  if (!path) return
  if (images.value.length >= MAX_IMAGES) {
    toast(`图片数量超过了最大限制(${MAX_IMAGES}张)`, 'error')
    return
  }
  images.value.push(path)
}

function removeImage(index: number) {
  images.value.splice(index, 1)
}

function openMedia() {
  mediaRef.value?.open('select', MAX_IMAGES)
}

function openPublish() {
  if (!plainText(content.value) && images.value.length === 0) {
    toast('内容太短！', 'error')
  }
  publishDialog.value = true
}

async function doPublish() {
  const token = requireToken()
  if (!token) return
  publishLoading.value = true
  try {
    const res = await createFeed(content.value, images.value, tagList.value, token)
    if (res.code === 1) {
      const id = res.data?.resource_id
      content.value = ''
      images.value = []
      tagList.value = []
      publishDialog.value = false
      if (id) router.replace(`/feed/${id}`)
      else {
        toast('发布成功')
        router.replace('/timeline')
      }
    } else {
      toast(res.msg || '发布失败', 'error')
    }
  } finally {
    publishLoading.value = false
  }
}

const onBeforeUnload = (e: BeforeUnloadEvent) => {
  if (!plainText(content.value) && !images.value.length && !tagList.value.length) return
  e.preventDefault()
  e.returnValue = ''
}

let unreg: (() => void) | undefined

onMounted(() => {
  if (!isLoggedIn.value) {
    router.replace('/member/login')
    return
  }
  unreg = registerCreateFeedPublish(openPublish)
  window.addEventListener('beforeunload', onBeforeUnload)
})

onUnmounted(() => {
  unreg?.()
  window.removeEventListener('beforeunload', onBeforeUnload)
})
</script>

<template>
  <div class="create-feed-page create-shell-page">
    <!-- 参考站：cols 12 md8 offset-md2 lg6 offset-lg3 -->
    <v-container class="create-feed-page__container pt-0 pt-sm-1" fluid>
      <v-row>
        <v-col cols="12" md="8" offset-md="2" lg="6" offset-lg="3">
          <v-sheet class="pa-3 py-4 d-flex flex-column">
            <CreateRichEditor
              v-model="content"
              :height="200"
              limit
              :max-count="200"
              placeholder="分享新鲜事…"
            />
          </v-sheet>
          <v-divider />

          <!-- 参考 ImageSelect：dense row，cols 4 / sm 3 -->
          <v-sheet class="pa-3 py-4">
            <v-row dense>
              <v-col
                v-for="(img, i) in images"
                :key="`${img}-${i}`"
                class="item"
                cols="4"
                sm="3"
              >
                <v-card elevation="0">
                  <v-img :src="mfunsImageUrl(img, 300)" :aspect-ratio="1" cover>
                    <div class="d-flex justify-end pa-1">
                      <div class="delete-btn" @click="removeImage(i)">
                        <v-icon icon="mdi-close" color="white" />
                      </div>
                    </div>
                  </v-img>
                </v-card>
              </v-col>
              <v-col v-if="images.length < MAX_IMAGES" cols="4" sm="3">
                <v-responsive :aspect-ratio="1">
                  <div class="image-add" v-ripple role="button" @click="openMedia">
                    <v-icon icon="mdi-plus" size="24" />
                  </div>
                </v-responsive>
              </v-col>
            </v-row>
          </v-sheet>
          <v-divider />

          <v-sheet class="pa-3 py-4">
            <div class="d-flex justify-space-between align-center">
              <span>
                话题设置
                <span class="text-disabled">(最好不要超过10个)</span>
              </span>
              <v-btn icon variant="text" color="link" @click="tagOpen = true">
                <v-icon icon="mdi-plus" />
              </v-btn>
            </div>
            <div class="mt-2">
              <v-chip
                v-for="(tag, index) in tagList"
                :key="tag"
                class="me-2 mb-1"
                @click="removeTag(index)"
              >
                #{{ tag }}#
              </v-chip>
            </div>
          </v-sheet>
          <v-divider />
        </v-col>
      </v-row>
    </v-container>

    <CreateTagDialog v-model="tagOpen" @select="addTag" />
    <MediaLibrary ref="mediaRef" title="选择图片" @select="onImage" />

    <v-dialog v-model="publishDialog" max-width="400">
      <v-card>
        <v-card-title>
          <span class="text-h6">发表动态</span>
        </v-card-title>
        <v-card-text>
          <p>您确定要发布动态吗？</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" color="error" @click="publishDialog = false">取消</v-btn>
          <v-btn color="link" variant="text" :loading="publishLoading" @click="doPublish">
            确定
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
.create-feed-page__container {
  max-width: 1400px;
}

/* 参考 ImageSelect scoped：image-add / delete-btn */
.image-add {
  align-items: center;
  display: flex;
  height: 100%;
  justify-content: center;
  width: 100%;
  border: 1px dashed #999;
  border-radius: 6px;
  cursor: pointer;
}

.delete-btn {
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
}
</style>
