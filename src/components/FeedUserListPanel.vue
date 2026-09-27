<script setup lang="ts">
import { computed } from 'vue'
import type { FeedFollowUserEntry } from '../api/feedsApi'
import FeedMemberInfoRow, { type FeedMemberInfoData } from './FeedMemberInfoRow.vue'
import { mfunsImageUrl } from '../utils/mfunsImageUrl'

const props = withDefaults(
  defineProps<{
    users: FeedFollowUserEntry[]
    modelValue: number
    layout?: 'vertical' | 'horizontal'
    showActiveState?: boolean
  }>(),
  { layout: 'vertical', showActiveState: true },
)

const emit = defineEmits<{
  'update:modelValue': [value: number]
  select: [userId: number]
}>()

interface FollowListItem {
  id: number
  row: FeedMemberInfoData
  label: string
  avatar?: string
  nameColorClass?: string
  isAll?: boolean
}

const items = computed((): FollowListItem[] => {
  const all: FollowListItem = {
    id: 0,
    label: '全部关注',
    isAll: true,
    row: {
      name: '全部关注',
      info: '查看全部关注动态',
      isAll: true,
    },
  }
  const rest = props.users
    .map((u) => {
      const id = u.user_id ?? u.user?.id ?? u.id ?? 0
      const name = u.user?.name ?? u.name ?? '喵友'
      return {
        id,
        label: name,
        avatar: u.user?.avatar ?? u.avatar,
        nameColorClass: u.user?.name_color,
        row: {
          id,
          name,
          name_color: u.user?.name_color,
          avatar: u.user?.avatar ?? u.avatar,
          level_id: u.user?.level_id ?? u.level_id,
          badges: u.user?.badges ?? u.badges,
          info: u.user?.info ?? u.info,
        } satisfies FeedMemberInfoData,
      }
    })
    .filter((x) => x.id > 0)
  return [all, ...rest]
})

function pick(userId: number) {
  emit('update:modelValue', userId)
  emit('select', userId)
}

function isActive(entryId: number): boolean {
  return props.showActiveState && props.modelValue === entryId
}

function nameColorClass(raw: string | undefined): string | undefined {
  const color = raw?.trim()
  if (!color) return undefined
  if (color.includes('--text')) return color
  return `${color}--text`
}

function avatarSrc(path: string | undefined): string {
  return mfunsImageUrl(path, 80)
}
</script>

<template>
  <!-- 参考 FeedUserListMobile + RowScroll -->
  <v-card
    v-if="layout === 'horizontal'"
    elevation="0"
    rounded="lg"
    class="feed-user-list-mobile"
  >
    <div class="feed-user-list-mobile__scroll d-flex">
      <div
        v-for="entry in items"
        :key="entry.id"
        v-ripple
        class="feed-user-list-mobile__item flex-shrink-0 d-flex flex-column align-center my-2"
        role="button"
        tabindex="0"
        @click="pick(entry.id)"
        @keydown.enter="pick(entry.id)"
      >
        <v-avatar size="44" :color="entry.isAll ? 'grey-lighten-3' : 'grey-lighten-2'" class="mt-1">
          <v-icon v-if="entry.isAll" icon="mdi-account-group" size="24" />
          <v-img v-else-if="avatarSrc(entry.avatar)" :src="avatarSrc(entry.avatar)" cover />
          <v-icon v-else icon="mdi-account" size="26" />
        </v-avatar>
        <div
          class="feed-user-list-mobile__name text-center mt-2 overflow-hidden"
          :class="nameColorClass(entry.nameColorClass)"
        >
          {{ entry.label }}
        </div>
      </div>
    </div>
  </v-card>

  <!-- 参考 FeedUserList：v-sheet + ripple 行 + MemberInfo -->
  <v-sheet
    v-else
    elevation="0"
    rounded="lg"
    class="feed-user-list scroll-y-style"
  >
    <div
      v-for="entry in items"
      :key="entry.id"
      v-ripple
      class="feed-user-list__entry"
      role="button"
      tabindex="0"
      @click="pick(entry.id)"
      @keydown.enter="pick(entry.id)"
    >
      <FeedMemberInfoRow :data="entry.row" :active="isActive(entry.id)" />
    </div>
  </v-sheet>
</template>

<style scoped>
.feed-user-list {
  background: rgb(var(--v-theme-surface));
  max-height: 620px;
  overflow-x: hidden;
  overflow-y: auto;
  padding: 8px;
  position: sticky;
  top: calc(var(--mfuns-app-bar-height, 48px) + 8px);
}

@media screen and (max-height: 600px) {
  .feed-user-list {
    max-height: calc(100dvh - 88px);
  }
}

.feed-user-list__entry {
  cursor: pointer;
  overflow: hidden;
  max-width: 100%;
}

.feed-user-list-mobile {
  background: rgb(var(--v-theme-surface));
}

.feed-user-list-mobile__scroll {
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.feed-user-list-mobile__scroll::-webkit-scrollbar {
  display: none;
}

.feed-user-list-mobile__item {
  width: 80px;
  cursor: pointer;
}

.feed-user-list-mobile__name {
  width: 100%;
  max-width: 80px;
  font-size: 0.75rem;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
