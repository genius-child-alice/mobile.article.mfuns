<script setup lang="ts">
import { onMounted, onUnmounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  createFavoriteList,
  deleteFavoriteList,
  fetchMyFavoriteLists,
  updateFavoriteList,
  type FavoriteListItem,
} from '../../api/favoriteApi'
import { readMemberAuthState } from '../../auth/memberSession'
import { useMemberAuth } from '../../composables/useMemberAuth'
import { useMemberProfile } from '../../composables/useMemberProfile'
import { registerPlaylistCreateOpenHandler } from '../../composables/usePlaylistNew'

const router = useRouter()
const { isLoggedIn } = useMemberAuth()
const { memberInfo, refreshMemberProfile } = useMemberProfile()

const myList = ref<FavoriteListItem[]>([])
const loading = ref(false)
const snackbar = ref({ open: false, text: '', color: 'success' as string })

const createData = reactive({
  dialog: false,
  loading: false,
  name: '',
  desc: '',
  status: 1,
})

const updateData = reactive({
  dialog: false,
  loading: false,
  name: '',
  desc: '',
  status: 1,
  id: 0,
})

const deleteData = reactive({
  dialog: false,
  loading: false,
  id: 0,
})

function toast(text: string, color = 'success') {
  snackbar.value = { open: true, text, color }
}

function getListStatus(status?: number) {
  switch (status) {
    case 1:
      return '公开'
    case 2:
      return '私有'
    case 3:
      return '仅链接访问'
    default:
      return '未知'
  }
}

function requireAuth(): string | null {
  const { token, isLogin } = readMemberAuthState()
  if (!isLogin || !token) {
    router.replace('/member/login')
    return null
  }
  return token
}

async function loadMyList() {
  const token = requireAuth()
  if (!token) return

  if (!memberInfo.value?.id) {
    await refreshMemberProfile()
  }
  const userId = memberInfo.value?.id
  if (!userId) {
    toast('无法获取用户信息', 'error')
    return
  }

  loading.value = true
  try {
    const res = await fetchMyFavoriteLists(userId, token)
    if (res.code === 1 && Array.isArray(res.data?.list)) {
      myList.value = res.data.list
    } else {
      myList.value = []
      if (res.code !== 1) toast(res.msg || '加载失败', 'error')
    }
  } finally {
    loading.value = false
  }
}

function openCreate() {
  createData.name = ''
  createData.desc = ''
  createData.status = 1
  createData.dialog = true
}

function openUpdate(item: FavoriteListItem) {
  updateData.id = item.id
  updateData.name = item.name ?? ''
  updateData.desc = item.desc ?? ''
  updateData.status = item.status ?? 1
  updateData.dialog = true
}

function openDelete(item: FavoriteListItem) {
  deleteData.id = item.id
  deleteData.dialog = true
}

async function submitCreate() {
  const token = requireAuth()
  if (!token) return
  if (!createData.name.trim()) {
    toast('请填写名称', 'error')
    return
  }
  createData.loading = true
  try {
    const res = await createFavoriteList(
      createData.name.trim(),
      createData.desc.trim(),
      createData.status,
      token,
    )
    if (res.code === 1) {
      createData.dialog = false
      toast('创建成功')
      await loadMyList()
    } else {
      toast(res.msg || '创建失败', 'error')
    }
  } finally {
    createData.loading = false
  }
}

async function submitUpdate() {
  const token = requireAuth()
  if (!token) return
  if (!updateData.name.trim()) {
    toast('请填写名称', 'error')
    return
  }
  updateData.loading = true
  try {
    const res = await updateFavoriteList(
      updateData.id,
      updateData.name.trim(),
      updateData.desc.trim(),
      updateData.status,
      token,
    )
    if (res.code === 1) {
      updateData.dialog = false
      toast('已更新')
      await loadMyList()
    } else {
      toast(res.msg || '更新失败', 'error')
    }
  } finally {
    updateData.loading = false
  }
}

async function submitDelete() {
  const token = requireAuth()
  if (!token) return
  deleteData.loading = true
  try {
    const res = await deleteFavoriteList(deleteData.id, token)
    if (res.code === 1) {
      deleteData.dialog = false
      toast('已删除')
      await loadMyList()
    } else {
      toast(res.msg || '删除失败', 'error')
    }
  } finally {
    deleteData.loading = false
  }
}

function openList(item: FavoriteListItem) {
  router.push(`/playlist/${item.id}`)
}

let unregisterOpen: (() => void) | undefined

onMounted(() => {
  if (!isLoggedIn.value) {
    router.replace('/member/login')
    return
  }
  void loadMyList()
  unregisterOpen = registerPlaylistCreateOpenHandler(openCreate)
})

onUnmounted(() => {
  unregisterOpen?.()
})
</script>

<template>
  <div class="playlist-mylist-page">
    <v-progress-linear v-if="loading" indeterminate color="primary" />

    <v-list bg-color="transparent" lines="two">
      <v-list-subheader>我创建的收藏夹</v-list-subheader>

      <v-list-item
        v-for="item in myList"
        :key="item.id"
        :title="item.name || '未命名'"
        :subtitle="`${getListStatus(item.status)} · ${item.count ?? 0}个内容`"
        @click="openList(item)"
      >
        <template #append>
          <v-menu>
            <template #activator="{ props: menuProps }">
              <v-btn
                v-bind="menuProps"
                icon
                variant="text"
                aria-label="更多"
                @click.stop
              >
                <v-icon icon="mdi-dots-vertical" />
              </v-btn>
            </template>
            <v-list density="compact">
              <v-list-item title="修改收藏夹信息" @click="openUpdate(item)" />
              <v-list-item title="删除收藏夹" @click="openDelete(item)" />
            </v-list>
          </v-menu>
        </template>
      </v-list-item>

      <div
        v-if="!loading && myList.length === 0"
        class="text-center text-medium-emphasis py-10"
      >
        暂无收藏夹，点右上角 + 新建
      </div>
    </v-list>

    <v-dialog v-model="createData.dialog" max-width="500" persistent>
      <v-card>
        <v-card-title>新建收藏夹</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="createData.name"
            label="名称"
            counter="20"
            maxlength="20"
            variant="underlined"
          />
          <v-textarea
            v-model="createData.desc"
            label="描述"
            counter="50"
            maxlength="50"
            rows="2"
            variant="underlined"
          />
          <v-radio-group v-model="createData.status" inline label="可见性">
            <v-radio :value="1" label="公开" />
            <v-radio :value="2" label="私有" />
            <v-radio :value="3" label="仅链接" />
          </v-radio-group>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="createData.dialog = false">取消</v-btn>
          <v-btn color="link" variant="text" :loading="createData.loading" @click="submitCreate">
            创建
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="updateData.dialog" max-width="500" persistent>
      <v-card>
        <v-card-title>修改收藏夹</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="updateData.name"
            label="名称"
            counter="20"
            maxlength="20"
            variant="underlined"
          />
          <v-textarea
            v-model="updateData.desc"
            label="描述"
            counter="50"
            maxlength="50"
            rows="2"
            variant="underlined"
          />
          <v-radio-group v-model="updateData.status" inline label="可见性">
            <v-radio :value="1" label="公开" />
            <v-radio :value="2" label="私有" />
            <v-radio :value="3" label="仅链接" />
          </v-radio-group>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="updateData.dialog = false">取消</v-btn>
          <v-btn color="link" variant="text" :loading="updateData.loading" @click="submitUpdate">
            保存
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteData.dialog" max-width="320">
      <v-card>
        <v-card-title class="text-body-1">删除收藏夹？</v-card-title>
        <v-card-text>删除后不可恢复，夹内收藏关系也会移除。</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteData.dialog = false">取消</v-btn>
          <v-btn color="error" variant="text" :loading="deleteData.loading" @click="submitDelete">
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
