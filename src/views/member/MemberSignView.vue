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
const sign = ref<Record<string | number, number | string>>({})
const isSign = ref(false)
const loading = ref(false)
const dialog = ref(false)
const signAgainDay = ref(0)
const signDay = ref(0)
const signAllDay = ref(0)
const accumulated = ref<{ day: string; content: string }[]>([])
const snackbar = ref({ open: false, text: '', color: 'success' as string })

const getDate = computed(() => new Date().getDate())

/** 按周分行，对齐参考站 table + tr */
const weekRows = computed(() => {
  const rows: Array<Array<number | ''>> = []
  for (let i = 0; i < time.value.length; i += 7) {
    const row = time.value.slice(i, i + 7)
    while (row.length < 7) row.push('')
    rows.push(row)
  }
  return rows
})

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

/** 参考站：1==this.sign[t]（兼容字符串 "1"） */
function getIsSign(day: number | '' = getDate.value): boolean {
  if (day === '') return false
  return Number(sign.value[day]) === 1
}

/** 参考站 getColor：已签用主题 green；其余用 rgba 背景 */
function daySheetStyle(day: number | ''): Record<string, string> | undefined {
  if (day === '' || getIsSign(day)) return undefined
  const bg = day <= getDate.value ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.1)'
  return {
    background: bg,
    color: day <= getDate.value ? '#fff' : 'inherit',
  }
}

function dayIsDark(day: number | ''): boolean {
  return day !== '' && (getIsSign(day) || day <= getDate.value)
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
      <v-card>
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

      <v-card class="mt-2">
        <v-card-subtitle class="d-flex">
          签到记录
          <v-spacer />
          本月累计签到&nbsp;
          <span class="link--text font-weight-black">{{ signDay }}</span>
          &nbsp;天
        </v-card-subtitle>
        <v-card-text class="d-flex">
          <table class="member-sign-page__table text-center text-body-1">
            <thead>
              <tr>
                <td v-for="w in WEEK_LABELS" :key="w">{{ w }}</td>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, ri) in weekRows" :key="ri">
                <td
                  v-for="(day, di) in row"
                  :key="di"
                  :class="{ 'today-border': day === getDate }"
                >
                  <v-sheet
                    v-if="day !== ''"
                    class="member-sign-page__day"
                    :color="getIsSign(day) ? 'green' : undefined"
                    :style="daySheetStyle(day)"
                    :theme="dayIsDark(day) ? 'dark' : undefined"
                    v-ripple
                    @click="askSignAgain(day)"
                  >
                    {{ day }}
                  </v-sheet>
                </td>
              </tr>
            </tbody>
          </table>
        </v-card-text>
      </v-card>

      <v-card class="mt-2">
        <v-card-subtitle class="d-flex">本月累计签到奖励</v-card-subtitle>
        <v-list>
          <v-list-item
            v-for="item in accumulated"
            :key="item.day"
            :title="`第 ${item.day} 天`"
            :subtitle="item.content || '—'"
          >
            <template #append>
              <span
                v-if="Number(item.day) <= signDay"
                class="link--text text-caption"
              >
                ✔已领取
              </span>
              <span v-else class="text-caption text-medium-emphasis">未达到要求</span>
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
.member-sign-page__table {
  border: none;
  border-collapse: collapse;
  border-spacing: 0;
  width: 100%;
  flex-grow: 1;
}

.member-sign-page__table tbody td :deep(.v-sheet),
.member-sign-page__day {
  border-radius: 3px;
  padding: 10px 0;
  text-align: center;
  cursor: pointer;
}

.member-sign-page__table tr td {
  padding: 3px;
}

.member-sign-page__table .today-border {
  border: 1px solid #4caf50;
}
</style>
