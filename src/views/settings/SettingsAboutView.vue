<script setup lang="ts">
import { onMounted, ref } from 'vue'

const webVersion = '0.0.0'
const buildDate = ref('')

const broName = ref('未知')
const broIcon = ref('mdi-help-circle-outline')
const osName = ref('未知')
const osIcon = ref('mdi-help-circle-outline')
const screenSize = ref('未知')
const network = ref('正常')
const userAgent = ref('')

onMounted(() => {
  buildDate.value = new Date().toLocaleDateString('zh-CN')
  detectBrowser()
  detectOs()
  screenSize.value = `${window.screen.width}x${window.screen.height}`
  network.value = navigator.onLine ? '正常' : '无网络链接'
  userAgent.value = navigator.userAgent
})

function detectBrowser() {
  const ua = navigator.userAgent
  if (ua.includes('Edg/')) {
    broName.value = 'Microsoft Edge'
    broIcon.value = 'mdi-microsoft-edge'
  } else if (ua.includes('Chrome/')) {
    broName.value = 'Google Chrome'
    broIcon.value = 'mdi-google-chrome'
  } else if (ua.includes('Firefox/')) {
    broName.value = 'Mozilla Firefox'
    broIcon.value = 'mdi-firefox'
  } else if (ua.includes('Safari/') && !ua.includes('Chrome')) {
    broName.value = 'Safari'
    broIcon.value = 'mdi-apple-safari'
  } else {
    broName.value = '其他浏览器'
  }
}

function detectOs() {
  const ua = navigator.userAgent
  try {
    if (ua.includes('Android') || ua.includes('Linux')) {
      osName.value = ua.includes('Android') ? 'Android' : 'Linux'
      osIcon.value = ua.includes('Android') ? 'mdi-android' : 'mdi-linux'
    } else if (ua.includes('iPhone') || ua.includes('iPad')) {
      osName.value = 'iOS'
      osIcon.value = 'mdi-apple'
    } else if (ua.includes('Windows')) {
      osName.value = 'Windows'
      osIcon.value = 'mdi-microsoft-windows'
    } else {
      osName.value = '其他'
    }
  } catch {
    osName.value = '其他'
  }
}
</script>

<template>
  <div class="settings-page settings-about">
    <div class="settings-about-section">软件版本信息</div>
    <v-card class="settings-about-card" elevation="0" border>
      <v-list bg-color="transparent" density="comfortable">
        <v-list-item>
          <template #prepend>
            <v-icon icon="mdi-alpha-v-box-outline" color="link" />
          </template>
          <v-list-item-title>当前 Web 端版本</v-list-item-title>
          <template #append>
            <span class="text-medium-emphasis">{{ webVersion }}</span>
          </template>
        </v-list-item>
        <v-divider />
        <v-list-item>
          <template #prepend>
            <v-icon icon="mdi-calendar" color="link" />
          </template>
          <v-list-item-title>编译日期</v-list-item-title>
          <template #append>
            <span class="text-medium-emphasis">{{ buildDate }}</span>
          </template>
        </v-list-item>
      </v-list>
    </v-card>

    <div class="settings-about-section">开发人员信息</div>
    <v-card class="settings-about-card" elevation="0" border>
      <v-card-text class="text-body-2 text-medium-emphasis">
        感谢每一位开发者的付出
      </v-card-text>
    </v-card>

    <div class="settings-about-section">运行环境信息</div>
    <v-card class="settings-about-card" elevation="0" border>
      <v-list bg-color="transparent" density="comfortable">
        <v-list-item>
          <template #prepend>
            <v-icon :icon="osIcon" color="link" />
          </template>
          <v-list-item-title>平台信息</v-list-item-title>
          <template #append>
            <span class="text-medium-emphasis">{{ osName }}</span>
          </template>
        </v-list-item>
        <v-divider />
        <v-list-item>
          <template #prepend>
            <v-icon :icon="broIcon" color="link" />
          </template>
          <v-list-item-title>浏览器版本</v-list-item-title>
          <template #append>
            <span class="text-medium-emphasis text-truncate" style="max-width: 45%">{{
              broName
            }}</span>
          </template>
        </v-list-item>
        <v-divider />
        <v-list-item lines="three">
          <template #prepend>
            <v-icon icon="mdi-code-tags" color="link" />
          </template>
          <v-list-item-title>浏览器 UA</v-list-item-title>
          <v-list-item-subtitle class="text-wrap">{{ userAgent }}</v-list-item-subtitle>
        </v-list-item>
        <v-divider />
        <v-list-item>
          <template #prepend>
            <v-icon icon="mdi-monitor-screenshot" color="link" />
          </template>
          <v-list-item-title>设备屏幕大小</v-list-item-title>
          <template #append>
            <span class="text-medium-emphasis">{{ screenSize }}</span>
          </template>
        </v-list-item>
        <v-divider />
        <v-list-item>
          <template #prepend>
            <v-icon icon="mdi-wifi" color="link" />
          </template>
          <v-list-item-title>网络状况</v-list-item-title>
          <template #append>
            <span class="text-medium-emphasis">{{ network }}</span>
          </template>
        </v-list-item>
      </v-list>
    </v-card>
  </div>
</template>

<style scoped>
@import '../../styles/settings-page.css';

.settings-about {
  padding-bottom: 24px;
}
</style>
