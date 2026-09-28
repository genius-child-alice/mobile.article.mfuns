<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  fetchAccumulatedAwards,
  fetchSignAgain,
  fetchSignIn,
  fetchSignList,
} from '../../api/signApi'
import { readMemberAuthState } from '../../auth/memberSession'
import { useMemberAuth } from '../../composables/useMemberAuth'

const WEEK_LABELS = ['一', '二', '三', '四', '五', '六', '日'] as const

const router = useRouter()
const { isLoggedIn } = useMemberAuth()

const time = ref<Array<number | ''>>([])
const sign = ref<Record<string | number, number>>({})
const isSign = ref(false)
const loading = ref(false)
const dialog = ref(false)
const signAgainDay = ref(0)
const signDay = ref(0)
const signAllDay = ref(0)
const accumulated = ref<{ day: string; content: string }[]>([])
const snackbar = ref({ open: false, text: '', color: 'success' as string })

const getDate = computed(() => new Date().getDate())

function toast(text: string, color = 'success') {
  snackbar.value = { open: true, text, color }
}

function requireToken(): string | null {
  const { token, isLogin } = readMemberAuthState()
  if (!isLogin || !token) {
    router.replace('/member/login')
    return null
  }
  return token
}

function buildDayList(): Array<number | ''> {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth() + 1
  let firstWeekday = new Date(y, m - 1, 1).getDay()
  if (firstWeekday === 0) firstWeekday = 7
  const daysInMonth = new Date(y, m, 0).getDate()
  const cells: Array<number | ''> = []
  for (let i = 0; i < firstWeekday; i++) cells.push('')
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  return cells
}

function getIsSign(day: number | '' = getDate.value): boolean {
  if (day === '') return false
  return sign.value[day] === 1
}

function cellColor(day: number | ''): string {
  if (day === '') return 'transparent'
  if (getIsSign(day)) return 'green'
  if (day <= getDate.value) return 'rgba(0,0,0,0.4)'
  return 'rgba(0,0,0,0.1)'
}

function cellDark(day: number | ''): boolean {
  return day !== '' && day <= getDate.value
}

async function refresh() {
  const token = requireToken()
  if (!token) return

  const [listRes, awardRes] = await Promise.all([
    fetchSignList(token),
    fetchAccumulatedAwards(token),
  ])

  if (listRes.code === 1 && listRes.data) {
    sign.value = listRes.data.list ?? {}
    signDay.value = listRes.data.month_times ?? 0
    signAllDay.value = listRes.data.all_times ?? 0
  }

  if (awardRes.code === 1 && awardRes.data && typeof awardRes.data === 'object') {
    const rows: { day: string; content: string }[] = []
    for (const [day, awards] of Object.entries(awardRes.data)) {
      let content = ''
      if (Array.isArray(awards)) {
        for (const item of awards) content += `${item.desc ?? ''} `
      }
      rows.push({ day, content: content.trim() })
    }
    rows.sort((a, b) => Number(a.day) - Number(b.day))
    accumulated.value = rows
  }

  isSign.value = getIsSign()
}

async function signIn() {
  const token = requireToken()
  if (!token) return
  loading.value = true
  try {
    const res = await fetchSignIn(token)
    toast(res.msg || (res.code === 1 ? '签到成功' : '签到失败'), res.code === 1 ? 'success' : 'error')
    await refresh()
    isSign.value = true
  } finally {
    loading.value = false
  }
}

function askSignAgain(day: number | '') {
  if (day === '' || getIsSign(day) || day > getDate.value || day === getDate.value) return
  signAgainDay.value = day
  dialog.value = true
}

async function confirmSignAgain() {
  const token = requireToken()
  if (!token) return
  const res = await fetchSignAgain(signAgainDay.value, token)
  toast(res.msg || (res.code === 1 ? '补签成功' : '补签失败'), res.code === 1 ? 'success' : 'error')
  dialog.value = false
  await refresh()
}

onMounted(async () => {
  if (!isLoggedIn.value) {
    router.replace('/member/login')
    return
  }
  time.value = buildDayList()
  await refresh()
})
</script>

<template>
  <div class="member-sign-page">
    <v-container class="py-3" style="max-width: 720px">
      <v-card class="mb-3" elevation="1">
        <v-card-text class="d-flex align-center justify-space-between">
          <div>累计签到 {{ signAllDay }} 天</div>
          <v-btn
            variant="text"
            color="link"
            :loading="loading"
            :disabled="isSign"
            @click="signIn"
          >
            {{ isSign ? '已签到' : '签到' }}
          </v-btn>
        </v-card-text>
      </v-card>

      <v-card class="mb-3" elevation="1">
        <v-card-title class="text-body-1">签到记录</v-card-title>
        <v-card-subtitle>本月累计 {{ signDay }} 天</v-card-subtitle>
        <v-card-text>
          <div class="member-sign-page__week">
            <div v-for="w in WEEK_LABELS" :key="w" class="member-sign-page__week-label">
              {{ w }}
            </div>
          </div>
          <div class="member-sign-page__table">
            <button
              v-for="(day, idx) in time"
              :key="idx"
              type="button"
              class="member-sign-page__cell"
              :class="{
                'member-sign-page__cell--today': day === getDate,
                'member-sign-page__cell--empty': day === '',
              }"
              :style="{
                background: cellColor(day),
                color: cellDark(day) ? '#fff' : undefined,
              }"
              :disabled="day === ''"
              @click="askSignAgain(day)"
            >
              {{ day }}
            </button>
          </div>
        </v-card-text>
      </v-card>

      <v-card elevation="1">
        <v-card-title class="text-body-1">本月累计签到奖励</v-card-title>
        <v-list density="compact">
          <v-list-item
            v-for="item in accumulated"
            :key="item.day"
            :title="`第 ${item.day} 天`"
            :subtitle="item.content || '—'"
          >
            <template #append>
              <span
                class="text-caption"
                :class="Number(item.day) <= signDay ? 'text-success' : 'text-medium-emphasis'"
              >
                {{ Number(item.day) <= signDay ? '✔已领取' : '未达到要求' }}
              </span>
            </template>
          </v-list-item>
          <div
            v-if="accumulated.length === 0"
            class="text-center text-medium-emphasis py-6"
          >
            暂无奖励配置
          </div>
        </v-list>
      </v-card>
    </v-container>

    <v-dialog v-model="dialog" max-width="320">
      <v-card>
        <v-card-title class="text-body-1">确认补签？</v-card-title>
        <v-card-text>
          补签 {{ signAgainDay }} 日将消耗补签卡 ×1。
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="dialog = false">取消</v-btn>
          <v-btn color="link" variant="text" @click="confirmSignAgain">补签</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.open" :color="snackbar.color" timeout="2500">
      {{ snackbar.text }}
    </v-snackbar>
  </div>
</template>

<style scoped>
.member-sign-page__week,
.member-sign-page__table {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 6px;
}

.member-sign-page__week {
  margin-bottom: 8px;
}

.member-sign-page__week-label {
  text-align: center;
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface), 0.6);
}

.member-sign-page__cell {
  aspect-ratio: 1;
  border: 0;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
}

.member-sign-page__cell--empty {
  cursor: default;
  background: transparent !important;
}

.member-sign-page__cell--today {
  box-shadow: inset 0 0 0 2px #4caf50;
}
</style>
