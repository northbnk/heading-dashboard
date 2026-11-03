import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

const runningSoftLightTheme = {
  dark: false,
  colors: {
    background: '#E5E9F0',
    surface: '#F2F4F8',
    'surface-variant': '#E8ECF2',
    primary: '#3653B3',
    'primary-darken-1': '#2B4293',
    secondary: '#334155',
    'secondary-darken-1': '#1E293B',
    accent: '#3653B3',
    error: '#C93B3B',
    info: '#3653B3',
    success: '#1E7E5C',
    warning: '#B86E14',
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
      defaultTheme: 'runningSoftLightTheme',
      themes: {
        runningSoftLightTheme,
      },
    },
  })

  nuxtApp.vueApp.use(vuetify)
})
