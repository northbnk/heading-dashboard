import { verifyUser, getSupabaseClient } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = await verifyUser(event)
  const idStr = event.context.params.id
  const id = parseInt(idStr, 10)

  const supabase = getSupabaseClient()

  const { error } = await supabase
    .from('races')
    .delete()
    .eq('user_id', user.id)
    .eq('id', id)

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete race from database: ' + error.message
    })
  }

  return { success: true }
})
