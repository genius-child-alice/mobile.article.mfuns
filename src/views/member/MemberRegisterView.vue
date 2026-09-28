<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { VForm } from 'vuetify/components'
import { registerMember, sendRegisterSmsCode } from '../../api/memberAuthApi'
import { MfunsApiError } from '../../api/mfunsApi'
import GeetestBind from '../../components/GeetestBind.vue'
import { useMemberAuth } from '../../composables/useMemberAuth'

const router = useRouter()
const { isLoggedIn } = useMemberAuth()

const formRef = ref<VForm | null>(null)
const geeRef = ref<InstanceType<typeof GeetestBind> | null>(null)
const name = ref('')
const password = ref('')
const phone = ref('')
const code = ref('')
const loading = ref(false)
const error = ref('')
const snackbar = ref({ open: false, text: '', color: 'success' as string })

const phoneCodeIsSend = ref(false)
const phoneCodeCountdown = ref(60)
let phoneCodeTimerId = 0

const requireRules = [(value: string) => !!value?.trim() || '输入不能为空']
const phoneRules = [
  (value: string) => /^1[3456789]\d{9}$/.test(value?.trim() || '') || '请输入正确的手机号',
]

onMounted(() => {
  if (isLoggedIn.value) router.replace('/home')
})

onUnmounted(() => {
  if (phoneCodeTimerId) clearInterval(phoneCodeTimerId)
})

function toast(text: string, color = 'success') {
  snackbar.value = { open: true, text, color }
}

async function sendCode() {
  if (!/^1[3456789]\d{9}$/.test(phone.value.trim())) {
    toast('请输入正确的手机号', 'error')
    return
  }
  phoneCodeIsSend.value = true
  phoneCodeCountdown.value = 60
  void sendRegisterSmsCode(phone.value)
  toast('验证码发送成功，请注意查收', 'success')
  phoneCodeTimerId = window.setInterval(() => {
    phoneCodeCountdown.value -= 1
    if (phoneCodeCountdown.value < 0) {
      phoneCodeCountdown.value = 60
      phoneCodeIsSend.value = false
      clearInterval(phoneCodeTimerId)
      phoneCodeTimerId = 0
    }
  }, 1000)
}

async function onRegisterClick() {
  error.value = ''
  const result = await formRef.value?.validate()
  if (!result?.valid) return
  geeRef.value?.showBox()
}

async function onCaptchaSuccess(captcha: Record<string, unknown>) {
  loading.value = true
  try {
    const res = await registerMember({
      name: name.value,
      password: password.value,
      phone: phone.value,
      code: code.value,
      captcha,
    })
    if (res.code !== 1) {
      error.value = res.msg || '注册失败'
      return
    }
    formRef.value?.reset()
    toast('注册成功，请登录')
    await router.replace('/member/login')
  } catch (e) {
    error.value = e instanceof MfunsApiError ? e.message : '无法连接到服务器'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="member-register">
    <div class="member-register__main">
      <v-form ref="formRef" :disabled="loading">
        <v-text-field
          v-model="name"
          label="用户名"
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
          autocomplete="new-password"
          :rules="requireRules"
          :error="error !== ''"
        />
        <v-text-field
          v-model="phone"
          label="手机号"
          color="link"
          variant="underlined"
          autocomplete="tel"
          :rules="phoneRules"
          :error="error !== ''"
        />
        <v-text-field
          v-model="code"
          label="验证码"
          color="link"
          variant="underlined"
          autocomplete="one-time-code"
          :rules="requireRules"
          :error-messages="error"
        >
          <template #append>
            <v-btn v-if="phoneCodeIsSend" variant="text" disabled>
              {{ phoneCodeCountdown }}秒
            </v-btn>
            <v-btn v-else variant="text" color="primary" @click="sendCode">发送验证码</v-btn>
          </template>
        </v-text-field>
      </v-form>

      <GeetestBind ref="geeRef" @success="onCaptchaSuccess" @error="(m) => toast(m, 'error')" />

      <v-btn
        class="mt-2"
        block
        color="primary"
        elevation="0"
        :loading="loading"
        @click="onRegisterClick"
      >
        注册
      </v-btn>
    </div>

    <v-snackbar v-model="snackbar.open" :color="snackbar.color" timeout="2500">
      {{ snackbar.text }}
    </v-snackbar>
  </div>
</template>

<style scoped>
.member-register {
  width: 100%;
}

.member-register__main {
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
  margin-inline: auto;
  padding: calc(12px * 0.7) calc(12px * 0.7) 0;
}

@media (min-width: 960px) {
  .member-register__main {
    max-width: min(100%, calc(30vw + 672px));
  }
}
</style>
