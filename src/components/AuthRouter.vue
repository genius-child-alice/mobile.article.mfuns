<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useMemberAuth } from '../composables/useMemberAuth'

const props = withDefaults(
  defineProps<{
    login?: boolean
    to?: string
  }>(),
  {
    login: false,
    to: '',
  },
)

const router = useRouter()
const { isLoggedIn } = useMemberAuth()

function navigate() {
  if (props.login && !isLoggedIn.value) {
    router.push('/member/login')
    return
  }
  if (props.to) router.push(props.to)
}
</script>

<template>
  <div class="auth-router" @click="navigate">
    <slot />
  </div>
</template>

<style scoped>
.auth-router {
  display: block;
  width: 100%;
}
</style>
