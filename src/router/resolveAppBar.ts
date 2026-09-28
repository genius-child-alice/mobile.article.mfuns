/** App bar layout aligned with m.mfuns SSR shells. */
export type MfunsAppBarVariant = 'none' | 'home' | 'timeline' | 'search' | 'back' | 'member'

export type MfunsAppBarTrailing =
  | 'none'
  | 'member-register'
  | 'create-article-actions'
  | 'create-feed-publish'
  | 'playlist-new'
  | 'history-clear'
  | 'sign-rank'
  | 'badges-save'
  | 'member-page-actions'

export interface MfunsAppBarConfig {
  visible: boolean
  variant: MfunsAppBarVariant
  /** Toolbar title (back variant). */
  title: string
  /** Tabs in main row (timeline) or extension row. */
  extensionTabs: readonly string[]
  /** Tabs inline in toolbar row (home sm breakpoint). */
  inlineTabs: readonly string[]
  /** xs-only extension tabs (home). */
  extensionTabsXsOnly: boolean
  trailing: MfunsAppBarTrailing
}

const NO_BAR: MfunsAppBarConfig = {
  visible: false,
  variant: 'none',
  title: '',
  extensionTabs: [],
  inlineTabs: [],
  extensionTabsXsOnly: false,
  trailing: 'none',
}

function backBar(
  title: string,
  opts: Partial<Omit<MfunsAppBarConfig, 'visible' | 'variant' | 'title'>> = {},
): MfunsAppBarConfig {
  return {
    visible: true,
    variant: 'back',
    title,
    extensionTabs: [],
    inlineTabs: [],
    extensionTabsXsOnly: false,
    trailing: 'none',
    ...opts,
  }
}

/** Per-path app bar (from live m.mfuns.net SSR, static routes). */
export function resolveAppBarConfig(path: string): MfunsAppBarConfig {
  const tagMatch = path.match(/^\/tag\/(.+)$/)
  if (tagMatch) {
    let tag = tagMatch[1]
    try {
      tag = decodeURIComponent(tag)
    } catch {
      /* keep raw */
    }
    return backBar(tag)
  }

  if (/^\/member\/(\d+)$/.test(path)) {
    return backBar('', {
      extensionTabs: ['首页', '文章', '收藏'],
      extensionTabsXsOnly: true,
      trailing: 'member-page-actions',
    })
  }

  if (
    path === '/premium' ||
    path === '/create/video' ||
    path.startsWith('/feed/') ||
    path.startsWith('/article/') ||
    /^\/playlist\/\d+/.test(path)
  ) {
    return NO_BAR
  }

  if (/^\/message\/\d+/.test(path) || path.startsWith('/message/chat/')) {
    return backBar('私信')
  }

  if (path === '/member') {
    return {
      visible: true,
      variant: 'member',
      title: '个人中心',
      extensionTabs: [],
      inlineTabs: [],
      extensionTabsXsOnly: false,
      trailing: 'none',
    }
  }

  if (path === '/home') {
    const tabs = ['推荐', '排行', '分区'] as const
    return {
      visible: true,
      variant: 'home',
      title: '',
      extensionTabs: tabs,
      inlineTabs: tabs,
      extensionTabsXsOnly: true,
      trailing: 'none',
    }
  }

  if (path === '/timeline') {
    return {
      visible: true,
      variant: 'timeline',
      title: '',
      extensionTabs: [],
      inlineTabs: ['时间线'],
      extensionTabsXsOnly: false,
      trailing: 'none',
    }
  }

  if (path === '/search') {
    return {
      visible: true,
      variant: 'search',
      title: '',
      extensionTabs: [],
      inlineTabs: [],
      extensionTabsXsOnly: false,
      trailing: 'none',
    }
  }

  const byPath: Record<string, MfunsAppBarConfig> = {
    '/member/login': backBar('用户登录', { trailing: 'member-register' }),
    '/member/register': backBar('用户注册'),
    '/member/profile': backBar('账号资料'),
    '/member/history': backBar('历史记录', { trailing: 'history-clear' }),
    '/member/badges': backBar('徽章设置', { trailing: 'badges-save' }),
    '/member/sign': backBar('每日签到', { trailing: 'sign-rank' }),
    '/member/sign_rank': backBar('签到排行榜'),
    '/member/reset_password': backBar('重置密码'),
    /** extensionTabs 占位以启用 extended；实际标签由 useLeaderboardTabs 动态填充 */
    '/leaderboard': backBar('全站排行', { extensionTabs: ['全站排行'] }),
    '/blackroom': backBar('小黑屋'),
    '/create': backBar('投稿中心'),
    '/create/article': backBar('投稿', { trailing: 'create-article-actions' }),
    '/create/feed': backBar('发布动态', { trailing: 'create-feed-publish' }),
    '/create/success': backBar('投稿成功'),
    '/playlist/mylist': backBar('收藏夹列表', { trailing: 'playlist-new' }),
    '/media': backBar('媒体库'),
    '/message': backBar('消息中心'),
    '/message/comment': backBar('评论通知'),
    '/message/like': backBar('点赞通知'),
    '/message/mention': backBar('提及我的'),
    '/message/notify': backBar('系统通知'),
    '/message/list': backBar('私信'),
    '/message/chat': backBar('私信'),
    '/settings': backBar('设置'),
    '/settings/about': backBar('关于'),
    '/settings/security': backBar('安全设置'),
    '/settings/themes': backBar('主题设置'),
    '/404': backBar('内容不见了哦'),
  }

  return byPath[path] ?? backBar(pathToFallbackTitle(path))
}

function pathToFallbackTitle(path: string): string {
  const segment = path.split('/').filter(Boolean).pop()
  return segment ?? '喵御宅'
}
