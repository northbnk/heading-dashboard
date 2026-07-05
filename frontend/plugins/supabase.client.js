import { createClient } from '@supabase/supabase-js'

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()
  
  const supabaseUrl = config.public.supabaseUrl
  const supabaseAnonKey = config.public.supabaseAnonKey

  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('YOUR_SUPABASE_PROJECT_URL')) {
    console.warn('Supabase is not configured yet. Set credentials in .env file.')
    return {
      provide: {
        supabase: null
      }
    }
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    db: {
      schema: 'training'
    }
  })

  return {
    provide: {
      supabase
    }
  }
})
