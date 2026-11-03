<template>
  <div class="bento-chart-panel d-flex flex-column h-100">
    <!-- ヘッダーと期間選択 -->
    <div class="d-flex justify-space-between align-center mb-3 flex-wrap gap-2">
      <div class="d-flex align-center flex-wrap">
        <span class="panel-title">
          PMC（パフォーマンス・マネジメント・チャート）
        </span>
        <span v-if="latestDateLabel" class="chart-submeta ml-2 font-num">
          (基準日 {{ latestDateLabel }} ｜ CTL青線・ATLピンク線・TSB棒グラフ)
        </span>
      </div>
      <!-- 期間選択トグル -->
      <div class="period-pill-group d-flex">
        <button
          v-for="p in [{ val: '14days', label: '14日間' }, { val: '42days', label: '42日間(6週)' }, { val: '90days', label: '90日間' }]"
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

    <!-- PMC 統合グラフ表示領域 -->
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
          <div class="d-flex flex-column align-center justify-center py-10 text-slate-muted">
            <v-progress-circular indeterminate color="primary" size="28" class="mb-2"></v-progress-circular>
            <div class="text-caption">PMCチャートを描画中...</div>
          </div>
        </template>
      </ClientOnly>
      <div v-if="workouts.length === 0" class="d-flex flex-column align-center justify-center py-10 text-slate-muted">
        <v-icon icon="mdi-chart-line" size="36" class="mb-2" color="#94A3B8"></v-icon>
        <div class="text-caption">データがありません。Stravaと同期してください。</div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue'
import { getAthleteHrConfig } from '~/config/athleteSettings'
import {
  parseWorkoutLocalDate,
  buildDailyPmcSeries
} from '~/utils/sportsScience'

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
      default: 'sub3.5'
    },
    height: {
      type: [Number, String],
      default: 255
    }
  },
  setup(props) {
    const selectedPeriod = ref('42days')
    const chartKey = ref(0)

    let runtimePublic = null
    try {
      const rc = useRuntimeConfig()
      runtimePublic = rc?.public || null
    } catch (_e) {
      runtimePublic = null
    }
    const hrConfig = computed(() => getAthleteHrConfig(runtimePublic))

    watch([selectedPeriod, () => props.workouts, () => props.targetGoal], () => {
      chartKey.value++
    })

    const anchorDate = computed(() => {
      const now = new Date()
      if (!props.workouts || props.workouts.length === 0) return now
      const dates = props.workouts
        .map(w => parseWorkoutLocalDate(w.workoutDate))
        .filter(d => d.getTime() > 0)
      if (dates.length === 0) return now
      const maxDate = new Date(Math.max(...dates))
      const diffDays = (now.getTime() - maxDate.getTime()) / (1000 * 60 * 60 * 24)
      return diffDays > 14 ? maxDate : now
    })

    const latestDateLabel = computed(() => {
      const d = anchorDate.value
      return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`
    })

    // 最低120日分以上の日次TRIMPからCTL(42d EMA)・ATL(7d EMA)・TSB(前日CTL-前日ATL)を算出
    const fullPmcSeries = computed(() => {
      const res = buildDailyPmcSeries(props.workouts, anchorDate.value, hrConfig.value, 130)
      return res.series || []
    })

    const windowDaysCount = computed(() => {
      if (selectedPeriod.value === '14days') return 14
      if (selectedPeriod.value === '90days') return 90
      return 42
    })

    const visiblePmcSlice = computed(() => {
      const all = fullPmcSeries.value
      const count = windowDaysCount.value
      if (all.length <= count) return all
      return all.slice(-count)
    })

    const categories = computed(() => {
      return visiblePmcSlice.value.map(item => {
        if (!item.dateStr) return ''
        const parts = item.dateStr.split('-')
        if (parts.length >= 3) {
          return `${parseInt(parts[1], 10)}/${parseInt(parts[2], 10)}`
        }
        return item.dateStr
      })
    })

    // PMC 3系列: TSB (ヒストグラム棒グラフ), CTL (青い折れ線), ATL (ピンクの折れ線)
    const series = computed(() => {
      const slice = visiblePmcSlice.value
      return [
        {
          name: 'TSB (コンディション)',
          type: 'column',
          data: slice.map(d => Number(d.TSB.toFixed(1)))
        },
        {
          name: 'CTL (現在の体力)',
          type: 'line',
          data: slice.map(d => Number(d.CTL.toFixed(1)))
        },
        {
          name: 'ATL (直近の疲労)',
          type: 'line',
          data: slice.map(d => Number(d.ATL.toFixed(1)))
        }
      ]
    })

    const chartOptions = computed(() => {
      const slice = visiblePmcSlice.value
      const step = selectedPeriod.value === '90days' ? 7 : selectedPeriod.value === '42days' ? 4 : 1

      return {
        chart: {
          toolbar: { show: false },
          background: 'transparent',
          foreColor: '#526071',
          zoom: { enabled: false },
          fontFamily: "'Inter', 'IBM Plex Sans JP', sans-serif",
          animations: { enabled: true, speed: 350 }
        },
        theme: { mode: 'light' },
        // Series 0: TSB (棒グラフ), Series 1: CTL (青折れ線), Series 2: ATL (ピンク折れ線)
        colors: ['#60A5FA', '#2563EB', '#EC4899'],
        stroke: {
          width: [0, 3, 2.5],
          curve: 'smooth'
        },
        plotOptions: {
          bar: {
            columnWidth: selectedPeriod.value === '90days' ? '70%' : '56%',
            borderRadius: 3,
            colors: {
              ranges: [
                {
                  from: 0,
                  to: 1000,
                  color: '#3B82F6' // TSB プラス: 青
                },
                {
                  from: -1000,
                  to: -0.01,
                  color: '#F97316' // TSB マイナス: オレンジ/赤系
                }
              ]
            }
          }
        },
        fill: {
          opacity: [0.42, 1, 1]
        },
        xaxis: {
          categories: categories.value,
          tickAmount: Math.ceil(slice.length / step),
          labels: {
            rotate: 0,
            style: { colors: '#526071', fontSize: '10px', fontWeight: 500 }
          },
          axisBorder: { show: false },
          axisTicks: { show: false }
        },
        yaxis: [
          {
            seriesName: 'TSB (コンディション)',
            opposite: true,
            title: {
              text: 'TSB (Form)',
              style: { color: '#526071', fontSize: '10px', fontWeight: 600 }
            },
            labels: {
              style: { colors: '#526071', fontSize: '10px', fontWeight: 600 },
              formatter: val => (val !== undefined && val !== null ? `${val > 0 ? '+' : ''}${val.toFixed(0)}` : '')
            }
          },
          {
            seriesName: 'CTL (現在の体力)',
            show: true,
            min: 0,
            title: {
              text: 'CTL / ATL',
              style: { color: '#2563EB', fontSize: '10px', fontWeight: 600 }
            },
            labels: {
              style: { colors: '#2563EB', fontSize: '10px', fontWeight: 600 },
              formatter: val => (val !== undefined && val !== null ? val.toFixed(0) : '')
            }
          },
          {
            seriesName: 'ATL (直近の疲労)',
            show: false,
            min: 0
          }
        ],
        annotations: {
          yaxis: [
            {
              y: 0,
              yAxisIndex: 0,
              borderColor: '#64748B',
              borderWidth: 1,
              strokeDashArray: 4,
              label: {
                borderColor: '#64748B',
                style: {
                  color: '#FFFFFF',
                  background: '#64748B',
                  fontWeight: 600,
                  fontSize: '9px'
                },
                text: 'TSB 0 (均衡ライン)'
              }
            }
          ]
        },
        tooltip: {
          shared: true,
          intersect: false,
          theme: 'light',
          y: {
            formatter: (value, { seriesIndex, dataPointIndex }) => {
              if (value === undefined || value === null) return '--'
              const dayObj = slice[dataPointIndex]
              if (seriesIndex === 0) {
                const sign = value >= 0 ? '+' : ''
                const trimpNote = dayObj ? ` (当日TRIMP: ${dayObj.trimp.toFixed(1)})` : ''
                return `${sign}${value.toFixed(1)}${trimpNote}`
              }
              return `${value.toFixed(1)}`
            }
          }
        },
        grid: {
          borderColor: '#DCE2EC',
          padding: { left: 6, right: 6, top: 4, bottom: 0 }
        },
        legend: {
          position: 'bottom',
          horizontalAlign: 'left',
          fontSize: '11px',
          fontWeight: 600,
          itemMargin: { horizontal: 10, vertical: 4 },
          labels: { colors: '#334155' }
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
  background: #F2F4F8;
  border: 1px solid #D5DBE3;
  border-radius: 16px;
  padding: 20px 24px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}

.panel-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: #1E293B;
  letter-spacing: -0.01em;
}

.chart-submeta {
  font-size: 0.7rem;
  color: #526071;
  font-weight: 500;
}

.text-slate-muted {
  color: #526071;
}

.period-pill-group {
  background: #E2E7EE;
  border: 1px solid #D1D8E2;
  border-radius: 9px;
  padding: 3px;
  gap: 2px;
}

.period-pill-btn {
  border: none;
  background: transparent;
  color: #526071;
  font-size: 0.72rem;
  font-weight: 600;
  padding: 5px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.period-pill-btn.active {
  background: #F8FAFC;
  color: #1E293B;
  font-weight: 700;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.08);
}

.chart-container {
  min-height: 225px;
}
</style>
