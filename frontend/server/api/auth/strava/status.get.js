import { getSupabaseClient, isSupabaseConfigured, readLocalJson } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const configSetup = !!(config.public.stravaClientId && config.stravaClientSecret)

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
              .select('athlete_id, athlete_firstname, athlete_lastname, session_token')
              .eq('athlete_id', athleteId)
              .maybeSingle()

            if (!error && data && data.session_token === sessionToken) {
              return {
                linked: true,
                configSetup,
                athlete: {
                  firstname: data.athlete_firstname,
                  lastname: data.athlete_lastname,
                  id: data.athlete_id
                }
              }
            }
          } catch (e) {
            console.warn('Supabase status check fallback:', e.message)
          }
        }
      }
    }
  }

  // ローカルフォールバック: strava_api_config.json が存在する場合はローカルオーナーとして扱う
  if (!isSupabaseConfigured()) {
    const localConfig = readLocalJson('strava_api_config.json')
    if (localConfig?.athlete?.id) {
      return {
        linked: true,
        configSetup: true,
        athlete: {
          firstname: localConfig.athlete.firstname || 'Fujino',
          lastname: localConfig.athlete.lastname || 'Takahiro',
          id: Number(localConfig.athlete.id)
        }
      }
    }
  }

  return { linked: false, athlete: null, configSetup }
})
