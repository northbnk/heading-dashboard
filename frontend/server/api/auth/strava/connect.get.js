import fs from 'fs'
import path from 'path'

function getProjectRoot() {
  let cwd = process.cwd()
  if (cwd.includes('.output')) {
    return cwd.split('.output')[0]
  }
  return cwd
}

export default defineEventHandler(async (event) => {
  checkAdmin(event)
  const root = getProjectRoot()
  const configPath = path.join(root, 'strava_api_config.json')

  if (!fs.existsSync(configPath)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Config file not found. Please create strava_api_config.json.'
    })
  }

  let config = {}
  try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
  } catch (err) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to read config file: ' + err.message
    })
  }

  const clientId = config.client_id
  if (!clientId || clientId === 'YOUR_STRAVA_CLIENT_ID') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Strava client_id is not configured in strava_api_config.json.'
    })
  }

  // Construct dynamic redirect URL (works on localhost or production)
  const host = event.node.req.headers.host || 'localhost:3000'
  const protocol = host.includes('localhost') ? 'http' : 'https'
  const redirectUri = `${protocol}://${host}/api/auth/strava/callback`

  console.log(`OAuth Initiated. Host: ${host}, Protocol: ${protocol}, Redirect URI: ${redirectUri}`)

  // Redirect user to Strava OAuth consent screen
  const scope = 'activity:read_all'
  const authUrl = `https://www.strava.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}`

  return sendRedirect(event, authUrl)
})
