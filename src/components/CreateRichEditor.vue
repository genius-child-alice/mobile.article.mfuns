<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import MediaLibrary from './MediaLibrary.vue'

const props = withDefaults(
  defineProps<{
    modelValue?: string
    height?: number
    /** true=动态精简工具栏（对齐参考 ArticleEditor.limit） */
    limit?: boolean
    maxCount?: number
    placeholder?: string
  }>(),
  {
    modelValue: '',
    height: 280,
    limit: false,
    maxCount: 100000,
    placeholder: '请输入内容',
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const editorRef = ref<HTMLElement | null>(null)
const mediaRef = ref<InstanceType<typeof MediaLibrary> | null>(null)
let syncing = false

const count = computed(() => {
  const d = document.createElement('div')
  d.innerHTML = props.modelValue || ''
  return (d.textContent || '').length
})

const overLimit = computed(() => count.value > props.maxCount)

function getContent(): string {
  return editorRef.value?.innerHTML ?? ''
}

function setContent(html: string) {
  if (!editorRef.value) return
  syncing = true
  editorRef.value.innerHTML = html || ''
  syncing = false
}

function emitContent() {
  if (syncing) return
  emit('update:modelValue', getContent())
}

function exec(cmd: string, value?: string) {
  editorRef.value?.focus()
  document.execCommand(cmd, false, value)
  emitContent()
}

function insertHtml(html: string) {
  editorRef.value?.focus()
  document.execCommand('insertHTML', false, html)
  emitContent()
}

function insertImage(path: string) {
  if (!path) return
  editorRef.value?.focus()
  document.execCommand('insertImage', false, path)
  emitContent()
}

function openMedia() {
  mediaRef.value?.open('select', 1)
}

function insertAt() {
  insertHtml('<span class="mention">@</span>&nbsp;')
}

function insertEmoji() {
  // 参考站有完整表情面板；此处插入常用表情占位，保持工具栏布局一致
  insertHtml('😊')
}

onMounted(() => {
  setContent(props.modelValue)
})

watch(
  () => props.modelValue,
  (v) => {
    if (v !== getContent()) setContent(v)
  },
)

onBeforeUnmount(() => {
  emitContent()
})

defineExpose({ getContent, setContent })
</script>

<template>
  <!-- 参考 ArticleEditor：编辑区 → 字数 → 底栏工具条 -->
  <div class="create-rich-editor">
    <div
      ref="editorRef"
      class="create-rich-editor__body"
      :style="{ height: `${height}px` }"
      contenteditable="true"
      :data-placeholder="placeholder"
      @input="emitContent"
      @blur="emitContent"
    />
    <v-divider class="mb-1" />
    <div
      class="text-right text-caption px-1"
      :class="overLimit ? 'text-error' : 'text-disabled'"
    >
      {{ count }} / {{ maxCount }}
    </div>
    <div class="create-rich-editor__toolbar d-flex flex-wrap">
      <v-btn icon variant="text" size="small" @click="insertEmoji">
        <v-icon icon="mdi-emoticon-outline" />
      </v-btn>
      <v-btn icon variant="text" size="small" @click="insertAt">
        <v-icon icon="mdi-at" />
      </v-btn>
      <v-btn v-if="!limit" icon variant="text" size="small" @click="openMedia">
        <v-icon icon="mdi-image-outline" />
      </v-btn>
      <v-btn icon variant="text" size="small" @click="exec('bold')">
        <v-icon icon="mdi-format-bold" />
      </v-btn>
      <v-btn icon variant="text" size="small" @click="exec('italic')">
        <v-icon icon="mdi-format-italic" />
      </v-btn>
      <v-btn icon variant="text" size="small" @click="exec('strikeThrough')">
        <v-icon icon="mdi-format-strikethrough-variant" size="21" />
      </v-btn>
      <v-btn icon variant="text" size="small" @click="exec('underline')">
        <v-icon icon="mdi-format-underline" size="21" />
      </v-btn>
      <template v-if="!limit">
        <v-btn icon variant="text" size="small" @click="exec('formatBlock', 'H1')">
          <v-icon icon="mdi-format-header-1" />
        </v-btn>
        <v-btn icon variant="text" size="small" @click="exec('formatBlock', 'H2')">
          <v-icon icon="mdi-format-header-2" />
        </v-btn>
        <v-btn icon variant="text" size="small" @click="exec('formatBlock', 'H3')">
          <v-icon icon="mdi-format-header-3" />
        </v-btn>
        <v-btn icon variant="text" size="small" @click="exec('formatBlock', 'PRE')">
          <v-icon icon="mdi-code-tags" />
        </v-btn>
        <v-btn icon variant="text" size="small" @click="exec('formatBlock', 'PRE')">
          <v-icon icon="mdi-code-braces" />
        </v-btn>
        <v-btn icon variant="text" size="small" @click="exec('formatBlock', 'BLOCKQUOTE')">
          <v-icon icon="mdi-format-quote-open" />
        </v-btn>
        <v-btn icon variant="text" size="small" @click="exec('insertUnorderedList')">
          <v-icon icon="mdi-format-list-bulleted" />
        </v-btn>
        <v-btn icon variant="text" size="small" @click="exec('insertOrderedList')">
          <v-icon icon="mdi-format-list-numbered" />
        </v-btn>
        <v-btn icon variant="text" size="small" @click="exec('insertHorizontalRule')">
          <v-icon icon="mdi-minus" />
        </v-btn>
      </template>
    </div>
    <MediaLibrary v-if="!limit" ref="mediaRef" title="插入图片" @select="insertImage" />
  </div>
</template>

<style scoped>
.create-rich-editor__body {
  outline: none;
  overflow: auto;
  line-height: 1.6;
  padding: 8px 4px;
}

.create-rich-editor__body:empty::before {
  content: attr(data-placeholder);
  color: rgba(var(--v-theme-on-surface), 0.38);
}

.create-rich-editor__body :deep(img) {
  max-width: 100%;
  height: auto;
}

.create-rich-editor__body :deep(.mention) {
  color: rgb(var(--v-theme-link));
}
</style>
