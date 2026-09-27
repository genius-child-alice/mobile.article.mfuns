export interface MemberServiceItem {
  text: string
  icon: string
  to: string
  color: string
}

/** 「推荐服务」grid from m.mfuns Member page. */
export const MEMBER_SERVICE_ITEMS: readonly MemberServiceItem[] = [
  { text: '历史记录', icon: 'mdi-clock', to: '/member/history', color: 'link' },
  { text: '账号资料', icon: 'mdi-account', to: '/member/profile', color: 'cyan' },
  { text: '我的收藏', icon: 'mdi-star-settings', to: '/playlist/mylist', color: 'pink' },
  { text: '每日签到', icon: 'mdi-clipboard-check', to: '/member/sign', color: 'green' },
  { text: '会员', icon: 'mdi-wallet-membership', to: '/premium', color: 'purple' },
  { text: '媒体库', icon: 'mdi-image-multiple', to: '/media', color: 'amber-darken-4' },
  { text: '稿件中心', icon: 'mdi-plus-circle', to: '/create', color: 'light-blue' },
  { text: '小黑屋', icon: 'mdi-bank', to: '/blackroom', color: 'blue-darken-4' },
] as const
