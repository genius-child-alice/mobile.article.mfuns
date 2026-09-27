<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { fetchUserBadge } from '../api/memberBadgeApi'
import { readMemberAuthState } from '../auth/memberSession'
import { getCachedBadge, setCachedBadge } from '../utils/memberBadgeCache'

const props = defineProps<{
  id: number
}>()

const svg = ref('')

async function loadBadge(id: number) {
  const cached = getCachedBadge(id)
  if (cached?.svg) {
    svg.value = cached.svg
    return
  }

  const { token } = readMemberAuthState()
  const res = await fetchUserBadge(id, token)
  if (res.code === 1 && res.data?.svg) {
    setCachedBadge(id, res.data)
    svg.value = res.data.svg
  }
}

onMounted(() => {
  void loadBadge(props.id)
})

watch(
  () => props.id,
  (id) => {
    svg.value = ''
    void loadBadge(id)
  },
)
</script>

<template>
  <span v-if="svg" class="mfuns-badge me-1" v-html="svg" />
</template>

<style scoped>
.mfuns-badge {
  display: inline-flex;
  align-items: center;
  vertical-align: middle;
  line-height: 0;
}

.mfuns-badge :deep(svg) {
  height: 1.125rem;
  width: auto;
  display: block;
}
</style>
