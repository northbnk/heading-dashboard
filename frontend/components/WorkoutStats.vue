<template>
  <!-- 1. 6項目テレメトリ・リボン (Bento KPI Strip) -->
  <v-row v-if="displayMode === 'all' || displayMode === 'stats-only'" dense class="bento-kpi-row">
    <!-- Tile 1: 直近30日間の走行距離 -->
    <v-col cols="6" sm="4" lg="2" class="d-flex">
      <div class="bento-stat-tile w-100 accent-indigo">
        <div class="d-flex justify-space-between align-start mb-1">
          <div>
            <div class="tile-eyebrow text-indigo-lighten-2">30D VOLUME</div>
            <div class="tile-label">直近30日走行距離</div>
          </div>
          <div class="tile-icon-badge bg-indigo-subtle">
            <v-icon color="primary" icon="mdi-calendar-range" size="16"></v-icon>
          </div>
        </div>

        <div class="d-flex align-baseline justify-space-between my-1">
          <div class="tile-value text-white font-outfit">
            {{ last30DaysDistance.toFixed(1) }}
            <span class="tile-unit">km</span>
          </div>
          <div class="tile-subvalue text-indigo-lighten-2">
            目標 {{ monthlyGoalDistance }}km
          </div>
        </div>

        <div class="tile-gauge-wrap mt-auto">
          <v-progress-linear
            :model-value="Math.min((last30DaysDistance / monthlyGoalDistance) * 100, 100)"
            color="primary"
            height="6"
            rounded
          ></v-progress-linear>
          <div class="d-flex justify-space-between tile-gauge-meta mt-1">
            <span>達成率</span>
            <span class="text-white font-weight-bold">{{ Math.round(Math.min((last30DaysDistance / monthlyGoalDistance) * 100, 100)) }}%</span>
          </div>
        </div>
      </div>
    </v-col>

    <!-- Tile 2: 推定VDOT & 予測タイム -->
    <v-col cols="6" sm="4" lg="2" class="d-flex">
      <div class="bento-stat-tile w-100 accent-emerald">
        <div class="d-flex justify-space-between align-start mb-1">
          <div>
            <div class="tile-eyebrow text-emerald">EST. VDOT</div>
            <div class="tile-label">推定VDOT・予測</div>
          </div>
          <div class="tile-icon-badge bg-emerald-subtle">
            <v-icon color="success" icon="mdi-chart-bell-curve-cumulative" size="16"></v-icon>
          </div>
        </div>

        <div class="d-flex align-baseline justify-space-between my-1">
          <div class="tile-value text-success font-outfit">
            {{ estimatedVDOT > 0 ? estimatedVDOT.toFixed(1) : '--' }}
          </div>
          <div class="tile-subvalue text-emerald" v-if="estimatedVDOT > 0">
            {{ formattedPredictedTime }}
          </div>
        </div>

        <div class="tile-gauge-wrap mt-auto">
          <v-progress-linear
            :model-value="Math.min((estimatedVDOT / requiredVDOT) * 100, 100)"
            color="success"
            height="6"
            rounded
          ></v-progress-linear>
          <div class="d-flex justify-space-between tile-gauge-meta mt-1">
            <span>要求 {{ requiredVDOT.toFixed(1) }}</span>
            <span class="text-white font-weight-bold">{{ estimatedVDOT > 0 ? Math.round(Math.min((estimatedVDOT / requiredVDOT) * 100, 100)) : 0 }}%</span>
          </div>
        </div>
      </div>
    </v-col>

    <!-- Tile 3: 目標ペース最長距離 -->
    <v-col cols="6" sm="4" lg="2" class="d-flex">
      <div class="bento-stat-tile w-100 accent-cyan">
        <div class="d-flex justify-space-between align-start mb-1">
          <div>
            <div class="tile-eyebrow text-cyan">M-PACE MAX</div>
            <div class="tile-label">{{ goalLabel }}ペース最長 {{ goalPaceLimitLabel }}</div>
          </div>
          <div class="tile-icon-badge bg-cyan-subtle">
            <v-icon color="secondary" icon="mdi-run-fast" size="16"></v-icon>
          </div>
        </div>

        <div class="d-flex align-baseline justify-space-between my-1">
          <div class="tile-value text-secondary font-outfit">
            {{ targetPaceMaxDistance.distance > 0 ? targetPaceMaxDistance.distance.toFixed(1) : '--' }}
            <span class="tile-unit">km</span>
          </div>
          <div class="tile-subvalue text-grey-lighten-1" v-if="targetPaceMaxDistance.date">
            {{ targetPaceMaxDistance.date.substring(5).replace('-', '/') }}
          </div>
        </div>

        <div class="tile-gauge-wrap mt-auto">
          <v-progress-linear
            :model-value="Math.min((targetPaceMaxDistance.distance / goalLongRunLimit) * 100, 100)"
            color="secondary"
            height="6"
            rounded
          ></v-progress-linear>
          <div class="d-flex justify-space-between tile-gauge-meta mt-1">
            <span>目標 {{ goalLongRunLimit }}km</span>
            <span class="text-white font-weight-bold">{{ targetPaceMaxDistance.distance > 0 ? Math.round(Math.min((targetPaceMaxDistance.distance / goalLongRunLimit) * 100, 100)) : 0 }}%</span>
          </div>
        </div>
      </div>
    </v-col>

    <!-- Tile 4: ランニング心拍効率 -->
    <v-col cols="6" sm="4" lg="2" class="d-flex">
      <div class="bento-stat-tile w-100 accent-violet">
        <div class="d-flex justify-space-between align-start mb-1">
          <div>
            <div class="tile-eyebrow text-violet">EFFICIENCY</div>
            <div class="tile-label">心拍効率 (EI)</div>
          </div>
          <div class="tile-icon-badge bg-violet-subtle">
            <v-icon color="accent" icon="mdi-heart-flash" size="16"></v-icon>
          </div>
        </div>

        <div class="d-flex align-baseline justify-space-between my-1">
          <div class="tile-value text-white font-outfit">
            {{ heartEfficiency > 0 ? heartEfficiency.toFixed(2) : '--' }}
            <span class="tile-unit">m/b</span>
          </div>
          <div class="tile-subvalue text-violet" v-if="averageHeartRate > 0">
            平均 {{ Math.round(averageHeartRate) }}bpm
          </div>
        </div>

        <div class="tile-gauge-wrap mt-auto">
          <v-progress-linear
            :model-value="Math.min((heartEfficiency / targetEI) * 100, 100)"
            color="accent"
            height="6"
            rounded
          ></v-progress-linear>
          <div class="d-flex justify-space-between tile-gauge-meta mt-1">
            <span>目標 {{ targetEI.toFixed(2) }}</span>
            <span class="text-white font-weight-bold">{{ heartEfficiency > 0 ? Math.round(Math.min((heartEfficiency / targetEI) * 100, 100)) : 0 }}%</span>
          </div>
        </div>
      </div>
    </v-col>

    <!-- Tile 5: 心肺デカップリング値 -->
    <v-col cols="6" sm="4" lg="2" class="d-flex">
      <div class="bento-stat-tile w-100 accent-purple">
        <div class="d-flex justify-space-between align-start mb-1">
          <div>
            <div class="tile-eyebrow text-purple">AEROBIC DRIFT</div>
            <div class="tile-label">心肺デカップリング</div>
          </div>
          <div class="tile-icon-badge bg-purple-subtle">
            <v-icon color="deep-purple-accent-2" icon="mdi-heart-pulse" size="16"></v-icon>
          </div>
        </div>

        <div class="d-flex align-baseline justify-space-between my-1">
          <div class="tile-value text-white font-outfit">
            {{ staminaDecouplingAnalysis.available ? staminaDecouplingAnalysis.decoupling.toFixed(1) : '--' }}
            <span class="tile-unit">%</span>
          </div>
          <div class="tile-subvalue" :class="staminaDecouplingAnalysis.available ? `text-${staminaDecouplingAnalysis.color}` : 'text-grey'">
            {{ staminaDecouplingAnalysis.available ? staminaDecouplingAnalysis.rating.split(' ')[0] : '15km+走で算出' }}
          </div>
        </div>

        <div class="tile-gauge-wrap mt-auto">
          <v-progress-linear
            :model-value="staminaDecouplingAnalysis.available ? Math.max(0, 100 - (staminaDecouplingAnalysis.decoupling * 8)) : 0"
            color="deep-purple-accent-2"
            height="6"
            rounded
          ></v-progress-linear>
          <div class="d-flex justify-space-between tile-gauge-meta mt-1">
            <span>基準 &lt;5.0%</span>
            <span class="text-white font-weight-bold">{{ staminaDecouplingAnalysis.available ? Math.round(Math.max(0, 100 - (staminaDecouplingAnalysis.decoupling * 8))) : 0 }}%</span>
          </div>
        </div>
      </div>
    </v-col>

    <!-- Tile 6: メインシューズ走行距離 -->
    <v-col cols="6" sm="4" lg="2" class="d-flex">
      <div class="bento-stat-tile w-100 accent-amber">
        <div class="d-flex justify-space-between align-start mb-1">
          <div class="overflow-hidden pr-1">
            <div class="tile-eyebrow text-amber">MAIN GEAR</div>
            <div class="tile-label text-truncate">{{ mainShoe.name || 'メインシューズ' }}</div>
          </div>
          <div class="flex-shrink-0">
            <ShoeIcon :name="mainShoe.name" :size="32" v-if="mainShoe.name"></ShoeIcon>
            <div class="tile-icon-badge bg-amber-subtle" v-else>
              <v-icon color="warning" icon="mdi-shoe-run" size="16"></v-icon>
            </div>
          </div>
        </div>

        <div class="d-flex align-baseline justify-space-between my-1">
          <div class="tile-value text-warning font-outfit">
            {{ mainShoe.distance > 0 ? mainShoe.distance.toFixed(0) : '--' }}
            <span class="tile-unit">km</span>
          </div>
          <div class="tile-subvalue text-grey-lighten-1">
            寿命 600km
          </div>
        </div>

        <div class="tile-gauge-wrap mt-auto">
          <v-progress-linear
            :model-value="mainShoe.lifePercent"
            :color="mainShoe.color"
            height="6"
            rounded
          ></v-progress-linear>
          <div class="d-flex justify-space-between tile-gauge-meta mt-1">
            <span>摩耗度</span>
            <span class="text-white font-weight-bold">{{ mainShoe.distance > 0 ? Math.round(mainShoe.lifePercent) : 0 }}%</span>
          </div>
        </div>
      </div>
    </v-col>
  </v-row>

  <!-- 2. コンパクトAI診断コックピットカード (displayMode が all または diagnosis-only) -->
  <div v-if="displayMode === 'all' || displayMode === 'diagnosis-only'" class="bento-diagnosis-panel d-flex flex-column h-100">
    <!-- ヘッダー -->
    <div class="d-flex align-center justify-space-between mb-2 flex-wrap gap-1">
      <div class="d-flex align-center">
        <div class="cockpit-dot bg-secondary mr-2"></div>
        <span class="text-subtitle-2 font-weight-black text-white tracking-wide">
          {{ goalLabel }} AI パフォーマンス診断
        </span>
      </div>
      <v-chip
        :color="marathonDiagnosis.color"
        variant="flat"
        size="x-small"
        class="font-weight-black px-2 text-black"
      >
        {{ marathonDiagnosis.rating }}
      </v-chip>
    </div>

    <!-- 期分けフェーズバナー -->
    <div v-if="raceDiagnosis?.heading" class="phase-banner px-2.5 py-1.5 mb-2 rounded-lg d-flex align-center justify-space-between">
      <div class="d-flex align-center overflow-hidden">
        <v-icon color="secondary" icon="mdi-compass-rose" size="14" class="mr-1.5 flex-shrink-0"></v-icon>
        <span class="text-caption font-weight-bold text-white text-truncate" style="font-size: 0.72rem;">
          {{ raceDiagnosis.heading }}
        </span>
      </div>
    </div>

    <!-- 診断マイクロタブ -->
    <div class="cockpit-tabs d-flex gap-1 mb-2 p-1 rounded-lg">
      <button
        type="button"
        class="cockpit-tab-btn flex-grow-1"
        :class="{ active: activeDiagTab === 'issues' }"
        @click="activeDiagTab = 'issues'"
      >
        <v-icon icon="mdi-target-Account" size="12" class="mr-1"></v-icon>
        課題・指示 ({{ marathonDiagnosis.issues.length }})
      </button>
      <button
        type="button"
        class="cockpit-tab-btn flex-grow-1"
        :class="{ active: activeDiagTab === 'strengths' }"
        @click="activeDiagTab = 'strengths'"
      >
        <v-icon icon="mdi-check-decagram" size="12" class="mr-1"></v-icon>
        強み ({{ marathonDiagnosis.strengths.length }})
      </button>
      <button
        type="button"
        class="cockpit-tab-btn flex-grow-1"
        :class="{ active: activeDiagTab === 'stamina' }"
        @click="activeDiagTab = 'stamina'"
      >
        <v-icon icon="mdi-heart-pulse" size="12" class="mr-1"></v-icon>
        心肺持久力
      </button>
    </div>

    <!-- タブコンテンツ領域 (スクロール可能なコンパクトビュー) -->
    <div class="diagnosis-scroll-area flex-grow-1 pr-1">
      <!-- Tab 1: 課題・アクション -->
      <div v-if="activeDiagTab === 'issues'">
        <ul class="diagnosis-compact-list">
          <li
            v-for="(item, idx) in marathonDiagnosis.issues"
            :key="'i-' + idx"
            class="diag-item diag-item-warning"
          >
            <v-icon color="warning" icon="mdi-chevron-right-circle" size="14" class="mr-1.5 mt-0.5 flex-shrink-0"></v-icon>
            <span>{{ item }}</span>
          </li>
          <li v-if="marathonDiagnosis.issues.length === 0" class="diag-item diag-item-success">
            <v-icon color="success" icon="mdi-check-all" size="15" class="mr-1.5 flex-shrink-0"></v-icon>
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
            class="diag-item diag-item-success"
          >
            <v-icon color="success" icon="mdi-check-circle" size="14" class="mr-1.5 mt-0.5 flex-shrink-0"></v-icon>
            <span>{{ item }}</span>
          </li>
          <li v-if="marathonDiagnosis.strengths.length === 0" class="text-grey text-caption py-4 text-center">
            現在クリア済みの項目はありません。課題タブのメニューから始めましょう。
          </li>
        </ul>
      </div>

      <!-- Tab 3: 心肺デカップリング詳細 -->
      <div v-else-if="activeDiagTab === 'stamina'" class="pa-1">
        <div v-if="!staminaDecouplingAnalysis.available" class="text-grey text-caption py-4 text-center">
          {{ staminaDecouplingAnalysis.message }}
        </div>
        <div v-else>
          <div class="d-flex align-center justify-space-between mb-1.5">
            <span class="text-caption text-grey-lighten-1 text-truncate">
              対象: <strong class="text-white">{{ staminaDecouplingAnalysis.activityName }}</strong> ({{ staminaDecouplingAnalysis.distance.toFixed(1) }}km)
            </span>
            <v-chip :color="staminaDecouplingAnalysis.color" size="x-small" variant="flat" class="font-weight-bold text-black">
              {{ staminaDecouplingAnalysis.rating }}
            </v-chip>
          </div>
          <div class="d-flex align-baseline mb-2">
            <span class="text-h5 font-weight-black text-white font-outfit mr-2">{{ staminaDecouplingAnalysis.decoupling }}%</span>
            <span class="text-caption text-grey">後半の心肺出力低下度 (ドリフト)</span>
          </div>
          <div class="diag-item diag-item-info">
            <span>{{ staminaDecouplingAnalysis.advice }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import ShoeIcon from './ShoeIcon.vue'

export default {
  name: 'WorkoutStats',
  components: {
    ShoeIcon
  },
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
      default: 'all' // 'all', 'stats-only', 'diagnosis-only'
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

    // 最新のワークアウト日を基準に直近30日を計算（古いデモデータでも0にならないよう配慮）
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
      const latestDate = dates.length > 0 ? new Date(Math.max(...dates)) : new Date('2026-07-05')

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

    const raceDiagnosis = computed(() => {
      const race = props.upcomingRace
      const BASE_DATE = new Date('2026-07-05')
      
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
      
      const raceTime = new Date(race.date).getTime()
      const diffTime = raceTime - BASE_DATE.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
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
          heading: `${race.name} あと${weeksRemaining}週 ｜ ${phaseName}`,
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

    const shoeAnalytics = computed(() => {
      const shoesMap = new Map()
      props.workouts.forEach(w => {
        if (w.gearName) {
          const name = w.gearName
          if (!shoesMap.has(name)) {
            shoesMap.set(name, {
              name,
              totalDistance: 0,
              totalRuns: 0,
              totalPaceSum: 0,
              totalHRSum: 0,
              hrCount: 0
            })
          }
          const s = shoesMap.get(name)
          s.totalDistance += Number(w.distance || 0)
          s.totalRuns += 1
          if (w.averagePaceSeconds > 0) s.totalPaceSum += w.averagePaceSeconds
          if (w.averageHeartrate > 0) {
            s.totalHRSum += w.averageHeartrate
            s.hrCount += 1
          }
        }
      })

      if (shoesMap.size === 0) return { available: false, shoes: [] }

      const shoes = Array.from(shoesMap.values()).map(s => {
        const avgPaceSec = Math.round(s.totalPaceSum / s.totalRuns)
        const avgHR = s.hrCount > 0 ? Math.round(s.totalHRSum / s.hrCount) : null
        const mins = Math.floor(avgPaceSec / 60)
        const secs = avgPaceSec % 60
        const paceStr = `${mins}:${String(secs).padStart(2, '0')}`
        const lifeLimit = 600
        const lifePercent = Math.min((s.totalDistance / lifeLimit) * 100, 100)
        
        let color = 'success'
        let status = '良好'
        if (s.totalDistance >= 500) {
          color = 'error'
          status = '交換推奨'
        } else if (s.totalDistance >= 400) {
          color = 'warning'
          status = '摩耗注意'
        }

        return {
          name: s.name,
          distance: Number(s.totalDistance.toFixed(1)),
          runs: s.totalRuns,
          paceStr,
          avgHR,
          lifePercent: Math.round(lifePercent),
          color,
          status
        }
      }).sort((a, b) => b.distance - a.distance)

      return { available: true, shoes }
    })

    const mainShoe = computed(() => {
      const stats = shoeAnalytics.value
      if (!stats.available || stats.shoes.length === 0) {
        return { name: '', distance: 0, lifePercent: 0, color: 'grey', status: '未登録' }
      }
      return stats.shoes[0]
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
      staminaDecouplingAnalysis,
      shoeAnalytics,
      mainShoe
    }
  }
}
</script>

<style scoped>
.bento-stat-tile {
  background: linear-gradient(160deg, rgba(22, 25, 38, 0.92) 0%, rgba(14, 16, 26, 0.95) 100%);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 14px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
  overflow: hidden;
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

.bento-stat-tile::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  opacity: 0.85;
}

.accent-indigo::before { background: linear-gradient(90deg, #6366f1, #818cf8); }
.accent-emerald::before { background: linear-gradient(90deg, #10b981, #34d399); }
.accent-cyan::before { background: linear-gradient(90deg, #06b6d4, #22d3ee); }
.accent-violet::before { background: linear-gradient(90deg, #8b5cf6, #a78bfa); }
.accent-purple::before { background: linear-gradient(90deg, #a855f7, #c084fc); }
.accent-amber::before { background: linear-gradient(90deg, #f59e0b, #fbbf24); }

.bento-stat-tile:hover {
  transform: translateY(-2px);
  border-color: rgba(255, 255, 255, 0.18);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
}

.tile-eyebrow {
  font-size: 0.6rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  line-height: 1;
  margin-bottom: 2px;
}

.tile-label {
  font-size: 0.72rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.72);
  line-height: 1.15;
}

.tile-icon-badge {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.bg-indigo-subtle { background: rgba(99, 102, 241, 0.14); }
.bg-emerald-subtle { background: rgba(16, 185, 129, 0.14); }
.bg-cyan-subtle { background: rgba(6, 182, 212, 0.14); }
.bg-violet-subtle { background: rgba(139, 92, 246, 0.14); }
.bg-purple-subtle { background: rgba(168, 85, 247, 0.14); }
.bg-amber-subtle { background: rgba(245, 158, 11, 0.14); }

.text-emerald { color: #34d399; }
.text-cyan { color: #22d3ee; }
.text-violet { color: #a78bfa; }
.text-purple { color: #c084fc; }
.text-amber { color: #fbbf24; }

.tile-value {
  font-size: 1.45rem;
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.02em;
}

.tile-unit {
  font-size: 0.7rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.5);
  margin-left: 1px;
}

.tile-subvalue {
  font-size: 0.68rem;
  font-weight: 700;
  white-space: nowrap;
}

.tile-gauge-meta {
  font-size: 0.64rem;
  color: rgba(255, 255, 255, 0.52);
  line-height: 1;
}

/* AI Diagnosis Panel */
.bento-diagnosis-panel {
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

.phase-banner {
  background: rgba(6, 182, 212, 0.08);
  border: 1px solid rgba(6, 182, 212, 0.22);
}

.cockpit-tabs {
  background: rgba(255, 255, 255, 0.04);
  padding: 3px;
  border-radius: 9px;
}

.cockpit-tab-btn {
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.68rem;
  font-weight: 700;
  padding: 5px 6px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.cockpit-tab-btn.active {
  background: rgba(99, 102, 241, 0.24);
  color: #ffffff;
  box-shadow: inset 0 0 0 1px rgba(99, 102, 241, 0.45);
}

.diagnosis-scroll-area {
  max-height: 220px;
  overflow-y: auto;
}

.diagnosis-scroll-area::-webkit-scrollbar {
  width: 4px;
}
.diagnosis-scroll-area::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 4px;
}

.diagnosis-compact-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.diag-item {
  font-size: 0.74rem;
  line-height: 1.42;
  color: rgba(255, 255, 255, 0.88);
  padding: 7px 9px;
  border-radius: 8px;
  display: flex;
  align-items: flex-start;
}

.diag-item-warning {
  background: rgba(245, 158, 11, 0.07);
  border: 1px solid rgba(245, 158, 11, 0.16);
}

.diag-item-success {
  background: rgba(16, 185, 129, 0.07);
  border: 1px solid rgba(16, 185, 129, 0.16);
}

.diag-item-info {
  background: rgba(139, 92, 246, 0.08);
  border: 1px solid rgba(139, 92, 246, 0.2);
}
</style>
