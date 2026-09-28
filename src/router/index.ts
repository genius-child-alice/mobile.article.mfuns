import { createRouter, createWebHistory } from 'vue-router'
import type { Component } from 'vue'
import AppShellLayout from '../layouts/AppShellLayout.vue'
import RoutePlaceholder from '../views/RoutePlaceholder.vue'
import SettingsThemesView from '../views/settings/SettingsThemesView.vue'
import SettingsView from '../views/settings/SettingsView.vue'
import SettingsAboutView from '../views/settings/SettingsAboutView.vue'
import SettingsSecurityView from '../views/settings/SettingsSecurityView.vue'
import MemberView from '../views/member/MemberView.vue'
import MemberLoginView from '../views/member/MemberLoginView.vue'
import MemberHistoryView from '../views/member/MemberHistoryView.vue'
import MemberProfileView from '../views/member/MemberProfileView.vue'
import TimelineView from '../views/timeline/TimelineView.vue'
import HomeView from '../views/home/HomeView.vue'
import FeedDetailView from '../views/feed/FeedDetailView.vue'
import ArticleDetailView from '../views/article/ArticleDetailView.vue'
import PremiumView from '../views/premium/PremiumView.vue'
import MediaView from '../views/media/MediaView.vue'
import PlaylistMyListView from '../views/playlist/PlaylistMyListView.vue'
import MemberSignView from '../views/member/MemberSignView.vue'
import BlackroomView from '../views/blackroom/BlackroomView.vue'
import MemberSignRankView from '../views/member/MemberSignRankView.vue'
import PlaylistDetailView from '../views/playlist/PlaylistDetailView.vue'
import CreateView from '../views/create/CreateView.vue'
import CreateArticleView from '../views/create/CreateArticleView.vue'
import CreateFeedView from '../views/create/CreateFeedView.vue'
import CreateSuccessView from '../views/create/CreateSuccessView.vue'
import LeaderboardView from '../views/leaderboard/LeaderboardView.vue'
import MessageView from '../views/message/MessageView.vue'
import MessageMentionView from '../views/message/MessageMentionView.vue'
import MessageLikeView from '../views/message/MessageLikeView.vue'
import MessageNotifyView from '../views/message/MessageNotifyView.vue'
import MessageCommentView from '../views/message/MessageCommentView.vue'
import MessageChatView from '../views/message/MessageChatView.vue'
import MemberRegisterView from '../views/member/MemberRegisterView.vue'
import MemberResetPasswordView from '../views/member/MemberResetPasswordView.vue'
import MemberBadgesView from '../views/member/MemberBadgesView.vue'
import MemberDetailView from '../views/member/MemberDetailView.vue'
import SearchView from '../views/search/SearchView.vue'
import NotFoundView from '../views/NotFoundView.vue'
import TagView from '../views/tag/TagView.vue'
import {
  MAIN_TAB_PATHS,
  STATIC_PAGE_PATHS,
  pathToRouteName,
  pathToTitle,
} from './staticRoutePaths'

const routeComponents: Partial<Record<string, Component>> = {
  '/home': HomeView,
  '/timeline': TimelineView,
  '/member': MemberView,
  '/member/login': MemberLoginView,
  '/member/register': MemberRegisterView,
  '/member/reset_password': MemberResetPasswordView,
  '/member/badges': MemberBadgesView,
  '/member/profile': MemberProfileView,
  '/member/history': MemberHistoryView,
  '/member/sign': MemberSignView,
  '/member/sign_rank': MemberSignRankView,
  '/premium': PremiumView,
  '/media': MediaView,
  '/playlist/mylist': PlaylistMyListView,
  '/blackroom': BlackroomView,
  '/leaderboard': LeaderboardView,
  '/search': SearchView,
  '/404': NotFoundView,
  '/create': CreateView,
  '/create/article': CreateArticleView,
  '/create/feed': CreateFeedView,
  '/create/success': CreateSuccessView,
  '/settings': SettingsView,
  '/settings/about': SettingsAboutView,
  '/settings/security': SettingsSecurityView,
  '/settings/themes': SettingsThemesView,
}

const mainTabSet = new Set<string>(MAIN_TAB_PATHS)

const shellFullBleedPaths = new Set([
  '/member',
  '/member/history',
  '/member/profile',
  '/member/sign',
  '/blackroom',
  '/playlist/mylist',
  '/media',
  '/create',
  '/create/article',
  '/create/feed',
  '/create/success',
  '/message',
  '/message/comment',
  '/message/like',
  '/message/mention',
  '/message/notify',
  '/message/list',
  '/settings',
  '/settings/about',
  '/settings/security',
  '/settings/themes',
])

/** Login/register: full main width like reference LoginPage (not 960px column). */
const shellStretchMainPaths = new Set([
  '/home',
  '/timeline',
  '/premium',
  '/media',
  '/leaderboard',
  '/search',
  '/member/login',
  '/member/register',
  '/member/reset_password',
])

/** 消息中心子页由 MessageView 嵌套渲染（横板右侧 message-content） */
const MESSAGE_NESTED_PATHS = new Set([
  '/message',
  '/message/comment',
  '/message/like',
  '/message/mention',
  '/message/notify',
  '/message/list',
])

function pageMeta(path: string) {
  return {
    title: pathToTitle(path),
    showBottomNav: mainTabSet.has(path),
    shellFullBleed: shellFullBleedPaths.has(path),
    shellStretchMain: shellStretchMainPaths.has(path),
  }
}

const childRoutes = STATIC_PAGE_PATHS.filter((path) => !MESSAGE_NESTED_PATHS.has(path)).map(
  (path) => {
    const segment = path.replace(/^\//, '')
    return {
      path: segment,
      name: pathToRouteName(path),
      component: routeComponents[path] ?? RoutePlaceholder,
      meta: pageMeta(path),
    }
  },
)

const messageChildMeta = (path: string) => ({
  title: pathToTitle(path),
  showBottomNav: false,
  shellFullBleed: true,
})

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: AppShellLayout,
      children: [
        { path: '', redirect: '/home' },
        ...childRoutes,
        {
          path: 'message',
          name: pathToRouteName('/message'),
          component: MessageView,
          meta: pageMeta('/message'),
          children: [
            {
              path: 'mention',
              name: pathToRouteName('/message/mention'),
              component: MessageMentionView,
              meta: messageChildMeta('/message/mention'),
            },
            {
              path: 'like',
              name: pathToRouteName('/message/like'),
              component: MessageLikeView,
              meta: messageChildMeta('/message/like'),
            },
            {
              path: 'notify',
              name: pathToRouteName('/message/notify'),
              component: MessageNotifyView,
              meta: messageChildMeta('/message/notify'),
            },
            {
              path: 'comment',
              name: pathToRouteName('/message/comment'),
              component: MessageCommentView,
              meta: messageChildMeta('/message/comment'),
            },
            {
              path: 'list',
              redirect: '/message',
            },
            {
              path: ':uid(\\d+)',
              name: 'message-chat',
              component: MessageChatView,
              meta: {
                title: '私信',
                showBottomNav: false,
                shellFullBleed: true,
              },
            },
          ],
        },
        {
          path: 'message/chat/:uid',
          redirect: (to) => `/message/${to.params.uid}`,
        },
        {
          path: 'feed/:id',
          name: 'feed-detail',
          component: FeedDetailView,
          meta: {
            title: '动态详情',
            showBottomNav: false,
            shellStretchMain: true,
          },
        },
        {
          path: 'article/:id',
          name: 'article-detail',
          component: ArticleDetailView,
          meta: {
            title: '文章详情',
            showBottomNav: false,
            shellStretchMain: true,
          },
        },
        {
          path: 'playlist/:id',
          name: 'playlist-detail',
          component: PlaylistDetailView,
          meta: {
            title: '收藏夹',
            showBottomNav: false,
            shellStretchMain: true,
          },
        },
        {
          path: 'member/:id(\\d+)',
          name: 'member-detail',
          component: MemberDetailView,
          meta: {
            title: '用户',
            showBottomNav: false,
            shellFullBleed: true,
          },
        },
        {
          path: 'tag/:tag',
          name: 'tag-detail',
          component: TagView,
          meta: {
            title: '标签',
            showBottomNav: false,
            shellFullBleed: true,
          },
        },
        {
          path: ':pathMatch(.*)*',
          name: 'catch-all',
          component: NotFoundView,
          meta: { title: '404', showBottomNav: false },
        },
      ],
    },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

router.afterEach((to) => {
  const title = (to.meta.title as string | undefined) ?? '喵御宅 Mfuns'
  document.title = `${title} - 喵御宅 Mfuns`
})
