import fs from 'fs'
import path from 'path'

export default defineEventHandler(async (event) => {
  const dataFilePath = path.join(process.cwd(), 'data/races.json')
  
  // Ensure directory exists
  const dir = path.dirname(dataFilePath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  
  // If file doesn't exist, create it with empty array or a sample race
  if (!fs.existsSync(dataFilePath)) {
    // Let's create an empty array as default
    fs.writeFileSync(dataFilePath, JSON.stringify([], null, 2), 'utf8')
  }

  try {
    const fileData = fs.readFileSync(dataFilePath, 'utf8')
    return JSON.parse(fileData)
  } catch (err) {
    console.error('Failed to read races file, returning empty array', err)
    return []
  }
})
