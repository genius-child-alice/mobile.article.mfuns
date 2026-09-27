<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { VForm } from 'vuetify/components'
import { extractLoginToken, loginMember } from '../../api/memberAuthApi'
import { MfunsApiError } from '../../api/mfunsApi'
import { persistMemberAuth } from '../../auth/memberSession'
import { refreshMemberAuth, useMemberAuth } from '../../composables/useMemberAuth'

const router = useRouter()
const { isLoggedIn } = useMemberAuth()

const formRef = ref<VForm | null>(null)
const account = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

const requireRules = [(value: string) => !!value?.trim() || '输入不能为空']

onMounted(() => {
  if (isLoggedIn.value) {
    router.replace('/home')
  }
})

async function submitLogin() {
  error.value = ''
  const result = await formRef.value?.validate()
  if (!result?.valid) return

  loading.value = true
  try {
    const res = await loginMember({
      account: account.value,
      password: password.value,
    })

    if (res.code !== 1) {
      error.value = res.msg || '登录失败'
      return
    }

    const token = extractLoginToken(res.data)
    if (!token) {
      error.value = '登录成功但未返回凭证'
      return
    }

    persistMemberAuth(token)
    refreshMemberAuth()

    if (window.history.length > 1) router.back()
    else router.replace('/member')
  } catch (e) {
    error.value = e instanceof MfunsApiError ? e.message : '好像出现了一点问题呢~'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <!-- m.mfuns LoginPage: v-main > container > form; btn sibling; .bottom outside main -->
  <div class="member-login">
    <div class="member-login__main">
      <v-form ref="formRef" :disabled="loading">
        <v-text-field
          v-model="account"
          label="用户名/ID/邮箱/手机号"
          color="link"
          variant="underlined"
          autocomplete="username"
          :rules="requireRules"
          :error="error !== ''"
        />
        <v-text-field
          v-model="password"
          label="密码"
          type="password"
          color="link"
          variant="underlined"
          autocomplete="current-password"
          :rules="requireRules"
          :error-messages="error"
        />
      </v-form>

      <v-btn
        class="mt-2"
        block
        color="primary"
        elevation="0"
        :loading="loading"
        @click="submitLogin"
      >
        登录
      </v-btn>
    </div>

    <div class="member-login__bottom">
      忘记了密码？
      <RouterLink class="link--text" to="/member/reset_password">找回密码</RouterLink>
    </div>
  </div>
</template>

<style scoped>
.member-login {
  position: relative;
  width: 100%;
}

/* <960px: full width + gutter; ≥960px: centered cap (side margins ×0.7) */
.member-login__main {
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
  margin-inline: auto;
  padding: calc(12px * 0.7) calc(12px * 0.7) 0;
}

@media (min-width: 960px) {
  .member-login__main {
    max-width: min(100%, calc(30vw + 672px));
  }
}

.member-login__main :deep(.v-form) {
  display: block;
  width: 100%;
  max-width: none;
}

.member-login__main :deep(.v-input),
.member-login__main :deep(.v-field) {
  width: 100%;
  max-width: none;
  padding-inline: 0;
}

.member-login__main :deep(.v-field__field) {
  width: 100%;
}

.member-login__main :deep(.v-btn) {
  width: 100%;
  max-width: none;
}

.member-login__bottom {
  position: fixed;
  z-index: 1;
  left: 0;
  right: 0;
  bottom: calc(16px + env(safe-area-inset-bottom, 0px));
  text-align: center;
  font-size: 1rem;
  font-weight: 400;
  line-height: 1.5;
  color: rgba(var(--v-theme-on-surface), var(--v-high-emphasis-opacity));
}

:global(.mfuns-app--left-rail) .member-login__bottom {
  left: var(--mfuns-left-nav-width, 74px);
  width: calc(100% - var(--mfuns-left-nav-width, 74px));
}
</style>
