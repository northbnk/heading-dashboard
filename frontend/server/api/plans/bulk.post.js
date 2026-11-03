import { verifyUser, getSupabaseClient, readLocalJson, writeLocalJson } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const athleteId = await verifyUser(event)
  const body = await readBody(event)
  
  const { plans } = body
  if (!Array.isArray(plans)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'plans must be an array.'
    })
  }

  const supabase = getSupabaseClient()

  if (supabase) {
    const toUpsert = []
    const toDelete = []

    for (const item of plans) {
      const { dateStr, plan } = item
      if (!dateStr) continue
      if (plan === null || plan === undefined) {
        toDelete.push(dateStr)
      } else {
        toUpsert.push({
          athlete_id: athleteId,
          date: dateStr,
          menu_text: plan.menuText || '休み',
          target_distance: Number(plan.targetDistance || 0),
          is_quality: !!plan.isQuality,
          target_pace: plan.targetPace ? Number(plan.targetPace) : null
        })
      }
    }

    if (toDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from('plans')
        .delete()
        .eq('athlete_id', athleteId)
        .in('date', toDelete)

      if (deleteError) {
        throw createError({
          statusCode: 500,
          statusMessage: 'Failed to delete plan overrides: ' + deleteError.message
        })
      }
    }

    if (toUpsert.length > 0) {
      const { error: upsertError } = await supabase
        .from('plans')
        .upsert(toUpsert)

      if (upsertError) {
        throw createError({
          statusCode: 500,
          statusMessage: 'Failed to bulk upsert plan overrides: ' + upsertError.message
        })
      }
    }

    return { success: true }
  }

  const localPlans = readLocalJson('data/plans.json', {})
  for (const item of plans) {
    const { dateStr, plan } = item
    if (!dateStr) continue
    if (plan === null || plan === undefined) {
      delete localPlans[dateStr]
    } else {
      localPlans[dateStr] = {
        menuText: plan.menuText || '休み',
        targetDistance: Number(plan.targetDistance || 0),
        isQuality: !!plan.isQuality,
        targetPace: plan.targetPace ? Number(plan.targetPace) : null
      }
    }
  }
  writeLocalJson('data/plans.json', localPlans)
  return { success: true }
})
