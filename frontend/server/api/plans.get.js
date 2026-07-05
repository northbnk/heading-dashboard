import { verifyUser, getSupabaseClient } from '../utils/auth'

export default defineEventHandler(async (event) => {
  try {
    const athleteId = await verifyUser(event)
    const supabase = getSupabaseClient()

    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .eq('athlete_id', athleteId)

    if (error) {
      console.error('Failed to query plans from Supabase:', error)
      return {}
    }

    const plansObj = {}
    if (data) {
      data.forEach(p => {
        plansObj[p.date] = {
          menuText: p.menu_text,
          targetDistance: Number(p.target_distance || 0),
          isQuality: !!p.is_quality,
          targetPace: p.target_pace
        }
      })
    }
    return plansObj
  } catch (err) {
    console.error('Error verifying user in plans.get:', err.message)
    return {}
  }
})
