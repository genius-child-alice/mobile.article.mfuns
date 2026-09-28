<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import type { MemberUserInfo } from '../api/memberUserApi'
import { mfunsResourcePath } from '../utils/mfunsResourceUrl'
import { formatRelativeTime } from '../utils/mfunsTime'
import FeedMemberInfoRow from './FeedMemberInfoRow.vue'
import MfunsRichText from './MfunsRichText.vue'

export interface NotifyCardData {
  id?: number
  user?: MemberUserInfo
  info?: string
  content?: string
  time?: number | string
  resource_id?: number
  resource_type?: number
}

const props = defineProps<{
  data: NotifyCardData
}>()

const router = useRouter()

const timeLabel = computed(() => formatRelativeTime(props.data.time))

const memberData = computed(() => ({
  id: props.data.user?.id,
  name: props.data.user?.name,
  avatar: props.data.user?.avatar,
  name_color: props.data.user?.name_color,
  level_id: props.data.user?.level_id,
  badges: props.data.user?.badges,
  info: props.data.info,
}))

function goResource() {
  const id = props.data.resource_id
  const type = props.data.resource_type
  if (id == null || type == null) return
  router.push(mfunsResourcePath(type, id))
}
</script>

<template>
  <!-- 参考 NotifyCard：MemberInfo + 灰底正文 + divider -->
  <div class="notify-card" style="max-width: 100vw">
    <v-sheet v-ripple class="pb-2" @click="goResource">
      <div @click.stop>
        <FeedMemberInfoRow :data="memberData" to-user>
          <span class="text-medium-emphasis text-caption">{{ timeLabel }}</span>
        </FeedMemberInfoRow>
      </div>
      <v-sheet class="ml-16 mr-3 pa-3" color="rgba(128,128,128,0.2)">
        <MfunsRichText :text="data.content" :type="0" />
      </v-sheet>
    </v-sheet>
    <v-divider />
  </div>
</template>
