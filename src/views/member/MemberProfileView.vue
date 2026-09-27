<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  updateMemberBio,
  updateMemberGender,
  updateMemberName,
} from '../../api/memberUserApi'
import { readMemberAuthState } from '../../auth/memberSession'
import MfunsBadge from '../../components/MfunsBadge.vue'
import { useMemberAuth } from '../../composables/useMemberAuth'
import { useMemberProfile } from '../../composables/useMemberProfile'
import { mfunsImageUrl } from '../../utils/mfunsImageUrl'
import { formatUnixDatetime } from '../../utils/mfunsTime'

const router = useRouter()
const { isLoggedIn } = useMemberAuth()
const { memberInfo, loading, refreshMemberProfile } = useMemberProfile()

const nameDialog = ref(false)
const genderDialog = ref(false)
const bioDialog = ref(false)
const saving = ref(false)
const formError = ref('')
const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref<'success' | 'error'>('success')

const nickname = ref('')
const genderDraft = ref(0)
const bioDraft = ref('')

const avatarSrc = computed(() => mfunsImageUrl(memberInfo.value?.avatar, 120))
const wearBadges = computed(() => memberInfo.value?.badges ?? [])

const genderLabel = computed(() => {
  switch (memberInfo.value?.gender) {
    case 0:
      return '保密'
    case 1:
      return '男'
    case 2:
      return '女'
    case 3:
      return '其他'
    default:
      return '未知'
  }
})

const registeredAt = computed(() => formatUnixDatetime(memberInfo.value?.created_at))

const nameChangeHint = computed(() => {
  const user = memberInfo.value
  if (!user) return ''
  if (user.free_name_change_available) {
    return '首次改名免费，之后每次需消耗 50 喵币或一张改名卡'
  }
  if ((user.change_name_card_count ?? 0) > 0) {
    return `改名将消耗一张改名卡（当前持有 ${user.change_name_card_count} 张）`
  }
  return `改名需消耗 50 喵币，当前拥有 ${user.neko_coin ?? 0} 喵币`
})

const genderTicks = { 0: '保密', 1: '男', 2: '女' } as const

function toast(msg: string, color: 'success' | 'error' = 'success') {
  snackbarText.value = msg
  snackbarColor.value = color
  snackbar.value = true
}

function requireToken(): string | null {
  const { token } = readMemberAuthState()
  if (!token) {
    router.replace('/member/login')
    return null
  }
  return token
}

function syncDraftsFromProfile() {
  nickname.value = memberInfo.value?.name ?? ''
  genderDraft.value = memberInfo.value?.gender ?? 0
  bioDraft.value = memberInfo.value?.bio ?? ''
}

function openNameDialog() {
  formError.value = ''
  nickname.value = memberInfo.value?.name ?? ''
  nameDialog.value = true
}

function openGenderDialog() {
  formError.value = ''
  genderDraft.value = memberInfo.value?.gender ?? 0
  genderDialog.value = true
}

function openBioDialog() {
  formError.value = ''
  bioDraft.value = memberInfo.value?.bio ?? ''
  bioDialog.value = true
}

async function saveName() {
  const name = nickname.value.trim()
  if (!name) {
    formError.value = '用户名不能为空'
    return
  }
  const token = requireToken()
  if (!token) return

  saving.value = true
  formError.value = ''
  try {
    const res = await updateMemberName(token, name)
    if (res.code === 1) {
      nameDialog.value = false
      toast(res.msg || '修改成功')
      await refreshMemberProfile()
    } else {
      formError.value = res.msg || '修改失败'
      toast(res.msg || '修改失败', 'error')
    }
  } finally {
    saving.value = false
  }
}

async function saveGender() {
  const token = requireToken()
  if (!token) return

  saving.value = true
  formError.value = ''
  try {
    const res = await updateMemberGender(token, genderDraft.value)
    if (res.code === 1) {
      genderDialog.value = false
      toast(res.msg || '修改成功')
      await refreshMemberProfile()
    } else {
      formError.value = res.msg || '修改失败'
      toast(res.msg || '修改失败', 'error')
    }
  } finally {
    saving.value = false
  }
}

async function saveBio() {
  const token = requireToken()
  if (!token) return

  saving.value = true
  formError.value = ''
  try {
    const res = await updateMemberBio(token, bioDraft.value)
    if (res.code === 1) {
      bioDialog.value = false
      toast(res.msg || '修改成功')
      await refreshMemberProfile()
    } else {
      formError.value = res.msg || '修改失败'
      toast(res.msg || '修改失败', 'error')
    }
  } finally {
    saving.value = false
  }
}

function goMedia() {
  router.push('/media')
}

function goBadges() {
  router.push('/member/badges')
}

watch(memberInfo, () => {
  if (!nameDialog.value && !genderDialog.value && !bioDialog.value) {
    syncDraftsFromProfile()
  }
})

onMounted(async () => {
  if (!isLoggedIn.value) {
    router.replace('/member/login')
    return
  }
  if (!requireToken()) return
  await refreshMemberProfile()
  syncDraftsFromProfile()
})
</script>

<template>
  <div class="settings-page member-profile-page">
    <v-progress-linear v-if="loading && !memberInfo" indeterminate color="primary" />

    <v-list v-else class="settings-list member-profile-list" bg-color="surface" rounded="0">
      <!-- inset + 空 avatar 占位：与参考站一致，分组标题与选项标题左缘对齐 -->
      <v-list-subheader inset>头像和徽章</v-list-subheader>

      <v-list-item lines="two" ripple @click="goMedia">
        <template #prepend>
          <v-avatar size="40" class="member-profile-list__avatar">
            <v-img v-if="avatarSrc" :src="avatarSrc" cover />
            <v-icon v-else icon="mdi-account" />
          </v-avatar>
        </template>
        <v-list-item-title>头像设置</v-list-item-title>
        <v-list-item-subtitle>点击更换头像</v-list-item-subtitle>
        <template #append>
          <v-icon icon="mdi-chevron-right" />
        </template>
      </v-list-item>

      <v-list-item lines="two" ripple @click="goBadges">
        <template #prepend>
          <v-avatar size="40" class="member-profile-list__avatar member-profile-list__avatar--spacer" />
        </template>
        <v-list-item-title>徽章设置</v-list-item-title>
        <v-list-item-subtitle>
          <span v-if="wearBadges.length === 0">未佩戴任何徽章</span>
          <span v-else class="member-profile-page__badges d-inline-flex align-center">
            <MfunsBadge v-for="id in wearBadges" :key="id" :id="id" />
          </span>
        </v-list-item-subtitle>
        <template #append>
          <v-icon icon="mdi-chevron-right" />
        </template>
      </v-list-item>

      <v-divider class="my-2" />

      <v-list-subheader inset>基本信息</v-list-subheader>

      <v-list-item lines="two">
        <template #prepend>
          <v-avatar size="40" class="member-profile-list__avatar member-profile-list__avatar--spacer" />
        </template>
        <v-list-item-title>UID</v-list-item-title>
        <v-list-item-subtitle>{{ memberInfo?.id ?? '—' }}</v-list-item-subtitle>
      </v-list-item>

      <v-list-item lines="two" ripple @click="openNameDialog">
        <template #prepend>
          <v-avatar size="40" class="member-profile-list__avatar member-profile-list__avatar--spacer" />
        </template>
        <v-list-item-title>用户名</v-list-item-title>
        <v-list-item-subtitle>{{ memberInfo?.name || '—' }}</v-list-item-subtitle>
        <template #append>
          <v-icon icon="mdi-chevron-right" />
        </template>
      </v-list-item>

      <v-list-item lines="two" ripple @click="openGenderDialog">
        <template #prepend>
          <v-avatar size="40" class="member-profile-list__avatar member-profile-list__avatar--spacer" />
        </template>
        <v-list-item-title>性别</v-list-item-title>
        <v-list-item-subtitle>{{ genderLabel }}</v-list-item-subtitle>
        <template #append>
          <v-icon icon="mdi-chevron-right" />
        </template>
      </v-list-item>

      <v-list-item lines="two">
        <template #prepend>
          <v-avatar size="40" class="member-profile-list__avatar member-profile-list__avatar--spacer" />
        </template>
        <v-list-item-title>注册日期</v-list-item-title>
        <v-list-item-subtitle>{{ registeredAt }}</v-list-item-subtitle>
      </v-list-item>

      <v-list-item lines="two" ripple @click="openBioDialog">
        <template #prepend>
          <v-avatar size="40" class="member-profile-list__avatar member-profile-list__avatar--spacer" />
        </template>
        <v-list-item-title>个性签名</v-list-item-title>
        <v-list-item-subtitle class="member-profile-page__bio">
          {{ memberInfo?.bio || '未填写' }}
        </v-list-item-subtitle>
        <template #append>
          <v-icon icon="mdi-chevron-right" />
        </template>
      </v-list-item>
    </v-list>

    <!-- 修改昵称 -->
    <v-dialog v-model="nameDialog" max-width="420">
      <v-card>
        <v-card-title>修改昵称</v-card-title>
        <v-card-text>
          <p class="text-body-2 text-medium-emphasis mb-3">{{ nameChangeHint }}</p>
          <v-alert v-if="formError" type="error" density="compact" class="mb-3" variant="tonal">
            {{ formError }}
          </v-alert>
          <v-text-field
            v-model="nickname"
            label="用户名"
            variant="outlined"
            density="comfortable"
            hide-details="auto"
            :disabled="saving"
            @keyup.enter="saveName"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" :disabled="saving" @click="nameDialog = false">取消</v-btn>
          <v-btn color="primary" :loading="saving" @click="saveName">确定</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 修改性别 -->
    <v-dialog v-model="genderDialog" max-width="420">
      <v-card>
        <v-card-title>修改性别</v-card-title>
        <v-card-text>
          <v-alert v-if="formError" type="error" density="compact" class="mb-3" variant="tonal">
            {{ formError }}
          </v-alert>
          <v-slider
            v-model="genderDraft"
            :min="0"
            :max="2"
            :step="1"
            show-ticks="always"
            :ticks="genderTicks"
            color="link"
            thumb-label
            :disabled="saving"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" :disabled="saving" @click="genderDialog = false">取消</v-btn>
          <v-btn color="primary" :loading="saving" @click="saveGender">确定</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 个性签名 -->
    <v-dialog v-model="bioDialog" max-width="420">
      <v-card>
        <v-card-title>个性签名</v-card-title>
        <v-card-text>
          <v-alert v-if="formError" type="error" density="compact" class="mb-3" variant="tonal">
            {{ formError }}
          </v-alert>
          <v-textarea
            v-model="bioDraft"
            label="个性签名"
            variant="outlined"
            density="comfortable"
            rows="3"
            auto-grow
            hide-details="auto"
            :disabled="saving"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" :disabled="saving" @click="bioDialog = false">取消</v-btn>
          <v-btn color="primary" :loading="saving" @click="saveBio">确定</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar" :color="snackbarColor" timeout="2500">
      {{ snackbarText }}
    </v-snackbar>
  </div>
</template>

<style scoped>
@import '../../styles/settings-page.css';

/* 与 Vuetify inset subheader / list-item-avatar 列宽对齐（40 + gap） */
.member-profile-list {
  --member-profile-avatar-col: 56px;
}

.member-profile-list :deep(.v-list-subheader--inset) {
  padding-inline-start: calc(16px + var(--member-profile-avatar-col));
}

.member-profile-list__avatar {
  flex-shrink: 0;
}

.member-profile-list__avatar--spacer {
  visibility: hidden;
  pointer-events: none;
}

.member-profile-page__badges {
  gap: 4px;
  flex-wrap: wrap;
  max-width: 100%;
}

.member-profile-page__bio {
  white-space: normal;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
