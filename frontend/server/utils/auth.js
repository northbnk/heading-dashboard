import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

export const isSupabaseConfigured = () => {
  const config = useRuntimeConfig()
  const url = config.public.supabaseUrl
  const key = config.supabaseServiceKey
  return !!(
    url &&
    key &&
    !url.includes('YOUR_SUPABASE') &&
    !key.includes('YOUR_SUPABASE') &&
    url.startsWith('http')
  )
}

export const getSupabaseClient = () => {
  const config = useRuntimeConfig()
  if (!isSupabaseConfigured()) {
    return null
  }
  return createClient(config.public.supabaseUrl, config.supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  })
}

export const getLocalDataPath = (filename) => {
  let cwd = process.cwd()
  if (cwd.includes('.output')) {
    cwd = cwd.split('.output')[0]
  }
  return path.join(cwd, filename)
}

export const readLocalJson = (relPath, fallback = null) => {
  try {
    const fullPath = getLocalDataPath(relPath)
    if (fs.existsSync(fullPath)) {
      return JSON.parse(fs.readFileSync(fullPath, 'utf8'))
    }
  } catch (e) {
    console.warn(`Failed to read local file ${relPath}:`, e.message)
  }
  return fallback
}

export const writeLocalJson = (relPath, data) => {
  try {
    const fullPath = getLocalDataPath(relPath)
    const dir = path.dirname(fullPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(fullPath, JSON.stringify(data, null, 2), 'utf8')
    return true
  } catch (e) {
    console.warn(`Failed to write local file ${relPath}:`, e.message)
    return false
  }
}

/**
 * HTTPOnly Cookie からセッションを確認し、ログイン中の athlete_id を返す
 * Supabase未設定・停止時はローカルの strava_api_config.json にフォールバック
 */
export const verifyUser = async (event) => {
  const sessionCookie = getCookie(event, 'athlete_session')

  if (sessionCookie) {
    const parts = sessionCookie.split(':')
    if (parts.length === 2) {
      const [athleteIdStr, sessionToken] = parts
      const athleteId = Number(athleteIdStr)

      if (!isNaN(athleteId) && sessionToken) {
        const supabase = getSupabaseClient()
        if (supabase) {
          try {
            const { data, error } = await supabase
              .from('strava_tokens')
              .select('athlete_id, session_token')
              .eq('athlete_id', athleteId)
              .maybeSingle()

            if (!error && data && data.session_token === sessionToken) {
              return athleteId
            }
          } catch (e) {
            console.warn('Supabase verifyUser fallback:', e.message)
          }
        }

        const localConfig = readLocalJson('strava_api_config.json')
        if (localConfig?.athlete?.id && Number(localConfig.athlete.id) === athleteId) {
          return athleteId
        }
      }
    }
  }

  // ローカルフォールバックモード時
  if (!isSupabaseConfigured()) {
    const localConfig = readLocalJson('strava_api_config.json')
    if (localConfig?.athlete?.id) {
      return Number(localConfig.athlete.id)
    }
  }

  throw createError({
    statusCode: 401,
    statusMessage: 'Unauthorized. Session is missing or invalid.'
  })
}
