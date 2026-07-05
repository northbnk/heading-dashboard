import fs from 'fs'
import path from 'path'

export default defineEventHandler(async (event) => {
  const dataFilePath = path.join(process.cwd(), 'data/workouts.json')

  if (!fs.existsSync(dataFilePath)) {
    return []
  }

  try {
    const fileData = fs.readFileSync(dataFilePath, 'utf8')
    return JSON.parse(fileData)
  } catch (err) {
    console.error('Failed to read workouts database:', err)
    return []
  }
})
