import { verifyUser, getSupabaseClient, readLocalJson, writeLocalJson } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const athleteId = await verifyUser(event)
  const idStr = event.context.params.id
  const id = parseInt(idStr, 10)

  const supabase = getSupabaseClient()

  if (supabase) {
    const { error } = await supabase
      .from('races')
      .delete()
      .eq('athlete_id', athleteId)
      .eq('id', id)

    if (error) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to delete race from database: ' + error.message
      })
    }

    return { success: true }
  }

  const races = readLocalJson('data/races.json', [])
  const filtered = races.filter(r => Number(r.id) !== id)
  writeLocalJson('data/races.json', filtered)
  return { success: true }
})
