import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { MFUNS_DISPLAY } from '../constants/mfunsDisplay'

const sharedColors = {
  secondary: '#424242',
  accent: '#82b1ff',
  error: '#ff5252',
  info: '#2196f3',
  success: '#4caf50',
  warning: '#fb8c00',
}

export const vuetify = createVuetify({
  components,
  directives,
  display: {
    mobileBreakpoint: MFUNS_DISPLAY.mobileBreakpoint,
    thresholds: { ...MFUNS_DISPLAY.thresholds },
  },
  theme: {
    defaultTheme: 'mfunsLight',
    themes: {
      mfunsLight: {
        dark: false,
        colors: {
          ...sharedColors,
          primary: '#7b7ff7',
          link: '#7b7ff7',
          background: '#eef0f8',
          surface: '#ffffff',
        },
      },
      mfunsDark: {
        dark: true,
        colors: {
          ...sharedColors,
          primary: '#212121',
          link: '#7b7ff7',
          background: '#121212',
          surface: '#1e1e1e',
        },
      },
    },
  },
  defaults: {
    VAppBar: {
      elevation: 4,
    },
  },
})
