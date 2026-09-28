<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import {
  fetchArticleCategories,
  type ArticleCategoryNode,
} from '../api/categoryApi'
import { readMemberAuthState } from '../auth/memberSession'

const open = defineModel<boolean>({ default: false })

const emit = defineEmits<{
  select: [payload: { id: number; name: string }]
}>()

const roots = ref<ArticleCategoryNode[]>([])
const parent = ref<ArticleCategoryNode | null>(null)
const loading = ref(false)

async function load() {
  loading.value = true
  try {
    const token = readMemberAuthState().token
    const res = await fetchArticleCategories(token)
    if (res.code === 1 && Array.isArray(res.data)) {
      roots.value = res.data
    }
  } finally {
    loading.value = false
  }
}

function pickParent(node: ArticleCategoryNode) {
  if (node.children?.length) {
    parent.value = node
    return
  }
  emit('select', { id: node.id, name: node.name || String(node.id) })
  open.value = false
}

function pickChild(node: ArticleCategoryNode) {
  const name = parent.value
    ? `${parent.value.name || ''} / ${node.name || node.id}`
    : node.name || String(node.id)
  emit('select', { id: node.id, name })
  open.value = false
}

watch(open, (v) => {
  if (v) {
    parent.value = null
    if (!roots.value.length) void load()
  }
})

onMounted(() => {
  void load()
})
</script>

<template>
  <v-dialog v-model="open" max-width="420" scrollable>
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-btn
          v-if="parent"
          icon
          variant="text"
          aria-label="返回"
          @click="parent = null"
        >
          <v-icon icon="mdi-arrow-left" />
        </v-btn>
        <span>{{ parent ? parent.name : '选择分区' }}</span>
        <v-spacer />
        <v-btn icon variant="text" aria-label="关闭" @click="open = false">
          <v-icon icon="mdi-close" />
        </v-btn>
      </v-card-title>
      <v-divider />
      <v-card-text class="pa-0">
        <v-progress-linear v-if="loading" indeterminate color="primary" />
        <v-list v-else density="comfortable">
          <template v-if="!parent">
            <v-list-item
              v-for="item in roots"
              :key="item.id"
              :title="item.name"
              :append-icon="item.children?.length ? 'mdi-chevron-right' : undefined"
              @click="pickParent(item)"
            />
          </template>
          <template v-else>
            <v-list-item
              v-for="child in parent.children || []"
              :key="child.id"
              :title="child.name"
              @click="pickChild(child)"
            />
          </template>
        </v-list>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
