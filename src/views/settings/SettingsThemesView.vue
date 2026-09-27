<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useMfunsTheme } from '../../composables/useMfunsTheme'

const { presets, applyPresetIndex, currentTheme } = useMfunsTheme()

const current = ref(0)
const loading = ref(false)

watch(
  () => currentTheme.value.index,
  (index) => {
    if (typeof index === 'number' && index >= 0) {
      current.value = index
    }
  },
  { immediate: true },
)

onMounted(() => {
  const index = currentTheme.value.index
  if (typeof index === 'number' && index >= 0) {
    current.value = index
  }
})

function select(index: number) {
  if (loading.value) return
  loading.value = true
  current.value = index
  applyPresetIndex(index)
  window.setTimeout(() => {
    loading.value = false
    window.location.reload()
  }, 817)
}
</script>

<template>
  <div class="settings-themes-page settings-page">
    <v-list class="settings-themes-list settings-list" bg-color="surface" rounded="0">
      <v-radio-group v-model="current" hide-details class="settings-themes-list__group">
        <v-list-item v-for="(preset, index) in presets" :key="index" @click="select(index)">
          <template #prepend>
            <v-avatar :color="preset.primary" size="40" />
          </template>

          <v-list-item-title>{{ preset.name }}</v-list-item-title>
          <v-list-item-subtitle v-if="preset.desc">{{ preset.desc }}</v-list-item-subtitle>

          <template #append>
            <v-radio :value="index" color="link" hide-details @click.stop="select(index)" />
          </template>
        </v-list-item>
      </v-radio-group>
    </v-list>

    <v-dialog :model-value="loading" persistent width="300">
      <v-card color="primary" theme="dark">
        <v-card-text class="pt-4">
          正在应用主题 请稍等哦 ~
          <v-progress-linear class="mb-0 mt-3" indeterminate color="white" />
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
@import '../../styles/settings-page.css';

.settings-themes-list {
  width: 100%;
  max-width: none;
  min-height: inherit;
  /* Vuetify 2 $list-padding */
  padding-block: 8px;
}

/* m.mfuns V2: 单行 v-list-item（非 two-line），content 上下 12px */
.settings-themes-list :deep(.v-list-item) {
  min-height: 56px;
  padding-inline: 16px;
  padding-block: 0;
  /* V2 头像与正文间距 16px（勿再给 prepend 加 margin，会与 V4 spacer 叠加） */
  --v-list-prepend-gap: 16px;
}

.settings-themes-list :deep(.v-list-item__content) {
  padding-block: 12px;
}

.settings-themes-list :deep(.v-list-item__prepend) {
  margin-inline-end: 0;
}

.settings-themes-list :deep(.v-list-item__append .v-selection-control) {
  --v-selection-control-size: 24px;
  margin: 0;
}

.settings-themes-list__group :deep(.v-selection-control-group) {
  display: contents;
}
</style>
