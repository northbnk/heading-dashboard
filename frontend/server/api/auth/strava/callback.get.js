import fs from 'fs'
import path from 'path'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const code = query.code

  if (!code) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Authorization code is missing from callback query parameters.'
    })
  }

  const configPath = path.join(process.cwd(), 'strava_api_config.json')
  
  if (!fs.existsSync(configPath)) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Strava API configuration file (strava_api_config.json) is missing.'
    })
  }

  let config = {}
  try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
  } catch (err) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to parse strava_api_config.json: ' + err.message
    })
  }

  const clientId = config.client_id
  const clientSecret = config.client_secret

  if (!clientId || clientId === 'YOUR_STRAVA_CLIENT_ID' || !clientSecret || clientSecret === 'YOUR_STRAVA_CLIENT_SECRET') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Strava Client ID or Client Secret is not configured in strava_api_config.json.'
    })
  }

  try {
    // Exchange authorization code for tokens
    const tokenResponse = await $fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      body: {
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        grant_type: 'authorization_code'
      }
    })

    // Update config with tokens and athlete profile
    config.access_token = tokenResponse.access_token
    config.refresh_token = tokenResponse.refresh_token
    config.expires_at = tokenResponse.expires_at
    config.athlete = tokenResponse.athlete

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8')

    // Redirect user back to dashboard home
    return sendRedirect(event, '/')
  } catch (err) {
    console.error('Failed to exchange token with Strava API:', err)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to exchange authorization code: ' + (err.data?.message || err.message)
    })
  }
})
