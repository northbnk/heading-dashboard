import { getSupabaseClient } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const code = query.code
  const userId = query.state // user_id passed via state parameter

  if (!code) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Authorization code is missing.'
    })
  }

  if (!userId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'State parameter (user ID) is missing.'
    })
  }

  const config = useRuntimeConfig()
  const supabase = getSupabaseClient()

  try {
    console.log(`Exchanging authorization code for token for user ${userId}...`)
    const tokenResponse = await $fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      body: {
        client_id: config.public.stravaClientId,
        client_secret: config.stravaClientSecret,
        code: code,
        grant_type: 'authorization_code'
      }
    })

    const athlete = tokenResponse.athlete || {}

    // Store tokens and athlete info in Supabase strava_tokens table
    const { error: upsertError } = await supabase
      .from('strava_tokens')
      .upsert({
        user_id: userId,
        access_token: tokenResponse.access_token,
        refresh_token: tokenResponse.refresh_token,
        expires_at: tokenResponse.expires_at,
        athlete_id: athlete.id,
        athlete_firstname: athlete.firstname || '',
        athlete_lastname: athlete.lastname || '',
        updated_at: new Date().toISOString()
      })

    if (upsertError) {
      console.error('Failed to save tokens to Supabase:', upsertError)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to save Strava credentials to database: ' + upsertError.message
      })
    }

    console.log(`Successfully linked Strava account for user ${userId}. Athlete ID: ${athlete.id}`)

    // Redirect user back to their dynamic sharing athlete URL page!
    return sendRedirect(event, `/athlete/${athlete.id}`)
  } catch (err) {
    console.error('Failed to exchange Strava token:', err)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to retrieve Strava access tokens: ' + (err.data?.message || err.message)
    })
  }
})
