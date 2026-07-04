import fs from 'fs'
import path from 'path'

export default defineEventHandler(async (event) => {
  // Verify administrator session
  checkAdmin(event)

  const dataFilePath = path.join(process.cwd(), 'data/races.json')
  const idStr = event.context.params.id
  const id = parseInt(idStr, 10)
  
  if (!fs.existsSync(dataFilePath)) {
    return { success: false, message: 'No races file found' }
  }
  
  try {
    const fileData = fs.readFileSync(dataFilePath, 'utf8')
    let races = JSON.parse(fileData)
    
    const initialLength = races.length
    races = races.filter(r => r.id !== id)
    
    if (races.length === initialLength) {
      throw createError({
        statusCode: 404,
        statusMessage: `Race with id ${id} not found.`
      })
    }
    
    fs.writeFileSync(dataFilePath, JSON.stringify(races, null, 2), 'utf8')
    return { success: true }
  } catch (err) {
    throw createError({
      statusCode: 500,
      statusMessage: err.message || 'Failed to delete race'
    })
  }
})
