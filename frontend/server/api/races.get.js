import { verifyUser, getSupabaseClient } from '../utils/auth'

export default defineEventHandler(async (event) => {
  try {
    const user = await verifyUser(event)
    const supabase = getSupabaseClient()

    const { data, error } = await supabase
      .from('races')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: true })

    if (error) {
      console.error('Failed to query races from Supabase:', error)
      return []
    }

    return (data || []).map(r => ({
      id: r.id,
      name: r.name,
      date: r.date,
      category: r.category,
      targetTime: r.target_time
    }))
  } catch (err) {
    console.error('Error verifying user in races.get:', err.message)
    return []
  }
})
