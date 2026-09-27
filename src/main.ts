import { createApp } from 'vue'
import App from './App.vue'
import { vuetify } from './plugins/vuetify'
import { router } from './router'
import { applyMfunsTheme } from './theme/applyMfunsTheme'
import { MFUNS_DEFAULT_THEME } from './theme/presets'
import { normalizeThemeConfig, readStoredMfunsTheme } from './theme/storage'
import { initMemberAuthFromStorage } from './composables/useMemberAuth'
import './styles/mfuns-shell.css'
import './styles/mfuns-main-nav.css'
import './styles/mfuns-home-content.css'

const initialTheme = normalizeThemeConfig(
  readStoredMfunsTheme() ?? { ...MFUNS_DEFAULT_THEME, index: 0 },
)
applyMfunsTheme(vuetify.theme, initialTheme)
initMemberAuthFromStorage()

createApp(App).use(vuetify).use(router).mount('#app')
