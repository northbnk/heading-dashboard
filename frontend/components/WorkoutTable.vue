<template>
  <div class="bento-table-wrap d-flex flex-column h-100">
    <!-- ページネーション＆件数バー -->
    <div class="d-flex align-center justify-space-between mb-3">
      <div class="table-count-label">
        全 <strong class="font-num">{{ workouts.length }}</strong> 件
        <span v-if="workouts.length > 0" class="ml-1 font-num">({{ currentPage }} / {{ maxPage }})</span>
      </div>
      <div class="d-flex align-center gap-1">
        <button
          type="button"
          class="page-nav-btn"
          :disabled="currentPage === 1"
          @click="prevPage"
        >
          <v-icon icon="mdi-chevron-left" size="16"></v-icon>
        </button>
        <button
          type="button"
          class="page-nav-btn"
          :disabled="currentPage >= maxPage"
          @click="nextPage"
        >
          <v-icon icon="mdi-chevron-right" size="16"></v-icon>
        </button>
      </div>
    </div>

    <!-- コンパクト・アクティビティリスト -->
    <div v-if="displayedWorkouts.length === 0" class="text-center py-12 empty-text">
      <v-icon icon="mdi-run" size="28" class="mb-2 d-block mx-auto" color="#94A3B8"></v-icon>
      ワークアウト記録がありません。Stravaと同期してください。
    </div>

    <div v-else class="cockpit-log-list flex-grow-1">
      <div
        v-for="item in displayedWorkouts"
        :key="item.id || item.workoutDate"
        class="cockpit-log-row d-flex align-center justify-space-between"
        @click="showMapDetail(item)"
      >
        <!-- 左：日付・タイトル・サブ情報 -->
        <div class="d-flex align-center overflow-hidden pr-3" style="min-width: 0; flex: 1;">
          <div class="log-date-badge text-center mr-3 flex-shrink-0">
            <div class="log-month">{{ formatMonth(item.workoutDate) }}</div>
            <div class="log-day font-num">{{ formatDay(item.workoutDate) }}</div>
          </div>
          <div class="overflow-hidden" style="min-width: 0;">
            <div class="log-title text-truncate">
              {{ item.activityName || 'ランニング' }}
            </div>
            <div class="d-flex align-center log-submeta text-truncate font-num">
              <span>{{ formatDuration(item.durationSeconds) }}</span>
              <span v-if="item.averageHeartrate" class="meta-dot">•</span>
              <span v-if="item.averageHeartrate">{{ Math.round(item.averageHeartrate) }} bpm</span>
              <span v-if="getWorkoutTrimpScore(item) > 0" class="meta-dot">•</span>
              <span v-if="getWorkoutTrimpScore(item) > 0" class="trimp-inline-tag">TRIMP {{ getWorkoutTrimpScore(item).toFixed(0) }}</span>
            </div>
          </div>
        </div>

        <!-- 右：距離・ペース・詳細アイコン -->
        <div class="d-flex align-center flex-shrink-0 gap-2">
          <div class="text-right">
            <div class="log-distance font-num">
              {{ Number(item.distance).toFixed(1) }}<span class="log-unit">km</span>
            </div>
            <div
              class="log-pace font-num"
              :class="item.averagePaceSeconds <= 295 ? 'pace-fast' : 'pace-normal'"
            >
              {{ formatPaceShort(item.averagePaceSeconds) }} /km
            </div>
          </div>
          <v-icon
            color="#94A3B8"
            icon="mdi-chevron-right"
            size="18"
          ></v-icon>
        </div>
      </div>
    </div>

    <!-- ルート詳細＆スプリット表示モーダルダイアログ (白ベース) -->
    <v-dialog v-model="mapDialog.active" max-width="580">
      <v-card class="map-dialog-card pa-6" elevation="8">
        <div class="d-flex justify-space-between align-start mb-4">
          <div>
            <div class="dialog-title d-flex align-center">
              <v-icon color="#3653B3" icon="mdi-map-marker-path" class="mr-2" size="22"></v-icon>
              {{ mapDialog.workout.activityName || 'ランニング詳細' }}
            </div>
            <div class="dialog-subtitle font-num mt-0.5">
              {{ formatWorkoutDate(mapDialog.workout.workoutDate) }} 実施ログ
            </div>
          </div>
          <v-btn icon="mdi-close" variant="text" color="#64748B" size="small" @click="mapDialog.active = false"></v-btn>
        </div>

        <div v-if="mapDialog.workout.description" class="description-box mb-4 px-3.5 py-2.5 rounded-lg">
          {{ mapDialog.workout.description }}
        </div>

        <div v-if="mapDialog.workout.mapUrl" class="map-image-container rounded-xl overflow-hidden mb-4">
          <v-img
            v-if="!mapDialog.workout.mapUrl.startsWith('polyline:')"
            :src="mapDialog.workout.mapUrl"
            aspect-ratio="1.91"
            cover
          >
            <template #placeholder>
              <div class="d-flex align-center justify-center fill-height" style="min-height: 200px;">
                <v-progress-circular indeterminate color="primary"></v-progress-circular>
              </div>
            </template>
          </v-img>
          
          <div
            v-else
            class="d-flex align-center justify-center px-4 py-3"
            style="min-height: 200px; background: #E8ECF2;"
          >
            <svg viewBox="0 0 500 250" style="width: 100%; height: auto; max-height: 200px;">
              <polyline
                :points="getSvgPoints(mapDialog.workout.mapUrl.replace('polyline:', ''))"
                fill="none"
                stroke="#3653B3"
                stroke-width="3.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </div>
        </div>

        <div class="mb-4">
          <div class="section-heading mb-2">
            パフォーマンス指標
          </div>
          
          <div class="metrics-grid-box pa-3.5 rounded-xl">
            <v-row dense class="text-center">
              <v-col cols="4" class="py-1.5">
                <div class="metric-label">距離</div>
                <div class="metric-val font-num">{{ Number(mapDialog.workout.distance || 0).toFixed(2) }} km</div>
              </v-col>
              <v-col cols="4" class="py-1.5 metric-divider">
                <div class="metric-label">平均ペース</div>
                <div class="metric-val font-num">{{ formatPace(mapDialog.workout.averagePaceSeconds) }}</div>
              </v-col>
              <v-col cols="4" class="py-1.5 metric-divider">
                <div class="metric-label">平均 / 最大心拍</div>
                <div class="metric-val font-num">
                  {{ mapDialog.workout.averageHeartrate ? Math.round(mapDialog.workout.averageHeartrate) : '--' }} / {{ mapDialog.workout.maxHeartrate || '--' }} bpm
                </div>
              </v-col>

              <v-col cols="12" class="my-1"><v-divider color="#E2E8F0"></v-divider></v-col>

              <v-col cols="4" class="py-1.5">
                <div class="metric-label">ピッチ</div>
                <div class="metric-val font-num">
                  {{ mapDialog.workout.cadence ? mapDialog.workout.cadence + ' spm' : '--' }}
                </div>
              </v-col>
              <v-col cols="4" class="py-1.5 metric-divider">
                <div class="metric-label">ストライド</div>
                <div class="metric-val font-num">
                  {{ mapDialog.workout.averageStride ? mapDialog.workout.averageStride + ' m' : '--' }}
                </div>
              </v-col>
              <v-col cols="4" class="py-1.5 metric-divider">
                <div class="metric-label">獲得標高</div>
                <div class="metric-val font-num">
                  {{ mapDialog.workout.elevationGain ? mapDialog.workout.elevationGain + ' m' : '--' }}
                </div>
              </v-col>
            </v-row>
          </div>
        </div>

        <div v-if="getWorkoutScienceDetails(mapDialog.workout)" class="mb-4">
          <div class="section-heading mb-2">
            スポーツ科学解析 (Banister TRIMP / 時間分割ドリフト / Riegel換算)
          </div>
          
          <div class="analysis-box pa-3.5 rounded-xl font-num">
            <div class="d-flex align-center justify-space-between py-1 border-b-dashed">
              <span class="metric-label">Banister TRIMP (男性係数)</span>
              <span class="metric-val" style="font-size: 0.8rem;">
                {{ getWorkoutScienceDetails(mapDialog.workout).trimp > 0
                  ? `${getWorkoutScienceDetails(mapDialog.workout).trimp.toFixed(1)} (HRR ${(getWorkoutScienceDetails(mapDialog.workout).hrrRatio * 100).toFixed(1)}%)`
                  : '心拍データなし' }}
              </span>
            </div>
            <div class="d-flex align-center justify-space-between py-1 border-b-dashed">
              <span class="metric-label">心肺ドリフト (時間 0-50% / 51-100%)</span>
              <span class="metric-val" style="font-size: 0.8rem;">
                <template v-if="getWorkoutScienceDetails(mapDialog.workout).decouplingDetails">
                  {{ getWorkoutScienceDetails(mapDialog.workout).decouplingDetails.decoupling.toFixed(2) }}%
                  (EF {{ getWorkoutScienceDetails(mapDialog.workout).decouplingDetails.firstHalf.ef.toFixed(2) }} → {{ getWorkoutScienceDetails(mapDialog.workout).decouplingDetails.secondHalf.ef.toFixed(2) }})
                </template>
                <template v-else>--</template>
              </span>
            </div>
            <div class="d-flex align-center justify-space-between py-1">
              <span class="metric-label">Riegel フルマラソン換算 (T1×(D2/D1)^1.06)</span>
              <span class="metric-val" style="font-size: 0.8rem; color: #3653B3;">
                {{ getWorkoutScienceDetails(mapDialog.workout).riegelFullFormatted }}
              </span>
            </div>
          </div>
        </div>

        <div v-if="mapDialog.workout.splits && mapDialog.workout.splits.length > 0">
          <div class="section-heading mb-2">
            1km毎スプリットラップ
          </div>
          <div class="splits-table-wrapper rounded-xl overflow-hidden">
            <v-table density="compact" class="splits-table">
              <thead>
                <tr>
                  <th class="font-weight-bold py-2">km</th>
                  <th class="font-weight-bold py-2">ラップ</th>
                  <th class="font-weight-bold py-2">心拍</th>
                  <th class="font-weight-bold py-2">標高差</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(split, idx) in mapDialog.workout.splits" :key="idx">
                  <td class="py-1.5 font-weight-bold font-num">{{ split.split || (idx + 1) }}</td>
                  <td class="py-1.5 font-weight-bold font-num">
                    {{ formatSplitTime(split.elapsedTime || split.movingTime) }}
                  </td>
                  <td class="py-1.5 font-num">
                    {{ split.averageHeartrate ? Math.round(split.averageHeartrate) + ' bpm' : '--' }}
                  </td>
                  <td class="py-1.5 font-num">
                    <span :class="split.elevationDifference >= 0 ? 'elev-up' : 'elev-down'">
                      {{ split.elevationDifference >= 0 ? '+' : '' }}{{ Math.round(split.elevationDifference || 0) }}m
                    </span>
                  </td>
                </tr>
              </tbody>
            </v-table>
          </div>
        </div>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue'
import { getAthleteHrConfig } from '~/config/athleteSettings'
import {
  calculateRiegelTime,
  formatSecondsToHMS,
  workoutSplitsToTrackingData,
  calculateAerobicDecouplingDetails,
  calculateWorkoutTrimp
} from '~/utils/sportsScience'

export default {
  name: 'WorkoutTable',
  props: {
    workouts: {
      type: Array,
      required: true,
      default: () => []
    }
  },
  setup(props) {
    const currentPage = ref(1)
    const pageSize = 7

    let runtimePublic = null
    try {
      const rc = useRuntimeConfig()
      runtimePublic = rc?.public || null
    } catch (_e) {
      runtimePublic = null
    }
    const hrConfig = computed(() => getAthleteHrConfig(runtimePublic))

    const mapDialog = ref({
      active: false,
      workout: {}
    })

    const safeParseDate = (dateStr) => {
      if (!dateStr) return new Date(0)
      const parts = dateStr.split(/[\s\-:]/)
      if (parts.length < 3) return new Date(0)
      const year = parseInt(parts[0], 10)
      const month = parseInt(parts[1], 10) - 1
      const day = parseInt(parts[2], 10)
      const hour = parts[3] ? parseInt(parts[3], 10) : 0
      const minute = parts[4] ? parseInt(parts[4], 10) : 0
      const second = parts[5] ? parseInt(parts[5], 10) : 0
      return new Date(year, month, day, hour, minute, second)
    }

    const maxPage = computed(() => {
      return Math.max(1, Math.ceil(props.workouts.length / pageSize))
    })

    const displayedWorkouts = computed(() => {
      const sorted = [...props.workouts].sort((a, b) => safeParseDate(b.workoutDate) - safeParseDate(a.workoutDate))
      const start = (currentPage.value - 1) * pageSize
      return sorted.slice(start, start + pageSize)
    })

    const prevPage = () => {
      if (currentPage.value > 1) currentPage.value--
    }

    const nextPage = () => {
      if (currentPage.value < maxPage.value) currentPage.value++
    }

    watch(() => props.workouts, () => {
      currentPage.value = 1
    })

    const formatDuration = (seconds) => {
      if (!seconds) return '00:00'
      const hrs = Math.floor(seconds / 3600)
      const mins = Math.floor((seconds % 3600) / 60)
      const secs = seconds % 60
      const parts = []
      if (hrs > 0) parts.push(String(hrs).padStart(2, '0'))
      parts.push(String(mins).padStart(2, '0'))
      parts.push(String(secs).padStart(2, '0'))
      return parts.join(':')
    }

    const formatPace = (secondsPerKm) => {
      if (!secondsPerKm) return '--:-- /km'
      const mins = Math.floor(secondsPerKm / 60)
      const secs = secondsPerKm % 60
      return `${mins}:${String(secs).padStart(2, '0')} /km`
    }

    const formatPaceShort = (secondsPerKm) => {
      if (!secondsPerKm) return '--:--'
      const mins = Math.floor(secondsPerKm / 60)
      const secs = secondsPerKm % 60
      return `${mins}:${String(secs).padStart(2, '0')}`
    }

    const formatWorkoutDate = (dateStr) => {
      if (!dateStr) return ''
      const datePart = dateStr.split(/[ T]/)[0]
      const parts = datePart.split('-')
      if (parts.length >= 3) {
        return `${parts[0]}/${parseInt(parts[1], 10)}/${parseInt(parts[2], 10)}`
      }
      return datePart
    }

    const formatMonth = (dateStr) => {
      if (!dateStr) return ''
      const parts = dateStr.split(/[ T\-]/)
      return parts.length >= 2 ? `${parseInt(parts[1], 10)}月` : ''
    }

    const formatDay = (dateStr) => {
      if (!dateStr) return ''
      const parts = dateStr.split(/[ T\-]/)
      return parts.length >= 3 ? String(parseInt(parts[2], 10)) : ''
    }

    const formatSplitTime = (seconds) => {
      if (!seconds) return '--:--'
      const mins = Math.floor(seconds / 60)
      const secs = Math.round(seconds % 60)
      return `${mins}:${String(secs).padStart(2, '0')}`
    }

    const showMapDetail = (workout) => {
      mapDialog.value = { active: true, workout }
    }

    const decodePolyline = (str) => {
      let index = 0, lat = 0, lng = 0, coordinates = [], shift = 0, result = 0, byte = null, latitude_change, longitude_change
      const factor = Math.pow(10, 5)
      while (index < str.length) {
        byte = null; shift = 0; result = 0
        do {
          byte = str.charCodeAt(index++) - 63
          result |= (byte & 0x1f) << shift
          shift += 5
        } while (byte >= 0x20)
        latitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1))
        lat += latitude_change
        shift = 0; result = 0
        do {
          byte = str.charCodeAt(index++) - 63
          result |= (byte & 0x1f) << shift
          shift += 5
        } while (byte >= 0x20)
        longitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1))
        lng += longitude_change
        coordinates.push([lat / factor, lng / factor])
      }
      return coordinates
    }

    const getSvgPoints = (polyline) => {
      if (!polyline) return ''
      const points = decodePolyline(polyline)
      if (points.length === 0) return ''
      
      let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity
      points.forEach(([lat, lng]) => {
        if (lat < minLat) minLat = lat
        if (lat > maxLat) maxLat = lat
        if (lng < minLng) minLng = lng
        if (lng > maxLng) maxLng = lng
      })
      
      const width = 500, height = 250, padding = 25
      const latRange = maxLat - minLat
      const lngRange = maxLng - minLng
      const scale = Math.min((width - padding * 2) / (lngRange || 1), (height - padding * 2) / (latRange || 1))
      const xOffset = (width - lngRange * scale) / 2
      const yOffset = (height - latRange * scale) / 2
      
      return points.map(([lat, lng]) => {
        const x = padding + (lng - minLng) * scale + (xOffset - padding)
        const y = height - (padding + (lat - minLat) * scale + (yOffset - padding))
        return `${x.toFixed(1)},${y.toFixed(1)}`
      }).join(' ')
    }

    const getWorkoutTrimpScore = (w) => {
      if (!w) return 0
      return calculateWorkoutTrimp(w, hrConfig.value).trimp
    }

    const getWorkoutScienceDetails = (w) => {
      if (!w || !w.distance) return null
      const { trimp, hrrRatio } = calculateWorkoutTrimp(w, hrConfig.value)
      const tracking = workoutSplitsToTrackingData(w)
      const decouplingDetails = tracking ? calculateAerobicDecouplingDetails(tracking) : null

      const distM = Number(w.distance || 0) * 1000
      const timeS = Number(w.movingTimeSeconds || w.durationSeconds || 0)
      const riegelFullSec = distM >= 10000 ? calculateRiegelTime(distM, timeS, 42195) : null

      return {
        trimp,
        hrrRatio,
        decouplingDetails,
        riegelFullFormatted: riegelFullSec ? formatSecondsToHMS(riegelFullSec) : '10km以上のランで算出'
      }
    }

    return {
      mapDialog,
      displayedWorkouts,
      currentPage,
      maxPage,
      prevPage,
      nextPage,
      formatDuration,
      formatPace,
      formatPaceShort,
      formatWorkoutDate,
      formatMonth,
      formatDay,
      formatSplitTime,
      showMapDetail,
      getSvgPoints,
      getWorkoutTrimpScore,
      getWorkoutScienceDetails
    }
  }
}
</script>

<style scoped>
.table-count-label {
  font-size: 0.76rem;
  color: #526071;
}

.table-count-label strong {
  color: #1E293B;
  font-weight: 700;
}

.page-nav-btn {
  width: 28px;
  height: 28px;
  border-radius: 7px;
  border: 1px solid #D5DBE3;
  background: #E8ECF2;
  color: #334155;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
}

.page-nav-btn:hover:not(:disabled) {
  background: #DFE6F2;
  border-color: #B8C4D4;
}

.page-nav-btn:disabled {
  opacity: 0.35;
  cursor: default;
}

.empty-text {
  font-size: 0.8rem;
  color: #526071;
}

.cockpit-log-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cockpit-log-row {
  background: #E8ECF2;
  border: 1px solid #D5DBE3;
  border-radius: 12px;
  padding: 10px 14px;
  cursor: pointer;
  transition: all 0.16s ease;
}

.cockpit-log-row:hover {
  background: #DFE6F2;
  border-color: #A8BADE;
  transform: translateY(-1px);
}

.log-date-badge {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: #F2F4F8;
  border: 1px solid #D5DBE3;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.log-month {
  font-size: 0.56rem;
  font-weight: 600;
  color: #526071;
  line-height: 1;
}

.log-day {
  font-size: 0.88rem;
  font-weight: 800;
  color: #1E293B;
  line-height: 1.15;
}

.log-title {
  font-size: 0.82rem;
  font-weight: 700;
  color: #1E293B;
  line-height: 1.3;
  margin-bottom: 2px;
}

.log-submeta {
  font-size: 0.7rem;
  color: #526071;
  gap: 5px;
}

.meta-dot {
  color: #B8C4D4;
}

.trimp-inline-tag {
  color: #2B4494;
  font-weight: 700;
}

.border-b-dashed {
  border-bottom: 1px dashed #D1D8E2;
}

.log-distance {
  font-size: 0.98rem;
  font-weight: 800;
  color: #1E293B;
  line-height: 1.15;
}

.log-unit {
  font-size: 0.68rem;
  font-weight: 600;
  color: #526071;
  margin-left: 2px;
}

.log-pace {
  font-size: 0.72rem;
  font-weight: 700;
}

.pace-fast {
  color: #1E7E5C;
}

.pace-normal {
  color: #3653B3;
}

/* Modal Styles */
.map-dialog-card {
  background: #F2F4F8 !important;
  border: 1px solid #D5DBE3 !important;
  border-radius: 20px !important;
  color: #1E293B !important;
}

.dialog-title {
  font-size: 1.1rem;
  font-weight: 800;
  color: #1E293B;
}

.dialog-subtitle {
  font-size: 0.76rem;
  color: #526071;
}

.description-box {
  background: #E8ECF2;
  border-left: 3px solid #3653B3;
  color: #334155;
  font-size: 0.82rem;
}

.map-image-container {
  border: 1px solid #D5DBE3;
}

.section-heading {
  font-size: 0.82rem;
  font-weight: 700;
  color: #334155;
}

.metrics-grid-box {
  background: #E8ECF2;
  border: 1px solid #D5DBE3;
}

.metric-divider {
  border-left: 1px solid #D5DBE3;
}

.metric-label {
  font-size: 0.7rem;
  color: #526071;
}

.metric-val {
  font-size: 0.88rem;
  font-weight: 700;
  color: #1E293B;
}

.analysis-box {
  background: #E2EFE9;
  border: 1px solid #B4D6C6;
}

.type-pill {
  background: #1E7E5C;
  color: #FFFFFF;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 6px;
}

.analysis-list {
  color: #1E293B;
  font-size: 0.78rem;
  line-height: 1.6;
}

.splits-table-wrapper {
  max-height: 280px;
  overflow-y: auto;
  border: 1px solid #D5DBE3;
}

.splits-table {
  background: #F2F4F8 !important;
  color: #334155 !important;
}

.splits-table th {
  background: #E8ECF2 !important;
  color: #475569 !important;
  font-size: 0.72rem;
}

.splits-table td {
  font-size: 0.78rem;
  color: #1E293B;
}

.elev-up {
  color: #B83232;
  font-weight: 600;
}

.elev-down {
  color: #1E7E5C;
  font-weight: 600;
}
</style>
