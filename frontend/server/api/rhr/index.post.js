import { verifyUser, readLocalJson, writeLocalJson } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  await verifyUser(event)
  const body = await readBody(event)

  const date = body?.date ? String(body.date).trim() : null
  const rhrBpm = Number(body?.rhr_bpm)

  if (!date || Number.isNaN(rhrBpm) || rhrBpm < 30 || rhrBpm > 130) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid date or rhr_bpm (must be between 30 and 130 bpm).'
    })
  }

  const rhrList = readLocalJson('data/rhr.json', [])
  const idx = rhrList.findIndex(item => item.date === date)
  if (idx !== -1) {
    rhrList[idx] = { date, rhr_bpm: rhrBpm }
  } else {
    rhrList.push({ date, rhr_bpm: rhrBpm })
  }

  rhrList.sort((a, b) => a.date.localeCompare(b.date))
  writeLocalJson('data/rhr.json', rhrList)

  return { success: true, rhrLogs: rhrList }
})
