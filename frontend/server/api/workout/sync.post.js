import { verifyUser, getSupabaseClient } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = await verifyUser(event)
  const supabase = getSupabaseClient()

  // 1. Get user Strava credentials
  const { data: config, error: configError } = await supabase
    .from('strava_tokens')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (configError || !config) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Strava is not linked to your account yet.'
    })
  }

  // 2. Refresh tokens if expired
  const accessToken = await getValidToken(config, supabase)

  // 3. Load existing cached workouts from Supabase
  const { data: existingWorkouts, error: workoutsError } = await supabase
    .from('workouts')
    .select('id, splits, gear_name')
    .eq('user_id', user.id)

  if (workoutsError) {
    console.warn('Failed to load existing cache from Supabase:', workoutsError.message)
  }

  const workoutsMap = new Map()
  if (existingWorkouts) {
    existingWorkouts.forEach(w => {
      workoutsMap.set(Number(w.id), w)
    })
  }

  let newlySyncedCount = 0

  try {
    // 4. Fetch latest activities from Strava API
    console.log(`Syncing workouts for user ${user.id} from Strava...`)
    const activities = await $fetch('https://www.strava.com/api/v3/athlete/activities', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      },
      query: {
        per_page: 100
      }
    })

    const runningActivities = activities.filter(act => 
      ['Run', 'TrailRun', 'VirtualRun'].includes(act.type)
    )

    console.log(`Found ${runningActivities.length} running activities. Syncing details...`)

    // 5. Query detailed info only for new workouts
    for (const activity of runningActivities) {
      const activityId = Number(activity.id)
      const existing = workoutsMap.get(activityId)

      // Skip detailed fetching if already cached
      if (existing && existing.splits && existing.splits.length > 0 && existing.gear_name !== undefined) {
        continue
      }

      console.log(`Fetching details for activity ${activityId}...`)
      await new Promise(r => setTimeout(r, 200)) // Rate limit throttle

      try {
        const detailed = await $fetch(`https://www.strava.com/api/v3/activities/${activityId}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        })

        const distanceKm = Number((detailed.distance / 1000).toFixed(2))
        const durationSeconds = detailed.moving_time || detailed.elapsed_time || 0
        const movingTimeSeconds = detailed.moving_time || durationSeconds
        const cadence = detailed.average_cadence ? Math.round(detailed.average_cadence * 2) : null
        
        let averagePaceSeconds = 0
        if (distanceKm > 0) {
          averagePaceSeconds = Math.round(movingTimeSeconds / distanceKm)
        }

        let averageStride = null
        if (cadence && cadence > 0 && distanceKm > 0 && movingTimeSeconds > 0) {
          const totalSteps = cadence * (movingTimeSeconds / 60)
          if (totalSteps > 0) {
            averageStride = Number(((distanceKm * 1000) / totalSteps).toFixed(2))
          }
        }

        const splits = (detailed.splits_metric || []).map((s, idx) => ({
          split: s.split || (idx + 1),
          elapsedTime: s.elapsed_time || s.moving_time,
          movingTime: s.moving_time,
          elevationDifference: s.elevation_difference || 0,
          averageHeartrate: s.average_heartrate ? Math.round(s.average_heartrate) : null
        }))

        const summaryPolyline = detailed.map?.summary_polyline || detailed.map?.polyline || ''
        const mapUrl = summaryPolyline ? `polyline:${summaryPolyline}` : null

        // Upsert detailed activity to database
        const { error: upsertError } = await supabase
          .from('workouts')
          .upsert({
            id: activityId,
            user_id: user.id,
            workout_date: detailed.start_date_local,
            activity_name: detailed.name || 'ランニング',
            distance: distanceKm,
            duration_seconds: durationSeconds,
            moving_time_seconds: movingTimeSeconds,
            average_pace_seconds: averagePaceSeconds,
            cadence,
            average_heartrate: detailed.average_heartrate ? Math.round(detailed.average_heartrate) : null,
            max_heartrate: detailed.max_heartrate ? Math.round(detailed.max_heartrate) : null,
            elevation_gain: detailed.total_elevation_gain ? Math.round(detailed.total_elevation_gain) : null,
            strava_link: `https://www.strava.com/activities/${activityId}`,
            average_stride: averageStride,
            gear_name: detailed.gear?.name || null,
            device_name: detailed.device_name || null,
            description: detailed.description || null,
            splits: splits,
            map_url: mapUrl,
            polyline: summaryPolyline,
            created_at: new Date().toISOString()
          })

        if (upsertError) {
          console.error(`Failed to save activity ${activityId}:`, upsertError.message)
        } else {
          newlySyncedCount++
        }
      } catch (err) {
        console.error(`Failed to fetch details for activity ${activityId}, saving summary fallback:`, err.message)
        
        const distanceKm = Number((activity.distance / 1000).toFixed(2))
        const durationSeconds = activity.moving_time || activity.elapsed_time || 0
        const movingTimeSeconds = activity.moving_time || durationSeconds
        const cadence = activity.average_cadence ? Math.round(activity.average_cadence * 2) : null
        
        let averagePaceSeconds = 0
        if (distanceKm > 0) {
          averagePaceSeconds = Math.round(movingTimeSeconds / distanceKm)
        }

        const summaryPolyline = activity.map?.summary_polyline || ''
        const mapUrl = summaryPolyline ? `polyline:${summaryPolyline}` : null

        // Upsert summary activity to database
        await supabase
          .from('workouts')
          .upsert({
            id: activityId,
            user_id: user.id,
            workout_date: activity.start_date_local,
            activity_name: activity.name || 'ランニング',
            distance: distanceKm,
            duration_seconds: durationSeconds,
            moving_time_seconds: movingTimeSeconds,
            average_pace_seconds: averagePaceSeconds,
            cadence,
            average_heartrate: activity.average_heartrate ? Math.round(activity.average_heartrate) : null,
            max_heartrate: activity.max_heartrate ? Math.round(activity.max_heartrate) : null,
            elevation_gain: activity.total_elevation_gain ? Math.round(activity.total_elevation_gain) : null,
            strava_link: `https://www.strava.com/activities/${activityId}`,
            average_stride: null,
            gear_name: null,
            device_name: null,
            description: null,
            splits: [],
            map_url: mapUrl,
            polyline: summaryPolyline,
            created_at: new Date().toISOString()
          })
      }
    }

    return {
      success: true,
      newlySynced: newlySyncedCount
    }

  } catch (err) {
    console.error('Strava activities sync failed:', err)
    throw createError({
      statusCode: 500,
      statusMessage: 'Sync failed: ' + (err.data?.message || err.message)
    })
  }
})

async function getValidToken(config, supabase) {
  const nowSec = Math.floor(Date.now() / 1000)
  if (nowSec < config.expires_at - 60) {
    return config.access_token
  }

  console.log('Refreshing expired Strava access token for user:', config.user_id)
  const runtimeConfig = useRuntimeConfig()
  try {
    const refreshResponse = await $fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      body: {
        client_id: runtimeConfig.public.stravaClientId,
        client_secret: runtimeConfig.stravaClientSecret,
        grant_type: 'refresh_token',
        refresh_token: config.refresh_token
      }
    })

    const { error: updateError } = await supabase
      .from('strava_tokens')
      .update({
        access_token: refreshResponse.access_token,
        refresh_token: refreshResponse.refresh_token,
        expires_at: refreshResponse.expires_at,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', config.user_id)

    if (updateError) {
      throw new Error('Failed to update refreshed tokens in Supabase: ' + updateError.message)
    }

    return refreshResponse.access_token
  } catch (err) {
    console.error('Failed to refresh Strava token:', err)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to refresh Strava authentication token: ' + (err.data?.message || err.message)
    })
  }
}
