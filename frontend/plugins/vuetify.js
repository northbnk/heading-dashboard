import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

const runningLightTheme = {
  dark: false,
  colors: {
    background: '#F4F6F9',
    surface: '#FFFFFF',
    'surface-variant': '#F1F5F9',
    primary: '#2563EB',
    'primary-darken-1': '#1D4ED8',
    secondary: '#0F172A',
    'secondary-darken-1': '#1E293B',
    accent: '#2563EB',
    error: '#DC2626',
    info: '#2563EB',
    success: '#059669',
    warning: '#D97706',
  },
}

export default defineNuxtPlugin((nuxtApp) => {
  const vuetify = createVuetify({
    ssr: true,
    components,
    directives,
    icons: {
      defaultSet: 'mdi',
      aliases,
      sets: {
        mdi,
      },
    },
    theme: {
      defaultTheme: 'runningLightTheme',
      themes: {
        runningLightTheme,
      },
    },
  })

  nuxtApp.vueApp.use(vuetify)
})
