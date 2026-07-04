import fs from 'fs'
import path from 'path'

export default defineEventHandler(async (event) => {
  const dataFilePath = path.join(process.cwd(), 'data/races.json')
  const body = await readBody(event)
  
  // Ensure directory exists
  const dir = path.dirname(dataFilePath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  
  let races = []
  if (fs.existsSync(dataFilePath)) {
    try {
      const fileData = fs.readFileSync(dataFilePath, 'utf8')
      races = JSON.parse(fileData)
    } catch (err) {
      console.warn('Failed to parse races file, starting with empty list', err)
    }
  }
  
  // Validate request body
  if (!body.name || !body.date) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Race name and date are required.'
    })
  }

  const newRace = {
    id: Date.now(),
    name: body.name,
    date: body.date, // "YYYY-MM-DD"
    category: body.category || 'フルマラソン',
    targetTime: body.targetTime || 'サブ3.5',
    createdAt: new Date().toISOString()
  }
  
  races.push(newRace)
  fs.writeFileSync(dataFilePath, JSON.stringify(races, null, 2), 'utf8')
  
  return { success: true, race: newRace }
})
