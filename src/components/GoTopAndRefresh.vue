<script setup lang="ts">
import { onMounted, onUnmounted, ref, useTemplateRef } from 'vue'

withDefaults(
  defineProps<{
    offset?: number
    position?: 'fixed' | 'absolute'
  }>(),
  {
    offset: 0,
    position: 'fixed',
  },
)

const emit = defineEmits<{
  refresh: [done: () => void]
}>()

const rootEl = useTemplateRef<HTMLElement>('rootEl')
const loading = ref(false)
const top = ref(0)
const isShow = ref(typeof window !== 'undefined' && !('ontouchstart' in window))

let scrollTarget: HTMLElement | Window | null = null

function readScrollTop(target: HTMLElement | Window): number {
  if (target instanceof Window) {
    return document.documentElement.scrollTop || document.body.scrollTop || 0
  }
  return target.scrollTop
}

function findScrollParent(el: HTMLElement | null): HTMLElement | Window {
  let node = el?.parentElement ?? null
  while (node) {
    const style = getComputedStyle(node)
    const oy = style.overflowY
    if ((oy === 'auto' || oy === 'scroll' || oy === 'overlay') && node.scrollHeight > node.clientHeight) {
      return node
    }
    node = node.parentElement
  }
  return window
}

function onScroll() {
  if (!scrollTarget) return
  top.value = readScrollTop(scrollTarget)
}

function refresh() {
  if (loading.value) return
  loading.value = true
  emit('refresh', () => {
    loading.value = false
  })
}

function goTop() {
  if (!scrollTarget) return
  if (scrollTarget instanceof Window) {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } else {
    scrollTarget.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

onMounted(() => {
  isShow.value = !('ontouchstart' in window)
  if (!isShow.value) return
  scrollTarget = findScrollParent(rootEl.value)
  scrollTarget.addEventListener('scroll', onScroll, { passive: true })
  onScroll()
})

onUnmounted(() => {
  scrollTarget?.removeEventListener('scroll', onScroll)
})
</script>

<template>
  <div
    v-if="isShow"
    ref="rootEl"
    class="go-top-refresh"
    :class="position === 'fixed' ? 'go-top-refresh--fixed' : 'go-top-refresh--absolute'"
    :style="{ transform: `translateY(-${offset}px)` }"
  >
    <v-btn
      v-if="top < 100"
      color="pink"
      icon
      size="large"
      :loading="loading"
      @click="refresh"
    >
      <v-icon icon="mdi-refresh" />
    </v-btn>
    <v-btn v-else color="pink" icon size="large" @click="goTop">
      <v-icon icon="mdi-format-vertical-align-top" />
    </v-btn>
  </div>
</template>

<style scoped>
.go-top-refresh {
  bottom: 16px;
  right: 16px;
  z-index: 5;
}

.go-top-refresh--fixed {
  position: fixed;
}

.go-top-refresh--absolute {
  position: absolute;
}
</style>
