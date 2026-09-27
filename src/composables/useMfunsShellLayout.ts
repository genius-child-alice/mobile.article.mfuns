import { computed, type ComputedRef } from 'vue'
import { useDisplay } from 'vuetify'
import type { MfunsAppBarConfig } from '../router/resolveAppBar'

/** Same as original layout: left rail width when not `breakpoint.mobile`. */
export const MFUNS_LEFT_NAV_WIDTH = 74

/**
 * App bar height + main nav mirror m.mfuns layout bundle.
 */
export function useMfunsShellLayout(options: {
  appBar: ComputedRef<MfunsAppBarConfig>
  showBottomNav: ComputedRef<boolean>
}) {
  const { xs, sm, mdAndUp, mobile } = useDisplay()

  const showMainNavBottom = computed(
    () => options.showBottomNav.value && mobile.value,
  )
  const showMainNavLeft = computed(
    () => options.showBottomNav.value && !mobile.value,
  )

  const showHomeExtensionTabs = computed(() => {
    const bar = options.appBar.value
    if (bar.variant !== 'home') return false
    if (!bar.extensionTabsXsOnly) return bar.extensionTabs.length > 0
    return xs.value && bar.extensionTabs.length > 0
  })

  const showHomeInlineTabs = computed(() => {
    const bar = options.appBar.value
    if (bar.variant !== 'home') return false
    return sm.value && !mdAndUp.value
  })

  const showTimelineTabs = computed(
    () => options.appBar.value.variant === 'timeline',
  )

  const showBackExtensionTabs = computed(() => {
    const bar = options.appBar.value
    if (bar.variant !== 'back') return false
    return bar.extensionTabs.length > 0
  })

  const appBarExtended = computed(
    () => showHomeExtensionTabs.value || showBackExtensionTabs.value,
  )

  const appBarHeight = computed(() => {
    const bar = options.appBar.value
    if (!bar.visible) return 0
    if (appBarExtended.value) return 96
    return 48
  })

  const bottomNavHeight = computed(() => (showMainNavBottom.value ? 56 : 0))
  const leftNavWidth = computed(() => (showMainNavLeft.value ? MFUNS_LEFT_NAV_WIDTH : 0))

  const shellStyle = computed(() => ({
    '--mfuns-app-bar-height': `${appBarHeight.value}px`,
    '--mfuns-bottom-nav-height': `${bottomNavHeight.value}px`,
    '--mfuns-left-nav-width': `${leftNavWidth.value}px`,
    '--v-layout-left': `${leftNavWidth.value}px`,
    '--v-layout-bottom': `${bottomNavHeight.value}px`,
  }))

  return {
    mdAndUp,
    showMainNavBottom,
    showMainNavLeft,
    showHomeExtensionTabs,
    showHomeInlineTabs,
    showTimelineTabs,
    showBackExtensionTabs,
    appBarExtended,
    appBarHeight,
    shellStyle,
  }
}
