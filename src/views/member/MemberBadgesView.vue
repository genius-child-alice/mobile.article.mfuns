<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  fetchUserBadges,
  setUserBadges,
  type MemberOwnedBadge,
} from '../../api/memberBadgeApi'
import { MfunsApiError } from '../../api/mfunsApi'
import { readMemberAuthState } from '../../auth/memberSession'
import MfunsBadge from '../../components/MfunsBadge.vue'
import { registerBadgeSave } from '../../composables/useBadgeSave'
import { useMemberAuth } from '../../composables/useMemberAuth'
import { refreshMemberProfile, useMemberProfile } from '../../composables/useMemberProfile'

const router = useRouter()
const { isLoggedIn } = useMemberAuth()
const { memberInfo } = useMemberProfile()

const MAX_WEAR = 2
const loading = ref(false)
const allBadges = ref<MemberOwnedBadge[]>([])
const wearList = ref<MemberOwnedBadge[]>([])
const dialog = ref(false)
const info = ref('')
const expire = ref(0)
const snackbar = ref({ open: false, text: '', color: 'success' as string })

function toast(text: string, color = 'success') {
  snackbar.value = { open: true, text, color }
}

function wear(index: number) {
  if (wearList.value.length >= MAX_WEAR) {
    toast('徽章已满', 'error')
    return
  }
  const item = allBadges.value[index]
  if (!item || item.wear) return
  wearList.value.push(item)
  item.wear = true
}

function remove(index: number) {
  const removed = wearList.value.splice(index, 1)[0]
  if (!removed) return
  for (const badge of allBadges.value) {
    if (badge.badge_id === removed.badge_id) badge.wear = false
  }
}

function showInfo(index: number) {
  const item = allBadges.value[index]
  if (!item) return
  info.value = item.info?.description ?? ''
  const expireAt = item.expire_time ?? 0
  expire.value = Math.floor((expireAt - Date.now() / 1000) / 86400)
  dialog.value = true
}

async function save() {
  const { token } = readMemberAuthState()
  if (!token) {
    router.replace('/member/login')
    return
  }
  loading.value = true
  try {
    const ids = wearList.value.map((b) => b.badge_id)
    const res = await setUserBadges(ids, token)
    if (res.code === 1) {
      toast('更改成功')
      await refreshMemberProfile()
    } else {
      toast(res.msg || '保存失败', 'error')
    }
  } catch (e) {
    toast(e instanceof MfunsApiError ? e.message : '好像出现了一点问题呢~', 'error')
  } finally {
    loading.value = false
  }
}

async function load() {
  const { token, isLogin } = readMemberAuthState()
  if (!isLogin || !token) {
    router.replace('/home')
    return
  }
  try {
    const res = await fetchUserBadges(token)
    if (res.code !== 1 || !Array.isArray(res.data)) {
      toast(res.msg || '加载失败', 'error')
      return
    }
    allBadges.value = res.data.map((b) => ({ ...b, wear: false }))
    const worn = memberInfo.value?.badges ?? []
    for (const badgeId of worn) {
      const idx = allBadges.value.findIndex((b) => b.badge_id === badgeId)
      if (idx >= 0) wear(idx)
    }
  } catch (e) {
    toast(e instanceof MfunsApiError ? e.message : '好像出现了一点问题呢~', 'error')
  }
}

let unreg: (() => void) | null = null

onMounted(() => {
  if (!isLoggedIn.value) {
    router.replace('/home')
    return
  }
  unreg = registerBadgeSave(() => {
    void save()
  })
  void refreshMemberProfile().then(() => load())
})

onUnmounted(() => {
  unreg?.()
})
</script>

<template>
  <div class="member-badges">
    <v-row dense>
      <v-col cols="12" md="6">
        <v-list elevation="1" class="bg-surface">
          <v-list-subheader class="d-flex align-center">
            <span>佩戴区域</span>
            <v-spacer />
            <span>{{ wearList.length }}/{{ MAX_WEAR }}</span>
          </v-list-subheader>
          <v-divider />
          <template v-for="(item, index) in wearList" :key="item.badge_id">
            <v-list-item>
              <v-list-item-title class="d-flex align-center flex-wrap">
                {{ item.info?.name }}
                <MfunsBadge v-if="item.info?.id" :id="item.info.id" />
              </v-list-item-title>
              <template #append>
                <v-btn color="primary" variant="flat" @click="remove(index)">取下</v-btn>
              </template>
            </v-list-item>
            <v-divider />
          </template>
          <v-list-item v-if="wearList.length === 0">
            <v-list-item-title>你还没有佩戴徽章呢( XAX)~</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-col>

      <v-col cols="12" md="6">
        <v-list elevation="1" class="bg-surface">
          <v-list-subheader>我的所有徽章</v-list-subheader>
          <v-divider />
          <template v-for="(item, index) in allBadges" :key="`${item.badge_id}-${index}`">
            <template v-if="item.info?.wearable === 1">
              <v-list-item>
                <v-list-item-title class="d-flex align-center flex-wrap">
                  {{ item.info?.name }}
                  <MfunsBadge v-if="item.info?.id" :id="item.info.id" />
                </v-list-item-title>
                <template #append>
                  <v-btn variant="text" class="me-1" @click="showInfo(index)">详情</v-btn>
                  <v-btn
                    color="success"
                    variant="flat"
                    :disabled="item.wear"
                    @click="wear(index)"
                  >
                    {{ item.wear ? '已佩戴' : '佩戴' }}
                  </v-btn>
                </template>
              </v-list-item>
              <v-divider />
            </template>
          </template>
        </v-list>
      </v-col>
    </v-row>

    <v-dialog v-model="dialog" max-width="500">
      <v-card>
        <v-card-text>
          {{ info }}
          <br />
          到期时间：{{ expire }}天后
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" variant="text" @click="dialog = false">了解</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.open" :color="snackbar.color" timeout="2500">
      {{ snackbar.text }}
    </v-snackbar>
  </div>
</template>

<style scoped>
.member-badges {
  padding: 8px;
}
</style>
