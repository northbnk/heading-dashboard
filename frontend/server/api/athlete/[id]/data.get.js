import { getSupabaseClient, readLocalJson } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  const athleteId = getRouterParam(event, 'id')

  if (!athleteId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Athlete ID is required.'
    })
  }

  const supabase = getSupabaseClient()

  if (supabase) {
    try {
      const { data: tokenData, error: tokenError } = await supabase
        .from('strava_tokens')
        .select('athlete_firstname, athlete_lastname')
        .eq('athlete_id', Number(athleteId))
        .maybeSingle()

      if (!tokenError && tokenData) {
        const [workoutsRes, racesRes, plansRes] = await Promise.all([
          supabase
            .from('workouts')
            .select('*')
            .eq('athlete_id', Number(athleteId))
            .order('workout_date', { ascending: false }),
          supabase
            .from('races')
            .select('*')
            .eq('athlete_id', Number(athleteId))
            .order('date', { ascending: true }),
          supabase
            .from('plans')
            .select('*')
            .eq('athlete_id', Number(athleteId))
        ])

        if (!workoutsRes.error && !racesRes.error && !plansRes.error) {
          const plansObj = {}
          if (plansRes.data) {
            plansRes.data.forEach(p => {
              plansObj[p.date] = {
                menuText: p.menu_text,
                targetDistance: Number(p.target_distance || 0),
                isQuality: !!p.is_quality,
                targetPace: p.target_pace
              }
            })
          }

          const mappedWorkouts = (workoutsRes.data || []).map(w => ({
            id: w.id,
            activityId: w.id,
            workoutDate: w.workout_date.replace('T', ' ').replace('Z', '').split('.')[0],
            activityName: w.activity_name,
            distance: Number(w.distance),
            durationSeconds: w.duration_seconds,
            movingTimeSeconds: w.moving_time_seconds,
            averagePaceSeconds: w.average_pace_seconds,
            cadence: w.cadence,
            averageHeartrate: w.average_heartrate,
            maxHeartrate: w.max_heartrate,
            elevationGain: w.elevation_gain,
            stravaLink: w.strava_link,
            averageStride: w.average_stride ? Number(w.average_stride) : null,
            gearName: w.gear_name,
            deviceName: w.device_name,
            description: w.description,
            splits: typeof w.splits === 'string' ? JSON.parse(w.splits) : w.splits,
            mapUrl: w.map_url,
            polyline: w.polyline
          }))

          const mappedRaces = (racesRes.data || []).map(r => ({
            id: r.id,
            name: r.name,
            date: r.date,
            category: r.category,
            targetTime: r.target_time
          }))

          const localRhr = readLocalJson('data/rhr.json', [])

          return {
            athlete: {
              firstname: tokenData.athlete_firstname,
              lastname: tokenData.athlete_lastname,
              athleteId: Number(athleteId)
            },
            workouts: mappedWorkouts,
            races: mappedRaces,
            plans: plansObj,
            rhrLogs: localRhr
          }
        }
      }
    } catch (e) {
      console.warn('Supabase query failed in athlete/[id]/data, using local fallback:', e.message)
    }
  }

  // ローカルJSONフォールバック (Supabase未設定・停止時、または初期状態)
  const localConfig = readLocalJson('strava_api_config.json', {})
  const localWorkouts = readLocalJson('data/workouts.json', [])
  const localRaces = readLocalJson('data/races.json', [])
  const localPlans = readLocalJson('data/plans.json', {})
  const localRhr = readLocalJson('data/rhr.json', [])

  const athlete = localConfig.athlete || {}

  return {
    athlete: {
      firstname: athlete.firstname || 'Fujino',
      lastname: athlete.lastname || 'Takahiro',
      athleteId: Number(athleteId)
    },
    workouts: localWorkouts,
    races: localRaces,
    plans: localPlans,
    rhrLogs: localRhr
  }
})
