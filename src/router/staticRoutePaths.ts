/**
 * Page paths from `.local/m.mfuns.net/routes-index.json` → static (assets excluded).
 */
export const STATIC_PAGE_PATHS = [
  '/home',
  '/timeline',
  '/member',
  '/member/login',
  '/member/register',
  '/member/profile',
  '/member/history',
  '/member/badges',
  '/member/sign',
  '/member/sign_rank',
  '/member/reset_password',
  '/search',
  '/leaderboard',
  '/blackroom',
  '/create',
  '/create/article',
  '/create/video',
  '/create/feed',
  '/create/success',
  '/playlist/mylist',
  '/media',
  '/premium',
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
  '/404',
] as const

export type StaticPagePath = (typeof STATIC_PAGE_PATHS)[number]

/** Routes that show the main tab bar (首页 / 动态 / 我的). */
export const MAIN_TAB_PATHS = ['/home', '/timeline', '/member'] as const

export function pathToRouteName(path: string): string {
  if (path === '/404') return 'not-found'
  return path
    .replace(/^\//, '')
    .replace(/\//g, '-')
    .replace(/[^a-zA-Z0-9-]/g, '') || 'root'
}

export function pathToTitle(path: string): string {
  const titles: Record<string, string> = {
    '/home': '首页',
    '/timeline': '动态',
    '/member': '我的',
    '/member/login': '登录',
    '/member/register': '注册',
    '/member/profile': '账号资料',
    '/member/history': '历史记录',
    '/member/badges': '徽章',
    '/member/sign': '每日签到',
    '/member/sign_rank': '签到排行',
    '/member/reset_password': '重置密码',
    '/search': '搜索',
    '/leaderboard': '排行',
    '/blackroom': '小黑屋',
    '/create': '稿件中心',
    '/create/article': '投稿文章',
    '/create/video': '投稿视频',
    '/create/feed': '发布动态',
    '/create/success': '发布成功',
    '/playlist/mylist': '我的收藏',
    '/media': '媒体库',
    '/premium': '开通会员',
    '/message': '消息',
    '/message/comment': '回复',
    '/message/like': '点赞',
    '/message/mention': '提及',
    '/message/notify': '通知',
    '/message/list': '私信',
    '/settings': '设置',
    '/settings/about': '关于',
    '/settings/security': '安全设置',
    '/settings/themes': '主题设置',
    '/404': '404',
  }
  return titles[path] ?? path
}
