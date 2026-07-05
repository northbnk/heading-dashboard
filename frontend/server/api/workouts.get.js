import fs from 'fs'
import path from 'path'

function getProjectRoot() {
  let cwd = process.cwd()
  if (cwd.includes('.output')) {
    return cwd.split('.output')[0]
  }
  return cwd
}

export default defineEventHandler(async (event) => {
  const root = getProjectRoot()
  const dataFilePath = path.join(root, 'data/workouts.json')

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
