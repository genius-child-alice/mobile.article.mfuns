import { createRouter, createWebHistory } from 'vue-router'
import type { Component } from 'vue'
import AppShellLayout from '../layouts/AppShellLayout.vue'
import RoutePlaceholder from '../views/RoutePlaceholder.vue'
import SettingsThemesView from '../views/settings/SettingsThemesView.vue'
import MemberView from '../views/member/MemberView.vue'
import {
  MAIN_TAB_PATHS,
  STATIC_PAGE_PATHS,
  pathToRouteName,
  pathToTitle,
} from './staticRoutePaths'

const routeComponents: Partial<Record<string, Component>> = {
  '/member': MemberView,
  '/settings/themes': SettingsThemesView,
}

const mainTabSet = new Set<string>(MAIN_TAB_PATHS)

const shellFullBleedPaths = new Set(['/member', '/settings/themes'])

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
