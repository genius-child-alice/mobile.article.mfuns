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
import TimelineView from '../views/timeline/TimelineView.vue'
import {
  MAIN_TAB_PATHS,
  STATIC_PAGE_PATHS,
  pathToRouteName,
  pathToTitle,
} from './staticRoutePaths'

const routeComponents: Partial<Record<string, Component>> = {
  '/timeline': TimelineView,
  '/member': MemberView,
  '/member/login': MemberLoginView,
  '/member/history': MemberHistoryView,
  '/settings': SettingsView,
  '/settings/about': SettingsAboutView,
  '/settings/security': SettingsSecurityView,
  '/settings/themes': SettingsThemesView,
}

const mainTabSet = new Set<string>(MAIN_TAB_PATHS)

const shellFullBleedPaths = new Set([
  '/member',
  '/member/history',
  '/settings',
  '/settings/about',
  '/settings/security',
  '/settings/themes',
])

/** Login/register: full main width like reference LoginPage (not 960px column). */
const shellStretchMainPaths = new Set([
  '/timeline',
  '/member/login',
  '/member/register',
  '/member/reset_password',
])

const childRoutes = STATIC_PAGE_PATHS.map((path) => {
  const segment = path.replace(/^\//, '')
  return {
    path: segment,
    name: pathToRouteName(path),
    component: routeComponents[path] ?? RoutePlaceholder,
    meta: {
      title: pathToTitle(path),
      showBottomNav: mainTabSet.has(path),
      shellFullBleed: shellFullBleedPaths.has(path),
      shellStretchMain: shellStretchMainPaths.has(path),
    },
  }
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
          path: ':pathMatch(.*)*',
          name: 'catch-all',
          component: RoutePlaceholder,
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
