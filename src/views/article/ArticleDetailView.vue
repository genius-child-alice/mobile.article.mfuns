<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  fetchArticleGet,
  fetchSeriesItems,
  type ArticleCategory,
  type ArticleDetail,
  type ArticleSeriesItem,
} from '../../api/articleApi'
import { fetchLikeStatus } from '../../api/likeApi'
import type { FeedUser } from '../../api/feedsApi'
import { readMemberAuthState } from '../../auth/memberSession'
import CommentSection from '../../components/CommentSection.vue'
import FavoriteDialog from '../../components/FavoriteDialog.vue'
import FollowBtn from '../../components/FollowBtn.vue'
import ForwardTool from '../../components/ForwardTool.vue'
import MfunsRichText from '../../components/MfunsRichText.vue'
import ReportsDialog from '../../components/ReportsDialog.vue'
import RewardDialog from '../../components/RewardDialog.vue'
import { useLikeToggle } from '../../composables/useLikeToggle'
import { useMemberAuth } from '../../composables/useMemberAuth'
import { mfunsImageUrl } from '../../utils/mfunsImageUrl'
import { formatRelativeUnixTime } from '../../utils/mfunsTime'

const route = useRoute()
const router = useRouter()
const { isLoggedIn } = useMemberAuth()

const articleId = computed(() => Number(route.params.id))
const exposureId = computed(() => String(route.query.exposure_id || ''))
const source = computed(() => String(route.query.source || ''))

const loading = ref(true)
const notFound = ref(false)
const appbarShow = ref(false)
const article = ref<ArticleDetail>({ id: 0, title: '', is_show_cover: true })
const userinfo = ref<FeedUser | null>(null)
const tags = ref<string[]>([])
const category = ref<ArticleCategory>({})
const commentId = ref(0)
const viewCount = ref(0)
const favoriteCount = ref(0)
const rewardCount = ref(0)
const seriesList = ref<ArticleSeriesItem[]>([])
const snackbar = ref({ open: false, text: '', color: 'error' as string })

const titleEl = ref<HTMLElement | null>(null)
const shareRef = ref<InstanceType<typeof ForwardTool> | null>(null)
const favoriteRef = ref<InstanceType<typeof FavoriteDialog> | null>(null)
const rewardRef = ref<InstanceType<typeof RewardDialog> | null>(null)
const reportsRef = ref<InstanceType<typeof ReportsDialog> | null>(null)
let titleObserver: IntersectionObserver | null = null

const { likeStatus, like, dislike, applyStatus } = useLikeToggle(() => articleId.value, 0)

const coverSrc = computed(() => mfunsImageUrl(article.value.cover, 800))
const avatarSrc = computed(() => mfunsImageUrl(userinfo.value?.avatar, 100))
const createTime = computed(() => formatRelativeUnixTime(article.value.created_at))
const pageUrl = computed(() => (typeof window !== 'undefined' ? window.location.href : ''))

function toast(text: string, color = 'error') {
  snackbar.value = { open: true, text, color }
}

function goBack() {
  if (window.history.length > 1) router.back()
  else router.push('/home')
}

function bindTitleObserver() {
  titleObserver?.disconnect()
  if (!titleEl.value) return
  titleObserver = new IntersectionObserver(
    (entries) => {
      const entry = entries[0]
      if (!entry) return
      // 参考站 showAppbar(entries, observer, isIntersecting) → appbarShow = !isIntersecting
      appbarShow.value = !entry.isIntersecting
    },
    { threshold: [1] },
  )
  titleObserver.observe(titleEl.value)
}

async function load() {
  loading.value = true
  notFound.value = false
  appbarShow.value = false
  seriesList.value = []
  try {
    const token = readMemberAuthState().token
    const res = await fetchArticleGet(
      articleId.value,
      exposureId.value,
      source.value,
      token,
    )
    if (res.code === 404) {
      notFound.value = true
      return
    }
    if (res.code !== 1 || !res.data?.article) {
      toast(res.msg || '加载失败')
      return
    }

    article.value = res.data.article
    userinfo.value = res.data.user ?? null
    tags.value = res.data.tag ?? []
    category.value = res.data.category ?? {}
    commentId.value = res.data.comment_id ?? res.data.article.comment_area_id ?? 0
    viewCount.value = res.data.view_count ?? 0
    favoriteCount.value = res.data.favorite_count ?? 0
    rewardCount.value = res.data.reward_count ?? 0
    applyStatus(res.data.like_status)
    document.title = `${article.value.title || '文章'} - 喵御宅 Mfuns`

    if (article.value.series_id) {
      const seriesRes = await fetchSeriesItems(article.value.series_id, token)
      if (seriesRes.code === 1 && Array.isArray(seriesRes.data?.list)) {
        seriesList.value = seriesRes.data.list
      }
    }

    if (isLoggedIn.value && token) {
      const st = await fetchLikeStatus(articleId.value, 0, token)
      if (st.code === 1) applyStatus(st.data?.status)
    }

    await nextTick()
    bindTitleObserver()
  } finally {
    loading.value = false
  }
}

watch(articleId, () => {
  if (Number.isFinite(articleId.value) && articleId.value > 0) void load()
})

onMounted(async () => {
  if (!Number.isFinite(articleId.value) || articleId.value <= 0) {
    notFound.value = true
    loading.value = false
    return
  }
  await load()
  if (notFound.value) router.replace('/404')
})

onUnmounted(() => {
  titleObserver?.disconnect()
})
</script>

<template>
  <div class="article-detail">
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

      <template v-if="appbarShow">
        <v-toolbar-title class="article-detail__bar-title">
          {{ loading ? '正在加载中' : article.title }}
        </v-toolbar-title>
      </template>
      <template v-else>
        <v-avatar
          v-if="userinfo?.id"
          size="32"
          class="me-2"
          role="button"
          @click="router.push(`/member/${userinfo.id}`)"
        >
          <v-img v-if="avatarSrc" :src="avatarSrc" cover />
          <v-icon v-else icon="mdi-account" />
        </v-avatar>
        <v-toolbar-title
          v-if="userinfo?.id"
          class="article-detail__bar-title"
          role="button"
          @click="router.push(`/member/${userinfo.id}`)"
        >
          {{ userinfo.name }}
        </v-toolbar-title>
      </template>

      <v-spacer />

      <FollowBtn
        v-if="!loading && !notFound && userinfo?.id"
        :user-id="userinfo.id"
        color="white"
      />
      <v-btn
        icon
        variant="text"
        :href="`mfuns://net.mfuns.app.asuka/article/${articleId}`"
        aria-label="APP打开"
      >
        <v-icon icon="mdi-open-in-new" />
      </v-btn>
      <v-menu location="bottom">
        <template #activator="{ props: menuProps }">
          <v-btn v-bind="menuProps" icon variant="text">
            <v-icon icon="mdi-dots-vertical" />
          </v-btn>
        </template>
        <v-list>
          <v-list-item title="举报不当内容" @click="reportsRef?.show(articleId, 0)" />
        </v-list>
      </v-menu>
    </v-app-bar>

    <div class="article-detail__main">
    <v-progress-linear v-if="loading" color="pink" indeterminate />

    <div v-else-if="!notFound" class="article-detail__body">
      <div class="article-detail__col">
        <div v-if="article.is_show_cover && coverSrc" class="article-detail__cover">
          <img :src="coverSrc" alt="Article Cover" fetchpriority="high" />
        </div>

        <v-sheet class="pa-4">
          <h1 ref="titleEl" class="text-h5 my-1 article-detail__title">
            {{ article.title }}
          </h1>
          <div class="text-medium-emphasis text-body-2">
            <span>{{ viewCount }}浏览</span>
            <span class="text-disabled"> • </span>
            <span>{{ createTime }}</span>
            <span class="text-disabled"> • </span>
            <span>{{ category.name || '' }}</span>
            <span class="text-disabled"> • </span>
            <span> MA{{ article.id }} </span>
          </div>
        </v-sheet>

        <v-divider />

        <v-sheet class="pa-4">
          <MfunsRichText :text="article.content" :type="article.content_type ?? 1" />

          <div v-if="article.copyright === 2" class="mt-4 text-disabled">
            未经作者允许，禁止转载
          </div>

          <div v-if="tags.length" class="mt-4">
            <v-chip
              v-for="tag in tags"
              :key="tag"
              class="me-2 mb-2 text-caption text-medium-emphasis"
              @click="router.push(`/tag/${tag}`)"
            >
              #{{ tag }}
            </v-chip>
          </div>

          <div class="d-flex mt-3 align-center" style="min-height: 40px">
            <v-sheet class="d-flex justify-center align-center pa-2" v-ripple role="button" @click="like">
              <v-icon
                class="me-1"
                size="22"
                :color="likeStatus.like?.is_active ? 'link' : undefined"
                :icon="likeStatus.like?.is_active ? 'mdi-thumb-up' : 'mdi-thumb-up-outline'"
              />
              <span class="text-body-1 text-medium-emphasis">
                {{ likeStatus.like?.count || ' ' }}
              </span>
            </v-sheet>
            <v-sheet
              class="d-flex justify-center align-center pa-2 ms-3"
              style="min-width: 52px"
              v-ripple
              role="button"
              @click="dislike"
            >
              <v-icon
                class="me-1"
                size="22"
                :color="likeStatus.dislike?.is_active ? 'link' : undefined"
                :icon="
                  likeStatus.dislike?.is_active ? 'mdi-thumb-down' : 'mdi-thumb-down-outline'
                "
              />
              <span class="text-body-1 text-medium-emphasis">
                {{ likeStatus.dislike?.count || ' ' }}
              </span>
            </v-sheet>
            <v-sheet
              class="d-flex justify-center pa-2 ms-3"
              style="min-width: 52px"
              v-ripple
              role="button"
              @click="favoriteRef?.show()"
            >
              <div class="me-1" style="width: 22px; height: 22px">
                <v-icon
                  size="24"
                  :color="favoriteRef?.isFavorite ? 'link' : undefined"
                  :icon="favoriteRef?.isFavorite ? 'mdi-star' : 'mdi-star-outline'"
                />
              </div>
              <span v-if="favoriteCount" class="text-body-1">{{ favoriteCount }}</span>
            </v-sheet>
            <v-sheet
              class="d-flex justify-center pa-2 ms-3"
              style="min-width: 52px"
              v-ripple
              role="button"
              @click="rewardRef?.show()"
            >
              <v-icon
                class="me-1"
                size="22"
                :color="rewardRef?.isReward ? 'link' : undefined"
                :icon="rewardRef?.isReward ? 'mdi-star-circle' : 'mdi-star-circle-outline'"
              />
              <span v-if="rewardCount" class="text-body-1">{{ rewardCount }}</span>
            </v-sheet>
            <v-sheet
              class="d-flex justify-center pa-2 ms-3"
              v-ripple
              role="button"
              @click="shareRef?.show()"
            >
              <v-icon class="me-1" size="22" icon="mdi-share-variant" />
            </v-sheet>
            <v-spacer />
          </div>
        </v-sheet>

        <v-divider />

        <v-sheet v-if="seriesList.length" class="mt-2 pa-4">
          <div class="text-subtitle-1 font-weight-bold mb-2">所属合集</div>
          <v-list density="compact" class="pa-0">
            <v-list-item
              v-for="(item, index) in seriesList"
              :key="item.resource_id"
              class="px-0"
              :to="
                item.resource_type === 1
                  ? `/video/${item.resource_id}`
                  : `/article/${item.resource_id}`
              "
            >
              <v-list-item-title class="text-body-2 text-wrap">
                <span
                  v-if="item.resource_id === article.id"
                  class="text-primary font-weight-bold"
                >
                  P{{ index + 1 }}. {{ item.title }} (当前)
                </span>
                <span v-else> P{{ index + 1 }}. {{ item.title }} </span>
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-sheet>
        <v-divider v-if="seriesList.length" />

        <v-sheet v-if="commentId" class="mt-1">
          <CommentSection :area-id="commentId" />
        </v-sheet>
      </div>
    </div>

    <ForwardTool
      ref="shareRef"
      :id="articleId"
      :type="0"
      :title="article.title || ''"
      :content="pageUrl"
    />
    <FavoriteDialog
      ref="favoriteRef"
      :id="articleId"
      :type="0"
      @update="(n) => (favoriteCount = n)"
    />
    <RewardDialog
      ref="rewardRef"
      :id="articleId"
      :type="0"
      @reward="(n) => (rewardCount += n)"
    />
    <ReportsDialog ref="reportsRef" />

    <v-snackbar v-model="snackbar.open" :color="snackbar.color" timeout="2500">
      {{ snackbar.text }}
    </v-snackbar>
    </div>
  </div>
</template>

<style scoped>
.article-detail__bar-title {
  padding-inline-start: 0 !important;
  font-size: 1.05rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 46vw;
}

.article-detail__cover {
  display: block;
  width: 100%;
  height: 150px;
  min-height: 150px;
  position: relative;
  overflow: hidden;
}

.article-detail__cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.article-detail__title {
  min-height: 32px;
}

.article-detail__col {
  max-width: 960px;
  margin-inline: auto;
  width: 100%;
}

@media (min-width: 960px) {
  .article-detail__col {
    max-width: 66.666%;
  }
}
</style>
