<template>
  <v-card class="table-card px-3 px-sm-6 py-4" elevation="4">
    <!-- テーブルヘッダー (タイトルの横エリアに単独の MDI ボタンを配置) -->
    <div class="d-flex align-center justify-space-between mb-4 px-2">
      <div class="d-flex align-center">
        <v-icon color="primary" icon="mdi-history" class="mr-2"></v-icon>
        <span class="text-h6 font-weight-bold text-white mr-2">アクティビティ履歴</span>
        
        <!-- MDI単独の < > ボタン -->
        <v-btn
          icon="mdi-chevron-left"
          variant="text"
          density="compact"
          color="white"
          :disabled="currentPage === 1"
          @click="prevPage"
          style="width: 28px; height: 28px; min-width: 28px;"
        ></v-btn>
        <v-btn
          icon="mdi-chevron-right"
          variant="text"
          density="compact"
          color="white"
          :disabled="currentPage >= maxPage"
          @click="nextPage"
          style="width: 28px; height: 28px; min-width: 28px;"
        ></v-btn>
      </div>
    </div>

    <!-- データテーブル (追加ロード方式) -->
    <v-data-table
      :headers="headers"
      :items="displayedWorkouts"
      :items-per-page="-1"
      hide-default-footer
      hover
      class="custom-data-table"
      no-data-text="ワークアウト記録がありません。右上からStravaと連携して同期してください。"
    >
      <!-- 日付列 -->
      <template #[`item.workoutDate`]="{ item }">
        <span class="font-weight-medium text-white">{{ formatWorkoutDate(item.workoutDate) }}</span>
      </template>

      <!-- 距離列 -->
      <template #[`item.distance`]="{ item }">
        <v-chip color="primary" variant="tonal" size="small" class="font-weight-bold">
          {{ Number(item.distance).toFixed(2) }} km
        </v-chip>
      </template>

      <!-- タイム列 -->
      <template #[`item.durationSeconds`]="{ item }">
        <span class="text-white">{{ formatDuration(item.durationSeconds) }}</span>
      </template>

      <!-- 平均ペース列 -->
      <template #[`item.averagePaceSeconds`]="{ item }">
        <v-chip
          :color="item.averagePaceSeconds <= 255 ? 'success' : 'secondary'"
          variant="outlined"
          size="small"
          class="font-weight-bold"
        >
          {{ formatPace(item.averagePaceSeconds) }}
        </v-chip>
      </template>

      <!-- 心拍数列 -->
      <template #[`item.averageHeartrate`]="{ item }">
        <span v-if="item.averageHeartrate" class="text-white">
          {{ Math.round(item.averageHeartrate) }} <span class="text-caption text-grey">bpm</span>
        </span>
        <span v-else class="text-grey-darken-1">--</span>
      </template>

      <!-- ピッチ列 -->
      <template #[`item.cadence`]="{ item }">
        <span v-if="item.cadence" class="text-white">
          {{ item.cadence }} <span class="text-caption text-grey">spm</span>
        </span>
        <span v-else class="text-grey-darken-1">--</span>
      </template>

      <!-- ストライド列 -->
      <template #[`item.averageStride`]="{ item }">
        <span v-if="item.averageStride" class="text-white">
          {{ Number(item.averageStride).toFixed(2) }} <span class="text-caption text-grey">m</span>
        </span>
        <span v-else class="text-grey-darken-1">--</span>
      </template>

      <!-- Stravaリンク / 詳細マップ列 -->
      <template #[`item.stravaLink`]="{ item }">
        <div class="d-flex align-center justify-center">
          <!-- マップ表示ボタン (詳細データ蓄積時のみ表示) -->
          <v-btn
            v-if="item.mapUrl || (item.splits && item.splits.length > 0)"
            icon="mdi-map-legend"
            variant="text"
            color="primary"
            size="small"
            class="mr-1"
            title="詳細・ルートマップを表示"
            @click="showMapDetail(item)"
          ></v-btn>
          <span v-if="!item.mapUrl && (!item.splits || item.splits.length === 0)" class="text-grey-darken-1">--</span>
        </div>
      </template>
    </v-data-table>



    <!-- ルート詳細＆スプリット・添付写真表示モーダルダイアログ -->
    <v-dialog v-model="mapDialog.active" max-width="600">
      <v-card class="map-dialog-card px-5 py-4" border style="background: #171A26; border-radius: 20px; color: #fff;">
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

        <!-- 使用シューズ・GPSウォッチ・説明文 [NEW] -->
        <div class="d-flex flex-wrap gap-2 mb-3" v-if="mapDialog.workout.gearName || mapDialog.workout.deviceName">
          <v-chip v-if="mapDialog.workout.gearName" color="accent" size="x-small" prepend-icon="mdi-shoe-run" class="font-weight-bold">
            シューズ: {{ mapDialog.workout.gearName }}
          </v-chip>
          <v-chip v-if="mapDialog.workout.deviceName" color="info" size="x-small" prepend-icon="mdi-watch" class="font-weight-bold">
            デバイス: {{ mapDialog.workout.deviceName }}
          </v-chip>
        </div>

        <div v-if="mapDialog.workout.description" class="description-box mb-4 px-3 py-2 rounded-lg text-body-2 text-grey-lighten-1" style="background: rgba(255,255,255,0.03); border-left: 3px solid #6366F1;">
          {{ mapDialog.workout.description }}
        </div>

        <!-- ルートマップ画像 -->
        <div v-if="mapDialog.workout.mapUrl" class="map-image-container rounded-lg overflow-hidden border border-grey-darken-3 mb-4">
          <v-img
            v-if="!mapDialog.workout.mapUrl.startsWith('polyline:')"
            :src="mapDialog.workout.mapUrl"
            aspect-ratio="1.91"
            cover
            class="bg-grey-darken-4"
          >
            <template #placeholder>
              <div class="d-flex align-center justify-center fill-height" style="min-height: 250px;">
                <v-progress-circular indeterminate color="primary"></v-progress-circular>
              </div>
            </template>
          </v-img>
          
          <!-- Direct SVG polyline rendering for Strava OAuth sync -->
          <div
            v-else
            class="d-flex align-center justify-center bg-grey-darken-4 px-4 py-2"
            style="min-height: 250px; background: rgba(30, 41, 59, 0.4) !important;"
          >
            <svg
              viewBox="0 0 500 250"
              style="width: 100%; height: auto; max-height: 250px;"
            >
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

        <!-- 添付メディア写真 -->
        <div v-if="mapDialog.workout.media && mapDialog.workout.media.length > 0" class="mb-4">
          <div class="text-subtitle-2 font-weight-bold text-white mb-2 d-flex align-center">
            <v-icon color="secondary" icon="mdi-image-multiple-outline" class="mr-1" size="18"></v-icon>
            添付写真 ({{ mapDialog.workout.media.length }})
          </div>
          <v-row dense>
            <v-col
              v-for="(imgUrl, idx) in mapDialog.workout.media"
              :key="idx"
              cols="4"
            >
              <v-card class="overflow-hidden rounded-lg border border-grey-darken-3" elevation="2">
                <v-img :src="imgUrl" aspect-ratio="1" cover class="bg-grey-darken-4"></v-img>
              </v-card>
            </v-col>
          </v-row>
        </div>

        <!-- 詳細パフォーマンス指標 -->
        <div class="mb-4">
          <div class="text-subtitle-2 font-weight-bold text-white mb-2 d-flex align-center">
            <v-icon color="secondary" icon="mdi-sine-wave" class="mr-1" size="18"></v-icon>
            詳細パフォーマンス指標
          </div>
          
          <v-card variant="outlined" class="pa-3 border-grey-darken-3 rounded-lg" style="background: rgba(255,255,255,0.015); border-color: rgba(255,255,255,0.08) !important;">
            <v-row dense class="text-center">
              <v-col cols="4" class="py-1">
                <div class="text-caption text-grey">ピッチ (平均)</div>
                <div class="text-subtitle-2 font-weight-bold text-white">
                  {{ mapDialog.workout.cadence ? mapDialog.workout.cadence + ' spm' : '--' }}
                </div>
              </v-col>
              <v-col cols="4" class="py-1" style="border-left: 1px solid rgba(255,255,255,0.08)">
                <div class="text-caption text-grey">ストライド (平均)</div>
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
              
              <v-col cols="12" class="my-1"><v-divider style="opacity: 0.08"></v-divider></v-col>
              
              <v-col cols="4" class="py-1">
                <div class="text-caption text-grey">最高心拍数</div>
                <div class="text-subtitle-2 font-weight-bold text-white">
                  {{ mapDialog.workout.maxHeartrate ? mapDialog.workout.maxHeartrate + ' bpm' : '--' }}
                </div>
              </v-col>
              <v-col cols="4" class="py-1" style="border-left: 1px solid rgba(255,255,255,0.08)">
                <div class="text-caption text-grey">走行時間 (実質)</div>
                <div class="text-subtitle-2 font-weight-bold text-white">
                  {{ formatDuration(mapDialog.workout.movingTimeSeconds || mapDialog.workout.durationSeconds) }}
                </div>
              </v-col>
              <v-col cols="4" class="py-1" style="border-left: 1px solid rgba(255,255,255,0.08)">
                <div class="text-caption text-grey">経過時間 (全体)</div>
                <div class="text-subtitle-2 font-weight-bold text-white">
                  {{ formatDuration(mapDialog.workout.durationSeconds) }}
                </div>
              </v-col>
            </v-row>
          </v-card>
        </div>

        <!-- 1kmごとの詳細ラップスプリット [NEW] -->
        <div v-if="mapDialog.workout.splits && mapDialog.workout.splits.length > 0" class="mb-4">
          <div class="text-subtitle-2 font-weight-bold text-white mb-2 d-flex align-center">
            <v-icon color="primary" icon="mdi-timer-outline" class="mr-1" size="18"></v-icon>
            スプリットラップ情報 (1km毎)
          </div>
          <div class="splits-table-wrapper rounded-lg overflow-hidden border border-grey-darken-3">
            <v-table density="compact" class="splits-table text-grey-lighten-2" style="background: rgba(255,255,255,0.02)">
              <thead>
                <tr style="background: rgba(255,255,255,0.04)">
                  <th class="font-weight-bold py-1 text-white">km</th>
                  <th class="font-weight-bold py-1 text-white">ラップタイム</th>
                  <th class="font-weight-bold py-1 text-white">平均心拍</th>
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

        <!-- 走行統計情報サマリー -->
        <v-divider class="mb-4" style="opacity: 0.08"></v-divider>
        <v-row class="text-center bg-surface-variant rounded-lg py-2 mx-0 dense">
          <v-col cols="4">
            <div class="text-caption text-grey">距離</div>
            <div class="text-subtitle-2 font-weight-bold text-white">{{ Number(mapDialog.workout.distance || 0).toFixed(2) }} km</div>
          </v-col>
          <v-col cols="4">
            <div class="text-caption text-grey">ペース</div>
            <div class="text-subtitle-2 font-weight-bold text-white">{{ formatPace(mapDialog.workout.averagePaceSeconds) }}</div>
          </v-col>
          <v-col cols="4">
            <div class="text-caption text-grey">平均心拍</div>
            <div class="text-subtitle-2 font-weight-bold text-white">
              {{ mapDialog.workout.averageHeartrate ? Math.round(mapDialog.workout.averageHeartrate) + ' bpm' : '--' }}
            </div>
          </v-col>
        </v-row>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script>
import { ref, computed, watch } from 'vue'
import { useDisplay } from 'vuetify'

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
    const { xs, sm } = useDisplay() // スマホ対応のためのレスポンシブブレークポイント
    const search = ref('')
    const currentPage = ref(1) // 現在のページ番号 (初期値1)

    const mapDialog = ref({
      active: false,
      workout: {}
    })

    // safeParseDate ヘルパー (日付順での正確なソート用)
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

    // 総ページ数 (10件ずつ)
    const maxPage = computed(() => {
      return Math.max(1, Math.ceil(props.workouts.length / 10))
    })

    // 最新のワークアウト順にソートし、現在のページの10件のみに切り出す (ページ切り替え方式)
    const displayedWorkouts = computed(() => {
      const sorted = [...props.workouts].sort((a, b) => safeParseDate(b.workoutDate) - safeParseDate(a.workoutDate))
      const start = (currentPage.value - 1) * 10
      return sorted.slice(start, start + 10)
    })

    const prevPage = () => {
      if (currentPage.value > 1) {
        currentPage.value--
      }
    }

    const nextPage = () => {
      if (currentPage.value < maxPage.value) {
        currentPage.value++
      }
    }

    // ワークアウト配列自体が更新（同期など）された場合はページ番号を1にリセットする
    watch(() => props.workouts, () => {
      currentPage.value = 1
    })

    // スマホ対応：画面幅に応じてテーブルの列を動的に調整
    const headers = computed(() => {
      if (xs.value) {
        // スマートフォン（幅600px未満）：超必須の4項目のみ表示
        return [
          { title: '日付', key: 'workoutDate', align: 'start', sortable: true },
          { title: '距離', key: 'distance', align: 'start', sortable: true },
          { title: 'ペース', key: 'averagePaceSeconds', align: 'start', sortable: true },
          { title: '詳細', key: 'stravaLink', align: 'center', sortable: false }
        ]
      }
      if (sm.value) {
        // タブレット（幅960px未満）：「タイム」を加えた5項目表示
        return [
          { title: '日付', key: 'workoutDate', align: 'start', sortable: true },
          { title: '距離', key: 'distance', align: 'start', sortable: true },
          { title: 'タイム', key: 'durationSeconds', align: 'start', sortable: true },
          { title: '平均ペース', key: 'averagePaceSeconds', align: 'start', sortable: true },
          { title: '詳細', key: 'stravaLink', align: 'center', sortable: false }
        ]
      }
      // PC（大画面）：全項目表示
      return [
        { title: '日付', key: 'workoutDate', align: 'start', sortable: true },
        { title: '距離', key: 'distance', align: 'start', sortable: true },
        { title: 'タイム', key: 'durationSeconds', align: 'start', sortable: true },
        { title: '平均ペース', key: 'averagePaceSeconds', align: 'start', sortable: true },
        { title: '心拍数', key: 'averageHeartrate', align: 'start', sortable: true },
        { title: 'ピッチ', key: 'cadence', align: 'start', sortable: true },
        { title: 'ストライド', key: 'averageStride', align: 'start', sortable: true },
        { title: '詳細', key: 'stravaLink', align: 'center', sortable: false }
      ]
    })

    // タイム (秒) を時:分:秒に整形
    const formatDuration = (seconds) => {
      if (!seconds) return '00:00'
      const hrs = Math.floor(seconds / 3600)
      const mins = Math.floor((seconds % 3600) / 60)
      const secs = seconds % 60
      
      const parts = []
      if (hrs > 0) {
        parts.push(String(hrs).padStart(2, '0'))
      }
      parts.push(String(mins).padStart(2, '0'))
      parts.push(String(secs).padStart(2, '0'))
      
      return parts.join(':')
    }

    // ペース (秒/km) を分:秒/kmに整形
    const formatPace = (secondsPerKm) => {
      if (!secondsPerKm) return '--:-- /km'
      const mins = Math.floor(secondsPerKm / 60)
      const secs = secondsPerKm % 60
      return `${mins}:${String(secs).padStart(2, '0')} /km`
    }

    // 日付フォーマットの整形 (時間や0埋めを解除し、シンプルな「YYYY/M/d」形式にする)
    const formatWorkoutDate = (dateStr) => {
      if (!dateStr) return ''
      const datePart = dateStr.split(/[ T]/)[0]
      const parts = datePart.split('-')
      if (parts.length >= 3) {
        const yyyy = parts[0]
        const m = parseInt(parts[1], 10)
        const d = parseInt(parts[2], 10)
        return `${yyyy}/${m}/${d}`
      }
      return datePart
    }

    // スプリットタイム（秒）を 分:秒 にフォーマット
    const formatSplitTime = (seconds) => {
      if (!seconds) return '--:--'
      const mins = Math.floor(seconds / 60)
      const secs = Math.round(seconds % 60)
      return `${mins}:${String(secs).padStart(2, '0')}`
    }

    const showMapDetail = (workout) => {
      mapDialog.value = {
        active: true,
        workout: workout
      }
    }

    // Polyline decoding helper
    const decodePolyline = (str) => {
      let index = 0, lat = 0, lng = 0, coordinates = [], shift = 0, result = 0, byte = null, latitude_change, longitude_change;
      const factor = Math.pow(10, 5);
      while (index < str.length) {
        byte = null;
        shift = 0;
        result = 0;
        do {
          byte = str.charCodeAt(index++) - 63;
          result |= (byte & 0x1f) << shift;
          shift += 5;
        } while (byte >= 0x20);
        latitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));
        lat += latitude_change;
        shift = 0;
        result = 0;
        do {
          byte = str.charCodeAt(index++) - 63;
          result |= (byte & 0x1f) << shift;
          shift += 5;
        } while (byte >= 0x20);
        longitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));
        lng += longitude_change;
        coordinates.push([lat / factor, lng / factor]);
      }
      return coordinates;
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
      
      const width = 500
      const height = 250
      const padding = 25
      
      const latRange = maxLat - minLat
      const lngRange = maxLng - minLng
      
      const scale = Math.min((width - padding * 2) / (lngRange || 1), (height - padding * 2) / (latRange || 1))
      
      const xOffset = (width - lngRange * scale) / 2
      const yOffset = (height - latRange * scale) / 2
      
      const svgPoints = points.map(([lat, lng]) => {
        const x = padding + (lng - minLng) * scale + (xOffset - padding)
        const y = height - (padding + (lat - minLat) * scale + (yOffset - padding))
        return `${x.toFixed(1)},${y.toFixed(1)}`
      })
      
      return svgPoints.join(' ')
    }

    return {
      search,
      headers,
      mapDialog,
      displayedWorkouts,
      currentPage,
      maxPage,
      prevPage,
      nextPage,
      formatDuration,
      formatPace,
      formatWorkoutDate,
      formatSplitTime,
      showMapDetail,
      getSvgPoints
    }
  }
}
</script>

<style scoped>
.table-card {
  background: rgba(25, 28, 41, 0.65);
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px !important;
  box-shadow: 0 10px 30px 0 rgba(0, 0, 0, 0.3) !important;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}
.table-card:hover {
  border-color: rgba(99, 102, 241, 0.25);
  box-shadow: 0 10px 30px 0 rgba(99, 102, 241, 0.03) !important;
}

.search-input {
  max-width: 300px;
}

.map-image-container {
  border: 1px solid rgba(255, 255, 255, 0.08);
  min-height: 250px;
  background: #0f111a;
}

.splits-table-wrapper {
  max-height: 600px;
  overflow-y: auto;
}

.splits-table th {
  font-weight: 700;
}

:deep(.custom-data-table) {
  background: transparent !important;
}

:deep(.v-table__wrapper) {
  border-radius: 0 0 16px 16px;
}

:deep(.v-data-table-header__content) {
  font-weight: 700;
  color: #9E9E9E;
  font-size: 11px !important;
}
</style>
