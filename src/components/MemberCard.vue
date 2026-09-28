<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'
import { fetchFollowCount } from '../api/followApi'
import type { MemberUserInfo } from '../api/memberUserApi'
import { readMemberAuthState } from '../auth/memberSession'
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

const followCount = ref<number | null>(null)
const fansCount = ref<number | null>(null)

const displayFollowCount = computed(
  () => followCount.value ?? props.user.follow?.follow ?? 0,
)
const displayFansCount = computed(() => fansCount.value ?? props.user.follow?.fans ?? 0)

async function loadFollowStats() {
  if (!props.user.id) return
  const { token } = readMemberAuthState()
  const res = await fetchFollowCount(props.user.id, token)
  if (res.code === 1 && res.data) {
    if (typeof res.data.follow === 'number') followCount.value = res.data.follow
    if (typeof res.data.fans === 'number') fansCount.value = res.data.fans
  }
}

onMounted(() => {
  void loadFollowStats()
})

watch(
  () => props.user.id,
  () => {
    followCount.value = null
    fansCount.value = null
    void loadFollowStats()
  },
)

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
      <div v-if="smAndUp" class="member-card__banner-strip">
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
            <span>{{ displayFollowCount }}</span>
            <span class="member-card__stat-label"> 关注</span>
          </span>
          <span class="member-card__stat-link ms-3" @click.stop="goFollow('fans')">
            <span>{{ displayFansCount }}</span>
            <span class="member-card__stat-label"> 粉丝</span>
          </span>
          <span class="ms-3">
            <span>{{ formatRelativeTime(user.created_at) }}</span>
            <span class="member-card__stat-label"> 注册</span>
          </span>
        </div>
      </div>
    </v-img>

    <div
      class="member-card__body"
      :class="{
        'member-card__body--mobile': !smAndUp,
        'member-card__body--wide': smAndUp,
      }"
    >
      <div :class="smAndUp ? 'member-card__avatar-fill' : 'member-card__avatar-mini'">
        <v-avatar :size="smAndUp ? 112 : 88" color="white" elevation="1">
          <v-img v-if="avatarSrc" :src="avatarSrc" cover />
          <v-icon v-else icon="mdi-account" size="40" />
        </v-avatar>
      </div>

      <div v-if="!smAndUp" class="member-card__mobile-info">
        <div class="member-card__name-row member-card__name-row--mobile text-h6">
          <span :class="nameColorClass(user.name_color)">{{ user.name }}</span>
          <v-icon v-if="user.gender === 1" icon="mdi-gender-male" color="#00b9ff" size="18" />
          <v-icon v-if="user.gender === 2" icon="mdi-gender-female" color="#ea7c8d" size="18" />
          <MfunsBadge v-for="badgeId in displayBadgeIds" :key="`m-${badgeId}`" :id="badgeId" />
        </div>
        <div class="text-center text-body-2 member-card__stats member-card__stats--mobile">
          <span>UID{{ user.id }}</span>
          <span class="member-card__stat-link ms-2" @click.stop="goFollow('follow')">
            {{ displayFollowCount }} 关注
          </span>
          <span class="member-card__stat-link ms-2" @click.stop="goFollow('fans')">
            {{ displayFansCount }} 粉丝
          </span>
        </div>
      </div>

      <div
        class="member-card__bio"
        :class="{
          'member-card__bio--wide': smAndUp,
          'member-card__bio--mobile': !smAndUp,
        }"
      >
        <div v-if="user.bio" class="text-body-2 text-pre-wrap">{{ user.bio }}</div>
        <div v-else class="text-body-2 text-medium-emphasis">这个人很懒，还没有写签名呢~</div>
      </div>
    </div>
  </v-card>
</template>

<style scoped>
.member-card__banner-placeholder {
  width: 100%;
  height: 100%;
  background: rgba(var(--v-theme-on-surface), 0.08);
}

/* 参考 user-banner-image-color：底部信息条，左侧留给头像 */
.member-card__banner-strip {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 80px;
  padding-left: 140px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  background-image: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
}

.member-card__body {
  position: relative;
}

.member-card__body--mobile {
  padding-top: 44px;
}

/* 头像 bottom = -80 + 112 = 32px；简介底边与之对齐 */
.member-card__body--wide {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  min-height: 32px;
  padding-left: 140px;
  padding-top: 10px;
  padding-bottom: 10px;
}

.member-card__avatar-fill {
  position: absolute;
  top: -80px;
  left: 16px;
  z-index: 1;
}

.member-card__avatar-mini {
  position: absolute;
  top: -44px;
  left: 50%;
  z-index: 1;
  transform: translateX(-50%);
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

.member-card__mobile-info {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  margin: 0;
  padding: 0 16px;
  gap: 4px;
}

.member-card__name-row--mobile {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  justify-content: center;
  gap: 4px;
  line-height: 1.25;
  max-width: 100%;
}

.member-card__name-row--mobile > span:first-child {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.member-card__stats--mobile {
  margin: 0;
  line-height: 1.25;
}

.member-card__bio {
  padding-top: 8px;
}

.member-card__bio--mobile {
  text-align: center;
  margin: 0;
  padding: 4px 16px 8px;
  font-size: 0.875rem;
  line-height: 1.25;
}

.member-card__bio--mobile .text-body-2 {
  font-size: inherit;
  line-height: inherit;
}

.member-card__bio--wide {
  width: 100%;
  padding: 0 12px 0 0;
}
</style>
