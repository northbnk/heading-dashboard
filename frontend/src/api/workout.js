const SPREADSHEET_CSV_URL = '/sheets-api/spreadsheets/d/1PgHvfRXUPPLRvlhOMPSmm14Xuupx0wOnb4MqVEeoPF0/export?format=csv&gid=0'

const cleanColumn = (col) => {
  if (!col) return ''
  col = col.trim()
  if (col.startsWith('"') && col.endsWith('"')) {
    col = col.substring(1, col.length - 1)
  }
  return col.trim()
}

const parseCSV = (csvText) => {
  const lines = csvText.split('\n')
  const workouts = []
  let lineCount = 0
  
  for (let i = 1; i < lines.length; i++) {
    lineCount++
    const line = lines[i]
    if (!line || line.trim() === '') continue
    
    // ダブルクォーテーションを考慮したカンマ分割
    const columns = line.split(/,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/)
    if (columns.length < 21) continue
    
    const cleaned = columns.map(cleanColumn)
    
    try {
      const workoutDate = cleaned[0]
      const activityName = cleaned[2]
      const durationSeconds = Number(cleaned[4] || 0)
      const movingTimeSeconds = cleaned[5] ? Number(cleaned[5]) : null
      const cadence = cleaned[6] ? Number(cleaned[6]) : null
      const averageHeartrate = cleaned[8] ? Number(cleaned[8]) : null
      const maxHeartrate = cleaned[9] ? Number(cleaned[9]) : null
      const elevationGain = cleaned[10] ? Number(cleaned[10]) : null
      const stravaLink = cleaned[18]
      const distance = Number(cleaned[19] || 0)

      // Stravaリンクから真のユニークなアクティビティIDを抽出して使用する
      let activityId = lineCount
      if (stravaLink) {
        const match = stravaLink.match(/activities\/(\d+)/)
        if (match) {
          activityId = Number(match[1])
        }
      }
      const id = activityId
      
      // 平均ペース "5:58" を秒数にパース (CSVの実データはインデックス14に入っている)
      let averagePaceSeconds = 0
      const paceStr = cleaned[14]
      if (paceStr && paceStr.includes(':')) {
        const parts = paceStr.split(':')
        averagePaceSeconds = Number(parts[0]) * 60 + Number(parts[1])
      } else if (distance > 0) {
        const secondsForCalc = movingTimeSeconds || durationSeconds
        averagePaceSeconds = Math.round(secondsForCalc / distance)
      }

      // 移動時間が空の場合は、平均ペースと距離から自動逆算する (フォールバック)
      let finalMovingTime = movingTimeSeconds
      if (!finalMovingTime && averagePaceSeconds > 0 && distance > 0) {
        finalMovingTime = Math.round(averagePaceSeconds * distance)
      }
      if (!finalMovingTime || finalMovingTime <= 0) {
        finalMovingTime = durationSeconds
      }
      
      // 平均ストライドが空の場合は、ピッチと移動時間と距離から自動算出する (インテリジェント・フォールバック)
      let averageStride = cleaned[22] ? Number(cleaned[22]) : null
      if (!averageStride && cadence > 0 && distance > 0) {
        const durationMinutes = finalMovingTime / 60
        const totalSteps = cadence * durationMinutes
        if (totalSteps > 0) {
          averageStride = Number(((distance * 1000) / totalSteps).toFixed(2))
        }
      }
      
      workouts.push({
        id, // 重複のないユニークキー
        activityId,
        workoutDate,
        activityName,
        distance,
        durationSeconds,
        movingTimeSeconds: finalMovingTime,
        averagePaceSeconds,
        cadence,
        averageHeartrate,
        maxHeartrate,
        elevationGain,
        stravaLink,
        averageStride
      })
    } catch (e) {
      console.error('Failed to parse line', lineCount, e)
    }
  }
  
  // 日付の降順（新しい順）でソートして返す (safeParseDateで全ブラウザ対応)
  return workouts.sort((a, b) => safeParseDate(b.workoutDate) - safeParseDate(a.workoutDate))
}

// すべてのブラウザで一桁時間(例: "9:54:57")を含む日付を安全にパースするためのヘルパー
const safeParseDate = (dateStr) => {
  if (!dateStr) return new Date(0)
  const parts = dateStr.split(/[\s\-:]/)
  if (parts.length < 3) return new Date(0)
  
  const year = parseInt(parts[0], 10)
  const month = parseInt(parts[1], 10) - 1 // 0-indexed
  const day = parseInt(parts[2], 10)
  
  const hour = parts[3] ? parseInt(parts[3], 10) : 0
  const minute = parts[4] ? parseInt(parts[4], 10) : 0
  const second = parts[5] ? parseInt(parts[5], 10) : 0
  
  return new Date(year, month, day, hour, minute, second)
}

// メモリ上にデータをキャッシュし、同期時に更新する
let cachedWorkouts = []

export default {
  /**
   * すべてのワークアウトを取得します（スプレッドシートから直接取得）
   */
  async getAllWorkouts() {
    if (cachedWorkouts.length > 0) {
      return cachedWorkouts
    }
    await this.syncWorkouts()

    // ローカルに蓄積されたStrava詳細データをマージ
    try {
      const detailsRes = await fetch('/data/strava_details.json')
      if (detailsRes.ok) {
        const detailsMap = await detailsRes.json()
        cachedWorkouts.forEach(w => {
          const detail = detailsMap[w.activityId]
          if (detail) {
            w.mapUrl = detail.mapUrl || null
            w.media = detail.media || []
          }
        })
      }
    } catch (err) {
      console.warn('Failed to load Strava details from local DB:', err)
    }

    return cachedWorkouts
  },

  /**
   * 指定したIDのワークアウトを取得します。
   */
  async getWorkoutById(id) {
    const list = await this.getAllWorkouts()
    return list.find(w => w.id === id) || null
  },

  /**
   * スプレッドシートから最新データを同期・フェッチします。
   */
  async syncWorkouts() {
    try {
      const response = await fetch(SPREADSHEET_CSV_URL)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const csvText = await response.text()
      cachedWorkouts = parseCSV(csvText)
      return {
        syncedCount: cachedWorkouts.length,
        data: cachedWorkouts
      }
    } catch (err) {
      console.error('Failed to fetch running data from spreadsheet', err)
      throw err
    }
  },

  /**
   * スプレッドシート直接参照のため、書き込み処理はリードオンリー用のダミーレスポンス
   */
  async createWorkout(workoutData) {
    console.warn('Manual creation is disabled. Please add workout directly in Google Sheets.')
    return workoutData
  },

  async updateWorkout(id, workoutData) {
    console.warn('Manual update is disabled. Please edit workout directly in Google Sheets.')
    return workoutData
  },

  async deleteWorkout(id) {
    console.warn('Manual deletion is disabled. Please delete workout directly in Google Sheets.')
    return { id }
  }
}
