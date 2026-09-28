<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { fetchIsReward, rewardResource } from '../api/rewardApi'
import { readMemberAuthState } from '../auth/memberSession'
import { useMemberAuth } from '../composables/useMemberAuth'
import { useMemberProfile } from '../composables/useMemberProfile'

const props = defineProps<{
  id: number
  type: number
}>()

const emit = defineEmits<{
  reward: [count: number]
}>()

const router = useRouter()
const { isLoggedIn } = useMemberAuth()
const { nekoCoin } = useMemberProfile()

const dialog = ref(false)
const isReward = ref(false)
const count = ref(5)
const snackbar = ref({ open: false, text: '', color: 'success' as string })

function toast(text: string, color = 'success') {
  snackbar.value = { open: true, text, color }
}

async function refreshStatus() {
  const token = readMemberAuthState().token
  if (!token) return
  const res = await fetchIsReward(props.id, props.type, token)
  if (res.code === 1) isReward.value = Boolean(res.data?.is_reward)
}

function show() {
  if (!isLoggedIn.value) {
    router.push('/member/login')
    return
  }
  if (isReward.value) {
    toast('内容已打赏', 'info')
    return
  }
  dialog.value = true
}

async function onStarClick(index: number) {
  count.value = index + 1
  await reward()
}

async function reward() {
  const token = readMemberAuthState().token
  if (!token) {
    router.push('/member/login')
    return
  }

  isReward.value = true
  const res = await rewardResource(props.id, props.type, count.value, token)
  if (res.code === 1) {
    toast(res.msg || '打赏成功')
    emit('reward', count.value)
  } else {
    isReward.value = false
    toast(res.msg || '打赏失败', 'error')
  }
  dialog.value = false
}

onMounted(() => {
  if (isLoggedIn.value) void refreshStatus()
})

defineExpose({ show, isReward, refreshStatus })
</script>

<template>
  <v-dialog v-model="dialog" max-width="350">
    <v-card>
      <v-card-title>选择打赏数量</v-card-title>
      <v-card-text>
        <div class="text-center">
          <v-rating v-model="count" :length="5" hover>
            <template #item="{ index, isFilled }">
              <v-icon
                :icon="isFilled ? 'mdi-star-circle' : 'mdi-star-circle-outline'"
                :color="isFilled ? 'link' : 'grey-lighten-1'"
                size="large"
                @click="onStarClick(index)"
              />
            </template>
          </v-rating>
          <div class="mt-3 text-body-2">
            打赏将消耗 {{ count }} 喵币，当前剩余 {{ isLoggedIn ? nekoCoin : 0 }} 喵币
          </div>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>

  <v-snackbar v-model="snackbar.open" :color="snackbar.color" timeout="2500">
    {{ snackbar.text }}
  </v-snackbar>
</template>
