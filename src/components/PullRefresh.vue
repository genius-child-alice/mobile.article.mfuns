<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    color?: string
    loadHeight?: number
    offset?: number
  }>(),
  {
    color: 'primary',
    loadHeight: 0,
    offset: 0,
  },
)

const emit = defineEmits<{
  refresh: [done: () => void]
  download: [done: (notHaveMore?: boolean) => void]
}>()

const start = ref(0)
const move = ref(0)
const loading = ref(false)
const downLoad = ref(false)
const cancel = ref(false)
const notHaveMore = ref(false)
const loadTime = ref(0)
const slotEl = ref<HTMLElement | null>(null)
const sentinelEl = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

const moveY = computed(() => Math.min(move.value, 120))

const logoStyle = computed(() => ({
  transform: `translateY(${moveY.value + props.offset}px)`,
}))

function touchStart(e: TouchEvent) {
  start.value = e.changedTouches[0].pageY
  const top = slotEl.value?.getBoundingClientRect().top ?? 0
  if (top <= 0) cancel.value = true
}

function touchMove(e: TouchEvent) {
  if (loading.value || cancel.value) return
  const top = slotEl.value?.getBoundingClientRect().top ?? 0
  if (top < 0) return
  if (start.value === 0) touchStart(e)
  const dy = e.changedTouches[0].pageY - start.value
  if (dy > 0) {
    if (e.cancelable) e.preventDefault()
    move.value = dy
  }
  if (move.value !== 0) e.preventDefault()
}

function touchEnd() {
  if (loading.value) return
  if (move.value >= 150) {
    move.value = 150
    loading.value = true
    loadTime.value = Date.now()
    emit('refresh', () => {
      notHaveMore.value = false
      const elapsed = Date.now() - loadTime.value
      const wait = elapsed < 200 ? 500 - elapsed : 0
      setTimeout(() => {
        move.value = 0
        setTimeout(() => {
          loading.value = false
        }, 100)
      }, wait)
    })
  } else {
    move.value = 0
    cancel.value = false
  }
}

function scrollLoad() {
  if (downLoad.value || loading.value || notHaveMore.value) return
  downLoad.value = true
  emit('download', (noMore = false) => {
    downLoad.value = false
    notHaveMore.value = !!noMore
  })
}

onMounted(() => {
  scrollLoad()
  if (sentinelEl.value && typeof IntersectionObserver !== 'undefined') {
    observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) scrollLoad()
      },
      {
        threshold: 1,
        rootMargin: `0px 0px ${props.loadHeight}px 0px`,
      },
    )
    observer.observe(sentinelEl.value)
  }
})

onUnmounted(() => {
  observer?.disconnect()
})
</script>

<template>
  <div
    class="pull-refresh pb-6"
    @touchstart.passive="touchStart"
    @touchmove="touchMove"
    @touchend="touchEnd"
  >
    <v-avatar
      v-if="moveY || loading"
      class="pull-refresh-logo"
      :style="logoStyle"
      :elevation="1"
      color="#fff"
      size="41"
    >
      <v-progress-circular
        v-if="loading"
        :color="color"
        indeterminate
        size="25"
        width="3"
      />
      <v-icon v-else :color="color" size="31" icon="mdi-arrow-down" />
    </v-avatar>

    <div ref="slotEl" class="pull-refresh-slot">
      <slot />
    </div>

    <div ref="sentinelEl">
      <v-btn
        :loading="downLoad"
        block
        variant="text"
        :disabled="notHaveMore"
        @click="scrollLoad"
      >
        {{ notHaveMore ? '没有更多了' : '加载更多' }}
      </v-btn>
    </div>
  </div>
</template>

<style scoped>
.pull-refresh {
  position: relative;
  min-height: 25vh;
}

.pull-refresh-logo {
  position: absolute;
  left: 50%;
  top: 0;
  z-index: 2;
  margin-left: -20.5px;
}

.pull-refresh-slot {
  min-height: 1px;
}
</style>
