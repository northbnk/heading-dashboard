import fs from 'fs'
import path from 'path'

export default defineEventHandler(async (event) => {
  // Verify administrator session
  checkAdmin(event)

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

  if (body.id) {
    // Editing an existing race
    const index = races.findIndex(r => r.id === Number(body.id))
    if (index === -1) {
      throw createError({
        statusCode: 404,
        statusMessage: `Race with id ${body.id} not found.`
      })
    }
    
    races[index] = {
      ...races[index],
      name: body.name,
      date: body.date,
      category: body.category || 'フルマラソン',
      targetTime: body.targetTime || 'サブ3.5',
      updatedAt: new Date().toISOString()
    }
    
    fs.writeFileSync(dataFilePath, JSON.stringify(races, null, 2), 'utf8')
    return { success: true, race: races[index] }
  } else {
    // Creating a new race
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
  }
})
