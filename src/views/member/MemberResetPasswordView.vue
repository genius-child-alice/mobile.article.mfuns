<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { resetPassword, sendPasswordResetCode } from '../../api/memberAuthApi'
import { MfunsApiError } from '../../api/mfunsApi'

const router = useRouter()

const step = ref(1)
const phone = ref('')
const code = ref('')
const password = ref('')
const repeatPassword = ref('')
const loading = ref(false)
const snackbar = ref({ open: false, text: '', color: 'success' as string })

const stepTitles = ['电话号码', '验证码', '重置密码'] as const
const stepTitle = computed(() => stepTitles[step.value - 1] ?? '')

const requireRules = [(value: string) => !!value?.trim() || '输入不能为空']
const repeatPasswordRule = [
  (value: string) => value === password.value || '两次输入密码不一致',
]

function toast(text: string, color = 'success') {
  snackbar.value = { open: true, text, color }
}

async function sendCode() {
  if (!phone.value.trim()) {
    toast('输入不能为空', 'error')
    return
  }
  loading.value = true
  try {
    const res = await sendPasswordResetCode(phone.value)
    if (res.code === 1) step.value = 2
    else toast(res.msg || '发送失败', 'error')
  } catch (e) {
    toast(e instanceof MfunsApiError ? e.message : '好像出现了一点问题呢~', 'error')
  } finally {
    loading.value = false
  }
}

async function submit() {
  if (password.value !== repeatPassword.value) {
    toast('两次输入密码不一致', 'error')
    return
  }
  loading.value = true
  try {
    const res = await resetPassword({
      phone: phone.value,
      phone_code: code.value,
      password: password.value,
    })
    if (res.code === 1) {
      toast('密码重置成功')
      router.back()
    } else {
      toast(res.msg || '重置失败', 'error')
    }
  } catch (e) {
    toast(e instanceof MfunsApiError ? e.message : '好像出现了一点问题呢~', 'error')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="member-reset">
    <v-container>
      <v-card class="mx-auto member-reset__card" max-width="500">
        <v-card-title class="text-h6 font-weight-regular d-flex justify-space-between align-center">
          <span>{{ stepTitle }}</span>
          <v-avatar color="primary" size="24" class="text-white text-caption">
            {{ step }}
          </v-avatar>
        </v-card-title>

        <v-window v-model="step">
          <v-window-item :value="1">
            <v-card-text>
              <v-text-field
                v-model="phone"
                label="电话号码"
                color="link"
                variant="underlined"
                :rules="requireRules"
              />
              <div class="text-medium-emphasis">请输入你注册时的电话号码</div>
            </v-card-text>
          </v-window-item>

          <v-window-item :value="2">
            <v-card-text>
              <v-otp-input v-model="code" length="6" type="number" color="link" variant="outlined" />
              <div class="text-medium-emphasis mt-2">检查你的手机短信，输入6位验证码</div>
            </v-card-text>
          </v-window-item>

          <v-window-item :value="3">
            <v-card-text>
              <v-text-field
                v-model="password"
                label="新密码"
                type="password"
                color="link"
                variant="underlined"
                :rules="requireRules"
              />
              <v-text-field
                v-model="repeatPassword"
                label="确认密码"
                type="password"
                color="link"
                variant="underlined"
                :rules="repeatPasswordRule"
              />
              <div class="text-medium-emphasis">输入你的新密码</div>
            </v-card-text>
          </v-window-item>
        </v-window>

        <v-divider />

        <v-card-actions>
          <v-btn variant="text" color="link" :disabled="step === 1" @click="step -= 1">返回</v-btn>
          <v-spacer />
          <v-btn
            v-if="step === 1"
            color="primary"
            variant="flat"
            :loading="loading"
            @click="sendCode"
          >
            下一步
          </v-btn>
          <v-btn
            v-else-if="step === 2"
            color="primary"
            variant="flat"
            :disabled="code.length !== 6"
            @click="step = 3"
          >
            下一步
          </v-btn>
          <v-btn v-else color="primary" variant="flat" :loading="loading" @click="submit">
            提交
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-container>

    <v-snackbar v-model="snackbar.open" :color="snackbar.color" timeout="2500">
      {{ snackbar.text }}
    </v-snackbar>
  </div>
</template>
