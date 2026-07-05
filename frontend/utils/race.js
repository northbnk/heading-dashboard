export default {
  async getRaces() {
    try {
      const res = await fetch('/api/races')
      if (res.ok) {
        return await res.json()
      }
    } catch (err) {
      console.error('Failed to get races:', err)
    }
    return []
  },

  async createRace(raceData, headers = {}) {
    const res = await fetch('/api/races', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: JSON.stringify(raceData)
    })
    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.statusMessage || 'Failed to save race')
    }
    return await res.json()
  },

  async deleteRace(id, headers = {}) {
    const res = await fetch(`/api/races/${id}`, {
      method: 'DELETE',
      headers: {
        ...headers
      }
    })
    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.statusMessage || 'Failed to delete race')
    }
    return await res.json()
  }
}
