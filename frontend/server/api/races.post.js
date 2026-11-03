import { verifyUser, getSupabaseClient, readLocalJson, writeLocalJson } from '../utils/auth'

export default defineEventHandler(async (event) => {
  const athleteId = await verifyUser(event)
  const body = await readBody(event)
  
  if (!body.name || !body.date) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Race name and date are required.'
    })
  }

  const supabase = getSupabaseClient()

  if (supabase) {
    if (body.id) {
      const { data, error } = await supabase
        .from('races')
        .update({
          name: body.name,
          date: body.date,
          category: body.category || 'フルマラソン',
          target_time: body.targetTime || 'サブ3.5'
        })
        .eq('athlete_id', athleteId)
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
      const { data, error } = await supabase
        .from('races')
        .insert({
          athlete_id: athleteId,
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
  }

  // ローカルフォールバック
  const races = readLocalJson('data/races.json', [])
  if (body.id) {
    const idx = races.findIndex(r => Number(r.id) === Number(body.id))
    if (idx !== -1) {
      races[idx] = {
        ...races[idx],
        name: body.name,
        date: body.date,
        category: body.category || 'フルマラソン',
        targetTime: body.targetTime || 'サブ3.5'
      }
      writeLocalJson('data/races.json', races)
      return { success: true, race: races[idx] }
    }
  }
  const newRace = {
    id: Date.now(),
    name: body.name,
    date: body.date,
    category: body.category || 'フルマラソン',
    targetTime: body.targetTime || 'サブ3.5',
    createdAt: new Date().toISOString()
  }
  races.push(newRace)
  writeLocalJson('data/races.json', races)
  return { success: true, race: newRace }
})
