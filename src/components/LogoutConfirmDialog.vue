<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { logoutMember } from '../api/memberAuthApi'
import { persistMemberAuth } from '../auth/memberSession'
import { refreshMemberAuth } from '../composables/useMemberAuth'
import { clearMemberProfile } from '../composables/useMemberProfile'

const router = useRouter()
const open = ref(false)
const loading = ref(false)

function show() {
  open.value = true
}

async function confirm() {
  loading.value = true
  try {
    await logoutMember()
  } catch {
    /* still clear local session */
  } finally {
    persistMemberAuth(null)
    refreshMemberAuth()
    clearMemberProfile()
    loading.value = false
    open.value = false
    router.replace('/member/login')
  }
}

defineExpose({ show })
</script>

<template>
  <v-dialog v-model="open" max-width="320">
    <v-card>
      <v-card-title class="text-h6">提示</v-card-title>
      <v-card-text>是否登录退出？</v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" :disabled="loading" @click="open = false">手滑了 QAQ</v-btn>
        <v-btn color="primary" variant="text" :loading="loading" @click="confirm">确认</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
