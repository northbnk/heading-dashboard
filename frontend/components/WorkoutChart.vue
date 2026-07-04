<template>
  <v-card class="chart-card px-3 px-sm-6 py-4" elevation="4">
    <!-- ヘッダーと期間選択 -->
    <div class="d-flex flex-column flex-sm-row justify-space-between align-start align-sm-center mb-4">
      <div>
        <div class="text-h6 font-weight-bold text-white d-flex align-center">
          <v-icon color="secondary" icon="mdi-chart-timeline-variant" class="mr-2"></v-icon>
          統合パフォーマンス分析
          <span class="text-caption text-grey ml-2 font-weight-regular d-none d-sm-inline">(Training Performance Analytics)</span>
        </div>
      </div>
      <!-- 期間選択トグル -->
      <v-btn-toggle
        v-model="selectedPeriod"
        color="secondary"
        density="compact"
        mandatory
        rounded="lg"
        class="mt-2 mt-sm-0"
      >
        <v-btn value="7days" size="small" class="text-white">
          7日間
        </v-btn>
        <v-btn value="month" size="small" class="text-white">
          月
        </v-btn>
        <v-btn value="year" size="small" class="text-white">
          年
        </v-btn>
      </v-btn-toggle>
    </div>

    <!-- 統合グラフ表示領域 -->
    <div class="chart-container">
      <ClientOnly>
        <apexchart
          v-if="workouts.length > 0 && chartOptions && series"
          :key="chartKey"
          :height="height"
          :options="chartOptions"
          :series="series"
        ></apexchart>
        <template #fallback>
          <div class="d-flex flex-column align-center justify-center py-12 text-grey">
            <v-progress-circular indeterminate color="secondary" class="mb-2"></v-progress-circular>
            <div>グラフを初期化中...</div>
          </div>
        </template>
      </ClientOnly>
      <div v-if="workouts.length === 0" class="d-flex flex-column align-center justify-center py-12 text-grey">
        <v-icon icon="mdi-chart-bell-curve-cumulative" size="64" class="mb-2 text-grey-darken-2"></v-icon>
        <div>データがありません。スプレッドシートと同期してください。</div>
      </div>
    </div>
  </v-card>
</template>

<script>
import { useDisplay } from 'vuetify'

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

// 各ワークアウトの VDOT 計算ヘルパー (走力指標の可視化用)
const calculateWorkoutVDOT = (distanceKm, durationSeconds) => {
  if (!distanceKm || !durationSeconds || distanceKm <= 0 || durationSeconds <= 0) return 0
  const t = durationSeconds / 60 // 分
  const d = distanceKm
  const velocity = d * 1000 / t // m/min
  const o2cost = 0.182258 * velocity + 0.000104 * velocity * velocity - 4.6
  const drop = 0.2989558 * Math.exp(-0.1932605 * t) + 0.1894393 * Math.exp(-0.012778 * t) + 0.8
  const vdot = o2cost / drop
  return Number(vdot.toFixed(1))
}

export default {
  name: 'WorkoutChart',
  props: {
    workouts: {
      type: Array,
      required: true,
      default: () => []
    },
    targetGoal: {
      type: String,
      default: 'sub3'
    },
    height: {
      type: [Number, String],
      default: 300
    }
  },
  setup(props) {
    const { xs } = useDisplay()
    const selectedPeriod = ref('7days')
    const chartKey = ref(0)

    // 表示データや表示期間、目標変更時にグラフを強制再マウントさせ、アノテーション等の描画漏れバグを完全回避
    watch([selectedPeriod, () => props.workouts, () => props.targetGoal], () => {
      chartKey.value++
    })

    // 実際の日付フォーマット用ユーティリティ
    const formatDateString = (d) => {
      const yyyy = d.getFullYear()
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      const dd = String(d.getDate()).padStart(2, '0')
      return `${yyyy}-${mm}-${dd}`
    }

    // 表示期間に応じた実際の日付・月のインターバルリストを生成 (等間隔のカレンダータイムスケール)
    const calendarIntervals = computed(() => {
      const today = new Date()
      const intervals = []

      if (selectedPeriod.value === '7days') {
        // 直近7日間の毎日
        for (let i = 6; i >= 0; i--) {
          const d = new Date()
          d.setDate(today.getDate() - i)
          intervals.push(formatDateString(d))
        }
      } else if (selectedPeriod.value === 'month') {
        // 直近30日間の毎日
        for (let i = 29; i >= 0; i--) {
          const d = new Date()
          d.setDate(today.getDate() - i)
          intervals.push(formatDateString(d))
        }
      } else if (selectedPeriod.value === 'year') {
        // 直近12ヶ月間の各月 (例: "2025-07")
        for (let i = 11; i >= 0; i--) {
          const d = new Date()
          d.setMonth(today.getMonth() - i)
          const yyyy = d.getFullYear()
          const mm = String(d.getMonth() + 1).padStart(2, '0')
          intervals.push(`${yyyy}-${mm}`)
        }
      }
      return intervals
    })

    // カレンダーの各日付・各月スロットへワークアウト実データをマッピング (休養日は距離0、他は直近データを補間)
    const mappedIntervalWorkouts = computed(() => {
      const data = props.workouts
      const intervals = calendarIntervals.value
      
      let lastValidPace = null
      let lastValidStride = null
      let lastValidCadence = null
      let lastValidVDOT = null

      // 最古の有効データを探してデフォルトの初期値にする (前方補正用)
      const sortedByDate = [...data].sort((a, b) => safeParseDate(a.workoutDate) - safeParseDate(b.workoutDate))
      const firstValidPaceWorkout = sortedByDate.find(w => (w.averagePaceSeconds || 0) > 0)
      if (firstValidPaceWorkout) {
        lastValidPace = firstValidPaceWorkout.averagePaceSeconds
      }
      const firstValidStrideWorkout = sortedByDate.find(w => (w.averageStride || 0) > 0)
      if (firstValidStrideWorkout) {
        lastValidStride = firstValidStrideWorkout.averageStride
      }
      const firstValidCadenceWorkout = sortedByDate.find(w => (w.cadence || 0) > 0)
      if (firstValidCadenceWorkout) {
        lastValidCadence = firstValidCadenceWorkout.cadence
      }
      const firstValidVDOTWorkout = sortedByDate.find(w => (Number(w.distance) || 0) > 0 && (Number(w.durationSeconds) || 0) > 0)
      if (firstValidVDOTWorkout) {
        lastValidVDOT = calculateWorkoutVDOT(Number(firstValidVDOTWorkout.distance), Number(firstValidVDOTWorkout.durationSeconds))
      }

      return intervals.map(interval => {
        let dayWorkouts = []
        if (selectedPeriod.value === 'year') {
          dayWorkouts = data.filter(w => w.workoutDate && w.workoutDate.startsWith(interval))
        } else {
          dayWorkouts = data.filter(w => w.workoutDate && w.workoutDate.startsWith(interval))
        }

        if (dayWorkouts.length > 0) {
          const totalDistance = dayWorkouts.reduce((sum, w) => sum + Number(w.distance || 0), 0)
          
          const validPaces = dayWorkouts.filter(w => (w.averagePaceSeconds || 0) > 0)
          if (validPaces.length > 0) {
            lastValidPace = validPaces.reduce((sum, w) => sum + Number(w.averagePaceSeconds), 0) / validPaces.length
          }

          const validStrides = dayWorkouts.filter(w => (w.averageStride || 0) > 0)
          if (validStrides.length > 0) {
            lastValidStride = validStrides.reduce((sum, w) => sum + Number(w.averageStride), 0) / validStrides.length
          }

          const validCadences = dayWorkouts.filter(w => (w.cadence || 0) > 0)
          if (validCadences.length > 0) {
            lastValidCadence = validCadences.reduce((sum, w) => sum + Number(w.cadence), 0) / validCadences.length
          }

          const validVDOTWorkouts = dayWorkouts.filter(w => (Number(w.distance) || 0) > 0 && (Number(w.durationSeconds) || 0) > 0)
          if (validVDOTWorkouts.length > 0) {
            const vdots = validVDOTWorkouts.map(w => calculateWorkoutVDOT(Number(w.distance), Number(w.durationSeconds)))
            lastValidVDOT = Math.max(...vdots, 0)
          }

          return {
            label: interval,
            distance: totalDistance,
            averagePaceSeconds: lastValidPace,
            averageStride: lastValidStride,
            cadence: lastValidCadence,
            vdot: lastValidVDOT
          }
        } else {
          // 走っていない日（休養日）は距離0、他指標は「直近の有効データ」をキャリーオーバー
          return {
            label: interval,
            distance: 0,
            averagePaceSeconds: lastValidPace,
            averageStride: lastValidStride,
            cadence: lastValidCadence,
            vdot: lastValidVDOT
          }
        }
      })
    })

    // X軸ラベル
    const categories = computed(() => {
      return calendarIntervals.value.map(interval => {
        if (selectedPeriod.value === 'year') {
          return interval
        }
        const parts = interval.split('-')
        if (parts.length >= 3) {
          const m = parseInt(parts[1], 10)
          const d = parseInt(parts[2], 10)
          return `${m}/${d}`
        }
        return interval
      })
    })

    // 5つの指標の統合シリーズデータ (インデックス同期の1対1マッピングに VDOT を追加)
    const series = computed(() => {
      const data = mappedIntervalWorkouts.value
      
      const distanceSeries = {
        name: '走行距離 (km)',
        type: 'column',
        data: data.map(w => Number(w.distance || 0))
      }
      
      const vdotSeries = {
        name: 'VDOT (走力指標)',
        type: 'line',
        data: data.map(w => w.vdot ? Number(Number(w.vdot).toFixed(1)) : null)
      }

      if (xs.value) {
        // スマホ(xs)表示時は「走行距離」と「VDOT」の2つのみの簡易表示にする
        return [distanceSeries, vdotSeries]
      }

      return [
        distanceSeries,
        {
          name: '平均ペース (分/km)',
          type: 'line',
          data: data.map(w => {
            const seconds = w.averagePaceSeconds
            if (!seconds) return null
            return Number((seconds / 60).toFixed(2))
          })
        },
        {
          name: 'ストライド (m)',
          type: 'line',
          data: data.map(w => w.averageStride ? Number(Number(w.averageStride).toFixed(2)) : null)
        },
        {
          name: 'ピッチ (spm)',
          type: 'line',
          data: data.map(w => w.cadence ? Number(Math.round(w.cadence)) : null)
        },
        vdotSeries
      ]
    })

    // 休養日 (走行距離が0の日) を特定し、X軸アノテーションを生成
    const restDaysAnnotations = computed(() => {
      const dailyData = mappedIntervalWorkouts.value
      if (selectedPeriod.value === 'year') return []

      const bandWidth = xs.value
        ? (selectedPeriod.value === 'month' ? 6 : 24)
        : (selectedPeriod.value === 'month' ? 10 : 42)
      const todayStr = formatDateString(new Date())

      return dailyData
        .filter(w => Number(w.distance || 0) === 0 && w.label !== todayStr)
        .map(w => {
          const parts = w.label.split('-')
          const formattedLabel = parts.length >= 3 ? `${parseInt(parts[1], 10)}/${parseInt(parts[2], 10)}` : w.label

          return {
            x: formattedLabel,
            borderColor: 'rgba(255, 255, 255, 0.04)',
            borderWidth: bandWidth,
            label: {
              borderColor: 'transparent',
              orientation: 'horizontal',
              style: {
                color: '#9CA3AF',
                background: 'transparent',
                fontSize: '10px',
                fontWeight: 700
              },
              text: '休息日',
              offsetY: 10
            }
          }
        })
    })

    // 目標設定に応じたアノテーション値（目標ペース）
    const targetPaceAnnotation = computed(() => {
      if (props.targetGoal === 'sub4') {
        return {
          y: 5.67,
          label: 'サブ4目標 (5:40/km)'
        }
      } else if (props.targetGoal === 'sub3.5') {
        return {
          y: 4.92,
          label: 'サブ3.5目標 (4:55/km)'
        }
      }
      return {
        y: 4.25,
        label: 'サブ3目標 (4:15/km)'
      }
    })

    // 統合グラフオプション
    const chartOptions = computed(() => {
      const paceAnnot = targetPaceAnnotation.value
      
      const yaxisConfig = xs.value
        ? [
            {
              seriesName: '走行距離 (km)',
              show: true,
              title: { text: '' },
              labels: {
                style: { colors: '#6366F1' },
                formatter: val => val !== undefined && val !== null ? `${val.toFixed(1)} km` : ''
              }
            },
            {
              seriesName: 'VDOT (走力指標)',
              show: true,
              opposite: true,
              title: { text: '' },
              labels: {
                style: { colors: '#EF5350' },
                formatter: val => val !== undefined && val !== null ? `${val.toFixed(1)}` : ''
              }
            }
          ]
        : [
            {
              seriesName: '走行距離 (km)',
              show: true,
              title: { text: '' },
              labels: {
                style: { colors: '#6366F1' },
                formatter: val => val !== undefined && val !== null ? `${val.toFixed(1)} km` : ''
              }
            },
            {
              seriesName: '平均ペース (分/km)',
              show: false,
              labels: { show: false }
            },
            {
              seriesName: 'ストライド (m)',
              show: true,
              opposite: true,
              title: { text: '' },
              labels: {
                style: { colors: '#8B5CF6' },
                formatter: val => val !== undefined && val !== null ? `${val.toFixed(2)} m` : ''
              }
            },
            {
              seriesName: 'ピッチ (spm)',
              show: false,
              labels: { show: false }
            },
            {
              seriesName: 'VDOT (走力指標)',
              show: false,
              labels: { show: false }
            }
          ]

      const tooltipFormatter = (value, { seriesIndex }) => {
        if (xs.value) {
          if (seriesIndex === 0) return `${value.toFixed(2)} km`
          return value > 0 ? `${value.toFixed(1)}` : '--'
        } else {
          if (seriesIndex === 0) return `${value.toFixed(2)} km`
          if (seriesIndex === 1) {
            const totalSeconds = Math.round(value * 60)
            const m = Math.floor(totalSeconds / 60)
            const s = totalSeconds % 60
            return `${m}:${String(s).padStart(2, '0')} /km`
          }
          if (seriesIndex === 2) return value > 0 ? `${value.toFixed(2)} m` : '--'
          if (seriesIndex === 3) return value > 0 ? `${Math.round(value)} spm` : '--'
          return value > 0 ? `${value.toFixed(1)}` : '--'
        }
      }

      return {
        chart: {
          toolbar: { show: false },
          background: 'transparent',
          foreColor: '#9CA3AF',
          zoom: { enabled: false }
        },
        theme: {
          mode: 'dark'
        },
        colors: xs.value
          ? ['#6366F1', '#EF5350']
          : ['#6366F1', '#10B981', '#8B5CF6', '#F59E0B', '#EF5350'],
        stroke: {
          width: xs.value ? [0, 3] : [0, 3, 2, 2, 3],
          curve: 'smooth',
          connectNulls: true
        },
        plotOptions: {
          bar: {
            columnWidth: '35%',
            borderRadius: 4
          }
        },
        fill: {
          opacity: xs.value ? [0.35, 1] : [0.35, 1, 1, 1, 1]
        },
        xaxis: {
          categories: categories.value,
          labels: {
            style: { colors: '#9CA3AF' }
          }
        },
        yaxis: yaxisConfig,
        annotations: {
          xaxis: restDaysAnnotations.value,
          yaxis: xs.value
            ? []
            : [
                {
                  y: paceAnnot.y,
                  yAxisIndex: 1,
                  borderColor: '#10B981',
                  borderWidth: 2,
                  strokeDashArray: 5,
                  label: {
                    borderColor: '#10B981',
                    style: {
                      color: '#fff',
                      background: '#10B981',
                      fontWeight: 700
                    },
                    text: paceAnnot.label
                  }
                }
              ]
        },
        tooltip: {
          shared: true,
          intersect: false,
          theme: 'dark',
          y: {
            formatter: tooltipFormatter
          }
        },
        grid: {
          borderColor: 'rgba(255, 255, 255, 0.05)',
          padding: { left: 10, right: 10, top: 10, bottom: 0 }
        },
        legend: {
          position: 'bottom',
          horizontalAlign: 'left',
          labels: { colors: '#9CA3AF' }
        }
      }
    })

    return {
      selectedPeriod,
      chartKey,
      series,
      chartOptions
    }
  }
}
</script>

<style scoped>
.chart-card {
  background: rgba(25, 28, 41, 0.65);
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px !important;
  box-shadow: 0 10px 30px 0 rgba(0, 0, 0, 0.3) !important;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}
.chart-card:hover {
  border-color: rgba(99, 102, 241, 0.25);
  box-shadow: 0 10px 30px 0 rgba(99, 102, 241, 0.03) !important;
}
.chart-container {
  min-height: 200px;
}
</style>
