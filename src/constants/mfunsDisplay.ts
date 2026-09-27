/**
 * Display breakpoints aligned with m.mfuns (Vuetify 2 + @nuxtjs/vuetify).
 *
 * Vuetify 2 `mobileBreakpoint: 'sm'` means `breakpoint.mobile` when current name is
 * xs OR sm — i.e. width < md (960px), NOT width < sm (600px).
 *
 * Vuetify 4 `display.mobile` uses width < threshold[mobileBreakpoint], so we set
 * mobileBreakpoint to 960 to match.
 */
export const MFUNS_DISPLAY = {
  mobileBreakpoint: 960,
  thresholds: {
    xs: 0,
    sm: 600,
    md: 960,
    lg: 1264,
    xl: 1920,
    xxl: 2560,
  },
} as const

/** Bottom bar vs left rail switch (same as `$vuetify.breakpoint.mobile` on reference). */
export function isMfunsMainNavMobile(width: number): boolean {
  return width < MFUNS_DISPLAY.thresholds.md
}
