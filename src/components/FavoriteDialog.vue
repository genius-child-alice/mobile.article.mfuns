<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  addFavorite,
  fetchFavoriteListForResource,
  fetchIsFavorite,
  removeFavoriteByResource,
  type FavoriteListItem,
} from '../api/favoriteApi'
import { readMemberAuthState } from '../auth/memberSession'
import { useMemberAuth } from '../composables/useMemberAuth'
import { refreshMemberProfile, useMemberProfile } from '../composables/useMemberProfile'

const props = defineProps<{
  id: number
  type: number
}>()

const emit = defineEmits<{
  update: [count: number]
}>()

const router = useRouter()
const { isLoggedIn } = useMemberAuth()
const { memberInfo } = useMemberProfile()

const dialog = ref(false)
const list = ref<FavoriteListItem[]>([])
const loaded = ref(false)
const isFavorite = ref(false)
const snackbar = ref({ open: false, text: '', color: 'error' as string })

function toast(text: string, color = 'error') {
  snackbar.value = { open: true, text, color }
}

function listStatusLabel(status?: number): string {
  switch (status) {
    case 1:
      return '公开'
    case 2:
      return '私有'
    case 3:
      return '仅链接访问'
    default:
      return ''
  }
}

async function refreshFavorite() {
  const token = readMemberAuthState().token
  if (!token) return
  const res = await fetchIsFavorite(props.id, props.type, token)
  if (res.code === 1) {
    isFavorite.value = Boolean(res.data?.is_favorite)
    emit('update', res.data?.count ?? 0)
  } else if (res.msg) {
    toast(res.msg)
  }
}

async function loadLists() {
  const token = readMemberAuthState().token
  const userId = memberInfo.value?.id
  if (!token || !userId) return

  const res = await fetchFavoriteListForResource(userId, props.id, props.type, token)
  if (res.code === 1 && Array.isArray(res.data?.list)) {
    list.value = res.data.list.map((item) => ({ ...item, loading: false }))
  } else if (res.msg) {
    toast(res.msg)
  }
}

async function show() {
  if (!isLoggedIn.value) {
    router.push('/member/login')
    return
  }
  dialog.value = true
  if (!memberInfo.value?.id) await refreshMemberProfile()
  if (!loaded.value) {
    loaded.value = true
    await loadLists()
  }
}

async function toggle(item: FavoriteListItem) {
  const token = readMemberAuthState().token
  if (!token) {
    router.push('/member/login')
    return
  }

  item.loading = true
  try {
    if (item.is_favorite) {
      const res = await removeFavoriteByResource(props.id, item.id, props.type, token)
      if (res.code === 1) item.is_favorite = false
      else toast(res.msg || '取消失败')
    } else {
      const res = await addFavorite(item.id, props.id, props.type, token)
      if (res.code === 1) item.is_favorite = true
      else toast(res.msg || '收藏失败')
    }
    await refreshFavorite()
  } finally {
    item.loading = false
  }
}

onMounted(() => {
  if (isLoggedIn.value) void refreshFavorite()
})

defineExpose({ show, isFavorite, refreshFavorite })
</script>

<template>
  <v-dialog v-model="dialog" max-width="500">
    <v-card>
      <v-card-title>保存到收藏夹</v-card-title>
      <v-list>
        <v-list-item
          v-for="item in list"
          :key="item.id"
          :title="item.name || '未命名'"
          :subtitle="`${listStatusLabel(item.status)} ${item.desc || ''}`.trim()"
          @click="toggle(item)"
        >
          <template #append>
            <v-progress-circular
              v-if="item.loading"
              indeterminate
              color="link"
              size="20"
              width="3"
            />
            <v-checkbox-btn
              v-else
              :model-value="Boolean(item.is_favorite)"
              color="link"
              @click.stop="toggle(item)"
            />
          </template>
        </v-list-item>
        <v-list-item v-if="!list.length" title="暂无收藏夹" subtitle="请先在网页端创建收藏夹" />
      </v-list>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" color="link" @click="dialog = false">完成</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-snackbar v-model="snackbar.open" :color="snackbar.color" timeout="2500">
    {{ snackbar.text }}
  </v-snackbar>
</template>
