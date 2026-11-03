<template>
  <div class="bento-table-wrap d-flex flex-column h-100">
    <!-- ページネーション＆件数バー -->
    <div class="d-flex align-center justify-space-between mb-1.5 px-1">
      <div class="text-caption text-grey" style="font-size: 0.7rem;">
        全 <strong class="text-white">{{ workouts.length }}</strong> 件のラン記録
        <span v-if="workouts.length > 0" class="ml-1">({{ currentPage }} / {{ maxPage }} ページ)</span>
      </div>
      <div class="d-flex align-center gap-1">
        <v-btn
          icon="mdi-chevron-left"
          variant="tonal"
          density="compact"
          color="grey-lighten-1"
          size="x-small"
          :disabled="currentPage === 1"
          @click="prevPage"
        ></v-btn>
        <v-btn
          icon="mdi-chevron-right"
          variant="tonal"
          density="compact"
          color="grey-lighten-1"
          size="x-small"
          :disabled="currentPage >= maxPage"
          @click="nextPage"
        ></v-btn>
      </div>
    </div>

    <!-- コンパクト・アクティビティリスト -->
    <div v-if="displayedWorkouts.length === 0" class="text-center py-10 text-grey text-caption">
      <v-icon icon="mdi-run" size="28" class="mb-2 d-block mx-auto text-grey-darken-2"></v-icon>
      ワークアウト記録がありません。Stravaと同期してください。
    </div>

    <div v-else class="cockpit-log-list flex-grow-1">
      <div
        v-for="item in displayedWorkouts"
        :key="item.id || item.workoutDate"
        class="cockpit-log-row d-flex align-center justify-space-between px-2.5 py-1.5"
        @click="showMapDetail(item)"
      >
        <!-- 左：日付・タイトル・シューズ -->
        <div class="d-flex align-center overflow-hidden pr-2" style="min-width: 0; flex: 1;">
          <div class="log-date-badge text-center mr-2.5 flex-shrink-0">
            <div class="log-month">{{ formatMonth(item.workoutDate) }}</div>
            <div class="log-day font-outfit">{{ formatDay(item.workoutDate) }}</div>
          </div>
          <div class="overflow-hidden" style="min-width: 0;">
            <div class="text-caption font-weight-bold text-white text-truncate" style="font-size: 0.76rem; line-height: 1.2;">
              {{ item.activityName || 'ランニング' }}
            </div>
            <div class="d-flex align-center text-grey text-truncate" style="font-size: 0.65rem; gap: 6px;">
              <span>{{ formatDuration(item.durationSeconds) }}</span>
              <span v-if="item.averageHeartrate" class="text-rose">♥ {{ Math.round(item.averageHeartrate) }}</span>
              <span v-if="item.cadence">{{ item.cadence }}spm</span>
              <span v-if="item.gearName" class="text-amber text-truncate">👟 {{ item.gearName }}</span>
            </div>
          </div>
        </div>

        <!-- 右：距離・ペース・詳細アイコン -->
        <div class="d-flex align-center flex-shrink-0 gap-2">
          <div class="text-right">
            <div class="font-outfit font-weight-black text-white" style="font-size: 0.92rem; line-height: 1.1;">
              {{ Number(item.distance).toFixed(1) }}<span class="text-caption text-grey ml-0.5" style="font-size: 0.62rem;">km</span>
            </div>
            <div
              class="font-outfit font-weight-bold"
              :class="item.averagePaceSeconds <= 295 ? 'text-emerald' : 'text-cyan'"
              style="font-size: 0.68rem;"
            >
              {{ formatPaceShort(item.averagePaceSeconds) }}/k
            </div>
          </div>
          <v-icon
            color="primary"
            icon="mdi-chevron-right"
            size="16"
            class="opacity-70"
          ></v-icon>
        </div>
      </div>
    </div>

    <!-- ルート詳細＆スプリット・添付写真表示モーダルダイアログ -->
    <v-dialog v-model="mapDialog.active" max-width="600">
      <v-card class="map-dialog-card px-5 py-4" border style="background: #141724; border-radius: 20px; color: #fff;">
        <div class="d-flex justify-space-between align-center mb-3">
          <div>
            <div class="text-h6 font-weight-bold text-white d-flex align-center">
              <v-icon color="primary" icon="mdi-map-legend" class="mr-2"></v-icon>
              {{ mapDialog.workout.activityName || 'ランニングルート' }}
            </div>
            <div class="text-caption text-grey">
              {{ formatWorkoutDate(mapDialog.workout.workoutDate) }} 実施ログ
            </div>
          </div>
          <v-btn icon="mdi-close" variant="text" color="grey-lighten-1" size="small" @click="mapDialog.active = false"></v-btn>
        </div>

        <div class="d-flex flex-wrap gap-2 mb-3" v-if="mapDialog.workout.gearName || mapDialog.workout.deviceName">
          <v-chip v-if="mapDialog.workout.gearName" color="warning" size="x-small" prepend-icon="mdi-shoe-run" class="font-weight-bold">
            シューズ: {{ mapDialog.workout.gearName }}
          </v-chip>
          <v-chip v-if="mapDialog.workout.deviceName" color="info" size="x-small" prepend-icon="mdi-watch" class="font-weight-bold">
            デバイス: {{ mapDialog.workout.deviceName }}
          </v-chip>
        </div>

        <div v-if="mapDialog.workout.description" class="description-box mb-4 px-3 py-2 rounded-lg text-body-2 text-grey-lighten-1" style="background: rgba(255,255,255,0.03); border-left: 3px solid #6366F1;">
          {{ mapDialog.workout.description }}
        </div>

        <div v-if="mapDialog.workout.gearName" class="mb-4">
          <div class="text-subtitle-2 font-weight-bold text-white mb-2 d-flex align-center">
            <v-icon color="warning" icon="mdi-shoe-run" class="mr-1" size="18"></v-icon>
            使用シューズ
          </div>
          <v-card variant="outlined" class="pa-3 rounded-lg border-grey-darken-3 d-flex align-center justify-center text-center" style="background: rgba(25, 28, 41, 0.4); border: 1px solid rgba(255, 255, 255, 0.08) !important;">
            <div class="d-flex align-center gap-4">
              <ShoeIcon :name="mapDialog.workout.gearName" :size="68"></ShoeIcon>
              <div class="text-left">
                <div class="text-subtitle-2 font-weight-bold text-white">
                  {{ mapDialog.workout.gearName }}
                </div>
                <div class="text-caption text-grey">
                  このアクティビティで使用されたランニングシューズ
                </div>
              </div>
            </div>
          </v-card>
        </div>

        <div v-if="mapDialog.workout.mapUrl" class="map-image-container rounded-lg overflow-hidden border border-grey-darken-3 mb-4">
          <v-img
            v-if="!mapDialog.workout.mapUrl.startsWith('polyline:')"
            :src="mapDialog.workout.mapUrl"
            aspect-ratio="1.91"
            cover
            class="bg-grey-darken-4"
          >
            <template #placeholder>
              <div class="d-flex align-center justify-center fill-height" style="min-height: 220px;">
                <v-progress-circular indeterminate color="primary"></v-progress-circular>
              </div>
            </template>
          </v-img>
          
          <div
            v-else
            class="d-flex align-center justify-center bg-grey-darken-4 px-4 py-2"
            style="min-height: 220px; background: rgba(30, 41, 59, 0.4) !important;"
          >
            <svg viewBox="0 0 500 250" style="width: 100%; height: auto; max-height: 220px;">
              <polyline
                :points="getSvgPoints(mapDialog.workout.mapUrl.replace('polyline:', ''))"
                fill="none"
                stroke="#6366F1"
                stroke-width="3"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </div>
        </div>

        <div class="mb-4">
          <div class="text-subtitle-2 font-weight-bold text-white mb-2 d-flex align-center">
            <v-icon color="secondary" icon="mdi-sine-wave" class="mr-1" size="18"></v-icon>
            詳細パフォーマンス指標
          </div>
          
          <v-card variant="outlined" class="pa-3 border-grey-darken-3 rounded-lg" style="background: rgba(255,255,255,0.015); border-color: rgba(255,255,255,0.08) !important;">
            <v-row dense class="text-center">
              <v-col cols="4" class="py-1">
                <div class="text-caption text-grey">距離</div>
                <div class="text-subtitle-2 font-weight-bold text-white">{{ Number(mapDialog.workout.distance || 0).toFixed(2) }} km</div>
              </v-col>
              <v-col cols="4" class="py-1" style="border-left: 1px solid rgba(255,255,255,0.08)">
                <div class="text-caption text-grey">平均ペース</div>
                <div class="text-subtitle-2 font-weight-bold text-white">{{ formatPace(mapDialog.workout.averagePaceSeconds) }}</div>
              </v-col>
              <v-col cols="4" class="py-1" style="border-left: 1px solid rgba(255,255,255,0.08)">
                <div class="text-caption text-grey">平均 / 最大心拍</div>
                <div class="text-subtitle-2 font-weight-bold text-white">
                  {{ mapDialog.workout.averageHeartrate ? Math.round(mapDialog.workout.averageHeartrate) : '--' }} / {{ mapDialog.workout.maxHeartrate || '--' }} bpm
                </div>
              </v-col>

              <v-col cols="12" class="my-1"><v-divider style="opacity: 0.08"></v-divider></v-col>

              <v-col cols="4" class="py-1">
                <div class="text-caption text-grey">ピッチ</div>
                <div class="text-subtitle-2 font-weight-bold text-white">
                  {{ mapDialog.workout.cadence ? mapDialog.workout.cadence + ' spm' : '--' }}
                </div>
              </v-col>
              <v-col cols="4" class="py-1" style="border-left: 1px solid rgba(255,255,255,0.08)">
                <div class="text-caption text-grey">ストライド</div>
                <div class="text-subtitle-2 font-weight-bold text-white">
                  {{ mapDialog.workout.averageStride ? mapDialog.workout.averageStride + ' m' : '--' }}
                </div>
              </v-col>
              <v-col cols="4" class="py-1" style="border-left: 1px solid rgba(255,255,255,0.08)">
                <div class="text-caption text-grey">獲得標高</div>
                <div class="text-subtitle-2 font-weight-bold text-white">
                  {{ mapDialog.workout.elevationGain ? mapDialog.workout.elevationGain + ' m' : '--' }}
                </div>
              </v-col>
            </v-row>
          </v-card>
        </div>

        <div v-if="getWorkoutAnalysis(mapDialog.workout)" class="mb-4">
          <div class="text-subtitle-2 font-weight-bold text-white mb-2 d-flex align-center">
            <v-icon color="success" icon="mdi-lightbulb-on-outline" class="mr-1" size="18"></v-icon>
            スポーツ科学分析
          </div>
          
          <v-card class="pa-3 rounded-lg border" style="background: rgba(16, 185, 129, 0.04); border-color: rgba(16, 185, 129, 0.15) !important;">
            <div class="d-flex align-center mb-2">
              <span class="text-caption text-grey mr-2">種別:</span>
              <v-chip color="success" size="x-small" variant="flat" class="font-weight-bold text-black">
                {{ getWorkoutAnalysis(mapDialog.workout).typeLabel }}
              </v-chip>
            </div>
            
            <ul class="pl-4" style="list-style-type: disc; color: rgba(255, 255, 255, 0.85); font-size: 12.5px; line-height: 1.55;">
              <li v-for="(bullet, idx) in getWorkoutAnalysis(mapDialog.workout).bullets" :key="idx" class="mb-1.5">
                {{ bullet }}
              </li>
            </ul>
          </v-card>
        </div>

        <div v-if="mapDialog.workout.splits && mapDialog.workout.splits.length > 0">
          <div class="text-subtitle-2 font-weight-bold text-white mb-2 d-flex align-center">
            <v-icon color="primary" icon="mdi-timer-outline" class="mr-1" size="18"></v-icon>
            1km毎スプリットラップ
          </div>
          <div class="splits-table-wrapper rounded-lg overflow-hidden border border-grey-darken-3">
            <v-table density="compact" class="splits-table text-grey-lighten-2" style="background: rgba(255,255,255,0.02)">
              <thead>
                <tr style="background: rgba(255,255,255,0.04)">
                  <th class="font-weight-bold py-1 text-white">km</th>
                  <th class="font-weight-bold py-1 text-white">ラップ</th>
                  <th class="font-weight-bold py-1 text-white">心拍</th>
                  <th class="font-weight-bold py-1 text-white">標高差</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(split, idx) in mapDialog.workout.splits" :key="idx">
                  <td class="py-1 font-weight-bold">{{ split.split || (idx + 1) }}</td>
                  <td class="py-1 text-white font-weight-medium">
                    {{ formatSplitTime(split.elapsedTime || split.movingTime) }}
                  </td>
                  <td class="py-1">
                    {{ split.averageHeartrate ? Math.round(split.averageHeartrate) + ' bpm' : '--' }}
                  </td>
                  <td class="py-1">
                    <span :class="split.elevationDifference >= 0 ? 'text-error' : 'text-success'">
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
import ShoeIcon from './ShoeIcon.vue'

export default {
  name: 'WorkoutTable',
  components: {
    ShoeIcon
  },
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

    const getWorkoutAnalysis = (w) => {
      if (!w) return null
      const analyses = []
      let typeLabel = 'ジョグ・その他'
      const dist = Number(w.distance || 0)
      const paceSec = w.averagePaceSeconds || 0
      
      if (dist >= 20.0) {
        typeLabel = 'ロング走（有酸素持久力強化）'
      } else if (dist >= 10.0 && paceSec > 0 && paceSec <= 295) {
        typeLabel = 'ペース走・ビルドアップ（乳酸閾値向上）'
      } else if (dist < 8.0 && paceSec >= 360) {
        typeLabel = '回復ジョグ（アクティブリカバリー）'
      } else if (dist >= 8.0) {
        typeLabel = '有酸素ジョグ（基礎スタミナ構築）'
      }

      if (w.averageHeartrate > 0 && paceSec > 0) {
        const speedMmin = 1000 / (paceSec / 60)
        const ef = speedMmin / w.averageHeartrate
        if (ef >= 1.25) {
          analyses.push('【心肺効率: 優良】心拍に対する走行速度が非常に高く、極めて低燃費で走れています。')
        } else if (ef >= 1.10) {
          analyses.push('【心肺効率: 標準】標準的な心肺効率が維持されています。')
        } else {
          analyses.push('【心肺効率: 負荷高め】設定ペースに対して心拍がやや高めです。次回は回復ジョグを推奨します。')
        }
      }

      if (w.cadence > 0) {
        if (w.cadence >= 180) {
          analyses.push(`【高ピッチ走法 (平均 ${w.cadence} spm)】着地衝撃が低く抑えられた理想的なステップです。`)
        } else if (w.cadence < 170) {
          analyses.push(`【ストライド傾向 (平均 ${w.cadence} spm)】ピッチを175付近に引き上げると後半の脚持ちが良くなります。`)
        } else {
          analyses.push(`【適正ピッチ (平均 ${w.cadence} spm)】ピッチとストライドのバランスが良好です。`)
        }
      }

      if (w.splits && w.splits.length >= 6 && w.splits.every(s => s.averageHeartrate > 0)) {
        const splits = w.splits
        const n = splits.length
        const mid = Math.floor(n / 2)
        const firstHalf = splits.slice(0, mid)
        const secondHalf = splits.slice(mid)

        const firstTimeSec = firstHalf.reduce((sum, s) => sum + (s.movingTime || s.elapsedTime), 0)
        const firstAvgHR = firstHalf.reduce((sum, s) => sum + s.averageHeartrate, 0) / mid
        const firstEF = ((mid * 1000) / (firstTimeSec / 60)) / firstAvgHR

        const secondTimeSec = secondHalf.reduce((sum, s) => sum + (s.movingTime || s.elapsedTime), 0)
        const secondAvgHR = secondHalf.reduce((sum, s) => sum + s.averageHeartrate, 0) / (n - mid)
        const secondEF = (((n - mid) * 1000) / (secondTimeSec / 60)) / secondAvgHR

        const decoupling = ((firstEF - secondEF) / firstEF) * 100
        if (decoupling < 5.0) {
          analyses.push(`【スタミナ維持度: 優秀】後半の心拍ドリフトが ${decoupling.toFixed(1)}% と極めて低く安定しています。`)
        } else if (decoupling <= 10.0) {
          analyses.push(`【スタミナ維持度: 標準】後半のドリフト率は ${decoupling.toFixed(1)}% です。`)
        } else {
          analyses.push(`【スタミナ低下: 課題あり】後半のドリフト率が ${decoupling.toFixed(1)}% と高めです。`)
        }
      }

      return { typeLabel, bullets: analyses }
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
      getWorkoutAnalysis
    }
  }
}
</script>

<style scoped>
.cockpit-log-list {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.cockpit-log-row {
  background: rgba(255, 255, 255, 0.025);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.16s ease;
}

.cockpit-log-row:hover {
  background: rgba(99, 102, 241, 0.1);
  border-color: rgba(99, 102, 241, 0.35);
  transform: translateX(2px);
}

.log-date-badge {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background: rgba(99, 102, 241, 0.12);
  border: 1px solid rgba(99, 102, 241, 0.25);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.log-month {
  font-size: 0.52rem;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1;
}

.log-day {
  font-size: 0.82rem;
  font-weight: 800;
  color: #fff;
  line-height: 1.1;
}

.text-emerald { color: #34d399; }
.text-cyan { color: #22d3ee; }
.text-rose { color: #fb7185; }
.text-amber { color: #fbbf24; }

.splits-table-wrapper {
  max-height: 320px;
  overflow-y: auto;
}
</style>
