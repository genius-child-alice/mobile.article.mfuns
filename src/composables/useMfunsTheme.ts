import { onMounted, ref, shallowReadonly } from 'vue'
import { useTheme } from 'vuetify'
import { applyMfunsTheme } from '../theme/applyMfunsTheme'
import { MFUNS_DEFAULT_THEME, MFUNS_THEME_PRESETS } from '../theme/presets'
import { normalizeThemeConfig, persistMfunsTheme, readStoredMfunsTheme } from '../theme/storage'
import type { MfunsThemeConfig } from '../theme/types'

const initialized = ref(false)
const currentTheme = ref<MfunsThemeConfig>({ ...MFUNS_DEFAULT_THEME })

export function useMfunsTheme() {
  const vuetifyTheme = useTheme()

  function applyTheme(config: MfunsThemeConfig) {
    const normalized = normalizeThemeConfig(config)
    currentTheme.value = normalized
    applyMfunsTheme(vuetifyTheme, normalized)
    persistMfunsTheme(normalized)
  }

  function applyPresetIndex(index: number) {
    const preset = MFUNS_THEME_PRESETS[index]
    if (!preset) return
    applyTheme({ ...preset, index })
  }

  function initThemeFromStorage() {
    if (initialized.value) return
    initialized.value = true
    const stored = readStoredMfunsTheme()
    applyTheme(stored ?? { ...MFUNS_DEFAULT_THEME, index: 0 })
  }

  onMounted(() => {
    initThemeFromStorage()
  })

  return {
    currentTheme: shallowReadonly(currentTheme),
    presets: MFUNS_THEME_PRESETS,
    applyTheme,
    applyPresetIndex,
    initThemeFromStorage,
  }
}
