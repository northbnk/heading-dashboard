import { getSupabaseClient } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const code = query.code
  const state = query.state

  const oauthState = getCookie(event, 'oauth_state')
  deleteCookie(event, 'oauth_state')

  if (!code) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Authorization code is missing.'
    })
  }

  if (!state || state !== oauthState) {
    throw createError({
      statusCode: 403,
      statusMessage: 'CSRF validation failed. Invalid state parameter.'
    })
  }

  const config = useRuntimeConfig()
  const supabase = getSupabaseClient()

  try {
    console.log(`Exchanging authorization code for token...`)
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
    const athleteId = Number(athlete.id)

    if (!athleteId) {
      throw new Error('Failed to retrieve athlete ID from Strava response.')
    }

    // Generate a secure session token
    const sessionToken = crypto.randomUUID()

    // Store tokens and athlete info in Supabase strava_tokens table
    const { error: upsertError } = await supabase
      .from('strava_tokens')
      .upsert({
        athlete_id: athleteId,
        access_token: tokenResponse.access_token,
        refresh_token: tokenResponse.refresh_token,
        expires_at: tokenResponse.expires_at,
        athlete_firstname: athlete.firstname || '',
        athlete_lastname: athlete.lastname || '',
        session_token: sessionToken,
        updated_at: new Date().toISOString()
      })

    if (upsertError) {
      console.error('Failed to save tokens to Supabase:', upsertError)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to save Strava credentials to database: ' + upsertError.message
      })
    }

    console.log(`Successfully linked Strava account. Athlete ID: ${athleteId}`)

    // Set secure HTTPOnly session cookie (holds athleteId:sessionToken)
    const host = event.node.req.headers.host || 'localhost:3000'
    setCookie(event, 'athlete_session', `${athleteId}:${sessionToken}`, {
      httpOnly: true,
      secure: !host.includes('localhost'),
      sameSite: 'lax',
      maxAge: 30 * 24 * 3600 // 30 days
    })

    // Redirect user back to their dashboard!
    return sendRedirect(event, `/athlete/${athleteId}`)
  } catch (err) {
    console.error('Failed to exchange Strava token:', err)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to retrieve Strava access tokens: ' + (err.data?.message || err.message)
    })
  }
})
