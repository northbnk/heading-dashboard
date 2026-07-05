let cachedWorkouts = []

export default {
  /**
   * すべてのワークアウトを取得します (ローカルJSONデータベースから取得)
   */
  async getAllWorkouts() {
    if (cachedWorkouts.length > 0) {
      return cachedWorkouts
    }
    
    try {
      const response = await fetch('/api/workouts')
      if (response.ok) {
        cachedWorkouts = await response.json()
      }
    } catch (err) {
      console.error('Failed to load workouts from local API database:', err)
    }

    return cachedWorkouts
  },

  /**
   * 指定したIDのワークアウトを取得します。
   */
  async getWorkoutById(id) {
    const list = await this.getAllWorkouts()
    return list.find(w => Number(w.id) === Number(id)) || null
  },

  /**
   * Strava APIから最新データを同期・フェッチします。
   */
  async syncWorkouts() {
    try {
      const response = await fetch('/api/workout/sync', {
        method: 'POST'
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.statusMessage || `HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      
      // 同期成功後、キャッシュを再読込
      if (result && result.success) {
        const fetchNewRes = await fetch('/api/workouts')
        if (fetchNewRes.ok) {
          cachedWorkouts = await fetchNewRes.json()
        }
      }
      return result
    } catch (err) {
      console.error('Failed to sync running data from Strava API', err)
      throw err
    }
  },

  /**
   * Strava連携移行のため、手動編集は無効化
   */
  async createWorkout(workoutData) {
    console.warn('Manual creation is disabled. Workout data is synced directly from Strava.')
    return workoutData
  },

  async updateWorkout(id, workoutData) {
    console.warn('Manual update is disabled. Workout data is synced directly from Strava.')
    return workoutData
  },

  async deleteWorkout(id) {
    console.warn('Manual deletion is disabled. Workout data is synced directly from Strava.')
    return { id }
  }
}
