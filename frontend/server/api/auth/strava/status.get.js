import fs from 'fs'
import path from 'path'

export default defineEventHandler(async (event) => {
  const configPath = path.join(process.cwd(), 'strava_api_config.json')

  if (!fs.existsSync(configPath)) {
    return { linked: false, athlete: null, configSetup: false }
  }

  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
    const configSetup = config.client_id && config.client_id !== 'YOUR_STRAVA_CLIENT_ID' &&
                        config.client_secret && config.client_secret !== 'YOUR_STRAVA_CLIENT_SECRET'
    
    const linked = !!(config.access_token && config.refresh_token)

    return {
      linked,
      configSetup,
      athlete: config.athlete || null
    }
  } catch (err) {
    return { linked: false, athlete: null, configSetup: false, error: err.message }
  }
})
