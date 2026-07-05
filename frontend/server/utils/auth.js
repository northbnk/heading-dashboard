import { createClient } from '@supabase/supabase-js'

export const getSupabaseClient = () => {
  const config = useRuntimeConfig()
  if (!config.public.supabaseUrl || !config.supabaseServiceKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Supabase URL or Service Key is not configured in backend.'
    })
  }
  return createClient(config.public.supabaseUrl, config.supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  })
}

export const verifyUser = async (event) => {
  const authHeader = getHeader(event, 'authorization')
  const token = authHeader?.replace('Bearer ', '')

  if (!token) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized. Supabase token is missing.'
    })
  }

  const config = useRuntimeConfig()
  // Verify token via public anon client
  const client = createClient(config.public.supabaseUrl, config.public.supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  })
  
  const { data: { user }, error } = await client.auth.getUser(token)
  if (error || !user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid session token: ' + (error?.message || 'User not found')
    })
  }

  return user
}
