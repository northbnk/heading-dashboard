<template>
  <div class="bento-chart-panel d-flex flex-column h-100">
    <!-- ヘッダーと期間選択 -->
    <div class="d-flex justify-space-between align-center mb-1 flex-wrap gap-1">
      <div class="d-flex align-center">
        <div class="cockpit-dot bg-primary mr-2"></div>
        <span class="text-subtitle-2 font-weight-black text-white tracking-wide">
          統合テレメトリ推移
        </span>
        <span v-if="latestDateLabel" class="text-caption text-grey ml-2" style="font-size: 0.68rem;">
          (基準: {{ latestDateLabel }})
        </span>
      </div>
      <!-- 期間選択トグル -->
      <div class="period-pill-group d-flex">
        <button
          v-for="p in [{ val: '7days', label: '7日間' }, { val: 'month', label: '30日' }, { val: 'year', label: '12ヶ月' }]"
          :key="p.val"
          type="button"
          class="period-pill-btn"
          :class="{ active: selectedPeriod === p.val }"
          @click="selectedPeriod = p.val"
        >
          {{ p.label }}
        </button>
      </div>
    </div>

    <!-- 統合グラフ表示領域 -->
    <div class="chart-container flex-grow-1 d-flex flex-column justify-center">
      <ClientOnly>
        <apexchart
          v-if="workouts.length > 0 && chartOptions && series"
          :key="chartKey"
          :height="height"
          :options="chartOptions"
          :series="series"
        ></apexchart>
        <template #fallback>
          <div class="d-flex flex-column align-center justify-center py-8 text-grey">
            <v-progress-circular indeterminate color="secondary" size="28" class="mb-2"></v-progress-circular>
            <div class="text-caption">テレメトリ描画中...</div>
          </div>
        </template>
      </ClientOnly>
      <div v-if="workouts.length === 0" class="d-flex flex-column align-center justify-center py-8 text-grey">
        <v-icon icon="mdi-chart-bell-curve-cumulative" size="40" class="mb-1 text-grey-darken-2"></v-icon>
        <div class="text-caption">データがありません。Stravaと同期してください。</div>
      </div>
    </div>
  </div>
</template>

<script>
import { useDisplay } from 'vuetify'

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

const calculateWorkoutVDOT = (distanceKm, durationSeconds) => {
  if (!distanceKm || !durationSeconds || distanceKm <= 0 || durationSeconds <= 0) return 0
  const t = durationSeconds / 60
  const d = distanceKm
  const velocity = d * 1000 / t
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
      default: 245
    }
  },
  setup(props) {
    const { xs } = useDisplay()
    const selectedPeriod = ref('7days')
    const chartKey = ref(0)

    watch([selectedPeriod, () => props.workouts, () => props.targetGoal], () => {
      chartKey.value++
    })

    const formatDateString = (d) => {
      const yyyy = d.getFullYear()
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      const dd = String(d.getDate()).padStart(2, '0')
      return `${yyyy}-${mm}-${dd}`
    }

    // 最新ワークアウトが14日以上前の場合は最新ワークアウト日を基準日にする
    const anchorDate = computed(() => {
      const now = new Date()
      if (!props.workouts || props.workouts.length === 0) return now
      const dates = props.workouts.map(w => safeParseDate(w.workoutDate)).filter(d => d.getTime() > 0)
      if (dates.length === 0) return now
      const maxDate = new Date(Math.max(...dates))
      const diffDays = (now.getTime() - maxDate.getTime()) / (1000 * 60 * 60 * 24)
      return diffDays > 14 ? maxDate : now
    })

    const latestDateLabel = computed(() => {
      const d = anchorDate.value
      return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`
    })

    const calendarIntervals = computed(() => {
      const base = anchorDate.value
      const intervals = []

      if (selectedPeriod.value === '7days') {
        for (let i = 6; i >= 0; i--) {
          const d = new Date(base.getTime())
          d.setDate(base.getDate() - i)
          intervals.push(formatDateString(d))
        }
      } else if (selectedPeriod.value === 'month') {
        for (let i = 29; i >= 0; i--) {
          const d = new Date(base.getTime())
          d.setDate(base.getDate() - i)
          intervals.push(formatDateString(d))
        }
      } else if (selectedPeriod.value === 'year') {
        for (let i = 11; i >= 0; i--) {
          const d = new Date(base.getFullYear(), base.getMonth() - i, 1)
          const yyyy = d.getFullYear()
          const mm = String(d.getMonth() + 1).padStart(2, '0')
          intervals.push(`${yyyy}-${mm}`)
        }
      }
      return intervals
    })

    const mappedIntervalWorkouts = computed(() => {
      const data = props.workouts
      const intervals = calendarIntervals.value
      
      let lastValidPace = null
      let lastValidStride = null
      let lastValidCadence = null
      let lastValidVDOT = null

      const sortedByDate = [...data].sort((a, b) => safeParseDate(a.workoutDate) - safeParseDate(b.workoutDate))
      const firstValidPaceWorkout = sortedByDate.find(w => (w.averagePaceSeconds || 0) > 0)
      if (firstValidPaceWorkout) lastValidPace = firstValidPaceWorkout.averagePaceSeconds
      const firstValidStrideWorkout = sortedByDate.find(w => (w.averageStride || 0) > 0)
      if (firstValidStrideWorkout) lastValidStride = firstValidStrideWorkout.averageStride
      const firstValidCadenceWorkout = sortedByDate.find(w => (w.cadence || 0) > 0)
      if (firstValidCadenceWorkout) lastValidCadence = firstValidCadenceWorkout.cadence
      const firstValidVDOTWorkout = sortedByDate.find(w => (Number(w.distance) || 0) > 0 && (Number(w.durationSeconds) || 0) > 0)
      if (firstValidVDOTWorkout) {
        lastValidVDOT = calculateWorkoutVDOT(Number(firstValidVDOTWorkout.distance), Number(firstValidVDOTWorkout.durationSeconds))
      }

      return intervals.map(interval => {
        const dayWorkouts = data.filter(w => w.workoutDate && w.workoutDate.startsWith(interval))

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

    const series = computed(() => {
      const data = mappedIntervalWorkouts.value
      
      const distanceSeries = {
        name: '距離(km)',
        type: 'column',
        data: data.map(w => Number(w.distance || 0))
      }
      
      const vdotSeries = {
        name: 'VDOT',
        type: 'line',
        data: data.map(w => w.vdot ? Number(Number(w.vdot).toFixed(1)) : null)
      }

      if (xs.value) {
        return [distanceSeries, vdotSeries]
      }

      return [
        distanceSeries,
        {
          name: 'ペース(分/km)',
          type: 'line',
          data: data.map(w => {
            const seconds = w.averagePaceSeconds
            if (!seconds) return null
            return Number((seconds / 60).toFixed(2))
          })
        },
        {
          name: 'ストライド(m)',
          type: 'line',
          data: data.map(w => w.averageStride ? Number(Number(w.averageStride).toFixed(2)) : null)
        },
        {
          name: 'ピッチ(spm)',
          type: 'line',
          data: data.map(w => w.cadence ? Number(Math.round(w.cadence)) : null)
        },
        vdotSeries
      ]
    })

    const targetPaceAnnotation = computed(() => {
      if (props.targetGoal === 'sub4') {
        return { y: 5.67, label: 'Sub4 (5:40/k)' }
      } else if (props.targetGoal === 'sub3.5') {
        return { y: 4.92, label: 'Sub3.5 (4:55/k)' }
      }
      return { y: 4.25, label: 'Sub3 (4:15/k)' }
    })

    const chartOptions = computed(() => {
      const paceAnnot = targetPaceAnnotation.value
      
      const yaxisConfig = xs.value
        ? [
            {
              seriesName: '距離(km)',
              show: true,
              labels: {
                style: { colors: '#818cf8', fontSize: '10px' },
                formatter: val => val !== undefined && val !== null ? `${val.toFixed(0)}k` : ''
              }
            },
            {
              seriesName: 'VDOT',
              show: true,
              opposite: true,
              labels: {
                style: { colors: '#f87171', fontSize: '10px' },
                formatter: val => val !== undefined && val !== null ? `${val.toFixed(1)}` : ''
              }
            }
          ]
        : [
            {
              seriesName: '距離(km)',
              show: true,
              labels: {
                style: { colors: '#818cf8', fontSize: '10px' },
                formatter: val => val !== undefined && val !== null ? `${val.toFixed(0)}k` : ''
              }
            },
            {
              seriesName: 'ペース(分/km)',
              show: false,
              labels: { show: false }
            },
            {
              seriesName: 'ストライド(m)',
              show: true,
              opposite: true,
              labels: {
                style: { colors: '#a78bfa', fontSize: '10px' },
                formatter: val => val !== undefined && val !== null ? `${val.toFixed(2)}m` : ''
              }
            },
            {
              seriesName: 'ピッチ(spm)',
              show: false,
              labels: { show: false }
            },
            {
              seriesName: 'VDOT',
              show: false,
              labels: { show: false }
            }
          ]

      const tooltipFormatter = (value, { seriesIndex }) => {
        if (value === undefined || value === null) return '--'
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
          zoom: { enabled: false },
          fontFamily: 'Inter, sans-serif'
        },
        theme: { mode: 'dark' },
        colors: xs.value
          ? ['#6366F1', '#F43F5E']
          : ['#6366F1', '#10B981', '#8B5CF6', '#F59E0B', '#F43F5E'],
        stroke: {
          width: xs.value ? [0, 2.5] : [0, 2.5, 2, 2, 2.5],
          curve: 'smooth',
          connectNulls: true
        },
        plotOptions: {
          bar: {
            columnWidth: '42%',
            borderRadius: 4
          }
        },
        fill: {
          opacity: xs.value ? [0.45, 1] : [0.45, 1, 1, 1, 1]
        },
        xaxis: {
          categories: categories.value,
          labels: {
            style: { colors: '#9CA3AF', fontSize: '10px' }
          },
          axisBorder: { show: false },
          axisTicks: { show: false }
        },
        yaxis: yaxisConfig,
        annotations: {
          yaxis: xs.value
            ? []
            : [
                {
                  y: paceAnnot.y,
                  yAxisIndex: 1,
                  borderColor: '#10B981',
                  borderWidth: 1.5,
                  strokeDashArray: 4,
                  label: {
                    borderColor: '#10B981',
                    style: {
                      color: '#052e16',
                      background: '#34d399',
                      fontWeight: 700,
                      fontSize: '10px'
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
          y: { formatter: tooltipFormatter }
        },
        grid: {
          borderColor: 'rgba(255, 255, 255, 0.05)',
          padding: { left: 6, right: 6, top: 4, bottom: 0 }
        },
        legend: {
          position: 'bottom',
          horizontalAlign: 'left',
          fontSize: '11px',
          itemMargin: { horizontal: 8, vertical: 2 },
          labels: { colors: '#9CA3AF' }
        }
      }
    })

    return {
      selectedPeriod,
      chartKey,
      series,
      chartOptions,
      latestDateLabel
    }
  }
}
</script>

<style scoped>
.bento-chart-panel {
  background: linear-gradient(165deg, rgba(20, 23, 36, 0.92) 0%, rgba(13, 15, 24, 0.96) 100%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 12px 14px;
}

.cockpit-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  box-shadow: 0 0 8px currentColor;
}

.period-pill-group {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 2px;
  gap: 2px;
}

.period-pill-btn {
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.68rem;
  font-weight: 700;
  padding: 3px 9px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.period-pill-btn.active {
  background: #06b6d4;
  color: #08101d;
}

.chart-container {
  min-height: 210px;
}
</style>
