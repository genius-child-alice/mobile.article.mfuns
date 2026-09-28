<script setup lang="ts">
import { computed, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    id?: number | string
    type?: number | string
    title?: string
    /** 分享链接 URL */
    content?: string
  }>(),
  {
    id: 0,
    type: 0,
    title: '',
    content: '',
  },
)

const showSheet = ref(false)
const snackbar = ref({ open: false, text: '', color: 'success' as string })

const shareText = computed(() => `${props.title} ${props.content}`.trim())
const canNativeShare = computed(
  () => typeof navigator !== 'undefined' && typeof navigator.share === 'function',
)

function toast(text: string, color = 'success') {
  snackbar.value = { open: true, text, color }
}

function show() {
  showSheet.value = true
}

async function copyLink() {
  const text = shareText.value || props.content || (typeof location !== 'undefined' ? location.href : '')
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
    } else {
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    toast('复制成功')
  } catch {
    toast('复制失败', 'error')
  }
  showSheet.value = false
}

async function nativeShare() {
  if (!canNativeShare.value) {
    await copyLink()
    return
  }
  try {
    await navigator.share({
      title: props.title || '分享',
      text: props.title || undefined,
      url: props.content || undefined,
    })
    showSheet.value = false
  } catch {
    /* user cancelled */
  }
}

defineExpose({ show })
</script>

<template>
  <v-bottom-sheet v-model="showSheet" max-width="500">
    <v-sheet width="100%">
      <div class="text-subtitle-1 px-4 pt-3 pb-1">分享</div>
      <div class="px-4 pb-6 d-flex justify-space-around">
        <v-sheet
          v-if="canNativeShare"
          class="pa-4 d-flex flex-column justify-center align-center"
          v-ripple
          role="button"
          @click="nativeShare"
        >
          <v-avatar color="green">
            <v-icon icon="mdi-share-variant" color="white" size="36" />
          </v-avatar>
          <span class="pt-2 text-body-2">系统分享</span>
        </v-sheet>

        <v-sheet
          class="pa-4 d-flex flex-column justify-center align-center"
          v-ripple
          role="button"
          @click="copyLink"
        >
          <v-avatar color="light-blue">
            <v-icon icon="mdi-link-variant" color="white" size="36" />
          </v-avatar>
          <span class="pt-2 text-body-2">复制链接</span>
        </v-sheet>
      </div>
    </v-sheet>
  </v-bottom-sheet>

  <v-snackbar v-model="snackbar.open" :color="snackbar.color" timeout="2500">
    {{ snackbar.text }}
  </v-snackbar>
</template>
