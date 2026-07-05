import { getSupabaseClient } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  const athleteId = getRouterParam(event, 'id')

  if (!athleteId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Athlete ID is required.'
    })
  }

  const supabase = getSupabaseClient()

  // 1. Find user associated with this athlete_id
  const { data: tokenData, error: tokenError } = await supabase
    .from('strava_tokens')
    .select('user_id, athlete_firstname, athlete_lastname')
    .eq('athlete_id', Number(athleteId))
    .maybeSingle()

  if (tokenError || !tokenData) {
    throw createError({
      statusCode: 404,
      statusMessage: `Athlete with ID ${athleteId} is not linked or not found.`
    })
  }

  const userId = tokenData.user_id

  // 2. Fetch all user data in parallel
  const [workoutsRes, racesRes, plansRes] = await Promise.all([
    supabase
      .from('workouts')
      .select('*')
      .eq('user_id', userId)
      .order('workout_date', { ascending: false }),
    supabase
      .from('races')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: true }),
    supabase
      .from('plans')
      .select('*')
      .eq('user_id', userId)
  ])

  if (workoutsRes.error || racesRes.error || plansRes.error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to retrieve athlete data from database.'
    })
  }

  // 3. Convert plans list back to key-value object (indexed by date)
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

  // 4. Map DB workouts back to format expected by UI
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

  // 5. Map DB races back to format expected by UI
  const mappedRaces = (racesRes.data || []).map(r => ({
    id: r.id,
    name: r.name,
    date: r.date,
    category: r.category,
    targetTime: r.target_time
  }))

  return {
    athlete: {
      firstname: tokenData.athlete_firstname,
      lastname: tokenData.athlete_lastname,
      athleteId: Number(athleteId)
    },
    workouts: mappedWorkouts,
    races: mappedRaces,
    plans: plansObj
  }
})
