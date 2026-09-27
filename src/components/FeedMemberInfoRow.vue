<script setup lang="ts">
import { computed } from 'vue'
import MfunsBadge from './MfunsBadge.vue'
import { mfunsImageUrl } from '../utils/mfunsImageUrl'

export interface FeedMemberInfoData {
  id?: number
  name?: string
  name_color?: string
  avatar?: string
  level_id?: number
  badges?: number[]
  info?: string
  isAll?: boolean
}

const props = defineProps<{
  data: FeedMemberInfoData
  active?: boolean
}>()

/** 与 useMemberProfile.displayBadgeIds：等级 + 佩戴徽章 */
const displayBadgeIds = computed(() => {
  if (props.data.isAll) return []
  const ids: number[] = []
  if (props.data.level_id) ids.push(props.data.level_id)
  for (const badgeId of props.data.badges ?? []) {
    if (!ids.includes(badgeId)) ids.push(badgeId)
  }
  return ids
})

function nameColorClass(raw: string | undefined): string | undefined {
  const color = raw?.trim()
  if (!color) return undefined
  if (color.includes('--text')) return color
  return `${color}--text`
}

const avatarSrc = () => mfunsImageUrl(props.data.avatar, 80)
</script>

<template>
  <div
    class="feed-member-info d-flex align-center"
    :class="{ 'feed-member-info--active': active }"
  >
    <div class="feed-member-info__avatar flex-shrink-0">
      <v-avatar v-if="data.isAll" size="44" color="grey-lighten-3">
        <v-icon icon="mdi-account-group" size="24" />
      </v-avatar>
      <v-avatar v-else size="44" color="grey-lighten-2">
        <v-img v-if="avatarSrc()" :src="avatarSrc()" cover />
        <v-icon v-else icon="mdi-account" size="26" />
      </v-avatar>
    </div>
    <div class="feed-member-info__content min-width-0 flex-grow-1">
      <div class="feed-member-info__title text-body-2">
        <span class="feed-member-info__name" :class="nameColorClass(data.name_color)">
          {{ data.name || '喵友' }}
        </span>
        <span v-if="displayBadgeIds.length" class="feed-member-info__badges d-inline-flex align-center">
          <MfunsBadge
            v-for="badgeId in displayBadgeIds"
            :key="badgeId"
            :id="badgeId"
            class="feed-member-info__badge"
          />
        </span>
      </div>
      <div v-if="data.info" class="feed-member-info__subtitle text-caption text-medium-emphasis">
        {{ data.info }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.feed-member-info {
  min-height: 56px;
  padding: 4px 0;
  overflow: hidden;
  max-width: 100%;
}

.feed-member-info__avatar {
  margin-right: 16px;
  overflow: visible;
}

.feed-member-info__content {
  flex: 1 1 0;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
}

.feed-member-info__title {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 2px;
  min-height: 20px;
  max-width: 100%;
  line-height: 1.25;
  overflow: hidden;
}

/* 昵称优先完整展示，不省略、不 flex 压缩 */
.feed-member-info__name {
  flex: 0 0 auto;
  white-space: nowrap;
}

/* 剩余宽度给徽章；装不下则右侧裁切，不反压昵称 */
.feed-member-info__badges {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  gap: 2px;
  margin-left: 6px;
}

.feed-member-info__badge {
  vertical-align: middle;
  flex-shrink: 0;
}

.feed-member-info__subtitle {
  display: block;
  width: 100%;
  max-width: 100%;
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.35;
}
</style>
