<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'
import { redeemPremiumCode } from '../../api/premiumApi'
import { readMemberAuthState } from '../../auth/memberSession'
import { useMemberAuth } from '../../composables/useMemberAuth'
import { useMemberProfile } from '../../composables/useMemberProfile'
import { mfunsImageUrl } from '../../utils/mfunsImageUrl'

const BENEFITS = [
  '免广告',
  '红名',
  '特殊徽章',
  '特殊头像框',
  '特殊表情包',
  '更大视频上传容量',
] as const

const AFDIAN_URL = 'https://afdian.net/@mfuns'

const router = useRouter()
const { xs } = useDisplay()
const { isLoggedIn } = useMemberAuth()
const { memberInfo, refreshMemberProfile } = useMemberProfile()

const dialog = ref(false)
const code = ref('')
const error = ref('')
const days = ref(0)
const redeeming = ref(false)

const avatarSrc = computed(() => mfunsImageUrl(memberInfo.value?.avatar, 80))

const premiumDays = computed(() => {
  const expire = memberInfo.value?.premium?.expire_time
  if (!expire) return '未开通'
  const remain = Math.floor((expire - Date.now() / 1000) / 86400)
  return `${remain}天`
})

function goBack() {
  if (window.history.length > 1) router.back()
  else router.replace('/member')
}

function openDialog() {
  dialog.value = true
}

async function getCode() {
  const { token, isLogin } = readMemberAuthState()
  if (!isLogin || !token) {
    router.push('/member/login')
    return
  }

  const trimmed = code.value.trim()
  if (!trimmed) {
    error.value = '请输入激活码'
    return
  }

  redeeming.value = true
  error.value = ''
  try {
    const res = await redeemPremiumCode(trimmed, token)
    if (res.code === 1) {
      days.value = res.data?.day ?? 0
      error.value = ''
      await refreshMemberProfile()
    } else {
      error.value = res.msg || '兑换失败'
    }
  } catch {
    error.value = '网络错误，请稍后重试'
  } finally {
    redeeming.value = false
  }
}

onMounted(() => {
  if (isLoggedIn.value) void refreshMemberProfile()
})
</script>

<template>
  <div class="premium-page">
    <v-app-bar
      fixed
      location="top"
      color="primary"
      density="compact"
      elevation="4"
      class="text-white"
    >
      <v-btn icon variant="text" aria-label="返回" @click="goBack">
        <v-icon icon="mdi-arrow-left" />
      </v-btn>
      <v-toolbar-title>会员服务</v-toolbar-title>
      <v-spacer />
    </v-app-bar>

    <div class="premium-page__main">
      <v-container fluid class="premium-page__container pb-16">
        <v-card color="blue-grey-darken-4" theme="dark" class="premium-page__status overflow-hidden">
          <v-card-text class="d-flex pa-6 premium-page__status-body">
            <div>
              <v-avatar color="primary" :size="40" class="mt-1">
                <v-img v-if="isLoggedIn && avatarSrc" :src="avatarSrc" cover />
                <v-icon v-else icon="mdi-account" />
              </v-avatar>
            </div>
            <div class="pl-2">
              <div class="text-h6 text-white">
                {{ memberInfo?.name || (isLoggedIn ? '个人资料' : '未登录') }}
              </div>
              <div>会员服务：{{ premiumDays }}</div>
            </div>
            <v-icon
              class="premium-page__star"
              icon="mdi-star-outline"
              size="150"
              theme="dark"
            />
          </v-card-text>
        </v-card>

        <v-table class="mt-2" fixed-header>
          <thead>
            <tr>
              <th>会员福利</th>
              <th>普通用户</th>
              <th>会员</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in BENEFITS" :key="item">
              <td>{{ item }}</td>
              <td>
                <v-icon icon="mdi-close" />
              </td>
              <td>
                <v-icon icon="mdi-check" color="link" />
              </td>
            </tr>
          </tbody>
        </v-table>
      </v-container>
    </div>

    <v-sheet class="premium-page__buy" color="primary" elevation="5">
      <v-btn
        block
        color="primary"
        variant="flat"
        rounded="0"
        size="large"
        elevation="0"
        class="text-white"
        @click="openDialog"
      >
        立刻开通
      </v-btn>
    </v-sheet>

    <v-dialog
      v-model="dialog"
      :fullscreen="xs"
      :max-width="500"
      scrollable
      transition="dialog-bottom-transition"
    >
      <v-card rounded="0">
        <v-card-title class="pa-0">
          <v-toolbar color="primary" density="compact" elevation="1" class="text-white" rounded="0">
            <v-btn icon variant="text" aria-label="关闭" @click="dialog = false">
              <v-icon icon="mdi-close" />
            </v-btn>
            <v-toolbar-title>开通会员</v-toolbar-title>
          </v-toolbar>
        </v-card-title>
        <v-card-text>
          <div class="my-2">
            开通会员功能请登录M站爱发电主页（
            <a class="link--text" :href="AFDIAN_URL" target="_blank" rel="noopener noreferrer">
              {{ AFDIAN_URL }}
            </a>
            ）选择相应的商品进行购买Nya~ 如发现缺货请直接在爱发电私信页面进行留言Nya！
          </div>
          <v-text-field
            v-model="code"
            label="会员激活码"
            placeholder="XXXXX-XXXXX-XXXXX-XXXXX-XXXX"
            :error="!!error"
            :error-messages="error"
            variant="underlined"
          />
          <v-btn
            block
            color="link"
            elevation="0"
            class="text-white mb-3"
            :loading="redeeming"
            @click="getCode"
          >
            兑换激活码
          </v-btn>
          <div v-if="days !== 0" class="text-success">
            {{ 'Ciallo～(∠・ω< )⌒☆' }}
            <br />
            你已成功兑换会员时长：{{ days }}天，会员徽章已进入你的徽章库存中Nya~
            <br />
            感谢你对Mfuns的支持Nya！
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.premium-page {
  min-height: calc(
    100dvh - var(--mfuns-app-bar-height, 0px) - var(--mfuns-bottom-nav-height, 0px)
  );
}

.premium-page__main {
  width: 100%;
  max-width: 960px;
  margin-inline: auto;
  box-sizing: border-box;
}

.premium-page__container {
  max-width: none !important;
  padding-inline: 16px;
}

@media (orientation: landscape) {
  .premium-page__main {
    max-width: none;
    width: 100%;
  }

  .premium-page__container {
    padding-inline: 12px;
  }
}

@media (orientation: landscape) and (min-width: 960px) {
  .premium-page__container {
    padding-inline: 24px;
  }
}

.premium-page__status-body {
  position: relative;
  z-index: 10;
}

.premium-page__star {
  color: #37474f;
  position: absolute;
  right: -20px;
  top: -30px;
  transform: rotate(-20deg);
  z-index: 0;
  opacity: 0.85;
  pointer-events: none;
}

.premium-page__buy {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  z-index: 4;
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
</style>
