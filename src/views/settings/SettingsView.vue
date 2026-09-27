<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AuthRouter from '../../components/AuthRouter.vue'
import LogoutConfirmDialog from '../../components/LogoutConfirmDialog.vue'
import { useMemberAuth } from '../../composables/useMemberAuth'
import { refreshMemberProfile, useMemberProfile } from '../../composables/useMemberProfile'

const router = useRouter()
const { isLoggedIn } = useMemberAuth()
const { memberInfo } = useMemberProfile()

const logoutRef = ref<InstanceType<typeof LogoutConfirmDialog> | null>(null)

onMounted(() => {
  if (isLoggedIn.value) void refreshMemberProfile()
})

function go(path: string) {
  router.push(path)
}
</script>

<template>
  <div class="settings-page">
    <v-list class="settings-list" bg-color="surface" rounded="0">
      <AuthRouter login to="/member/profile">
        <v-list-item lines="two" ripple>
          <template #prepend>
            <v-avatar color="transparent">
              <v-icon icon="mdi-account-circle" color="blue" />
            </v-avatar>
          </template>
          <v-list-item-title>账号资料</v-list-item-title>
          <v-list-item-subtitle>头像、用户名、个性签名</v-list-item-subtitle>
        </v-list-item>
      </AuthRouter>

      <AuthRouter login to="/settings/security">
        <v-list-item lines="two" ripple>
          <template #prepend>
            <v-avatar color="transparent">
              <v-icon icon="mdi-lock" color="orange-darken-2" />
            </v-avatar>
          </template>
          <v-list-item-title>安全设置</v-list-item-title>
          <v-list-item-subtitle>邮箱、密码、手机号修改</v-list-item-subtitle>
        </v-list-item>
      </AuthRouter>

      <v-list-item lines="two" ripple @click="go('/settings/themes')">
        <template #prepend>
          <v-avatar color="transparent">
            <v-icon icon="mdi-theme-light-dark" color="pink" />
          </v-avatar>
        </template>
        <v-list-item-title>主题选择</v-list-item-title>
        <v-list-item-subtitle>切换站点配色方案</v-list-item-subtitle>
      </v-list-item>

      <v-list-item lines="two" ripple @click="go('/settings/about')">
        <template #prepend>
          <v-avatar color="transparent">
            <v-icon icon="mdi-information-outline" color="cyan" />
          </v-avatar>
        </template>
        <v-list-item-title>关于</v-list-item-title>
        <v-list-item-subtitle>软件版本、用户协议、开发者信息</v-list-item-subtitle>
      </v-list-item>

      <v-list-item
        v-if="isLoggedIn"
        lines="two"
        ripple
        @click="logoutRef?.show()"
      >
        <template #prepend>
          <v-avatar color="transparent">
            <v-icon icon="mdi-logout-variant" color="red" />
          </v-avatar>
        </template>
        <v-list-item-title>退出当前账号</v-list-item-title>
        <v-list-item-subtitle>
          用户名：{{ memberInfo?.name || '—' }}
        </v-list-item-subtitle>
      </v-list-item>
    </v-list>

    <LogoutConfirmDialog ref="logoutRef" />
  </div>
</template>

<style scoped>
@import '../../styles/settings-page.css';
</style>
