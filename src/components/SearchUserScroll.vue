<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { searchUsers, type SearchUserItem } from '../api/searchApi'
import { readMemberAuthState } from '../auth/memberSession'
import FollowBtn from './FollowBtn.vue'
import { mfunsImageUrl } from '../utils/mfunsImageUrl'

const props = defineProps<{
  search: string
}>()

const router = useRouter()
const list = ref<SearchUserItem[]>([])
const visible = ref(false)

function nameColorClass(raw: string | undefined): string | undefined {
  const color = raw?.trim()
  if (!color) return undefined
  if (color.includes('--text')) return color
  return `${color}--text`
}

function avatarSrc(path: string | undefined): string {
  return mfunsImageUrl(path, 80)
}

async function load() {
  const keyword = props.search.trim()
  if (!keyword) {
    list.value = []
    visible.value = false
    return
  }
  const { token } = readMemberAuthState()
  const res = await searchUsers(keyword, 1, token)
  if (res.code === 1 && Array.isArray(res.data?.list) && res.data.list.length > 0) {
    list.value = res.data.list
    visible.value = true
  } else {
    list.value = []
    visible.value = false
  }
}

function openUser(id: number) {
  router.push(`/member/${id}`)
}

watch(
  () => props.search,
  () => {
    void load()
  },
  { immediate: true },
)
</script>

<template>
  <!-- 参考 SearchUserScroll：综合搜索顶部横向用户卡片 -->
  <div v-if="visible" class="search-user-scroll">
    <div class="search-user-scroll__row d-flex">
      <v-card
        v-for="user in list"
        :key="user.id"
        class="search-user-scroll__card flex-shrink-0 d-flex flex-column align-center py-1"
        width="130"
        height="160"
        variant="outlined"
        @click="openUser(user.id)"
      >
        <v-avatar size="44" color="grey-lighten-2" class="mt-1">
          <v-img v-if="avatarSrc(user.avatar)" :src="avatarSrc(user.avatar)" cover />
          <v-icon v-else icon="mdi-account" size="26" />
        </v-avatar>
        <div
          class="search-user-scroll__name text-center mt-2 overflow-hidden"
          :class="nameColorClass(user.name_color)"
        >
          {{ user.name }}
        </div>
        <div class="search-user-scroll__info text-center text-caption text-medium-emphasis overflow-hidden px-1">
          {{ user.info }}
        </div>
        <FollowBtn
          class="mt-1"
          :user-id="user.id"
          :status="user.status ?? -1"
          @click.stop
        />
      </v-card>
    </div>
  </div>
</template>

<style scoped>
.search-user-scroll {
  height: 168px;
  margin-bottom: 8px;
  overflow: hidden;
}

.search-user-scroll__row {
  height: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  padding-inline: 4px;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.search-user-scroll__row::-webkit-scrollbar {
  display: none;
}

.search-user-scroll__card {
  margin-right: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12) !important;
  box-shadow: none !important;
}

.search-user-scroll__name {
  height: 20px;
  width: 100%;
  line-height: 20px;
  font-size: 0.875rem;
}

.search-user-scroll__info {
  height: 38px;
  width: 100%;
  line-height: 1.25;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
</style>
