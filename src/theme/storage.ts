import { MFUNS_DEFAULT_THEME, MFUNS_THEME_COOKIE, MFUNS_THEME_PRESETS } from './presets'
import type { MfunsThemeConfig } from './types'

const COOKIE_MAX_AGE_DAYS = 298205

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp(`(?:^|; )${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

export function readStoredMfunsTheme(): MfunsThemeConfig | null {
  const raw = getCookie(MFUNS_THEME_COOKIE)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as MfunsThemeConfig
    if (!parsed.primary || !parsed.link) return null
    return normalizeThemeConfig(parsed)
  } catch {
    return null
  }
}

export function persistMfunsTheme(config: MfunsThemeConfig): void {
  if (typeof document === 'undefined') return
  const payload = JSON.stringify(config)
  document.cookie = `${MFUNS_THEME_COOKIE}=${encodeURIComponent(payload)}; path=/; max-age=${COOKIE_MAX_AGE_DAYS * 86400}; SameSite=Lax`
}

export function normalizeThemeConfig(config: MfunsThemeConfig): MfunsThemeConfig {
  const index =
    typeof config.index === 'number' && config.index >= 0 && config.index < MFUNS_THEME_PRESETS.length
      ? config.index
      : MFUNS_THEME_PRESETS.findIndex(
          (p) => p.primary === config.primary && p.dark === config.dark && p.name === config.name,
        )

  const preset = index >= 0 ? MFUNS_THEME_PRESETS[index] : null

  return {
    dark: Boolean(config.dark),
    primary: config.primary,
    link: config.link,
    name: config.name || preset?.name || MFUNS_DEFAULT_THEME.name,
    desc: config.desc ?? preset?.desc ?? '',
    index: index >= 0 ? index : undefined,
  }
}
