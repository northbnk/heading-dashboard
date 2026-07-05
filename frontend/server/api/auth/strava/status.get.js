import { getSupabaseClient } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const configSetup = !!(config.public.stravaClientId && config.stravaClientSecret)

  const sessionCookie = getCookie(event, 'athlete_session')
  if (!sessionCookie) {
    return { linked: false, athlete: null, configSetup }
  }

  const parts = sessionCookie.split(':')
  if (parts.length !== 2) {
    return { linked: false, athlete: null, configSetup }
  }

  const [athleteIdStr, sessionToken] = parts
  const athleteId = Number(athleteIdStr)

  if (isNaN(athleteId) || !sessionToken) {
    return { linked: false, athlete: null, configSetup }
  }

  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('strava_tokens')
    .select('athlete_id, athlete_firstname, athlete_lastname, session_token')
    .eq('athlete_id', athleteId)
    .maybeSingle()

  if (error || !data || data.session_token !== sessionToken) {
    return { linked: false, athlete: null, configSetup }
  }

  return {
    linked: true,
    configSetup,
    athlete: {
      firstname: data.athlete_firstname,
      lastname: data.athlete_lastname,
      id: data.athlete_id
    }
  }
})
