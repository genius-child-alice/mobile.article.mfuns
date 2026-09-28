<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const CAPTCHA_ID = '647f5ed2ed8acb4be36784e01556bb71'
const GT4_SCRIPT = 'https://static.geetest.com/v4/gt4.js'

declare global {
  interface Window {
    initGeetest4?: (
      config: Record<string, unknown>,
      callback: (captcha: GeetestCaptcha) => void,
    ) => void
  }
}

interface GeetestCaptcha {
  showBox: () => void
  getValidate: () => Record<string, unknown> | undefined
  onSuccess: (cb: () => void) => void
  destroy?: () => void
}

const emit = defineEmits<{
  success: [validate: Record<string, unknown>]
  error: [message: string]
}>()

const loading = ref(true)
const captcha = ref<GeetestCaptcha | null>(null)
let scriptEl: HTMLScriptElement | null = null

function loadScript(): Promise<void> {
  if (typeof window.initGeetest4 === 'function') return Promise.resolve()
  return new Promise((resolve, reject) => {
    scriptEl = document.createElement('script')
    scriptEl.src = GT4_SCRIPT
    scriptEl.async = true
    scriptEl.onload = () => resolve()
    scriptEl.onerror = () => reject(new Error('验证码加载失败'))
    document.head.appendChild(scriptEl)
  })
}

function validate(): Record<string, unknown> | false {
  if (!captcha.value) {
    emit('error', '验证码正在加载')
    return false
  }
  const data = captcha.value.getValidate()
  if (!data) {
    emit('error', '请完成验证码')
    return false
  }
  return { ...data, captcha_id: CAPTCHA_ID }
}

function showBox() {
  if (!captcha.value) {
    emit('error', '验证码正在加载')
    return
  }
  captcha.value.showBox()
}

onMounted(async () => {
  try {
    await loadScript()
    window.initGeetest4?.(
      {
        captchaId: CAPTCHA_ID,
        product: 'bind',
        riskType: 'slide',
      },
      (instance) => {
        captcha.value = instance
        loading.value = false
        instance.onSuccess(() => {
          const data = validate()
          if (data) emit('success', data)
        })
      },
    )
  } catch {
    loading.value = false
    emit('error', '验证码加载失败')
  }
})

onBeforeUnmount(() => {
  captcha.value?.destroy?.()
  captcha.value = null
})

defineExpose({ showBox, validate, loading })
</script>

<template>
  <!-- bind 模式无可见 DOM，点击注册时 showBox -->
  <div class="geetest-bind" aria-hidden="true" />
</template>
