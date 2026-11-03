<template>
  <div class="bento-chart-panel d-flex flex-column h-100">
    <!-- ヘッダー: チャート種類切替 ＆ 期間・集計単位選択 -->
    <div class="d-flex justify-space-between align-center mb-3 flex-wrap gap-2">
      <!-- 左側: チャートモード切替 -->
      <div class="d-flex align-center flex-wrap gap-2">
        <div class="period-pill-group d-flex">
          <button
            v-for="m in [
              { val: 'pmc', label: 'PMC (CTL/ATL/TSB)' },
              { val: 'pace_hr', label: 'Pace / HR比トレンド' },
              { val: 'rhr', label: '安静時心拍 (RHR)' }
            ]"
            :key="m.val"
            type="button"
            class="period-pill-btn"
            :class="{ active: chartMode === m.val }"
            @click="chartMode = m.val"
          >
            {{ m.label }}
          </button>
        </div>

        <span class="chart-submeta font-num d-none d-sm-inline">
          <template v-if="chartMode === 'pmc'">CTL青線・ATLピンク線・TSB棒</template>
          <template v-else-if="chartMode === 'pace_hr'">速度(m/分) ÷ 平均心拍(bpm) 推移</template>
          <template v-else>日次RHR ＆ 7日間移動平均ライン</template>
        </span>
      </div>

      <!-- 右側: サブ期間・集計粒度トグル -->
      <div v-if="chartMode === 'pmc'" class="period-pill-group d-flex">
        <button
          v-for="p in [{ val: '14days', label: '14日' }, { val: '42days', label: '42日(6週)' }, { val: '90days', label: '90日' }]"
          :key="p.val"
          type="button"
          class="period-pill-btn"
          :class="{ active: selectedPeriod === p.val }"
          @click="selectedPeriod = p.val"
        >
          {{ p.label }}
        </button>
      </div>

      <div v-else-if="chartMode === 'pace_hr'" class="period-pill-group d-flex">
        <button
          v-for="g in [{ val: 'weekly', label: '週単位' }, { val: 'monthly', label: '月単位' }, { val: 'daily', label: 'ラン別' }]"
          :key="g.val"
          type="button"
          class="period-pill-btn"
          :class="{ active: paceHrGranularity === g.val }"
          @click="paceHrGranularity = g.val"
        >
          {{ g.label }}
        </button>
      </div>
    </div>

    <!-- グラフ描画領域 -->
    <div class="chart-container flex-grow-1 d-flex flex-column justify-center">
      <ClientOnly>
        <apexchart
          v-if="hasChartData && activeOptions && activeSeries"
          :key="chartKey"
          :height="height"
          :options="activeOptions"
          :series="activeSeries"
        ></apexchart>
        <template #fallback>
          <div class="d-flex flex-column align-center justify-center py-10 text-slate-muted">
            <v-progress-circular indeterminate color="primary" size="28" class="mb-2"></v-progress-circular>
            <div class="text-caption">チャートを描画中...</div>
          </div>
        </template>
      </ClientOnly>
      <div v-if="!hasChartData" class="d-flex flex-column align-center justify-center py-10 text-slate-muted">
        <v-icon icon="mdi-chart-line" size="36" class="mb-2" color="#94A3B8"></v-icon>
        <div class="text-caption">表示可能な時系列データがありません。</div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue'
import { getAthleteHrConfig } from '~/config/athleteSettings'
import {
  parseWorkoutLocalDate,
  buildDailyPmcSeries,
  buildPaceHrTrendFromWorkouts,
  calculateRhrTrend
} from '~/utils/sportsScience'

export default {
  name: 'WorkoutChart',
  props: {
    workouts: {
      type: Array,
      required: true,
      default: () => []
    },
    rhrLogs: {
      type: Array,
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
    const chartMode = ref('pmc')
    const selectedPeriod = ref('42days')
    const paceHrGranularity = ref('weekly')
    const chartKey = ref(0)

    let runtimePublic = null
    try {
      const rc = useRuntimeConfig()
      runtimePublic = rc?.public || null
    } catch (_e) {
      runtimePublic = null
    }
    const hrConfig = computed(() => getAthleteHrConfig(runtimePublic))

    watch(
      [chartMode, selectedPeriod, paceHrGranularity, () => props.workouts, () => props.rhrLogs, () => props.targetGoal],
      () => {
        chartKey.value++
      },
      { deep: true }
    )

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

    // -----------------------------------------------------------------------
    // 1. PMC チャート (CTL / ATL / TSB)
    // -----------------------------------------------------------------------
    const fullPmcSeries = computed(() => {
      const res = buildDailyPmcSeries(props.workouts, anchorDate.value, hrConfig.value, 130)
      return res.series || []
    })

    const visiblePmcSlice = computed(() => {
      const all = fullPmcSeries.value
      const count = selectedPeriod.value === '14days' ? 14 : selectedPeriod.value === '90days' ? 90 : 42
      return all.length <= count ? all : all.slice(-count)
    })

    const pmcSeries = computed(() => {
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

    const pmcOptions = computed(() => {
      const slice = visiblePmcSlice.value
      const step = selectedPeriod.value === '90days' ? 7 : selectedPeriod.value === '42days' ? 4 : 1
      const categories = slice.map(item => {
        if (!item.dateStr) return ''
        const parts = item.dateStr.split('-')
        return parts.length >= 3 ? `${parseInt(parts[1], 10)}/${parseInt(parts[2], 10)}` : item.dateStr
      })

      return {
        chart: {
          toolbar: { show: false },
          background: 'transparent',
          foreColor: '#526071',
          zoom: { enabled: false },
          fontFamily: "'Inter', 'IBM Plex Sans JP', sans-serif",
          animations: { enabled: true, speed: 300 }
        },
        theme: { mode: 'light' },
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
                { from: 0, to: 1000, color: '#3B82F6' },
                { from: -1000, to: -0.01, color: '#F97316' }
              ]
            }
          }
        },
        fill: { opacity: [0.42, 1, 1] },
        xaxis: {
          categories,
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

    // -----------------------------------------------------------------------
    // 2. Pace / HR 比トレンド (週単位・月単位・ラン別)
    // -----------------------------------------------------------------------
    const paceHrData = computed(() => {
      return buildPaceHrTrendFromWorkouts(props.workouts)
    })

    const activePaceHrPoints = computed(() => {
      if (paceHrGranularity.value === 'monthly') {
        return paceHrData.value.monthly.slice(-12).map(m => ({
          label: m.period,
          ratio: Number(m.pace_hr_ratio.toFixed(3)),
          ratioKmh: Number(m.pace_hr_ratio_kmh.toFixed(4)),
          speed: Number(m.avg_speed_m_min.toFixed(1)),
          hr: Number(m.avg_hr.toFixed(0))
        }))
      }
      if (paceHrGranularity.value === 'daily') {
        return paceHrData.value.workouts.slice(-24).map(w => ({
          label: w.date.substring(5).replace('-', '/'),
          ratio: Number(w.pace_hr_ratio.toFixed(3)),
          ratioKmh: Number(w.pace_hr_ratio_kmh.toFixed(4)),
          speed: Number(w.speed_m_min.toFixed(1)),
          hr: Number(w.avg_hr.toFixed(0))
        }))
      }
      return paceHrData.value.weekly.slice(-16).map(w => ({
        label: w.period.substring(5).replace('-', '/') + '週',
        ratio: Number(w.pace_hr_ratio.toFixed(3)),
        ratioKmh: Number(w.pace_hr_ratio_kmh.toFixed(4)),
        speed: Number(w.avg_speed_m_min.toFixed(1)),
        hr: Number(w.avg_hr.toFixed(0))
      }))
    })

    const paceHrSeries = computed(() => {
      const pts = activePaceHrPoints.value
      return [
        {
          name: '平均速度 (m/分)',
          type: 'column',
          data: pts.map(p => p.speed)
        },
        {
          name: 'Pace/HR比 (m/分/bpm)',
          type: 'line',
          data: pts.map(p => p.ratio)
        }
      ]
    })

    const paceHrOptions = computed(() => {
      const pts = activePaceHrPoints.value
      return {
        chart: {
          toolbar: { show: false },
          background: 'transparent',
          foreColor: '#526071',
          zoom: { enabled: false },
          fontFamily: "'Inter', 'IBM Plex Sans JP', sans-serif"
        },
        theme: { mode: 'light' },
        colors: ['#94A3B8', '#1E7E5C'],
        stroke: {
          width: [0, 3],
          curve: 'smooth'
        },
        markers: {
          size: [0, 4],
          hover: { size: 6 }
        },
        plotOptions: {
          bar: { columnWidth: '48%', borderRadius: 4 }
        },
        fill: { opacity: [0.3, 1] },
        xaxis: {
          categories: pts.map(p => p.label),
          labels: {
            style: { colors: '#526071', fontSize: '10px', fontWeight: 500 }
          },
          axisBorder: { show: false },
          axisTicks: { show: false }
        },
        yaxis: [
          {
            seriesName: '平均速度 (m/分)',
            opposite: true,
            title: {
              text: '速度 (m/min)',
              style: { color: '#64748B', fontSize: '10px', fontWeight: 600 }
            },
            labels: {
              style: { colors: '#64748B', fontSize: '10px', fontWeight: 600 },
              formatter: val => (val !== undefined && val !== null ? `${val.toFixed(0)}` : '')
            }
          },
          {
            seriesName: 'Pace/HR比 (m/分/bpm)',
            show: true,
            title: {
              text: 'Pace / HR比 (m/min/bpm)',
              style: { color: '#1E7E5C', fontSize: '10px', fontWeight: 600 }
            },
            labels: {
              style: { colors: '#1E7E5C', fontSize: '10px', fontWeight: 600 },
              formatter: val => (val !== undefined && val !== null ? val.toFixed(2) : '')
            }
          }
        ],
        tooltip: {
          shared: true,
          intersect: false,
          theme: 'light',
          y: {
            formatter: (value, { seriesIndex, dataPointIndex }) => {
              if (value === undefined || value === null) return '--'
              const pt = pts[dataPointIndex]
              if (seriesIndex === 0) {
                return `${value.toFixed(1)} m/min (平均心拍 ${pt?.hr || '--'} bpm)`
              }
              return `${value.toFixed(3)} m/min/bpm (${pt?.ratioKmh || '--'} km/h/bpm)`
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
          labels: { colors: '#334155' }
        }
      }
    })

    // -----------------------------------------------------------------------
    // 3. 安静時心拍数 (RHR) ＆ 7日移動平均トレンド
    // -----------------------------------------------------------------------
    const rhrTrendPoints = computed(() => {
      return calculateRhrTrend(props.rhrLogs, 3)
    })

    const rhrSeries = computed(() => {
      const pts = rhrTrendPoints.value
      return [
        {
          name: '日次 RHR (bpm)',
          type: 'column',
          data: pts.map(p => p.rhr_bpm)
        },
        {
          name: '7日間移動平均 (短期トレンド)',
          type: 'line',
          data: pts.map(p => p.moving_avg_7d)
        }
      ]
    })

    const rhrOptions = computed(() => {
      const pts = rhrTrendPoints.value
      const minBpm = pts.length > 0 ? Math.max(35, Math.min(...pts.map(p => p.rhr_bpm)) - 4) : 45
      const maxBpm = pts.length > 0 ? Math.max(...pts.map(p => p.rhr_bpm)) + 4 : 65

      // +3bpm 疲労注意の日の棒をオレンジ・赤でハイライト
      const discreteColors = pts
        .map((p, idx) => (p.fatigueWarning ? { seriesIndex: 0, dataPointIndex: idx, fillColor: '#EA580C' } : null))
        .filter(Boolean)

      return {
        chart: {
          toolbar: { show: false },
          background: 'transparent',
          foreColor: '#526071',
          zoom: { enabled: false },
          fontFamily: "'Inter', 'IBM Plex Sans JP', sans-serif"
        },
        theme: { mode: 'light' },
        colors: ['#93C5FD', '#2563EB'],
        stroke: {
          width: [0, 3],
          curve: 'smooth'
        },
        markers: {
          size: [0, 4]
        },
        plotOptions: {
          bar: {
            columnWidth: '48%',
            borderRadius: 4,
            colors: {
              ranges: []
            }
          }
        },
        discrete: discreteColors,
        fill: { opacity: [0.65, 1] },
        xaxis: {
          categories: pts.map(p => p.date.substring(5).replace('-', '/')),
          labels: {
            style: { colors: '#526071', fontSize: '10px', fontWeight: 500 }
          },
          axisBorder: { show: false },
          axisTicks: { show: false }
        },
        yaxis: {
          min: minBpm,
          max: maxBpm,
          title: {
            text: 'RHR (bpm)',
            style: { color: '#2563EB', fontSize: '10px', fontWeight: 600 }
          },
          labels: {
            style: { colors: '#526071', fontSize: '10px', fontWeight: 600 },
            formatter: val => (val !== undefined && val !== null ? `${val.toFixed(0)}` : '')
          }
        },
        tooltip: {
          shared: true,
          intersect: false,
          theme: 'light',
          y: {
            formatter: (value, { seriesIndex, dataPointIndex }) => {
              if (value === undefined || value === null) return '--'
              const pt = pts[dataPointIndex]
              if (seriesIndex === 0) {
                const warn = pt?.fatigueWarning ? ' ⚠️要疲労注意 (+3bpm超)' : ''
                return `${value} bpm${warn}`
              }
              return `${value.toFixed(1)} bpm`
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
          labels: { colors: '#334155' }
        }
      }
    })

    const hasChartData = computed(() => {
      if (chartMode.value === 'rhr') return rhrTrendPoints.value.length > 0
      if (chartMode.value === 'pace_hr') return activePaceHrPoints.value.length > 0
      return props.workouts.length > 0
    })

    const activeSeries = computed(() => {
      if (chartMode.value === 'pace_hr') return paceHrSeries.value
      if (chartMode.value === 'rhr') return rhrSeries.value
      return pmcSeries.value
    })

    const activeOptions = computed(() => {
      if (chartMode.value === 'pace_hr') return paceHrOptions.value
      if (chartMode.value === 'rhr') return rhrOptions.value
      return pmcOptions.value
    })

    return {
      chartMode,
      selectedPeriod,
      paceHrGranularity,
      chartKey,
      hasChartData,
      activeSeries,
      activeOptions
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
  padding: 5px 10px;
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
