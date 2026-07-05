import fs from 'fs'
import path from 'path'

function getProjectRoot() {
  let cwd = process.cwd()
  if (cwd.includes('.output')) {
    return cwd.split('.output')[0]
  }
  return cwd
}

export default defineEventHandler(async (event) => {
  checkAdmin(event)
  const root = getProjectRoot()
  const configPath = path.join(root, 'strava_api_config.json')
  const dataFilePath = path.join(root, 'data/workouts.json')

  if (!fs.existsSync(configPath)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Strava is not configured. Please set your credentials in strava_api_config.json.'
    })
  }

  let config = {}
  try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
  } catch (err) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to parse config file: ' + err.message
    })
  }

  if (!config.access_token || !config.refresh_token) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Strava is not linked yet. Please click connect first.'
    })
  }

  // Get a valid access token (refreshing it if expired)
  const accessToken = await getValidToken(config, configPath)

  // Load existing cached workouts
  let workoutsMap = new Map()
  if (fs.existsSync(dataFilePath)) {
    try {
      const existingData = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'))
      existingData.forEach(w => {
        workoutsMap.set(Number(w.id), w)
      })
    } catch (err) {
      console.warn('Failed to parse existing workouts cache, starting fresh:', err.message)
    }
  }

  let newlySyncedCount = 0
  try {
    // 1. Fetch latest activities summary list from Strava API
    console.log('Fetching workouts list from Strava API...')
    const activities = await $fetch('https://www.strava.com/api/v3/athlete/activities', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      },
      query: {
        per_page: 100 // Fetch latest 100 activities
      }
    })

    // Filter to only running/workout activities (e.g., Run, TrailRun, VirtualRun)
    const runningActivities = activities.filter(act => 
      ['Run', 'TrailRun', 'VirtualRun'].includes(act.type)
    )

    console.log(`Found ${runningActivities.length} running activities. Syncing details...`)

    // 2. Fetch detailed information for new workouts to avoid rate limits
    for (const activity of runningActivities) {
      const activityId = Number(activity.id)
      const existing = workoutsMap.get(activityId)

      // If already cached and contains splits/details, skip detailed fetching
      if (existing && existing.splits && existing.splits.length > 0 && existing.gearName !== undefined) {
        continue
      }

      console.log(`Fetching detailed activity data for ID ${activityId}...`)
      // Add a slight delay to be nice to Strava's rate limit
      await new Promise(r => setTimeout(r, 200))

      try {
        const detailed = await $fetch(`https://www.strava.com/api/v3/activities/${activityId}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        })

        const distanceKm = Number((detailed.distance / 1000).toFixed(2))
        const durationSeconds = detailed.elapsed_time || 0
        const movingTimeSeconds = detailed.moving_time || durationSeconds
        const cadence = detailed.average_cadence ? Math.round(detailed.average_cadence * 2) : null
        
        let averagePaceSeconds = 0
        if (distanceKm > 0) {
          averagePaceSeconds = Math.round(movingTimeSeconds / distanceKm)
        }

        // Calculate stride length if cadence is available
        let averageStride = null
        if (cadence && cadence > 0 && distanceKm > 0 && movingTimeSeconds > 0) {
          const durationMinutes = movingTimeSeconds / 60
          const totalSteps = cadence * durationMinutes
          if (totalSteps > 0) {
            averageStride = Number(((distanceKm * 1000) / totalSteps).toFixed(2))
          }
        }

        // Map splits
        const splits = (detailed.splits_metric || []).map((s, idx) => ({
          split: s.split || (idx + 1),
          elapsedTime: s.elapsed_time || s.moving_time,
          movingTime: s.moving_time,
          elevationDifference: s.elevation_difference || 0,
          averageHeartrate: s.average_heartrate ? Math.round(s.average_heartrate) : null
        }))

        // Map polyline as mapUrl with polyline prefix
        const summaryPolyline = detailed.map?.summary_polyline || detailed.map?.polyline || ''
        const mapUrl = summaryPolyline ? `polyline:${summaryPolyline}` : null

        const workout = {
          id: activityId,
          activityId: activityId,
          workoutDate: convertDate(detailed.start_date_local),
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

        workoutsMap.set(activityId, workout)
        newlySyncedCount++
      } catch (err) {
        console.error(`Failed to fetch details for activity ${activityId}:`, err)
        // If detailed fetch fails, fall back to summary data
        const distanceKm = Number((activity.distance / 1000).toFixed(2))
        const durationSeconds = activity.elapsed_time || 0
        const movingTimeSeconds = activity.moving_time || durationSeconds
        const cadence = activity.average_cadence ? Math.round(activity.average_cadence * 2) : null
        
        let averagePaceSeconds = 0
        if (distanceKm > 0) {
          averagePaceSeconds = Math.round(movingTimeSeconds / distanceKm)
        }

        const summaryPolyline = activity.map?.summary_polyline || ''
        const mapUrl = summaryPolyline ? `polyline:${summaryPolyline}` : null

        workoutsMap.set(activityId, {
          id: activityId,
          activityId: activityId,
          workoutDate: convertDate(activity.start_date_local),
          activityName: activity.name || 'ランニング',
          distance: distanceKm,
          durationSeconds,
          movingTimeSeconds,
          averagePaceSeconds,
          cadence,
          averageHeartrate: activity.average_heartrate ? Math.round(activity.average_heartrate) : null,
          maxHeartrate: activity.max_heartrate ? Math.round(activity.max_heartrate) : null,
          elevationGain: activity.total_elevation_gain ? Math.round(activity.total_elevation_gain) : null,
          stravaLink: `https://www.strava.com/activities/${activityId}`,
          averageStride: null,
          gearName: null,
          deviceName: null,
          description: null,
          splits: [],
          mapUrl,
          polyline: summaryPolyline
        })
      }
    }

    // Convert map back to list, sort by date desc
    const sortedWorkouts = Array.from(workoutsMap.values()).sort((a, b) => {
      return new Date(b.workoutDate).getTime() - new Date(a.workoutDate).getTime()
    })

    // Write to workouts.json database
    const dir = path.dirname(dataFilePath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(dataFilePath, JSON.stringify(sortedWorkouts, null, 2), 'utf8')

    return {
      success: true,
      count: sortedWorkouts.length,
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

async function getValidToken(config, configPath) {
  const nowSec = Math.floor(Date.now() / 1000)
  // If token is valid for at least another 60 seconds, reuse it
  if (nowSec < config.expires_at - 60) {
    return config.access_token
  }

  console.log('Refreshing expired Strava access token...')
  try {
    const refreshResponse = await $fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      body: {
        client_id: config.client_id,
        client_secret: config.client_secret,
        grant_type: 'refresh_token',
        refresh_token: config.refresh_token
      }
    })

    config.access_token = refreshResponse.access_token
    config.refresh_token = refreshResponse.refresh_token
    config.expires_at = refreshResponse.expires_at

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8')
    return config.access_token
  } catch (err) {
    console.error('Failed to refresh Strava token:', err)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to refresh Strava authentication token: ' + (err.data?.message || err.message)
    })
  }
}

function convertDate(isoString) {
  if (!isoString) return ''
  return isoString.replace('T', ' ').replace('Z', '').split('.')[0]
}
