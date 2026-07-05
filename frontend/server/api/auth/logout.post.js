import { getSupabaseClient } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const sessionCookie = getCookie(event, 'athlete_session')
  if (sessionCookie) {
    const parts = sessionCookie.split(':')
    if (parts.length === 2) {
      const [athleteIdStr] = parts
      const athleteId = Number(athleteIdStr)
      if (!isNaN(athleteId)) {
        const supabase = getSupabaseClient()
        // Invalidate session_token in database
        await supabase
          .from('strava_tokens')
          .update({ session_token: null })
          .eq('athlete_id', athleteId)
      }
    }
  }

  // Clear the session cookies
  deleteCookie(event, 'athlete_session', { path: '/' })
  deleteCookie(event, 'admin_session', { path: '/' })
  return { success: true }
})
