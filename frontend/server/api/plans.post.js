import fs from 'fs'
import path from 'path'

export default defineEventHandler(async (event) => {
  // Verify administrator session
  checkAdmin(event)
  
  const dataFilePath = path.join(process.cwd(), 'data/plans.json')
  const body = await readBody(event)
  
  // Ensure directory exists
  const dir = path.dirname(dataFilePath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  
  let plans = {}
  if (fs.existsSync(dataFilePath)) {
    try {
      const fileData = fs.readFileSync(dataFilePath, 'utf8')
      plans = JSON.parse(fileData)
    } catch (err) {
      console.warn('Failed to parse plans file, starting with empty object', err)
    }
  }
  
  const { dateStr, plan } = body
  if (!dateStr) {
    throw createError({
      statusCode: 400,
      statusMessage: 'dateStr is required.'
    })
  }

  if (plan === null || plan === undefined) {
    // Delete override to revert to default dynamic menu
    delete plans[dateStr]
  } else {
    // Save override
    plans[dateStr] = {
      menuText: plan.menuText || '休み',
      targetDistance: Number(plan.targetDistance || 0),
      isQuality: !!plan.isQuality,
      targetPace: plan.targetPace ? Number(plan.targetPace) : null
    }
  }
  
  fs.writeFileSync(dataFilePath, JSON.stringify(plans, null, 2), 'utf8')
  
  return { success: true }
})
