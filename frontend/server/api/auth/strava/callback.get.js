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
  const query = getQuery(event)
  const code = query.code

  if (!code) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Authorization code is missing.'
    })
  }

  const root = getProjectRoot()
  const configPath = path.join(root, 'strava_api_config.json')

  if (!fs.existsSync(configPath)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Config file not found.'
    })
  }

  let config = {}
  try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
  } catch (err) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to read config file.'
    })
  }

  try {
    // Exchange authorization code for token
    console.log(`Exchanging authorization code for token...`)
    const tokenResponse = await $fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      body: {
        client_id: config.client_id,
        client_secret: config.client_secret,
        code: code,
        grant_type: 'authorization_code'
      }
    })

    // Store tokens and athlete info
    config.access_token = tokenResponse.access_token
    config.refresh_token = tokenResponse.refresh_token
    config.expires_at = tokenResponse.expires_at
    config.athlete = tokenResponse.athlete || null

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8')

    // Redirect user back to dashboard home page
    return sendRedirect(event, '/')
  } catch (err) {
    console.error('Failed to exchange Strava token:', err)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to retrieve Strava access tokens: ' + (err.data?.message || err.message)
    })
  }
})
