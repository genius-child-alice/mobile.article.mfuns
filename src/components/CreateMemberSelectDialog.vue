<script setup lang="ts">
import { ref, watch } from 'vue'
import { useDisplay } from 'vuetify'
import { fetchFollowList } from '../api/followApi'
import type { MemberUserInfo } from '../api/memberUserApi'
import { searchUsers } from '../api/searchApi'
import { readMemberAuthState } from '../auth/memberSession'
import { useMemberProfile } from '../composables/useMemberProfile'
import FeedMemberInfoRow, { type FeedMemberInfoData } from './FeedMemberInfoRow.vue'

export type MentionUser = Pick<
  MemberUserInfo,
  'id' | 'name' | 'avatar' | 'name_color' | 'level_id' | 'badges'
>

const open = defineModel<boolean>({ default: false })

const emit = defineEmits<{
  select: [user: MentionUser]
}>()

const { mobile } = useDisplay()
const { memberId, refreshMemberProfile } = useMemberProfile()

type ListedUser = MentionUser & { last_id?: number }

const search = ref('')
const list = ref<ListedUser[]>([])
const lastId = ref(0)
const loading = ref(false)
let searchTimer: ReturnType<typeof setTimeout> | null = null

function toRow(u: MentionUser): FeedMemberInfoData {
  return {
    id: u.id,
    name: u.name,
    avatar: u.avatar,
    name_color: u.name_color,
    level_id: u.level_id,
    badges: u.badges,
  }
}

async function load(reset: boolean) {
  const { token, isLogin } = readMemberAuthState()
  if (!isLogin || !token || loading.value) return

  loading.value = true
  try {
    if (reset) lastId.value = 0
    let batch: ListedUser[] = []

    if (!search.value.trim()) {
      let uid = memberId.value
      if (!uid) {
        await refreshMemberProfile()
        uid = memberId.value
      }
      if (!uid) return
      const res = await fetchFollowList(uid, lastId.value || -1, token)
      if (res.code === 1 && Array.isArray(res.data?.list)) {
        for (const item of res.data.list) {
          const u = item.user
          if (!u?.id) continue
          batch.push({
            id: u.id,
            name: u.name,
            avatar: u.avatar,
            name_color: u.name_color,
            level_id: u.level_id,
            badges: u.badges,
            last_id: item.id,
          })
        }
        if (batch.length) {
          lastId.value = batch[batch.length - 1].last_id ?? batch[batch.length - 1].id
        }
      }
    } else if (reset) {
      // 参考站：搜索仅在 reset 时请求，不分页
      const res = await searchUsers(search.value.trim(), 1, token)
      if (res.code === 1 && Array.isArray(res.data?.list)) {
        batch = res.data.list.filter((u): u is ListedUser => Boolean(u?.id))
      }
    }

    if (reset) list.value = batch
    else if (batch.length) list.value.push(...batch)
  } finally {
    loading.value = false
  }
}

function scheduleSearch() {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    void load(true)
  }, 500)
}

function pick(user: MentionUser) {
  emit('select', user)
  open.value = false
}

watch(open, (v) => {
  if (v) {
    search.value = ''
    list.value = []
    void load(true)
  } else if (searchTimer) {
    clearTimeout(searchTimer)
    searchTimer = null
  }
})

watch(search, () => {
  if (!open.value) return
  scheduleSearch()
})
</script>

<template>
  <!-- 参考站 MemberSelect：xs 全屏，sm+ 500×500 -->
  <v-dialog
    v-model="open"
    :fullscreen="mobile"
    max-width="500"
    persistent
    scrollable
    transition="dialog-bottom-transition"
  >
    <v-card :height="mobile ? undefined : '500'" class="d-flex flex-column">
      <v-toolbar color="primary" density="compact">
        <v-text-field
          v-model="search"
          placeholder="搜索用户"
          variant="plain"
          hide-details
          density="compact"
          class="mx-2 create-member-select__search"
          theme="dark"
          color="link"
        />
        <v-btn icon variant="text" color="white" aria-label="关闭" @click="open = false">
          <v-icon icon="mdi-close" />
        </v-btn>
      </v-toolbar>

      <v-card-text class="pa-0 flex-grow-1 overflow-y-auto">
        <v-progress-linear v-if="loading && !list.length" indeterminate color="primary" />
        <v-list class="py-0">
          <template v-for="user in list" :key="user.id">
            <div v-ripple class="create-member-select__item px-4" @click="pick(user)">
              <FeedMemberInfoRow :data="toRow(user)" />
            </div>
            <v-divider />
          </template>
        </v-list>
        <div
          v-if="!loading && list.length === 0"
          class="text-center text-medium-emphasis py-8 text-body-2"
        >
          {{ search.trim() ? '未找到用户' : '暂无关注，可搜索用户' }}
        </div>
        <div v-if="!search.trim() && list.length" class="text-center py-3">
          <v-btn variant="text" color="link" :loading="loading" @click="load(false)">
            加载更多
          </v-btn>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.create-member-select__search :deep(.v-field__input) {
  color: #fff;
  caret-color: #fff;
}

.create-member-select__search :deep(input::placeholder) {
  color: rgba(255, 255, 255, 0.7);
}

.create-member-select__item {
  cursor: pointer;
}
</style>
