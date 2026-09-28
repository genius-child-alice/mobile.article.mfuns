<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchArticleCategories } from '../../api/categoryApi'
import {
  createContributeArticle,
  fetchContributeGet,
  updateContributeArticle,
} from '../../api/contributeApi'
import { readMemberAuthState } from '../../auth/memberSession'
import CreateCategoryDialog from '../../components/CreateCategoryDialog.vue'
import CreateRichEditor from '../../components/CreateRichEditor.vue'
import CreateTagDialog from '../../components/CreateTagDialog.vue'
import MediaLibrary from '../../components/MediaLibrary.vue'
import { useMemberAuth } from '../../composables/useMemberAuth'
import {
  registerCreateArticlePublish,
  registerCreateArticleSave,
  setCreateArticleTitle,
} from '../../composables/useCreateActions'
import { findCategoryPath } from '../../utils/categoryLookup'
import { mfunsImageUrl } from '../../utils/mfunsImageUrl'
import { quillPlainText } from '../../utils/quillContent'

const route = useRoute()
const router = useRouter()
const { isLoggedIn } = useMemberAuth()

const title = ref('')
const content = ref('')
const cid = ref(0)
const cateName = ref('请选择分类')
const tagList = ref<string[]>([])
const cover = ref('')
const copyright = ref(2)
const editId = ref(0)
const result = ref('')
const published = ref(false)

const publishDialog = ref(false)
const publishLoading = ref(false)
const categoryOpen = ref(false)
const tagOpen = ref(false)
const mediaRef = ref<InstanceType<typeof MediaLibrary> | null>(null)
const snackbar = ref({ open: false, text: '', color: 'success' as string })

const isEdit = computed(() => editId.value > 0)

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

function validate(forPublish: boolean): boolean {
  if (!title.value.trim()) {
    toast('请输入标题', 'error')
    return false
  }
  if (forPublish) {
    if (!plainText(content.value)) {
      toast('请输入正文', 'error')
      return false
    }
    if (!cid.value) {
      toast('请选择分类', 'error')
      return false
    }
    if (!tagList.value.length) {
      toast('请至少选择一个标签', 'error')
      return false
    }
  }
  return true
}

function buildBody(draft: boolean) {
  return {
    title: title.value.trim(),
    content: content.value,
    cid: cid.value,
    tags: tagList.value.join(','),
    cover: cover.value,
    copyright: copyright.value,
    draft,
  }
}

async function saveDraft() {
  const token = requireToken()
  if (!token) return
  if (!validate(false)) return

  publishLoading.value = true
  try {
    if (editId.value) {
      const res = await updateContributeArticle(
        { contribute_id: editId.value, ...buildBody(true) },
        token,
      )
      if (res.code === 1) toast('已保存至草稿')
      else toast(res.msg || '保存失败', 'error')
    } else {
      const res = await createContributeArticle(buildBody(true), token)
      if (res.code === 1) {
        const id = res.data?.contribute?.id
        if (id) {
          editId.value = id
          setCreateArticleTitle('更新投稿')
          router.replace({ path: '/create/article', query: { edit: String(id) } })
        }
        toast('已保存至草稿')
      } else {
        toast(res.msg || '保存失败', 'error')
      }
    }
  } finally {
    publishLoading.value = false
  }
}

async function doPublish() {
  const token = requireToken()
  if (!token) return
  if (!validate(true)) {
    publishDialog.value = false
    return
  }

  publishLoading.value = true
  try {
    if (editId.value) {
      const res = await updateContributeArticle(
        { contribute_id: editId.value, ...buildBody(false) },
        token,
      )
      if (res.code === 1) {
        published.value = true
        toast('更新成功')
        publishDialog.value = false
      } else {
        toast(res.msg || '发布失败', 'error')
      }
    } else {
      const res = await createContributeArticle(buildBody(false), token)
      if (res.code === 1) {
        published.value = true
        publishDialog.value = false
        router.replace('/create/success')
      } else {
        toast(res.msg || '发布失败', 'error')
      }
    }
  } finally {
    publishLoading.value = false
  }
}

function openPublish() {
  if (!validate(true)) return
  publishDialog.value = true
}

function addTag(name: string) {
  const n = name.replace(/^#|#$/g, '').trim()
  if (!n) return
  if (tagList.value.includes(n)) return
  if (tagList.value.length >= 10) {
    toast('最好不要超过10个话题', 'error')
    return
  }
  tagList.value.push(n)
}

function removeTag(index: number) {
  tagList.value.splice(index, 1)
}

function onCategory(payload: { id: number; name: string }) {
  cid.value = payload.id
  cateName.value = payload.name
}

function onCover(path: string) {
  cover.value = path
}

async function loadEdit(id: number) {
  const token = requireToken()
  if (!token) return
  const res = await fetchContributeGet(id, token)
  const c = res.data?.contribute
  if (res.code !== 1 || !c) {
    toast(res.msg || '加载稿件失败', 'error')
    return
  }
  editId.value = c.id
  title.value = c.title ?? ''
  content.value = c.content ?? ''
  cid.value = c.category_id ?? 0
  cateName.value = '请选择分类'
  if (cid.value) {
    try {
      const catRes = await fetchArticleCategories(token)
      if (catRes.code === 1 && Array.isArray(catRes.data)) {
        const found = findCategoryPath(catRes.data, cid.value)
        cateName.value = found?.name ?? `分区 #${cid.value}`
      } else {
        cateName.value = `分区 #${cid.value}`
      }
    } catch {
      cateName.value = `分区 #${cid.value}`
    }
  }
  cover.value = c.cover ?? ''
  copyright.value = c.copyright ?? 2
  result.value = c.result?.reason ?? ''
  if (Array.isArray(c.tags)) tagList.value = c.tags.map(String)
  else if (typeof c.tags === 'string' && c.tags)
    tagList.value = c.tags.split(',').map((s) => s.trim()).filter(Boolean)
  setCreateArticleTitle('更新投稿')
}

const onBeforeUnload = (e: BeforeUnloadEvent) => {
  if (published.value) return
  if (!title.value && !plainText(content.value) && !tagList.value.length) return
  e.preventDefault()
  e.returnValue = ''
}

let unregSave: (() => void) | undefined
let unregPublish: (() => void) | undefined

onMounted(() => {
  if (!isLoggedIn.value) {
    router.replace('/member/login')
    return
  }
  unregSave = registerCreateArticleSave(() => {
    void saveDraft()
  })
  unregPublish = registerCreateArticlePublish(openPublish)
  window.addEventListener('beforeunload', onBeforeUnload)

  const edit = Number(route.query.edit)
  if (Number.isFinite(edit) && edit > 0) {
    void loadEdit(edit)
  } else {
    setCreateArticleTitle(null)
  }
})

onUnmounted(() => {
  unregSave?.()
  unregPublish?.()
  setCreateArticleTitle(null)
  window.removeEventListener('beforeunload', onBeforeUnload)
})
</script>

<template>
  <div class="create-article-page create-shell-page">
    <v-container class="create-article-page__container pt-0 pt-sm-1" fluid>
      <v-row>
        <!-- 主栏：标题 + 编辑器 -->
        <v-col cols="12" sm="8">
          <v-alert v-if="result" color="error" theme="dark" class="ma-3">
            审核未通过: {{ result }}
          </v-alert>

          <v-sheet class="pa-3">
            <v-text-field
              v-model="title"
              label="标题"
              color="link"
              variant="underlined"
              hide-details
              required
            />
          </v-sheet>
          <v-divider />
          <v-sheet class="pa-3">
            <CreateRichEditor
              v-model="content"
              :height="400"
              :max-count="100000"
            />
          </v-sheet>
          <v-divider />
        </v-col>

        <!-- 侧栏：话题 / 分区 / 封面 / 版权 -->
        <v-col cols="12" sm="4">
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

          <v-sheet
            class="pa-3 py-4 d-flex"
            v-ripple
            style="cursor: pointer"
            @click="categoryOpen = true"
          >
            <span>分区选择</span>
            <v-spacer />
            <span class="link--text">{{ cateName }}</span>
          </v-sheet>
          <v-divider />

          <v-sheet class="pa-3 py-4">
            <div class="d-flex justify-space-between align-center">
              <span>文章封面图</span>
              <v-btn variant="text" color="link" @click="mediaRef?.open('cover', 1)">
                选择
              </v-btn>
            </div>
            <div class="mt-2">
              <v-img
                v-show="cover"
                :src="cover ? mfunsImageUrl(cover, 400) : undefined"
                max-height="250"
              />
            </div>
          </v-sheet>
          <v-divider />

          <v-sheet class="px-3 d-flex align-center">
            <span>版权声明</span>
            <v-spacer />
            <v-radio-group v-model="copyright" inline hide-details class="my-0">
              <v-radio :value="2" label="原创" />
              <v-radio :value="1" label="转载" />
              <v-radio :value="0" label="其他" />
            </v-radio-group>
          </v-sheet>
          <v-divider />
        </v-col>
      </v-row>
    </v-container>

    <CreateCategoryDialog v-model="categoryOpen" @select="onCategory" />
    <CreateTagDialog v-model="tagOpen" @select="addTag" />
    <MediaLibrary ref="mediaRef" title="插入图片" @select="onCover" />

    <v-dialog v-model="publishDialog" max-width="400">
      <v-card>
        <v-card-title>
          <span class="text-h6">{{ isEdit ? '更新' : '发表' }}文章</span>
        </v-card-title>
        <v-card-text>
          <p>您确定要{{ isEdit ? '更新' : '发表' }}文章吗？</p>
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
.create-article-page__container {
  max-width: 1400px;
}
</style>
