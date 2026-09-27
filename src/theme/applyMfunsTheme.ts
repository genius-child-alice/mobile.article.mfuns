import type { ThemeInstance } from 'vuetify'
import type { MfunsThemeConfig } from './types'

export const MFUNS_LIGHT_THEME = 'mfunsLight'
export const MFUNS_DARK_THEME = 'mfunsDark'

function setMetaThemeColor(hex: string): void {
  if (typeof document === 'undefined') return
  let el = document.querySelector('meta[name="theme-color"]')
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute('name', 'theme-color')
    document.head.appendChild(el)
  }
  el.setAttribute('content', hex)
}

/** Legacy Vuetify 2 variable names used in shell CSS. */
function setRootCssVars(config: MfunsThemeConfig): void {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.style.setProperty('--mfuns-primary', config.primary)
  root.style.setProperty('--mfuns-link', config.link)
  root.style.setProperty('--v-primary-base', config.primary)
  root.style.setProperty('--v-link-base', config.link)
  root.style.setProperty('--color-primary', config.primary)
  root.style.colorScheme = config.dark ? 'dark' : 'light'
  root.classList.toggle('mfuns-theme-dark', config.dark)
  root.classList.toggle('mfuns-theme-light', !config.dark)
}

/** Apply theme colors globally (Vuetify 3 + document meta/CSS). */
export function applyMfunsTheme(theme: ThemeInstance, config: MfunsThemeConfig): void {
  const light = theme.themes.value[MFUNS_LIGHT_THEME]
  const dark = theme.themes.value[MFUNS_DARK_THEME]
  if (!light || !dark) return

  light.colors.link = config.link
  dark.colors.link = config.link

  if (config.dark) {
    dark.colors.primary = config.primary
    theme.global.name.value = MFUNS_DARK_THEME
    setMetaThemeColor(config.primary)
  } else {
    light.colors.primary = config.primary
    theme.global.name.value = MFUNS_LIGHT_THEME
    setMetaThemeColor(config.primary)
  }

  setRootCssVars(config)
}
