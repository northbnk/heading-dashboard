import { verifyUser, getSupabaseClient } from '../utils/auth'

export default defineEventHandler(async (event) => {
  try {
    const athleteId = await verifyUser(event)
    const supabase = getSupabaseClient()

    const { data, error } = await supabase
      .from('workouts')
      .select('*')
      .eq('athlete_id', athleteId)
      .order('workout_date', { ascending: false })

    if (error) {
      console.error('Failed to query workouts from Supabase:', error)
      return []
    }

    return (data || []).map(w => ({
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
  } catch (err) {
    console.error('Error verifying user in workouts.get:', err.message)
    return []
  }
})
