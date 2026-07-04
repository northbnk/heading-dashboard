import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

const runningDarkTheme = {
  dark: true,
  colors: {
    background: '#0F111A',
    surface: '#171A26',
    'surface-variant': '#202438',
    primary: '#6366F1',
    'primary-darken-1': '#4F46E5',
    secondary: '#10B981',
    'secondary-darken-1': '#059669',
    accent: '#8B5CF6',
    error: '#EF4444',
    info: '#3B82F6',
    success: '#10B981',
    warning: '#F59E0B',
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
      defaultTheme: 'runningDarkTheme',
      themes: {
        runningDarkTheme,
      },
    },
  })

  nuxtApp.vueApp.use(vuetify)
})
