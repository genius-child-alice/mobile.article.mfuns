<script setup lang="ts">
import { computed } from 'vue'
import type { FeedFollowUserEntry } from '../api/feedsApi'
import { mfunsImageUrl } from '../utils/mfunsImageUrl'

const props = defineProps<{
  users: FeedFollowUserEntry[]
  modelValue: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number]
  select: [userId: number]
}>()

const items = computed(() => {
  const all = { id: 0, label: '全部关注', avatar: '' as string | undefined }
  const rest = props.users.map((u) => {
    const id = u.user_id ?? u.user?.id ?? u.id ?? 0
    return {
      id,
      label: u.user?.name ?? u.name ?? '喵友',
      avatar: u.user?.avatar ?? u.avatar,
    }
  })
  return [all, ...rest.filter((x) => x.id > 0)]
})

function pick(userId: number) {
  emit('update:modelValue', userId)
  emit('select', userId)
}

function avatarFor(entry: (typeof items.value)[number]): string {
  return mfunsImageUrl(entry.avatar, 80)
}
</script>

<template>
  <v-sheet class="feed-user-list rounded-lg pa-3" elevation="0">
    <v-list density="compact" nav class="feed-user-list__list py-0">
      <v-list-item
        v-for="entry in items"
        :key="entry.id"
        :active="modelValue === entry.id"
        color="primary"
        rounded="lg"
        @click="pick(entry.id)"
      >
        <template #prepend>
          <v-avatar v-if="entry.id === 0" size="32" color="primary" variant="tonal">
            <v-icon icon="mdi-account-group" size="20" />
          </v-avatar>
          <v-avatar v-else size="32" color="grey-lighten-2">
            <v-img v-if="avatarFor(entry)" :src="avatarFor(entry)" cover />
            <v-icon v-else icon="mdi-account" size="18" />
          </v-avatar>
        </template>
        <v-list-item-title class="text-body-2">{{ entry.label }}</v-list-item-title>
      </v-list-item>
    </v-list>
  </v-sheet>
</template>

<style scoped>
.feed-user-list {
  background: rgb(var(--v-theme-surface));
  position: sticky;
  top: calc(var(--mfuns-app-bar-height, 48px) + 8px);
}

.feed-user-list__list {
  background: transparent;
}
</style>
