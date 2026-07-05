import { verifyUser, getSupabaseClient } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  try {
    const user = await verifyUser(event)
    const config = useRuntimeConfig()
    
    const configSetup = !!(config.public.stravaClientId && config.stravaClientSecret)

    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('strava_tokens')
      .select('athlete_id, athlete_firstname, athlete_lastname')
      .eq('user_id', user.id)
      .maybeSingle()

    if (error || !data) {
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
  } catch (err) {
    return { linked: false, athlete: null, configSetup: false, error: err.message }
  }
})
