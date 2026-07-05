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
    db: {
      schema: 'training'
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  })
}

/**
 * HTTPOnly Cookie からセッションを確認し、ログイン中の athlete_id を返す
 */
export const verifyUser = async (event) => {
  const sessionCookie = getCookie(event, 'athlete_session')

  if (!sessionCookie) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized. Session cookie is missing.'
    })
  }

  const parts = sessionCookie.split(':')
  if (parts.length !== 2) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized. Invalid session format.'
    })
  }

  const [athleteIdStr, sessionToken] = parts
  const athleteId = Number(athleteIdStr)

  if (isNaN(athleteId) || !sessionToken) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized. Invalid session parameters.'
    })
  }

  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('strava_tokens')
    .select('athlete_id, session_token')
    .eq('athlete_id', athleteId)
    .maybeSingle()

  if (error || !data || data.session_token !== sessionToken) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized. Session token is invalid or expired.'
    })
  }

  return athleteId
}
