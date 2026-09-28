<script lang="ts">
const DEFAULT_REASONS = [
  '色情或低俗内容',
  '血腥暴力或令人反感',
  '涉及政治不当言论',
  '引战或传播仇恨',
  '人身攻击',
  '传播虚假信息',
  '不受欢迎的广告或垃圾内容',
  '骚扰或欺诈内容',
  '违法违禁',
] as const
</script>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { reportContent } from '../api/reportApi'
import { readMemberAuthState } from '../auth/memberSession'
import { useMemberAuth } from '../composables/useMemberAuth'

const props = withDefaults(
  defineProps<{
    reasons?: string[]
  }>(),
  {
    reasons: () => [...DEFAULT_REASONS],
  },
)

const router = useRouter()
const { isLoggedIn } = useMemberAuth()

const reasonList = computed(() => props.reasons)
const dialog = ref(false)
const reason = ref<string>(DEFAULT_REASONS[0])
const other = ref('')
const id = ref(0)
const type = ref(0)
const submitting = ref(false)
const snackbar = ref({ open: false, text: '', color: 'success' as string })

function toast(text: string, color = 'success') {
  snackbar.value = { open: true, text, color }
}

function show(resourceId: number, resourceType: number) {
  if (!isLoggedIn.value) {
    router.push('/member/login')
    return
  }
  id.value = resourceId
  type.value = resourceType
  reason.value = DEFAULT_REASONS[0]
  other.value = ''
  dialog.value = true
}

async function submit() {
  const token = readMemberAuthState().token
  if (!token) {
    router.push('/member/login')
    return
  }

  let text = reason.value
  if (reason.value === 'other') {
    text = other.value.replace(/\s/g, '')
    if (!text) {
      toast('举报内容不能为空！', 'error')
      return
    }
    text = other.value.trim()
  }

  submitting.value = true
  try {
    const res = await reportContent(id.value, type.value, text, token)
    if (res.code === 1) {
      toast('感谢你的举报！')
      dialog.value = false
    } else {
      toast(res.msg || '举报失败', 'error')
    }
  } finally {
    submitting.value = false
  }
}

defineExpose({ show })
</script>

<template>
  <v-dialog v-model="dialog" max-width="420">
    <v-card>
      <v-card-title>举报</v-card-title>
      <v-card-text>
        <v-radio-group v-model="reason" color="link" hide-details density="compact">
          <v-radio
            v-for="item in reasonList"
            :key="item"
            :label="item"
            :value="item"
            density="compact"
          />
          <v-radio label="其他" value="other" density="compact" />
        </v-radio-group>
        <v-textarea
          v-if="reason === 'other'"
          v-model="other"
          class="mt-2"
          density="compact"
          hide-details
          color="link"
          placeholder="请输入举报内容"
          variant="outlined"
          rows="2"
        />
      </v-card-text>
      <v-divider />
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" color="link" @click="dialog = false">关闭</v-btn>
        <v-btn variant="text" color="link" :loading="submitting" @click="submit">提交</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-snackbar v-model="snackbar.open" :color="snackbar.color" timeout="2500">
    {{ snackbar.text }}
  </v-snackbar>
</template>
