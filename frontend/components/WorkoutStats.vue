<template>
  <!-- 1. 5項目コア・指標リボン (シューズ除外・白ベース洗練デザイン) -->
  <div v-if="displayMode === 'all' || displayMode === 'stats-only'" class="kpi-five-grid">
    <!-- KPI 1: 直近30日間の走行距離 -->
    <div class="bento-stat-tile">
      <div class="d-flex justify-space-between align-start mb-2">
        <div>
          <div class="tile-eyebrow">30D VOLUME</div>
          <div class="tile-label">直近30日走行距離</div>
        </div>
        <div class="tile-icon-badge">
          <v-icon color="#3653B3" icon="mdi-calendar-range" size="18"></v-icon>
        </div>
      </div>

      <div class="d-flex align-baseline justify-space-between my-2">
        <div class="tile-value font-num">
          {{ last30DaysDistance.toFixed(1) }}
          <span class="tile-unit">km</span>
        </div>
        <div class="tile-subvalue">
          目標 {{ monthlyGoalDistance }}km
        </div>
      </div>

      <div class="tile-gauge-wrap mt-auto pt-1">
        <div class="gauge-track">
          <div
            class="gauge-fill fill-primary"
            :style="{ width: Math.min((last30DaysDistance / monthlyGoalDistance) * 100, 100) + '%' }"
          ></div>
        </div>
        <div class="d-flex justify-space-between tile-gauge-meta mt-1.5">
          <span>月間達成率</span>
          <span class="meta-strong font-num">{{ Math.round(Math.min((last30DaysDistance / monthlyGoalDistance) * 100, 100)) }}%</span>
        </div>
      </div>
    </div>

    <!-- KPI 2: 推定VDOT & フル予測タイム -->
    <div class="bento-stat-tile">
      <div class="d-flex justify-space-between align-start mb-2">
        <div>
          <div class="tile-eyebrow">ESTIMATED VDOT</div>
          <div class="tile-label">推定VDOT・フル予測</div>
        </div>
        <div class="tile-icon-badge">
          <v-icon color="#3653B3" icon="mdi-chart-line-variant" size="18"></v-icon>
        </div>
      </div>

      <div class="d-flex align-baseline justify-space-between my-2">
        <div class="tile-value font-num">
          {{ estimatedVDOT > 0 ? estimatedVDOT.toFixed(1) : '--' }}
        </div>
        <div class="tile-subvalue badge-pill-blue font-num" v-if="estimatedVDOT > 0">
          {{ formattedPredictedTime }}
        </div>
      </div>

      <div class="tile-gauge-wrap mt-auto pt-1">
        <div class="gauge-track">
          <div
            class="gauge-fill fill-primary"
            :style="{ width: Math.min((estimatedVDOT / requiredVDOT) * 100, 100) + '%' }"
          ></div>
        </div>
        <div class="d-flex justify-space-between tile-gauge-meta mt-1.5">
          <span>目標基準 {{ requiredVDOT.toFixed(1) }}</span>
          <span class="meta-strong font-num">{{ estimatedVDOT > 0 ? Math.round(Math.min((estimatedVDOT / requiredVDOT) * 100, 100)) : 0 }}%</span>
        </div>
      </div>
    </div>

    <!-- KPI 3: 目標ペース最長距離 -->
    <div class="bento-stat-tile">
      <div class="d-flex justify-space-between align-start mb-2">
        <div>
          <div class="tile-eyebrow">MARATHON PACE MAX</div>
          <div class="tile-label">{{ goalLabel }}ペース最長 {{ goalPaceLimitLabel }}</div>
        </div>
        <div class="tile-icon-badge">
          <v-icon color="#3653B3" icon="mdi-run-fast" size="18"></v-icon>
        </div>
      </div>

      <div class="d-flex align-baseline justify-space-between my-2">
        <div class="tile-value font-num">
          {{ targetPaceMaxDistance.distance > 0 ? targetPaceMaxDistance.distance.toFixed(1) : '--' }}
          <span class="tile-unit">km</span>
        </div>
        <div class="tile-subvalue font-num" v-if="targetPaceMaxDistance.date">
          {{ targetPaceMaxDistance.date.substring(5).replace('-', '/') }}
        </div>
      </div>

      <div class="tile-gauge-wrap mt-auto pt-1">
        <div class="gauge-track">
          <div
            class="gauge-fill fill-primary"
            :style="{ width: Math.min((targetPaceMaxDistance.distance / goalLongRunLimit) * 100, 100) + '%' }"
          ></div>
        </div>
        <div class="d-flex justify-space-between tile-gauge-meta mt-1.5">
          <span>目標 {{ goalLongRunLimit }}km</span>
          <span class="meta-strong font-num">{{ targetPaceMaxDistance.distance > 0 ? Math.round(Math.min((targetPaceMaxDistance.distance / goalLongRunLimit) * 100, 100)) : 0 }}%</span>
        </div>
      </div>
    </div>

    <!-- KPI 4: ランニング心拍効率 -->
    <div class="bento-stat-tile">
      <div class="d-flex justify-space-between align-start mb-2">
        <div>
          <div class="tile-eyebrow">CARDIAC EFFICIENCY</div>
          <div class="tile-label">心拍効率 (EI)</div>
        </div>
        <div class="tile-icon-badge">
          <v-icon color="#3653B3" icon="mdi-heart-flash" size="18"></v-icon>
        </div>
      </div>

      <div class="d-flex align-baseline justify-space-between my-2">
        <div class="tile-value font-num">
          {{ heartEfficiency > 0 ? heartEfficiency.toFixed(2) : '--' }}
          <span class="tile-unit">m/b</span>
        </div>
        <div class="tile-subvalue font-num" v-if="averageHeartRate > 0">
          平均 {{ Math.round(averageHeartRate) }} bpm
        </div>
      </div>

      <div class="tile-gauge-wrap mt-auto pt-1">
        <div class="gauge-track">
          <div
            class="gauge-fill fill-primary"
            :style="{ width: Math.min((heartEfficiency / targetEI) * 100, 100) + '%' }"
          ></div>
        </div>
        <div class="d-flex justify-space-between tile-gauge-meta mt-1.5">
          <span>目標 {{ targetEI.toFixed(2) }} m/b</span>
          <span class="meta-strong font-num">{{ heartEfficiency > 0 ? Math.round(Math.min((heartEfficiency / targetEI) * 100, 100)) : 0 }}%</span>
        </div>
      </div>
    </div>

    <!-- KPI 5: 心肺デカップリング値 -->
    <div class="bento-stat-tile">
      <div class="d-flex justify-space-between align-start mb-2">
        <div>
          <div class="tile-eyebrow">AEROBIC DECOUPLING</div>
          <div class="tile-label">心肺ドリフト維持率</div>
        </div>
        <div class="tile-icon-badge">
          <v-icon color="#3653B3" icon="mdi-heart-pulse" size="18"></v-icon>
        </div>
      </div>

      <div class="d-flex align-baseline justify-space-between my-2">
        <div class="tile-value font-num">
          {{ staminaDecouplingAnalysis.available ? staminaDecouplingAnalysis.decoupling.toFixed(1) : '--' }}
          <span class="tile-unit">%</span>
        </div>
        <div
          class="tile-subvalue"
          :class="staminaDecouplingAnalysis.available ? (staminaDecouplingAnalysis.decoupling < 5 ? 'badge-pill-green' : 'badge-pill-amber') : ''"
        >
          {{ staminaDecouplingAnalysis.available ? staminaDecouplingAnalysis.rating.split(' ')[0] : '15km+走で算出' }}
        </div>
      </div>

      <div class="tile-gauge-wrap mt-auto pt-1">
        <div class="gauge-track">
          <div
            class="gauge-fill"
            :class="staminaDecouplingAnalysis.available && staminaDecouplingAnalysis.decoupling < 5 ? 'fill-emerald' : 'fill-primary'"
            :style="{ width: (staminaDecouplingAnalysis.available ? Math.max(0, 100 - (staminaDecouplingAnalysis.decoupling * 8)) : 0) + '%' }"
          ></div>
        </div>
        <div class="d-flex justify-space-between tile-gauge-meta mt-1.5">
          <span>基準 5.0%未満</span>
          <span class="meta-strong font-num">{{ staminaDecouplingAnalysis.available ? Math.round(Math.max(0, 100 - (staminaDecouplingAnalysis.decoupling * 8))) : 0 }}%</span>
        </div>
      </div>
    </div>
  </div>

  <!-- 2. AI パフォーマンス診断パネル (displayMode が all または diagnosis-only) -->
  <div v-if="displayMode === 'all' || displayMode === 'diagnosis-only'" class="bento-diagnosis-panel d-flex flex-column h-100">
    <!-- ヘッダー -->
    <div class="d-flex align-center justify-space-between mb-3 flex-wrap gap-2">
      <div class="d-flex align-center">
        <span class="panel-title">
          {{ goalLabel }} トレーニング診断
        </span>
      </div>
      <span
        class="status-badge"
        :class="marathonDiagnosis.color === 'success' ? 'status-badge-green' : marathonDiagnosis.color === 'warning' ? 'status-badge-amber' : 'status-badge-slate'"
      >
        {{ marathonDiagnosis.rating }}
      </span>
    </div>

    <!-- 期分けフェーズバナー -->
    <div v-if="raceDiagnosis?.heading" class="phase-banner px-3 py-2 mb-3 rounded-lg d-flex align-center">
      <v-icon color="#3653B3" icon="mdi-compass-outline" size="16" class="mr-2 flex-shrink-0"></v-icon>
      <span class="phase-banner-text text-truncate">
        {{ raceDiagnosis.heading }}
      </span>
    </div>

    <!-- 診断マイクロタブ -->
    <div class="diag-tabs d-flex gap-1 mb-3">
      <button
        type="button"
        class="diag-tab-btn flex-grow-1"
        :class="{ active: activeDiagTab === 'issues' }"
        @click="activeDiagTab = 'issues'"
      >
        課題・アドバイス ({{ marathonDiagnosis.issues.length }})
      </button>
      <button
        type="button"
        class="diag-tab-btn flex-grow-1"
        :class="{ active: activeDiagTab === 'strengths' }"
        @click="activeDiagTab = 'strengths'"
      >
        強み ({{ marathonDiagnosis.strengths.length }})
      </button>
      <button
        type="button"
        class="diag-tab-btn flex-grow-1"
        :class="{ active: activeDiagTab === 'stamina' }"
        @click="activeDiagTab = 'stamina'"
      >
        心肺持久力
      </button>
    </div>

    <!-- タブコンテンツ領域 -->
    <div class="diagnosis-scroll-area flex-grow-1 pr-1">
      <!-- Tab 1: 課題・アクション -->
      <div v-if="activeDiagTab === 'issues'">
        <ul class="diagnosis-compact-list">
          <li
            v-for="(item, idx) in marathonDiagnosis.issues"
            :key="'i-' + idx"
            class="diag-item diag-item-issue"
          >
            <v-icon color="#3653B3" icon="mdi-arrow-right-circle-outline" size="16" class="mr-2 mt-0.5 flex-shrink-0"></v-icon>
            <span>{{ item }}</span>
          </li>
          <li v-if="marathonDiagnosis.issues.length === 0" class="diag-item diag-item-good">
            <v-icon color="#1E7E5C" icon="mdi-check-circle-outline" size="16" class="mr-2 flex-shrink-0"></v-icon>
            <span>目標基準のトレーニング項目をすべてクリアしています！</span>
          </li>
        </ul>
      </div>

      <!-- Tab 2: 強み -->
      <div v-else-if="activeDiagTab === 'strengths'">
        <ul class="diagnosis-compact-list">
          <li
            v-for="(item, idx) in marathonDiagnosis.strengths"
            :key="'s-' + idx"
            class="diag-item diag-item-good"
          >
            <v-icon color="#1E7E5C" icon="mdi-check-circle-outline" size="16" class="mr-2 mt-0.5 flex-shrink-0"></v-icon>
            <span>{{ item }}</span>
          </li>
          <li v-if="marathonDiagnosis.strengths.length === 0" class="empty-note py-6 text-center">
            現在クリア済みの項目はありません。課題タブのメニューから始めましょう。
          </li>
        </ul>
      </div>

      <!-- Tab 3: 心肺デカップリング詳細 -->
      <div v-else-if="activeDiagTab === 'stamina'" class="pa-1">
        <div v-if="!staminaDecouplingAnalysis.available" class="empty-note py-6 text-center">
          {{ staminaDecouplingAnalysis.message }}
        </div>
        <div v-else>
          <div class="d-flex align-center justify-space-between mb-2">
            <span class="stamina-meta text-truncate">
              対象: <strong>{{ staminaDecouplingAnalysis.activityName }}</strong> ({{ staminaDecouplingAnalysis.distance.toFixed(1) }}km)
            </span>
            <span class="status-badge" :class="staminaDecouplingAnalysis.decoupling < 5 ? 'status-badge-green' : 'status-badge-amber'">
              {{ staminaDecouplingAnalysis.rating }}
            </span>
          </div>
          <div class="d-flex align-baseline mb-2.5">
            <span class="stamina-big-num font-num mr-2">{{ staminaDecouplingAnalysis.decoupling }}%</span>
            <span class="stamina-meta">後半の心肺出力低下度 (ドリフト)</span>
          </div>
          <div class="diag-item diag-item-issue">
            <span>{{ staminaDecouplingAnalysis.advice }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'

export default {
  name: 'WorkoutStats',
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
    displayMode: {
      type: String,
      default: 'all'
    },
    upcomingRace: {
      type: Object,
      default: null
    }
  },
  setup(props) {
    const activeDiagTab = ref('issues')

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

    const goalLabel = computed(() => {
      if (props.targetGoal === 'sub4') return 'サブ4'
      if (props.targetGoal === 'sub3.5') return 'サブ3.5'
      return 'サブ3'
    })

    const monthlyGoalDistance = computed(() => {
      if (props.targetGoal === 'sub4') return 150
      if (props.targetGoal === 'sub3.5') return 200
      return 300
    })

    const requiredVDOT = computed(() => {
      if (props.targetGoal === 'sub4') return 38.0
      if (props.targetGoal === 'sub3.5') return 44.8
      return 53.6
    })

    const targetHeartRate = computed(() => {
      if (props.targetGoal === 'sub4') return 145
      if (props.targetGoal === 'sub3.5') return 150
      return 155
    })

    const mPaceRange = computed(() => {
      if (props.targetGoal === 'sub4') {
        return { min: 325, max: 355, paceStr: '5:40' }
      }
      if (props.targetGoal === 'sub3.5') {
        return { min: 285, max: 305, paceStr: '4:55' }
      }
      return { min: 245, max: 265, paceStr: '4:15' }
    })

    const goalPaceLimitLabel = computed(() => {
      if (props.targetGoal === 'sub4') return '(≦5:45)'
      if (props.targetGoal === 'sub3.5') return '(≦5:00)'
      return '(≦4:20)'
    })

    const referenceLatestDate = computed(() => {
      const now = new Date()
      if (props.workouts.length === 0) return now
      const dates = props.workouts.map(w => safeParseDate(w.workoutDate)).filter(d => d.getTime() > 0)
      if (dates.length === 0) return now
      const maxWorkoutDate = new Date(Math.max(...dates))
      const diffDays = (now.getTime() - maxWorkoutDate.getTime()) / (1000 * 60 * 60 * 24)
      return diffDays > 45 ? maxWorkoutDate : now
    })

    const last30DaysDistance = computed(() => {
      if (props.workouts.length === 0) return 0
      const thirtyDaysAgo = new Date(referenceLatestDate.value.getTime())
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      return props.workouts
        .filter(w => {
          const d = safeParseDate(w.workoutDate)
          return d >= thirtyDaysAgo && d <= referenceLatestDate.value
        })
        .reduce((sum, w) => sum + Number(w.distance || 0), 0)
    })

    const calculateVDOT = (distanceKm, durationSeconds) => {
      if (!distanceKm || !durationSeconds || distanceKm <= 0 || durationSeconds <= 0) return 0
      const t = durationSeconds / 60
      const v = (distanceKm * 1000) / t
      const vo2 = -4.60 + 0.182258 * v + 0.000104 * Math.pow(v, 2)
      const percentMax = 0.8 + 0.1894393 * Math.exp(-0.012778 * t) + 0.2989558 * Math.exp(-0.1932605 * t)
      return vo2 / percentMax
    }

    const calculateHeartrateBasedVDOT = (distanceKm, durationSeconds, averageHeartrate, maxHeartrate) => {
      if (!distanceKm || !durationSeconds || distanceKm <= 0 || durationSeconds <= 0) return 0
      const t = durationSeconds / 60
      const v = (distanceKm * 1000) / t
      const vo2 = 0.2 * v + 0.9
      const hrRest = 55
      const hrMax = maxHeartrate && maxHeartrate > 140 ? maxHeartrate : 185
      const hrActive = averageHeartrate && averageHeartrate > 100 ? averageHeartrate : 0
      if (hrActive <= hrRest) {
        return calculateVDOT(distanceKm, durationSeconds)
      }
      const percentVO2Max = (hrActive - hrRest) / (hrMax - hrRest)
      if (percentVO2Max <= 0.3) return 0
      const estimatedVO2Max = vo2 / percentVO2Max
      return Math.min(estimatedVO2Max, 65)
    }

    const estimatedVDOT = computed(() => {
      const dates = props.workouts.map(w => safeParseDate(w.workoutDate)).filter(d => d.getTime() > 0)
      const latestDate = dates.length > 0 ? new Date(Math.max(...dates)) : new Date()

      const fortyDaysAgo = new Date(latestDate.getTime())
      fortyDaysAgo.setDate(fortyDaysAgo.getDate() - 40)

      const points = []
      props.workouts.forEach(w => {
        const date = safeParseDate(w.workoutDate)
        if (date < fortyDaysAgo || date > latestDate) return

        const dist = Number(w.distance || 0)
        if (dist < 3.0 || w.movingTimeSeconds <= 0) return

        let v = 0
        if (w.averageHeartrate && w.averageHeartrate >= 110) {
          v = calculateHeartrateBasedVDOT(dist, w.movingTimeSeconds, w.averageHeartrate, w.maxHeartrate)
        } else {
          v = calculateVDOT(dist, w.movingTimeSeconds || w.durationSeconds)
        }

        if (v >= 30 && v <= 65) {
          points.push({ time: date.getTime(), vdot: v })
        }
      })

      if (points.length === 0) return 0
      points.sort((a, b) => a.time - b.time)

      if (points.length === 1) return Number(points[0].vdot.toFixed(1))
      if (points.length === 2) return Number(((points[0].vdot + points[1].vdot) / 2).toFixed(1))

      const t0 = points[0].time
      const N = points.length
      let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0

      points.forEach(p => {
        const x = (p.time - t0) / (24 * 60 * 60 * 1000)
        const y = p.vdot
        sumX += x
        sumY += y
        sumXY += x * y
        sumXX += x * x
      })

      const denominator = (N * sumXX) - (sumX * sumX)
      let slope = 0
      let intercept = sumY / N

      if (Math.abs(denominator) > 1e-5) {
        slope = ((N * sumXY) - (sumX * sumY)) / denominator
        intercept = (sumY - (slope * sumX)) / N
      }

      const xLatest = (points[N - 1].time - t0) / (24 * 60 * 60 * 1000)
      let trendVDOT = (slope * xLatest) + intercept

      const maxActual = Math.max(...points.map(p => p.vdot))
      const minActual = Math.min(...points.map(p => p.vdot))
      trendVDOT = Math.max(minActual, Math.min(maxActual, trendVDOT))

      const recentPoints = points.filter(p => (points[N - 1].time - p.time) <= 14 * 24 * 60 * 60 * 1000)
      if (recentPoints.length > 0) {
        const recentAvg = recentPoints.reduce((acc, p) => acc + p.vdot, 0) / recentPoints.length
        trendVDOT = Math.max(recentAvg - 2.0, Math.min(recentAvg + 2.0, trendVDOT))
      }

      return Number(trendVDOT.toFixed(1))
    })

    const vdotTable = [
      { vdot: 40, time: 13980 },
      { vdot: 41, time: 13650 },
      { vdot: 42, time: 13334 },
      { vdot: 43, time: 13030 },
      { vdot: 44, time: 12764 },
      { vdot: 45, time: 12506 },
      { vdot: 46, time: 12262 },
      { vdot: 47, time: 12025 },
      { vdot: 48, time: 11795 },
      { vdot: 49, time: 11571 },
      { vdot: 50, time: 11354 },
      { vdot: 51, time: 11143 },
      { vdot: 52, time: 10938 },
      { vdot: 53, time: 10738 },
      { vdot: 54, time: 10543 },
      { vdot: 55, time: 10353 },
      { vdot: 56, time: 10168 },
      { vdot: 57, time: 9988 },
      { vdot: 58, time: 9812 },
      { vdot: 59, time: 9641 },
      { vdot: 60, time: 9474 }
    ]

    const predictedTimeSeconds = computed(() => {
      const vdot = estimatedVDOT.value
      if (vdot < 40) {
        if (vdot <= 0) return 0
        return 14400 * (50 / vdot)
      }
      for (let i = 0; i < vdotTable.length - 1; i++) {
        const current = vdotTable[i]
        const next = vdotTable[i + 1]
        if (vdot >= current.vdot && vdot <= next.vdot) {
          const ratio = (vdot - current.vdot) / (next.vdot - current.vdot)
          return Math.round(current.time + ratio * (next.time - current.time))
        }
      }
      return 9474 * (60 / vdot)
    })

    const formattedPredictedTime = computed(() => {
      const seconds = predictedTimeSeconds.value
      if (!seconds) return '--'
      const hrs = Math.floor(seconds / 3600)
      const mins = Math.floor((seconds % 3600) / 60)
      const secs = seconds % 60
      return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
    })

    const targetPaceMaxDistance = computed(() => {
      let limitSeconds = 260
      if (props.targetGoal === 'sub4') {
        limitSeconds = 345
      } else if (props.targetGoal === 'sub3.5') {
        limitSeconds = 300
      }

      const matchingRuns = props.workouts.filter(w => w.averagePaceSeconds > 0 && w.averagePaceSeconds <= limitSeconds)
      if (matchingRuns.length === 0) return { distance: 0, date: '' }
      
      const sorted = [...matchingRuns].sort((a, b) => Number(b.distance) - Number(a.distance))
      return {
        distance: Number(sorted[0].distance),
        date: sorted[0].workoutDate.split(' ')[0]
      }
    })

    const heartEfficiency = computed(() => {
      const validRuns = props.workouts.filter(w => 
        Number(w.distance || 0) >= 5.0 && 
        w.movingTimeSeconds > 0 && 
        w.averageHeartrate && 
        w.averageHeartrate > 80
      )
      if (validRuns.length === 0) return 0
      const totalEff = validRuns.reduce((sum, w) => {
        const totalBeats = w.averageHeartrate * (w.movingTimeSeconds / 60)
        const meters = w.distance * 1000
        return sum + (meters / totalBeats)
      }, 0)
      return totalEff / validRuns.length
    })

    const averageHeartRate = computed(() => {
      const validRuns = props.workouts.filter(w => w.averageHeartrate && w.averageHeartrate > 80)
      if (validRuns.length === 0) return 0
      return validRuns.reduce((sum, w) => sum + w.averageHeartrate, 0) / validRuns.length
    })

    const longRunsCount = computed(() => {
      if (props.workouts.length === 0) return { over30k: 0, over20k: 0 }
      const thirtyDaysAgo = new Date(referenceLatestDate.value.getTime())
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      const recentWorkouts = props.workouts.filter(w => {
        const d = safeParseDate(w.workoutDate)
        return d >= thirtyDaysAgo && d <= referenceLatestDate.value
      })
      const over30k = recentWorkouts.filter(w => Number(w.distance) >= 30.0).length
      const over20k = recentWorkouts.filter(w => Number(w.distance) >= 20.0 && Number(w.distance) < 30.0).length
      
      return { over30k, over20k }
    })

    const mPaceStats = computed(() => {
      const range = mPaceRange.value
      const mPaceRuns = props.workouts.filter(w => 
        w.averagePaceSeconds >= range.min && 
        w.averagePaceSeconds <= range.max && 
        Number(w.distance) >= 5.0
      )
      if (mPaceRuns.length === 0) return null
      const totalHeartrate = mPaceRuns.reduce((sum, w) => sum + (w.averageHeartrate || 0), 0)
      const validHeartrateRuns = mPaceRuns.filter(w => (w.averageHeartrate || 0) > 0).length
      const avgHeartrate = validHeartrateRuns > 0 ? Math.round(totalHeartrate / validHeartrateRuns) : null
      const maxDist = Math.max(...mPaceRuns.map(w => Number(w.distance)), 0)
      return { avgHeartrate, maxDist, count: mPaceRuns.length }
    })

    // 実際の現在日付を基準に大会までの残り日数を計算
    const raceDiagnosis = computed(() => {
      const race = props.upcomingRace
      const now = new Date()
      now.setHours(0, 0, 0, 0)
      
      if (!race) {
        const G = monthlyGoalDistance.value
        const D = last30DaysDistance.value
        const gap = Math.max(0, G - D)
        const weeklyTarget = gap > 0 ? gap : G / 4
        const advice = gap > 0
          ? `今週はあと${weeklyTarget.toFixed(1)}kmを目標に走りましょう。`
          : `月間目標${G}kmクリア！今週は週平均${weeklyTarget.toFixed(1)}kmを目安に調整しましょう。`
        return {
          mode: 'VOLUME_ADJUSTMENT',
          heading: 'ベースアップ期（走行ボリューム構築）',
          advice
        }
      }
      
      const parts = race.date.split('-')
      const raceDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10))
      const diffTime = raceDate.getTime() - now.getTime()
      const diffDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
      
      if (diffDays >= 91) {
        const G = monthlyGoalDistance.value
        const D = last30DaysDistance.value
        const gap = Math.max(0, G - D)
        const weeklyTarget = gap > 0 ? gap : G / 4
        const advice = gap > 0
          ? `今週はあと${weeklyTarget.toFixed(1)}kmを目標に走りましょう。`
          : `月間目標${G}kmクリア！今週は週平均${weeklyTarget.toFixed(1)}kmを目安に調整しましょう。`
        return {
          mode: 'VOLUME_ADJUSTMENT',
          heading: 'ベースアップ期（走行ボリューム構築）',
          advice
        }
      } else {
        const weeksRemaining = Math.max(0, Math.ceil(diffDays / 7))
        let phaseName = ''
        let advice = ''
        
        if (weeksRemaining >= 9) {
          phaseName = '鍛錬期（脚作り）'
          advice = '基礎スタミナの構築期間です。週末に20〜25kmのロングジョグを入れましょう。'
        } else if (weeksRemaining >= 5) {
          phaseName = '実戦強化期'
          advice = '最重要時期です！週末に30kmロングランを計画し、平日は目標ペース5km走を入れてください。'
        } else if (weeksRemaining >= 2) {
          phaseName = '調整期（テーパリング）'
          advice = '走行量を落とし疲労を抜く時期です。週末は20kmをレースペースで走りましょう。'
        } else {
          phaseName = '直前期'
          advice = '完全な疲労回復に努めましょう。レース3日前に3kmの刺激入れのみで十分です。'
        }
        
        return {
          mode: 'PERIODIZATION',
          heading: `${race.name} あと${diffDays}日（${weeksRemaining}週）｜ ${phaseName}`,
          advice
        }
      }
    })

    const marathonDiagnosis = computed(() => {
      const strengths = []
      const issues = []
      const label = goalLabel.value
      const targetDist = monthlyGoalDistance.value
      const targetHR = targetHeartRate.value
      const range = mPaceRange.value
      
      const dist30d = last30DaysDistance.value
      if (dist30d >= targetDist) {
        strengths.push(`直近30日走行距離が${targetDist}km以上あり、${label}達成に向けた強固な有酸素ベースがあります。`)
      } else if (dist30d >= targetDist * 0.8) {
        strengths.push(`直近30日走行距離は${dist30d.toFixed(1)}km。目標${targetDist}kmへあと一歩です。`)
      } else {
        issues.push(`直近30日走行距離が${dist30d.toFixed(1)}kmと少なめです。月間${targetDist}km付近を安定させましょう。`)
      }
      
      const lr = longRunsCount.value
      if (props.targetGoal === 'sub3') {
        if (lr.over30k >= 1) {
          strengths.push(`直近30日に30km以上の距離走をクリアし、後半の脚耐性ができています。`)
        } else {
          issues.push('直近30日以内に30km走の実績がありません。レース3〜4週前までに1〜2回実施を推奨します。')
        }
        if (lr.over20k >= 3) {
          strengths.push(`20km以上の距離走を${lr.over20k}回消化し、高い持久力を維持しています。`)
        } else if (lr.over20k < 2) {
          issues.push('20〜25kmの中距離走の頻度が不足しています。週末のロングジョグを増やしましょう。')
        }
      } else if (props.targetGoal === 'sub3.5') {
        if (lr.over30k >= 1) {
          strengths.push(`直近30日に30km以上のロングランをクリアし、スタミナは十分です。`)
        } else if (lr.over20k >= 2) {
          strengths.push(`20〜29kmのロングランを${lr.over20k}回消化し、良好な脚耐久性が作られています。`)
        } else {
          issues.push('後半の失速を防ぐため、20〜25km以上の距離走を月2回以上に増やしましょう。')
        }
      } else {
        if (lr.over30k >= 1 || lr.over20k >= 1) {
          strengths.push(`20km以上のロングランをクリアし、サブ4突破の持久力が育っています。`)
        } else {
          issues.push('週末に15〜20km程度のロングジョグを取り入れて後半歩かない脚を作りましょう。')
        }
      }
      
      const mp = mPaceStats.value
      if (mp) {
        const diffHR = mp.avgHeartrate ? mp.avgHeartrate - targetHR : 0
        if (mp.avgHeartrate && mp.avgHeartrate <= targetHR) {
          strengths.push(`${label}ペース（${range.paceStr}/km付近）での平均心拍が${mp.avgHeartrate}bpm（≦${targetHR}bpm）と極めて低燃費です。`)
        } else if (mp.avgHeartrate) {
          issues.push(`${label}ペース時の平均心拍が${mp.avgHeartrate}bpmと上限（${targetHR}bpm）を+${diffHR}bpm超過。有酸素ジョグを強化しましょう。`)
        }
        
        let targetMdist = 15.0
        if (props.targetGoal === 'sub4') targetMdist = 10.0
        if (props.targetGoal === 'sub3') targetMdist = 20.0

        if (mp.maxDist >= targetMdist) {
          strengths.push(`目標ペースで最長${mp.maxDist.toFixed(1)}km（基準${targetMdist}km）をクリア済みです。`)
        } else {
          issues.push(`目標ペース最長距離が${mp.maxDist.toFixed(1)}kmです。${targetMdist}km程度まで伸ばして慣らしましょう。`)
        }
      } else {
        issues.push(`${label}ペース（${range.paceStr}/km付近）での5km以上の練習がありません。Mペース走を追加しましょう。`)
      }
      
      let rating = `${label} 準備不足 (C)`
      let color = 'error'
      const strengthPoints = strengths.length
      const issuePoints = issues.length
      
      if (strengthPoints >= 3 && issuePoints === 0) {
        rating = `${label} 合格圏 (S)`
        color = 'success'
      } else if (strengthPoints >= 2 && issuePoints <= 1) {
        rating = `${label} 射程圏 (A)`
        color = 'success'
      } else if (strengthPoints >= 1 && issuePoints <= 2) {
        rating = `${label} 挑戦圏 (B)`
        color = 'warning'
      }
      
      if (raceDiagnosis.value && raceDiagnosis.value.advice) {
        issues.unshift(raceDiagnosis.value.advice)
      }
      
      return { strengths, issues, rating, color }
    })

    const goalLongRunLimit = computed(() => {
      if (props.targetGoal === 'sub4') return 20
      if (props.targetGoal === 'sub3.5') return 25
      return 30
    })

    const targetEI = computed(() => {
      if (props.targetGoal === 'sub4') return 1.10
      if (props.targetGoal === 'sub3.5') return 1.30
      return 1.55
    })

    const staminaDecouplingAnalysis = computed(() => {
      const longRuns = props.workouts.filter(w => 
        Number(w.distance) >= 15.0 && 
        w.splits && 
        w.splits.length >= 6 && 
        w.splits.every(s => s.averageHeartrate > 0)
      )

      if (longRuns.length === 0) {
        return {
          available: false,
          message: '15km以上の距離走（心拍データ付き）が同期されると心肺ドリフト分析が表示されます。'
        }
      }

      const latestRun = [...longRuns].sort((a, b) => safeParseDate(b.workoutDate) - safeParseDate(a.workoutDate))[0]
      const splits = latestRun.splits
      const n = splits.length
      const mid = Math.floor(n / 2)

      const firstHalf = splits.slice(0, mid)
      const secondHalf = splits.slice(mid)

      const firstTimeSec = firstHalf.reduce((sum, s) => sum + (s.movingTime || s.elapsedTime), 0)
      const firstAvgHR = firstHalf.reduce((sum, s) => sum + s.averageHeartrate, 0) / mid
      const firstSpeed = (mid * 1000) / (firstTimeSec / 60)
      const firstEF = firstSpeed / firstAvgHR

      const secondTimeSec = secondHalf.reduce((sum, s) => sum + (s.movingTime || s.elapsedTime), 0)
      const secondAvgHR = secondHalf.reduce((sum, s) => sum + s.averageHeartrate, 0) / (n - mid)
      const secondSpeed = ((n - mid) * 1000) / (secondTimeSec / 60)
      const secondEF = secondSpeed / secondAvgHR

      const decoupling = ((firstEF - secondEF) / firstEF) * 100

      let rating = ''
      let color = ''
      let advice = ''

      if (decoupling < 5.0) {
        rating = '優良 (スタミナ十分)'
        color = 'success'
        advice = '長距離走でも心肺ドリフトが5%未満に抑えられており、レース後半の失速リスクは非常に低いです。'
      } else if (decoupling <= 10.0) {
        rating = '標準 (構築中)'
        color = 'warning'
        advice = '後半に5〜10%の心拍上昇が見られます。低強度（心拍130〜140台）のLSDを取り入れると後半の余裕度が増します。'
      } else {
        rating = '要改善 (スタミナ不足)'
        color = 'error'
        advice = '後半の心拍ドリフトが10%超です。30km以降の失速を防ぐため、ペースを落とした距離ジョグで有酸素基盤を育てましょう。'
      }

      return {
        available: true,
        activityName: latestRun.activityName,
        workoutDate: latestRun.workoutDate.split(' ')[0],
        distance: latestRun.distance,
        decoupling: Number(decoupling.toFixed(1)),
        rating,
        color,
        advice
      }
    })

    return {
      activeDiagTab,
      last30DaysDistance,
      estimatedVDOT,
      predictedTimeSeconds,
      formattedPredictedTime,
      heartEfficiency,
      averageHeartRate,
      longRunsCount,
      mPaceStats,
      raceDiagnosis,
      marathonDiagnosis,
      goalLabel,
      monthlyGoalDistance,
      requiredVDOT,
      targetHeartRate,
      goalPaceLimitLabel,
      targetPaceMaxDistance,
      goalLongRunLimit,
      targetEI,
      staminaDecouplingAnalysis
    }
  }
}
</script>

<style scoped>
/* 5カラム均等グリッド */
.kpi-five-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
}

@media (max-width: 1200px) {
  .kpi-five-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 700px) {
  .kpi-five-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.bento-stat-tile {
  background: #F2F4F8;
  border: 1px solid #D5DBE3;
  border-radius: 16px;
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.bento-stat-tile:hover {
  transform: translateY(-2px);
  border-color: #B8C4D4;
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.06);
}

.tile-eyebrow {
  font-size: 0.64rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: #526071;
  line-height: 1.1;
  margin-bottom: 4px;
}

.tile-label {
  font-size: 0.78rem;
  font-weight: 600;
  color: #334155;
  line-height: 1.25;
}

.tile-icon-badge {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: #E4EAF5;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.tile-value {
  font-size: 1.75rem;
  font-weight: 800;
  color: #1E293B;
  line-height: 1.05;
}

.tile-unit {
  font-size: 0.78rem;
  font-weight: 600;
  color: #526071;
  margin-left: 2px;
}

.tile-subvalue {
  font-size: 0.72rem;
  font-weight: 600;
  color: #526071;
  white-space: nowrap;
}

.badge-pill-blue {
  background: #E4EAF5;
  color: #2B4494;
  padding: 3px 8px;
  border-radius: 6px;
  font-weight: 700;
}

.badge-pill-green {
  background: #E2EFE9;
  color: #166548;
  padding: 3px 8px;
  border-radius: 6px;
  font-weight: 700;
}

.badge-pill-amber {
  background: #F5ECE0;
  color: #9A5B13;
  padding: 3px 8px;
  border-radius: 6px;
  font-weight: 700;
}

.gauge-track {
  height: 6px;
  background: #DCE2EC;
  border-radius: 99px;
  overflow: hidden;
}

.gauge-fill {
  height: 100%;
  border-radius: 99px;
  transition: width 0.4s cubic-bezier(0.22, 1, 0.36, 1);
}

.fill-primary {
  background: #3653B3;
}

.fill-emerald {
  background: #1E7E5C;
}

.tile-gauge-meta {
  font-size: 0.7rem;
  color: #526071;
  line-height: 1.1;
}

.meta-strong {
  color: #1E293B;
  font-weight: 700;
}

/* AI Diagnosis Panel */
.bento-diagnosis-panel {
  background: #F2F4F8;
  border: 1px solid #D5DBE3;
  border-radius: 16px;
  padding: 20px 22px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}

.panel-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: #1E293B;
  letter-spacing: -0.01em;
}

.status-badge {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 99px;
}

.status-badge-green {
  background: #E2EFE9;
  color: #166548;
  border: 1px solid #B4D6C6;
}

.status-badge-amber {
  background: #F5ECE0;
  color: #9A5B13;
  border: 1px solid #E5CEB0;
}

.status-badge-slate {
  background: #E2E7EE;
  color: #475569;
  border: 1px solid #D1D8E2;
}

.phase-banner {
  background: #E8ECF2;
  border: 1px solid #D5DBE3;
}

.phase-banner-text {
  font-size: 0.76rem;
  font-weight: 600;
  color: #1E293B;
}

.diag-tabs {
  background: #E2E7EE;
  padding: 4px;
  border-radius: 10px;
}

.diag-tab-btn {
  border: none;
  background: transparent;
  color: #526071;
  font-size: 0.72rem;
  font-weight: 600;
  padding: 6px 8px;
  border-radius: 7px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.diag-tab-btn.active {
  background: #F8FAFC;
  color: #1E293B;
  font-weight: 700;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
}

.diagnosis-scroll-area {
  max-height: 235px;
  overflow-y: auto;
}

.diagnosis-compact-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.diag-item {
  font-size: 0.78rem;
  line-height: 1.55;
  color: #334155;
  padding: 10px 12px;
  border-radius: 10px;
  display: flex;
  align-items: flex-start;
}

.diag-item-issue {
  background: #E8ECF2;
  border: 1px solid #D5DBE3;
}

.diag-item-good {
  background: #E2EFE9;
  border: 1px solid #B4D6C6;
}

.empty-note {
  font-size: 0.78rem;
  color: #526071;
}

.stamina-meta {
  font-size: 0.76rem;
  color: #475569;
}

.stamina-big-num {
  font-size: 1.75rem;
  font-weight: 800;
  color: #1E293B;
}
</style>
