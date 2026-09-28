<script setup lang="ts">
import { ref, watch } from 'vue'
import { searchTags, type TagSearchItem } from '../api/tagApi'
import { readMemberAuthState } from '../auth/memberSession'

const open = defineModel<boolean>({ default: false })

const emit = defineEmits<{
  select: [name: string]
}>()

const query = ref('')
const results = ref<TagSearchItem[]>([])
const loading = ref(false)

async function search() {
  const name = query.value.trim()
  if (!name) {
    results.value = []
    return
  }
  loading.value = true
  try {
    const token = readMemberAuthState().token
    const res = await searchTags(name, token)
    if (res.code === 1) {
      const data = res.data
      if (Array.isArray(data)) results.value = data
      else if (data && Array.isArray(data.list)) results.value = data.list
      else results.value = []
    } else {
      results.value = []
    }
  } finally {
    loading.value = false
  }
}

function pick(name: string) {
  const n = name.trim()
  if (!n) return
  emit('select', n)
  open.value = false
  query.value = ''
  results.value = []
}

function useCustom() {
  pick(query.value)
}

watch(open, (v) => {
  if (!v) {
    query.value = ''
    results.value = []
  }
})
</script>

<template>
  <v-dialog v-model="open" max-width="420" scrollable>
    <v-card>
      <v-card-title>选择话题</v-card-title>
      <v-card-text>
        <v-text-field
          v-model="query"
          label="搜索话题"
          variant="underlined"
          append-inner-icon="mdi-magnify"
          @keyup.enter="search"
          @click:append-inner="search"
        />
        <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-2" />
        <v-list density="compact">
          <v-list-item
            v-for="(item, i) in results"
            :key="`${item.name}-${i}`"
            :title="item.name"
            :subtitle="item.hot != null ? `热度 ${item.hot}` : undefined"
            @click="pick(item.name || '')"
          />
        </v-list>
        <div v-if="!loading && query.trim() && results.length === 0" class="text-medium-emphasis text-caption">
          无结果，可直接使用输入内容作为话题
        </div>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="open = false">取消</v-btn>
        <v-btn color="link" variant="text" :disabled="!query.trim()" @click="useCustom">
          使用「{{ query.trim() || '…' }}」
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
