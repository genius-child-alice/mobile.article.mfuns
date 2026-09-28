<script setup lang="ts">
import { computed } from 'vue'
import { mfunsImageUrl } from '../utils/mfunsImageUrl'
import { formatRelativeUnixTime } from '../utils/mfunsTime'
import MfunsRichText from './MfunsRichText.vue'

const props = withDefaults(
  defineProps<{
    msg?: string
    time?: number
    mine?: boolean
    avatarUrl?: string
  }>(),
  {
    msg: '',
    time: 0,
    mine: false,
    avatarUrl: '',
  },
)

const timeLabel = computed(() => formatRelativeUnixTime(props.time))
const avatarSrc = computed(() => mfunsImageUrl(props.avatarUrl, 100))
</script>

<template>
  <div class="message-bubble pl-2 py-4 d-flex" :class="{ 'flex-row-reverse': mine }">
    <v-avatar size="50" color="grey-lighten-2" :class="mine ? 'mr-2' : ''">
      <v-img v-if="avatarSrc" :src="avatarSrc" cover />
      <v-icon v-else icon="mdi-account" />
    </v-avatar>
    <div class="pt-3 message-bubble__body">
      <v-sheet
        elevation="3"
        class="pa-2"
        :class="
          mine
            ? 'mr-2 rounded-br-lg rounded-bl-lg rounded-tl-lg'
            : 'ml-2 text-left rounded-br-lg rounded-bl-lg rounded-tr-lg'
        "
      >
        <MfunsRichText class="message-bubble__text" :text="msg" :type="1" />
        <div
          class="text-medium-emphasis text-caption"
          :class="{ 'text-right': mine }"
        >
          {{ timeLabel }}
        </div>
      </v-sheet>
    </div>
  </div>
</template>

<style scoped>
.message-bubble__body {
  max-width: calc(100% - 80px);
  word-break: break-all;
}

.message-bubble__text {
  min-height: 27px;
}
</style>
