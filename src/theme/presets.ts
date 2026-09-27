import type { MfunsThemeConfig } from './types'

/** Presets from m.mfuns settings/themes (ac80e38.js). */
export const MFUNS_THEME_PRESETS: readonly MfunsThemeConfig[] = [
  { dark: false, primary: '#7b7ff7', link: '#7b7ff7', name: '默认主题', desc: '' },
  { dark: true, primary: '#212121', link: '#7b7ff7', name: '黑夜模式', desc: '' },
  { dark: false, primary: '#F44336', link: '#F44336', name: '大红色', desc: '' },
  { dark: false, primary: '#4CAF50', link: '#4CAF50', name: '早苗绿', desc: '' },
  { dark: false, primary: '#03A9F4', link: '#03A9F4', name: '冰雪蓝', desc: '' },
  { dark: false, primary: '#FF9800', link: '#FF9800', name: '橘红色', desc: '' },
  { dark: false, primary: '#FB7299', link: '#FB7299', name: '粉红色', desc: '' },
  { dark: false, primary: '#39C5BB', link: '#39C5BB', name: '苍绿色', desc: '' },
  { dark: false, primary: '#66ccff', link: '#66ccff', name: '天依蓝', desc: '' },
] as const

export const MFUNS_DEFAULT_THEME: MfunsThemeConfig = { ...MFUNS_THEME_PRESETS[0] }

export const MFUNS_THEME_COOKIE = 'mfuns_mobile_theme'
