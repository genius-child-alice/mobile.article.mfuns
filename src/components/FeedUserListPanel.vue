<script setup lang="ts">
import { computed } from 'vue'
import type { FeedFollowUserEntry } from '../api/feedsApi'
import { mfunsImageUrl } from '../utils/mfunsImageUrl'

const props = withDefaults(
  defineProps<{
    users: FeedFollowUserEntry[]
    modelValue: number
    /** 参考站：竖屏 / smAndDown 为 RowScroll 横滑，md+ 侧栏为纵向列表 */
    /** 顶栏在「关注」时才展示选中高亮（时间线 Tab 下不高亮「全部关注」等） */
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
  }
  const rest = props.users
    .map((u) => {
      const id = u.user_id ?? u.user?.id ?? u.id ?? 0
      return {
        id,
        label: u.user?.name ?? u.name ?? '喵友',
        avatar: u.user?.avatar ?? u.avatar,
        nameColorClass: u.user?.name_color ? `${u.user.name_color}--text` : undefined,
      }
    })
    .filter((x) => x.id > 0)
  return [all, ...rest]
})

function pick(userId: number) {
  emit('update:modelValue', userId)
  emit('select', userId)
}

function avatarSrc(entry: FollowListItem): string {
  return mfunsImageUrl(entry.avatar, 80)
}

function isActive(entryId: number): boolean {
  return props.showActiveState && props.modelValue === entryId
}
</script>

<template>
  <!-- 参考 FeedUserListMobile：横滑头像 + 昵称 -->
  <v-card
    v-if="layout === 'horizontal'"
    class="feed-user-list feed-user-list--horizontal"
    elevation="0"
  >
    <div class="feed-user-list__scroll d-flex">
      <button
        v-for="entry in items"
        :key="entry.id"
        type="button"
        class="feed-user-list__chip flex-shrink-0"
        :class="{ 'feed-user-list__chip--active': isActive(entry.id) }"
        @click="pick(entry.id)"
      >
        <v-avatar
          v-if="entry.isAll"
          size="44"
          :color="isActive(0) ? 'primary' : undefined"
          :variant="isActive(0) ? 'flat' : 'tonal'"
        >
          <v-icon icon="mdi-account-group" size="22" />
        </v-avatar>
        <v-avatar v-else size="44" color="grey-lighten-2">
          <v-img v-if="avatarSrc(entry)" :src="avatarSrc(entry)" cover />
          <v-icon v-else icon="mdi-account" size="22" />
        </v-avatar>
        <div
          class="feed-user-list__chip-label text-caption text-center mt-2 text-truncate"
          :class="entry.nameColorClass"
        >
          {{ entry.label }}
        </div>
      </button>
    </div>
  </v-card>

  <v-sheet v-else class="feed-user-list feed-user-list--vertical rounded-lg pa-2" elevation="0">
    <v-list density="compact" nav class="feed-user-list__list py-0">
      <v-list-item
        v-for="entry in items"
        :key="entry.id"
        :active="isActive(entry.id)"
        color="primary"
        rounded="lg"
        @click="pick(entry.id)"
      >
        <template #prepend>
          <v-avatar v-if="entry.isAll" size="32" color="primary" variant="tonal">
            <v-icon icon="mdi-account-group" size="20" />
          </v-avatar>
          <v-avatar v-else size="32" color="grey-lighten-2">
            <v-img v-if="avatarSrc(entry)" :src="avatarSrc(entry)" cover />
            <v-icon v-else icon="mdi-account" size="18" />
          </v-avatar>
        </template>
        <v-list-item-title class="text-body-2">{{ entry.label }}</v-list-item-title>
      </v-list-item>
    </v-list>
  </v-sheet>
</template>

<style scoped>
.feed-user-list--vertical {
  background: rgb(var(--v-theme-surface));
  position: sticky;
  top: calc(var(--mfuns-app-bar-height, 48px) + 8px);
}

.feed-user-list__list {
  background: transparent;
}

.feed-user-list--horizontal {
  background: rgb(var(--v-theme-surface));
  border-radius: 8px;
}

.feed-user-list__scroll {
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  padding: 4px 2px 8px;
  gap: 4px;
}

.feed-user-list__scroll::-webkit-scrollbar {
  display: none;
}

.feed-user-list__chip {
  width: 80px;
  margin: 8px 0;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  color: inherit;
  font: inherit;
}

.feed-user-list__chip--active .feed-user-list__chip-label {
  color: rgb(var(--v-theme-primary));
  font-weight: 600;
}

.feed-user-list__chip-label {
  width: 100%;
  max-width: 80px;
}
</style>
