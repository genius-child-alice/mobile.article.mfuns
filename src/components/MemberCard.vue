<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'
import type { MemberUserInfo } from '../api/memberUserApi'
import MfunsBadge from './MfunsBadge.vue'
import { formatRelativeTime } from '../utils/mfunsTime'
import { mfunsImageUrl } from '../utils/mfunsImageUrl'

const props = defineProps<{
  user: MemberUserInfo
}>()

const router = useRouter()
const { smAndUp } = useDisplay()

const bannerSrc = computed(() => mfunsImageUrl(props.user.banner_image, 1000))
const avatarSrc = computed(() => mfunsImageUrl(props.user.avatar, 300))

const displayBadgeIds = computed(() => {
  const ids: number[] = []
  if (props.user.level_id) ids.push(props.user.level_id)
  for (const id of props.user.badges ?? []) {
    if (!ids.includes(id)) ids.push(id)
  }
  return ids
})

function nameColorClass(raw: string | undefined): string | undefined {
  const color = raw?.trim()
  if (!color) return undefined
  if (color.includes('--text')) return color
  return `${color}--text`
}

function goFollow(type: 'follow' | 'fans') {
  router.push(`/follow/${type}/${props.user.id}`)
}
</script>

<template>
  <!-- 参考 MemberCard（只读；不含视频/横幅编辑） -->
  <v-card class="member-card rounded-lg" elevation="0">
    <v-img
      :src="bannerSrc || undefined"
      :height="smAndUp ? 250 : 120"
      cover
      class="member-card__banner bg-grey-lighten-3"
    >
      <template v-if="smAndUp" #placeholder>
        <div class="member-card__banner-placeholder" />
      </template>
      <div v-if="smAndUp" class="member-card__banner-overlay pa-4">
        <div class="text-h5 text-white">
          <span class="font-weight-bold" :class="nameColorClass(user.name_color)">
            {{ user.name }}
          </span>
          <v-icon v-if="user.gender === 1" icon="mdi-gender-male" color="#00b9ff" size="20" class="ms-1" />
          <v-icon v-if="user.gender === 2" icon="mdi-gender-female" color="#ea7c8d" size="20" class="ms-1" />
          <MfunsBadge v-for="badgeId in displayBadgeIds" :key="badgeId" :id="badgeId" />
        </div>
        <div class="my-1 text-white member-card__stats">
          <span>UID{{ user.id }}</span>
          <span class="member-card__stat-link ms-3" @click.stop="goFollow('follow')">
            <span>{{ user.follow?.follow ?? 0 }}</span>
            <span class="member-card__stat-label"> 关注</span>
          </span>
          <span class="member-card__stat-link ms-3" @click.stop="goFollow('fans')">
            <span>{{ user.follow?.fans ?? 0 }}</span>
            <span class="member-card__stat-label"> 粉丝</span>
          </span>
          <span class="ms-3">
            <span>{{ formatRelativeTime(user.created_at) }}</span>
            <span class="member-card__stat-label"> 注册</span>
          </span>
        </div>
      </div>
    </v-img>

    <div class="member-card__body" :class="{ 'member-card__body--mobile': !smAndUp }">
      <div class="member-card__avatar-wrap">
        <v-avatar :size="smAndUp ? 112 : 88" color="white" elevation="1">
          <v-img v-if="avatarSrc" :src="avatarSrc" cover />
          <v-icon v-else icon="mdi-account" size="40" />
        </v-avatar>
      </div>

      <v-container v-if="!smAndUp" fluid class="pt-0">
        <div class="text-h6 text-center">
          <span :class="nameColorClass(user.name_color)">{{ user.name }}</span>
          <v-icon v-if="user.gender === 1" icon="mdi-gender-male" color="#00b9ff" size="18" class="ms-1" />
          <v-icon v-if="user.gender === 2" icon="mdi-gender-female" color="#ea7c8d" size="18" class="ms-1" />
        </div>
        <div class="d-flex justify-center flex-wrap mt-1">
          <MfunsBadge v-for="badgeId in displayBadgeIds" :key="`m-${badgeId}`" :id="badgeId" />
        </div>
        <div class="text-center text-body-2 mt-2 member-card__stats">
          <span>UID{{ user.id }}</span>
          <span class="member-card__stat-link ms-2" @click.stop="goFollow('follow')">
            {{ user.follow?.follow ?? 0 }} 关注
          </span>
          <span class="member-card__stat-link ms-2" @click.stop="goFollow('fans')">
            {{ user.follow?.fans ?? 0 }} 粉丝
          </span>
        </div>
      </v-container>

      <v-container fluid class="member-card__bio pt-2">
        <div v-if="user.bio" class="text-body-2 text-pre-wrap">{{ user.bio }}</div>
        <div v-else class="text-body-2 text-medium-emphasis">这个人很懒，还没有写签名呢~</div>
      </v-container>
    </div>
  </v-card>
</template>

<style scoped>
.member-card__banner-placeholder {
  width: 100%;
  height: 100%;
  background: rgba(var(--v-theme-on-surface), 0.08);
}

.member-card__banner-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  background: linear-gradient(transparent 40%, rgba(0, 0, 0, 0.55));
}

.member-card__body {
  position: relative;
}

.member-card__body--mobile {
  padding-top: 44px;
}

.member-card__avatar-wrap {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1;
}

.member-card__stats {
  font-size: 0.875rem;
}

.member-card__stat-link {
  cursor: pointer;
}

.member-card__stat-label {
  opacity: 0.7;
}

.member-card__bio {
  padding-top: 8px;
}
</style>
