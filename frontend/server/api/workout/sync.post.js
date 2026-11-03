import { verifyUser, getSupabaseClient, readLocalJson, writeLocalJson } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const athleteId = await verifyUser(event)
  const supabase = getSupabaseClient()

  let config = null
  const workoutsMap = new Map()
  let localWorkoutsList = []

  if (supabase) {
    const { data: dbConfig, error: configError } = await supabase
      .from('strava_tokens')
      .select('*')
      .eq('athlete_id', athleteId)
      .maybeSingle()

    if (!configError && dbConfig) {
      config = dbConfig
      const { data: existingWorkouts } = await supabase
        .from('workouts')
        .select('id, splits, gear_name')
        .eq('athlete_id', athleteId)

      if (existingWorkouts) {
        existingWorkouts.forEach(w => {
          workoutsMap.set(Number(w.id), w)
        })
      }
    }
  }

  // ローカルフォールバック
  if (!config) {
    const localCfg = readLocalJson('strava_api_config.json')
    if (!localCfg || !localCfg.refresh_token) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Strava is not linked to your account yet.'
      })
    }
    config = {
      athlete_id: athleteId,
      access_token: localCfg.access_token,
      refresh_token: localCfg.refresh_token,
      expires_at: localCfg.expires_at,
      _isLocal: true,
      _raw: localCfg
    }
    localWorkoutsList = readLocalJson('data/workouts.json', [])
    localWorkoutsList.forEach(w => {
      workoutsMap.set(Number(w.activityId || w.id), {
        id: Number(w.activityId || w.id),
        splits: w.splits,
        gear_name: w.gearName
      })
    })
  }

  const accessToken = await getValidToken(config, supabase)
  let newlySyncedCount = 0

  try {
    console.log(`Syncing workouts for athlete ${athleteId} from Strava...`)
    const activities = await $fetch('https://www.strava.com/api/v3/athlete/activities', {
      headers: { Authorization: `Bearer ${accessToken}` },
      query: { per_page: 100 }
    })

    const runningActivities = activities.filter(act =>
      ['Run', 'TrailRun', 'VirtualRun'].includes(act.type)
    )

    for (const activity of runningActivities) {
      const activityId = Number(activity.id)
      const existing = workoutsMap.get(activityId)

      if (existing && existing.splits && existing.splits.length > 0 && existing.gear_name !== undefined) {
        continue
      }

      await new Promise(r => setTimeout(r, 200))

      try {
        const detailed = await $fetch(`https://www.strava.com/api/v3/activities/${activityId}`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        })

        const distanceKm = Number((detailed.distance / 1000).toFixed(2))
        const durationSeconds = detailed.moving_time || detailed.elapsed_time || 0
        const movingTimeSeconds = detailed.moving_time || durationSeconds
        const cadence = detailed.average_cadence ? Math.round(detailed.average_cadence * 2) : null
        const averagePaceSeconds = distanceKm > 0 ? Math.round(movingTimeSeconds / distanceKm) : 0

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

        if (supabase && !config._isLocal) {
          const { error: upsertError } = await supabase
            .from('workouts')
            .upsert({
              id: activityId,
              athlete_id: athleteId,
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
              splits,
              map_url: mapUrl,
              polyline: summaryPolyline,
              created_at: new Date().toISOString()
            })

          if (!upsertError) newlySyncedCount++
        } else {
          const localItem = {
            id: activityId,
            activityId,
            workoutDate: detailed.start_date_local.replace('T', ' ').replace('Z', '').split('.')[0],
            activityName: detailed.name || 'ランニング',
            distance: distanceKm,
            durationSeconds,
            movingTimeSeconds,
            averagePaceSeconds,
            cadence,
            averageHeartrate: detailed.average_heartrate ? Math.round(detailed.average_heartrate) : null,
            maxHeartrate: detailed.max_heartrate ? Math.round(detailed.max_heartrate) : null,
            elevationGain: detailed.total_elevation_gain ? Math.round(detailed.total_elevation_gain) : null,
            stravaLink: `https://www.strava.com/activities/${activityId}`,
            averageStride,
            gearName: detailed.gear?.name || null,
            deviceName: detailed.device_name || null,
            description: detailed.description || null,
            splits,
            mapUrl,
            polyline: summaryPolyline
          }
          const idx = localWorkoutsList.findIndex(w => Number(w.activityId || w.id) === activityId)
          if (idx !== -1) localWorkoutsList[idx] = localItem
          else localWorkoutsList.unshift(localItem)
          newlySyncedCount++
        }
      } catch (err) {
        console.error(`Failed to fetch details for activity ${activityId}:`, err.message)
      }
    }

    if (config._isLocal && newlySyncedCount > 0) {
      writeLocalJson('data/workouts.json', localWorkoutsList)
    }

    return { success: true, newlySynced: newlySyncedCount }
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

  const runtimeConfig = useRuntimeConfig()
  const refreshResponse = await $fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    body: {
      client_id: runtimeConfig.public.stravaClientId,
      client_secret: runtimeConfig.stravaClientSecret,
      grant_type: 'refresh_token',
      refresh_token: config.refresh_token
    }
  })

  if (supabase && !config._isLocal) {
    await supabase
      .from('strava_tokens')
      .update({
        access_token: refreshResponse.access_token,
        refresh_token: refreshResponse.refresh_token,
        expires_at: refreshResponse.expires_at,
        updated_at: new Date().toISOString()
      })
      .eq('athlete_id', config.athlete_id)
  } else if (config._isLocal && config._raw) {
    config._raw.access_token = refreshResponse.access_token
    config._raw.refresh_token = refreshResponse.refresh_token
    config._raw.expires_at = refreshResponse.expires_at
    writeLocalJson('strava_api_config.json', config._raw)
  }

  return refreshResponse.access_token
}
