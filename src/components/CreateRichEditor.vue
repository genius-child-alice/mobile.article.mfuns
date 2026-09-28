<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import Quill from 'quill'
import 'quill/dist/quill.core.css'
import { mfunsImageUrl } from '../utils/mfunsImageUrl'
import { isQuillDeltaJson } from '../utils/quillContent'
import CreateMemberSelectDialog, { type MentionUser } from './CreateMemberSelectDialog.vue'
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

const editorHost = ref<HTMLElement | null>(null)
const toolbarId = `create-rich-toolbar-${Math.random().toString(36).slice(2, 9)}`
const mediaRef = ref<InstanceType<typeof MediaLibrary> | null>(null)
const memberOpen = ref(false)
const count = ref(0)

let quill: Quill | null = null
let selectionIndex = 0
let syncing = false
let blotsReady = false

const overLimit = computed(() => count.value > props.maxCount)

const formats = computed(() =>
  props.limit
    ? ['bold', 'italic', 'strike', 'underline', 'mention']
    : [
        'bold',
        'italic',
        'strike',
        'underline',
        'header',
        'image',
        'mention',
        'code',
        'code-block',
        'blockquote',
        'list',
        'divider',
      ],
)

function ensureBlots() {
  if (blotsReady) return
  blotsReady = true

  const Block = Quill.import('blots/block') as { tagName: string }
  Block.tagName = 'DIV'
  Quill.register(Block as any, true)

  const Embed = Quill.import('blots/embed') as any
  class MentionBlot extends Embed {
    static blotName = 'mention'
    static tagName = 'span'
    static className = 'mention'

    static create(value: { id: number | string; value: string }) {
      const node = super.create() as HTMLElement
      node.setAttribute('data-id', String(value.id))
      node.setAttribute('data-value', value.value)
      node.setAttribute('class', 'mention')
      node.innerHTML = `@${value.value}`
      return node
    }

    static value(node: HTMLElement) {
      return {
        id: node.getAttribute('data-id'),
        value: node.getAttribute('data-value'),
      }
    }
  }
  Quill.register(MentionBlot as any)

  const Image = Quill.import('formats/image') as any
  class MfunsImageBlot extends Image {
    static create(value: string) {
      const node = super.create(value) as HTMLImageElement
      const path = typeof value === 'string' ? value : ''
      node.setAttribute('alt', path)
      node.setAttribute('src', mfunsImageUrl(path, 1000) || path)
      return node
    }

    static value(node: HTMLImageElement) {
      return node.getAttribute('alt') || node.getAttribute('src') || ''
    }
  }
  Quill.register(MfunsImageBlot as any, true)

  const BlockEmbed = Quill.import('blots/block/embed') as any
  class DividerBlot extends BlockEmbed {
    static blotName = 'divider'
    static tagName = 'hr'
  }
  Quill.register(DividerBlot as any)
}

function emitContent() {
  if (!quill || syncing) return
  emit('update:modelValue', JSON.stringify(quill.getContents()))
  refreshCount()
}

function refreshCount() {
  if (!quill) {
    count.value = 0
    return
  }
  const len = quill.getLength() - 1
  count.value = len <= 0 ? 0 : len
}

function saveSelection() {
  if (!quill) return
  const range = quill.getSelection()
  selectionIndex = range?.index ?? selectionIndex
}

function getContent(): string {
  if (!quill) return props.modelValue || ''
  return JSON.stringify(quill.getContents())
}

function setContent(content: string) {
  if (!quill) return
  syncing = true
  try {
    if (isQuillDeltaJson(content)) {
      quill.setContents(JSON.parse(content))
    } else if (content?.trim()) {
      // HTML / 纯文本回退（对齐参考 clipboard.convert）
      const delta = quill.clipboard.convert(content)
      quill.setContents(delta as any)
    } else {
      quill.setContents([] as any)
    }
  } catch {
    try {
      const delta = quill.clipboard.convert(content || '')
      quill.setContents(delta as any)
    } catch {
      quill.setText(content || '')
    }
  } finally {
    syncing = false
    refreshCount()
  }
}

function insertMention(user: MentionUser) {
  if (!quill || !user.id || !user.name) return
  const index = selectionIndex
  quill.insertEmbed(index, 'mention', { id: user.id, value: user.name }, 'user')
  selectionIndex = index + 1
  nextTick(() => {
    quill?.setSelection(selectionIndex, 0)
    saveSelection()
    emitContent()
  })
}

function insertEmoji() {
  if (!quill) return
  saveSelection()
  quill.insertText(selectionIndex, '😊', 'user')
  selectionIndex += 2
  quill.setSelection(selectionIndex, 0)
  emitContent()
}

function openMemberSelect() {
  saveSelection()
  memberOpen.value = true
}

function openMedia() {
  saveSelection()
  mediaRef.value?.open('select', 1)
}

function insertImage(path: string) {
  if (!quill || !path) return
  const index = selectionIndex
  quill.insertEmbed(index, 'image', path, 'user')
  selectionIndex = index + 1
  nextTick(() => {
    quill?.setSelection(selectionIndex, 0)
    saveSelection()
    emitContent()
  })
}

function insertDivider() {
  if (!quill) return
  saveSelection()
  quill.insertEmbed(selectionIndex, 'divider', true, 'user')
  selectionIndex += 1
  quill.setSelection(selectionIndex, 0)
  emitContent()
}

onMounted(() => {
  if (!editorHost.value) return
  ensureBlots()

  quill = new Quill(editorHost.value, {
    modules: {
      toolbar: {
        container: `#${toolbarId}`,
        handlers: {
          divider: insertDivider,
        },
      },
    },
    formats: formats.value,
    placeholder: props.placeholder,
  })

  quill.root.style.minHeight = `${props.height}px`
  quill.root.classList.add('markdown-body')

  quill.on('text-change', () => {
    if (!syncing) emitContent()
    else refreshCount()
  })
  quill.on('selection-change', (range) => {
    if (range) selectionIndex = range.index
  })

  if (props.modelValue) setContent(props.modelValue)
  else refreshCount()
})

watch(
  () => props.modelValue,
  (v) => {
    if (!quill) return
    const cur = JSON.stringify(quill.getContents())
    if (v !== cur) setContent(v || '')
  },
)

watch(
  () => props.height,
  (h) => {
    if (quill) quill.root.style.minHeight = `${h}px`
  },
)

onBeforeUnmount(() => {
  emitContent()
  quill = null
})

defineExpose({ getContent, setContent })
</script>

<template>
  <!-- 参考 ArticleEditor：Quill 编辑区 → 字数 → 底栏工具条 -->
  <div class="create-rich-editor">
    <div
      ref="editorHost"
      class="create-rich-editor__host mf-rich-text-editor"
      :style="{ minHeight: `${height}px` }"
    />
    <v-divider class="mb-1" />
    <div
      class="text-right text-caption px-1"
      :class="overLimit ? 'text-error' : 'text-disabled'"
    >
      {{ count }} / {{ maxCount }}
    </div>
    <div :id="toolbarId" class="create-rich-editor__toolbar d-flex flex-wrap">
      <v-btn icon variant="text" size="small" type="button" @click="insertEmoji">
        <v-icon icon="mdi-emoticon-outline" />
      </v-btn>
      <v-btn icon variant="text" size="small" type="button" @click="openMemberSelect">
        <v-icon icon="mdi-at" />
      </v-btn>
      <v-btn
        v-if="!limit"
        icon
        variant="text"
        size="small"
        type="button"
        @click="openMedia"
      >
        <v-icon icon="mdi-image-outline" />
      </v-btn>
      <button type="button" class="ql-bold create-rich-editor__ql-btn" aria-label="粗体">
        <v-icon icon="mdi-format-bold" size="20" />
      </button>
      <button type="button" class="ql-italic create-rich-editor__ql-btn" aria-label="斜体">
        <v-icon icon="mdi-format-italic" size="20" />
      </button>
      <button type="button" class="ql-strike create-rich-editor__ql-btn" aria-label="删除线">
        <v-icon icon="mdi-format-strikethrough-variant" size="20" />
      </button>
      <button type="button" class="ql-underline create-rich-editor__ql-btn" aria-label="下划线">
        <v-icon icon="mdi-format-underline" size="20" />
      </button>
      <template v-if="!limit">
        <button type="button" class="ql-header create-rich-editor__ql-btn" value="1" aria-label="H1">
          <v-icon icon="mdi-format-header-1" size="20" />
        </button>
        <button type="button" class="ql-header create-rich-editor__ql-btn" value="2" aria-label="H2">
          <v-icon icon="mdi-format-header-2" size="20" />
        </button>
        <button type="button" class="ql-header create-rich-editor__ql-btn" value="3" aria-label="H3">
          <v-icon icon="mdi-format-header-3" size="20" />
        </button>
        <button type="button" class="ql-code create-rich-editor__ql-btn" aria-label="行内代码">
          <v-icon icon="mdi-code-tags" size="20" />
        </button>
        <button type="button" class="ql-code-block create-rich-editor__ql-btn" aria-label="代码块">
          <v-icon icon="mdi-code-braces" size="20" />
        </button>
        <button type="button" class="ql-blockquote create-rich-editor__ql-btn" aria-label="引用">
          <v-icon icon="mdi-format-quote-open" size="20" />
        </button>
        <button type="button" class="ql-list create-rich-editor__ql-btn" value="bullet" aria-label="无序">
          <v-icon icon="mdi-format-list-bulleted" size="20" />
        </button>
        <button type="button" class="ql-list create-rich-editor__ql-btn" value="ordered" aria-label="有序">
          <v-icon icon="mdi-format-list-numbered" size="20" />
        </button>
        <button type="button" class="ql-divider create-rich-editor__ql-btn" aria-label="分割线">
          <v-icon icon="mdi-minus" size="20" />
        </button>
      </template>
    </div>
    <MediaLibrary v-if="!limit" ref="mediaRef" title="插入图片" @select="insertImage" />
    <CreateMemberSelectDialog v-model="memberOpen" @select="insertMention" />
  </div>
</template>

<style scoped>
.create-rich-editor__host {
  width: 100%;
}

.create-rich-editor__host :deep(.ql-editor) {
  min-height: inherit;
  padding: 8px 4px;
  font-size: 15px;
  line-height: 1.6;
  overflow-y: auto;
}

.create-rich-editor__host :deep(.ql-editor.ql-blank::before) {
  left: 4px;
  right: 4px;
  font-style: normal;
  color: rgba(var(--v-theme-on-surface), 0.38);
}

.create-rich-editor__host :deep(.mention) {
  color: rgb(var(--v-theme-link));
  white-space: nowrap;
}

.create-rich-editor__host :deep(img) {
  max-width: 100%;
  height: auto;
}

.create-rich-editor__ql-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 0;
  background: transparent;
  border-radius: 50%;
  color: inherit;
  cursor: pointer;
}

.create-rich-editor__ql-btn:hover {
  background: rgba(var(--v-theme-on-surface), 0.06);
}

.create-rich-editor__ql-btn.ql-active {
  color: rgb(var(--v-theme-link));
}
</style>
