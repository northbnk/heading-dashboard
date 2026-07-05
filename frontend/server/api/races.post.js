import { verifyUser, getSupabaseClient } from '../utils/auth'

export default defineEventHandler(async (event) => {
  const user = await verifyUser(event)
  const body = await readBody(event)
  
  if (!body.name || !body.date) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Race name and date are required.'
    })
  }

  const supabase = getSupabaseClient()

  if (body.id) {
    // Edit existing race
    const { data, error } = await supabase
      .from('races')
      .update({
        name: body.name,
        date: body.date,
        category: body.category || 'フルマラソン',
        target_time: body.targetTime || 'サブ3.5'
      })
      .eq('user_id', user.id)
      .eq('id', Number(body.id))
      .select()
      .maybeSingle()

    if (error) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to update race: ' + error.message
      })
    }

    return { 
      success: true, 
      race: data ? {
        id: data.id,
        name: data.name,
        date: data.date,
        category: data.category,
        targetTime: data.target_time
      } : null
    }
  } else {
    // Insert new race
    const { data, error } = await supabase
      .from('races')
      .insert({
        user_id: user.id,
        name: body.name,
        date: body.date,
        category: body.category || 'フルマラソン',
        target_time: body.targetTime || 'サブ3.5'
      })
      .select()
      .single()

    if (error) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to insert race: ' + error.message
      })
    }

    return { 
      success: true, 
      race: {
        id: data.id,
        name: data.name,
        date: data.date,
        category: data.category,
        targetTime: data.target_time
      }
    }
  }
})
