<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useDisplay } from 'vuetify'
import { useRouter } from 'vue-router'
import {
  deleteContributeArticle,
  fetchContributeList,
  type ContributeItem,
} from '../../api/contributeApi'
import { readMemberAuthState } from '../../auth/memberSession'
import { useMemberAuth } from '../../composables/useMemberAuth'
import { formatUnixDatetime } from '../../utils/mfunsTime'
import { mfunsImageUrl } from '../../utils/mfunsImageUrl'

/** 参考站 CreateArticleList.category */
const STATUS_OPTIONS = [
  { key: '全部', value: -1 },
  { key: '草稿', value: 0 },
  { key: '通过', value: 1 },
  { key: '审核中', value: 2 },
  { key: '驳回', value: 4 },
  { key: '锁定', value: 3 },
] as const

const router = useRouter()
const { mobile } = useDisplay()
const { isLoggedIn } = useMemberAuth()

const status = ref(-1)
const list = ref<ContributeItem[]>([])
const page = ref(1)
const total = ref(0)
const loading = ref(false)
const loadingMore = ref(false)
const notMore = ref(false)
const deleteItem = ref<ContributeItem | null>(null)
const deleteOpen = ref(false)
const deleting = ref(false)
const snackbar = ref({ open: false, text: '', color: 'success' as string })

function toast(text: string, color = 'success') {
  snackbar.value = { open: true, text, color }
}

function statusLabel(s?: number) {
  switch (s) {
    case 0:
      return '•草稿'
    case 1:
      return '✓已发布'
    case 2:
      return '•审核中'
    case 3:
      return '■已锁定'
    case 4:
      return '✗未通过'
    default:
      return ''
  }
}

function requireToken(): string | null {
  const { token, isLogin } = readMemberAuthState()
  if (!isLogin || !token) {
    router.replace('/member/login')
    return null
  }
  return token
}

function createdText(item: ContributeItem) {
  const raw = item.created_at
  if (!raw) return ''
  if (typeof raw === 'string' && raw.includes('-')) return raw
  const n = Number(raw)
  if (Number.isFinite(n) && n > 1_000_000_000) return formatUnixDatetime(n)
  return String(raw)
}

function resourceCode(item: ContributeItem) {
  const id = item.resource?.id ?? item.resource_id
  if (!id) return ''
  const prefix = item.resource?.type === 1 ? 'MV' : 'MA'
  return `${prefix}${id}`
}

async function load(reset = false) {
  const token = requireToken()
  if (!token) return

  if (reset) {
    page.value = 1
    list.value = []
    notMore.value = false
  }
  if (notMore.value) return

  const isFirst = list.value.length === 0 || reset
  if (isFirst) loading.value = true
  else loadingMore.value = true

  try {
    const res = await fetchContributeList(page.value, 20, status.value, token)
    if (res.code !== 1 || !Array.isArray(res.data?.list)) {
      notMore.value = true
      return
    }
    total.value = res.data.total ?? list.value.length + res.data.list.length
    if (res.data.list.length === 0) {
      notMore.value = true
      return
    }
    list.value.push(...res.data.list)
    page.value += 1
    if (res.data.list.length < 20) notMore.value = true
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

function editItem(item: ContributeItem) {
  router.push(`/create/article?edit=${item.id}`)
}

function viewItem(item: ContributeItem) {
  const id = item.resource_id ?? item.resource?.id
  if (!id) return
  router.push(`/article/${id}`)
}

function askDelete(item: ContributeItem) {
  deleteItem.value = item
  deleteOpen.value = true
}

async function confirmDelete() {
  const token = requireToken()
  if (!token || !deleteItem.value) return
  deleting.value = true
  try {
    const res = await deleteContributeArticle(deleteItem.value.id, token)
    if (res.code === 1) {
      toast('删除成功')
      deleteOpen.value = false
      await load(true)
    } else {
      toast(res.msg || '删除失败', 'error')
    }
  } finally {
    deleting.value = false
  }
}

watch(status, () => {
  void load(true)
})

onMounted(() => {
  if (!isLoggedIn.value) {
    router.replace('/member/login')
    return
  }
  void load(true)
})
</script>

<template>
  <div class="create-page">
    <!-- 参考 Container：pt-0 pt-sm-1，xs 时 pa-0，max-width 1400 -->
    <v-container
      class="create-page__container pt-0 pt-sm-1"
      :class="{ 'pa-0': mobile }"
      fluid
    >
      <v-row class="px-3 py-2">
        <v-col cols="4">
          <v-select
            v-model="status"
            :items="[...STATUS_OPTIONS]"
            item-title="key"
            item-value="value"
            density="compact"
            variant="underlined"
            hide-details
            color="link"
          />
        </v-col>
        <v-col cols="4" />
        <v-col cols="4" class="d-flex align-center justify-end">
          <span>共 {{ total }} 条</span>
        </v-col>
      </v-row>

      <v-progress-linear v-if="loading" indeterminate color="primary" />

      <div v-else-if="list.length === 0" class="text-center text-medium-emphasis py-12">
        暂无稿件
      </div>

      <!-- 参考 CreateInfoList + ContentInfoListItem -->
      <v-row v-else dense>
        <v-col v-for="item in list" :key="item.id" cols="12">
          <v-sheet class="px-3 py-2">
            <div class="d-flex">
              <v-card elevation="0" class="create-page__cover-card" @click="viewItem(item)">
                <v-img
                  :src="item.cover ? mfunsImageUrl(item.cover, 200) : undefined"
                  height="80"
                  width="142"
                  :aspect-ratio="9 / 16"
                  cover
                >
                  <span class="create-page__state pa-1">{{ statusLabel(item.status) }}</span>
                </v-img>
              </v-card>

              <div class="flex-fill pl-2 d-flex flex-column justify-space-between min-width-0">
                <div class="text-body-1 create-page__title" @click="viewItem(item)">
                  {{ item.title || '未命名' }}
                </div>
                <div class="text-medium-emphasis">
                  <span>创建：{{ createdText(item) }}</span>
                </div>
                <div v-if="item.resource" class="text-medium-emphasis">
                  <span> 点赞：{{ item.resource.like_count ?? 0 }} </span>
                  <span class="ms-1"> 浏览：{{ item.resource.view_count ?? 0 }} </span>
                  <span v-if="resourceCode(item)" class="ms-1">{{ resourceCode(item) }}</span>
                </div>
              </div>

              <!-- 桌面：右侧操作列（参考 ContentInfoListItem） -->
              <div v-if="!mobile" class="create-page__actions d-flex flex-column ga-2">
                <v-btn variant="outlined" color="link" @click="editItem(item)">
                  <v-icon start icon="mdi-circle-edit-outline" />
                  编辑
                </v-btn>
                <v-btn
                  v-if="item.resource_id || item.resource?.id"
                  variant="outlined"
                  color="success"
                  @click="viewItem(item)"
                >
                  <v-icon start icon="mdi-play-circle-outline" />
                  查看
                </v-btn>
                <v-btn variant="outlined" color="error" @click="askDelete(item)">
                  <v-icon start icon="mdi-delete-circle-outline" />
                  删除
                </v-btn>
              </div>
            </div>

            <div v-if="mobile" class="pt-2 d-flex">
              <v-spacer />
              <div>
                <v-btn variant="outlined" color="link" class="me-1" @click="editItem(item)">
                  <v-icon start icon="mdi-circle-edit-outline" />
                  编辑
                </v-btn>
                <v-btn variant="outlined" color="success" class="me-1" @click="viewItem(item)">
                  <v-icon start icon="mdi-play-circle-outline" />
                  查看
                </v-btn>
                <v-btn variant="outlined" color="error" @click="askDelete(item)">
                  <v-icon start icon="mdi-delete-circle-outline" />
                  删除
                </v-btn>
              </div>
            </div>
          </v-sheet>
          <v-divider />
        </v-col>
      </v-row>

      <div v-if="list.length" class="text-center py-4">
        <v-btn
          variant="text"
          block
          :disabled="notMore"
          :loading="loadingMore"
          @click="load(false)"
        >
          {{ notMore ? '没有更多了' : '加载更多' }}
        </v-btn>
      </div>
    </v-container>

    <v-btn
      class="create-page__fab"
      color="pink"
      icon
      size="large"
      elevation="6"
      aria-label="新建文章"
      :to="{ path: '/create/article' }"
    >
      <v-icon icon="mdi-plus" />
    </v-btn>

    <v-dialog v-model="deleteOpen" max-width="400">
      <v-card>
        <v-card-title>是否删除内容？</v-card-title>
        <v-card-text>删除之后将无法恢复</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" color="link" @click="deleteOpen = false">取消</v-btn>
          <v-btn variant="text" color="error" :loading="deleting" @click="confirmDelete">
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
.create-page__container {
  max-width: 1400px;
}

.create-page__cover-card {
  flex-shrink: 0;
  cursor: pointer;
  overflow: hidden;
}

.create-page__state {
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  font-size: 12px;
  line-height: 1.2;
}

.create-page__title {
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  cursor: pointer;
}

.create-page__actions {
  flex-shrink: 0;
  margin-left: 8px;
}

.create-page__fab {
  position: fixed;
  right: 16px;
  bottom: calc(16px + var(--mfuns-bottom-nav-height, 0px) + env(safe-area-inset-bottom, 0px));
  z-index: 4;
}
</style>
