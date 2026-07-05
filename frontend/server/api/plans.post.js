import { verifyUser, getSupabaseClient } from '../utils/auth'

export default defineEventHandler(async (event) => {
  const user = await verifyUser(event)
  const body = await readBody(event)
  
  const { dateStr, plan } = body
  if (!dateStr) {
    throw createError({
      statusCode: 400,
      statusMessage: 'dateStr is required.'
    })
  }

  const supabase = getSupabaseClient()

  if (plan === null || plan === undefined) {
    // Delete override
    const { error } = await supabase
      .from('plans')
      .delete()
      .eq('user_id', user.id)
      .eq('date', dateStr)

    if (error) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to delete plan override: ' + error.message
      })
    }
  } else {
    // Save override using upsert
    const { error } = await supabase
      .from('plans')
      .upsert({
        user_id: user.id,
        date: dateStr,
        menu_text: plan.menuText || '休み',
        target_distance: Number(plan.targetDistance || 0),
        is_quality: !!plan.isQuality,
        target_pace: plan.targetPace ? Number(plan.targetPace) : null
      })

    if (error) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to upsert plan override: ' + error.message
      })
    }
  }
  
  return { success: true }
})
