import fs from 'fs'
import path from 'path'

export default defineEventHandler(async (event) => {
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
  if (!clientId || clientId === 'YOUR_STRAVA_CLIENT_ID') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Strava Client ID is not configured. Please set your client_id in strava_api_config.json first.'
    })
  }

  // Construct dynamic redirect URI based on the incoming request host
  const host = event.node.req.headers.host || 'localhost:3000'
  const protocol = host.includes('localhost') ? 'http' : 'https'
  const redirectUri = `${protocol}://${host}/api/auth/strava/callback`

  const authUrl = `https://www.strava.com/oauth/authorize` +
    `?client_id=${clientId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=code` +
    `&scope=activity:read_all`

  return sendRedirect(event, authUrl)
})
