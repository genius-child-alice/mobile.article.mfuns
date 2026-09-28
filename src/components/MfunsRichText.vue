<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { mfunsImageUrl } from '../utils/mfunsImageUrl'

const props = withDefaults(
  defineProps<{
    text?: string
    /** 0=纯文本 1=HTML */
    type?: number
    maxLine?: number
  }>(),
  {
    text: '',
    type: 1,
    maxLine: 0,
  },
)

const htmlRef = ref<HTMLElement | null>(null)
const showMaxLineSwitch = ref(false)
const showAll = ref(false)
const renderKey = ref(0)
const lineHeight = 27

const htmlContent = computed(() => {
  if (props.type !== 1 || !props.text) return ''
  return rewriteImages(props.text)
})

function rewriteImages(html: string): string {
  if (typeof DOMParser === 'undefined') {
    return html.replace(/<img\b([^>]*?)\bsrc=["']([^"']+)["']/gi, (_m, attrs: string, src: string) => {
      const next = mfunsImageUrl(src, 1000) || src
      return `<img${attrs} src="${next}"`
    })
  }
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html')
  const root = doc.body.firstElementChild
  if (!root) return html
  root.querySelectorAll('img').forEach((img) => {
    const origin = img.getAttribute('src-origin') || img.getAttribute('src') || ''
    if (!img.getAttribute('src-origin') && origin) img.setAttribute('src-origin', origin)
    const next = mfunsImageUrl(origin, 1000)
    if (next) img.setAttribute('src', next)
    img.classList.add('preview')
  })
  return root.innerHTML
}

function measureClamp() {
  showMaxLineSwitch.value = false
  if (!props.maxLine || !htmlRef.value) return
  if (htmlRef.value.scrollHeight > lineHeight * props.maxLine) {
    showMaxLineSwitch.value = true
  }
}

function refresh() {
  renderKey.value += 1
  showAll.value = false
  nextTick().then(measureClamp)
}

watch(() => [props.text, props.type, props.maxLine], refresh)
onMounted(refresh)
</script>

<template>
  <div class="mfuns-rich-text">
    <div
      :key="renderKey"
      ref="htmlRef"
      class="mfuns-rich-text__body markdown-body"
      :class="{ 'mfuns-rich-text__body--clamped': showMaxLineSwitch && !showAll }"
      :style="maxLine ? { WebkitLineClamp: String(maxLine) } : undefined"
    >
      <div v-if="type === 0" class="mfuns-rich-text__plain">{{ text }}</div>
      <div v-else-if="type === 1" class="mfuns-rich-text__html" v-html="htmlContent" />
    </div>
    <a
      v-if="showMaxLineSwitch"
      class="mfuns-rich-text__toggle text-link"
      href="javascript:;"
      @click.stop.prevent="showAll = !showAll"
    >
      {{ showAll ? '收起' : '展开' }}
    </a>
  </div>
</template>

<style scoped>
.mfuns-rich-text__body {
  background-color: transparent;
  font-size: 15px;
  line-height: 1.5;
  word-break: break-word;
}

.mfuns-rich-text__body--clamped {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mfuns-rich-text__html :deep(p) {
  margin: 0 0 0.75em;
}

.mfuns-rich-text__html :deep(p:last-child) {
  margin-bottom: 0;
}

.mfuns-rich-text__html :deep(img) {
  display: block;
  max-width: 100%;
  height: auto;
  margin: 0.5em 0;
  border-radius: 4px;
}

.mfuns-rich-text__html :deep(a) {
  color: rgb(var(--v-theme-link));
}

.mfuns-rich-text__toggle {
  color: rgb(var(--v-theme-link));
  font-size: 14px;
  text-decoration: none;
}

.text-link {
  color: rgb(var(--v-theme-link));
}
</style>
