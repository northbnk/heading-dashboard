<template>
  <!-- 1. 上段5項目 スポーツ科学KPIリボン (CTL / ATL / TSB / Riegel予測 / 心肺ドリフト) -->
  <div v-if="displayMode === 'all' || displayMode === 'stats-only'" class="kpi-five-grid">
    <!-- KPI 1: CTL (Chronic Training Load / 現在の体力) -->
    <div class="bento-stat-tile">
      <div class="d-flex justify-space-between align-start mb-2">
        <div>
          <div class="tile-eyebrow">CTL (42D EMA)</div>
          <div class="tile-label">CTL（現在の体力）</div>
        </div>
        <div class="tile-icon-badge badge-ctl">
          <v-icon color="#2563EB" icon="mdi-trending-up" size="18"></v-icon>
        </div>
      </div>

      <div class="d-flex align-baseline justify-space-between my-2">
        <div class="tile-value font-num">
          {{ pmcResult.CTL.toFixed(1) }}
          <span class="tile-unit">tss</span>
        </div>
        <div class="tile-subvalue badge-pill-blue font-num">
          直近TRIMP {{ latestWorkoutTrimp.toFixed(0) }}
        </div>
      </div>

      <div class="tile-gauge-wrap mt-auto pt-1">
        <div class="gauge-track">
          <div
            class="gauge-fill fill-ctl"
            :style="{ width: Math.min((pmcResult.CTL / targetCtl) * 100, 100) + '%' }"
          ></div>
        </div>
        <div class="d-flex justify-space-between tile-gauge-meta mt-1.5 font-num">
          <span>30日走行 {{ last30DaysDistance.toFixed(1) }}km</span>
          <span class="meta-strong">42日指数移動平均</span>
        </div>
      </div>
    </div>

    <!-- KPI 2: ATL (Acute Training Load / 直近の疲労) -->
    <div class="bento-stat-tile">
      <div class="d-flex justify-space-between align-start mb-2">
        <div>
          <div class="tile-eyebrow">ATL (7D EMA)</div>
          <div class="tile-label">ATL（直近の疲労）</div>
        </div>
        <div class="tile-icon-badge badge-atl">
          <v-icon color="#DB2777" icon="mdi-lightning-bolt" size="18"></v-icon>
        </div>
      </div>

      <div class="d-flex align-baseline justify-space-between my-2">
        <div class="tile-value font-num">
          {{ pmcResult.ATL.toFixed(1) }}
          <span class="tile-unit">tss</span>
        </div>
        <div class="tile-subvalue badge-pill-pink font-num">
          7日計 {{ last7DaysTrimp.toFixed(0) }}
        </div>
      </div>

      <div class="tile-gauge-wrap mt-auto pt-1">
        <div class="gauge-track">
          <div
            class="gauge-fill fill-atl"
            :style="{ width: Math.min((pmcResult.ATL / Math.max(targetCtl * 1.3, 1)) * 100, 100) + '%' }"
          ></div>
        </div>
        <div class="d-flex justify-space-between tile-gauge-meta mt-1.5 font-num">
          <span>負荷比 (A/C)</span>
          <span class="meta-strong">{{ pmcResult.CTL > 0 ? (pmcResult.ATL / pmcResult.CTL).toFixed(2) : '--' }}</span>
        </div>
      </div>
    </div>

    <!-- KPI 3: TSB (Training Stress Balance / コンディション) ※プラスは青背景、マイナスは赤/オレンジ背景 -->
    <div
      class="bento-stat-tile"
      :class="pmcResult.TSB >= 0 ? 'tile-tsb-positive' : 'tile-tsb-negative'"
    >
      <div class="d-flex justify-space-between align-start mb-2">
        <div>
          <div class="tile-eyebrow tsb-eyebrow">TSB (FORM / CONDITION)</div>
          <div class="tile-label tsb-label">TSB（コンディション）</div>
        </div>
        <div class="tile-icon-badge" :class="pmcResult.TSB >= 0 ? 'badge-tsb-pos' : 'badge-tsb-neg'">
          <v-icon
            :color="pmcResult.TSB >= 0 ? '#1D4ED8' : '#C2410C'"
            :icon="pmcResult.TSB >= 0 ? 'mdi-battery-charging-high' : 'mdi-fire'"
            size="18"
          ></v-icon>
        </div>
      </div>

      <div class="d-flex align-baseline justify-space-between my-2">
        <div class="tile-value tsb-value font-num">
          {{ pmcResult.TSB >= 0 ? '+' : '' }}{{ pmcResult.TSB.toFixed(1) }}
        </div>
        <div
          class="tile-subvalue font-num"
          :class="pmcResult.TSB >= 0 ? 'tsb-pill-pos' : 'tsb-pill-neg'"
        >
          {{ tsbStateLabel }}
        </div>
      </div>

      <div class="tile-gauge-wrap mt-auto pt-1">
        <div class="d-flex justify-space-between tile-gauge-meta tsb-meta mt-1.5 font-num">
          <span>算出式: 前日CTL − 前日ATL</span>
          <span class="tsb-meta-strong">{{ pmcResult.TSB >= 0 ? 'フレッシュ圏' : '鍛錬・負荷圏' }}</span>
        </div>
      </div>
    </div>

    <!-- KPI 4: 予測完走タイム (Riegelの法則: 直近42日・10km以上ベストラン基準) -->
    <div class="bento-stat-tile">
      <div class="d-flex justify-space-between align-start mb-2">
        <div>
          <div class="tile-eyebrow">RIEGEL PREDICTION (42.195K)</div>
          <div class="tile-label">予測完走タイム (Riegel式)</div>
        </div>
        <div class="tile-icon-badge">
          <v-icon color="#3653B3" icon="mdi-timer-check-outline" size="18"></v-icon>
        </div>
      </div>

      <div class="d-flex align-baseline justify-space-between my-2">
        <div class="tile-value font-num" style="font-size: 1.55rem;">
          {{ riegelBest ? formatHMS(riegelBest.predFullSeconds) : '--:--:--' }}
        </div>
        <div v-if="riegelBest" class="tile-subvalue badge-pill-blue font-num">
          {{ riegelBest.distanceKm.toFixed(1) }}km基準
        </div>
        <div v-else class="tile-subvalue">
          42日内10km+走なし
        </div>
      </div>

      <div class="tile-gauge-wrap mt-auto pt-1">
        <div class="gauge-track">
          <div
            class="gauge-fill fill-primary"
            :style="{ width: riegelAchievementPct + '%' }"
          ></div>
        </div>
        <div class="d-flex justify-space-between tile-gauge-meta mt-1.5 font-num">
          <span>T2 = T1 × (D2/D1)^1.06</span>
          <span class="meta-strong" v-if="riegelBest">{{ riegelBest.workoutDate.substring(5).replace('-', '/') }} 計測</span>
          <span class="meta-strong" v-else>--</span>
        </div>
      </div>
    </div>

    <!-- KPI 5: 心肺ドリフト (Aerobic Decoupling: 時間ベース前半0-50% vs 後半51-100%) -->
    <div class="bento-stat-tile">
      <div class="d-flex justify-space-between align-start mb-2">
        <div>
          <div class="tile-eyebrow">AEROBIC DECOUPLING (TIME 50/50)</div>
          <div class="tile-label">心肺ドリフト率 (EF比)</div>
        </div>
        <div class="tile-icon-badge">
          <v-icon color="#3653B3" icon="mdi-heart-pulse" size="18"></v-icon>
        </div>
      </div>

      <div class="d-flex align-baseline justify-space-between my-2">
        <div class="tile-value font-num">
          {{ decouplingReport.available ? decouplingReport.decoupling.toFixed(1) : '--' }}
          <span class="tile-unit">%</span>
        </div>
        <div
          class="tile-subvalue font-num"
          :class="decouplingReport.available ? (decouplingReport.decoupling < 5 ? 'badge-pill-green' : 'badge-pill-amber') : ''"
        >
          {{ decouplingReport.available ? `EF ${decouplingReport.firstEF.toFixed(2)}→${decouplingReport.secondEF.toFixed(2)}` : '心拍データ要' }}
        </div>
      </div>

      <div class="tile-gauge-wrap mt-auto pt-1">
        <div class="gauge-track">
          <div
            class="gauge-fill"
            :class="decouplingReport.available && decouplingReport.decoupling < 5 ? 'fill-emerald' : 'fill-primary'"
            :style="{ width: (decouplingReport.available ? Math.max(0, Math.min(100, 100 - (decouplingReport.decoupling * 8))) : 0) + '%' }"
          ></div>
        </div>
        <div class="d-flex justify-space-between tile-gauge-meta mt-1.5 font-num">
          <span>基準 5.0%未満</span>
          <span class="meta-strong">{{ decouplingReport.available ? `${decouplingReport.distanceKm.toFixed(1)}km走` : '--' }}</span>
        </div>
      </div>
    </div>
  </div>

  <!-- 2. 左カラム下部: スポーツ科学メトリクス定量パネル (旧「直前診断（文字）」を廃止し数値データを表示) -->
  <div v-if="displayMode === 'all' || displayMode === 'diagnosis-only'" class="bento-science-panel d-flex flex-column h-100">
    <div class="d-flex align-center justify-space-between mb-3">
      <span class="panel-title">
        スポーツ科学メトリクス内訳
      </span>
      <span class="hr-config-pill font-num">
        HR定数: 安静 {{ hrConfig.restHr }} / 最大 {{ hrConfig.maxHr }} bpm
      </span>
    </div>

    <!-- セクション1: Riegel 距離別予測タイム (直近42日・10km+ベストラン基準) -->
    <div class="science-subcard pa-3 mb-2.5 rounded-xl">
      <div class="d-flex align-center justify-space-between mb-2">
        <span class="subcard-heading">
          1. Riegel 距離別予測タイム
        </span>
        <span class="subcard-formula font-num">T2 = T1 × (D2/D1)^1.06</span>
      </div>

      <div v-if="riegelBest">
        <div class="riegel-grid font-num mb-2">
          <div class="riegel-cell">
            <div class="r-label">10km</div>
            <div class="r-val">{{ formatHMS(riegelBest.pred10kSeconds) }}</div>
          </div>
          <div class="riegel-cell">
            <div class="r-label">ハーフ</div>
            <div class="r-val">{{ formatHMS(riegelBest.predHalfSeconds) }}</div>
          </div>
          <div class="riegel-cell">
            <div class="r-label">30km</div>
            <div class="r-val">{{ formatHMS(riegelBest.pred30kSeconds) }}</div>
          </div>
          <div class="riegel-cell riegel-cell-highlight">
            <div class="r-label">フル (42.195k)</div>
            <div class="r-val r-val-primary">{{ formatHMS(riegelBest.predFullSeconds) }}</div>
          </div>
        </div>
        <div class="subcard-footnote font-num">
          基準ベスト: {{ riegelBest.workoutDate }} {{ riegelBest.activityName }} ({{ riegelBest.distanceKm.toFixed(2) }}km / {{ formatHMS(riegelBest.timeS) }})
        </div>
      </div>
      <div v-else class="subcard-empty py-2">
        直近42日間に10km以上のワークアウトがないため算出不可
      </div>
    </div>

    <!-- セクション2: 時間ベース50/50 心肺ドリフト (Aerobic Decoupling) 内訳 -->
    <div class="science-subcard pa-3 mb-2.5 rounded-xl">
      <div class="d-flex align-center justify-space-between mb-2">
        <span class="subcard-heading">
          2. 心肺ドリフト (時間分割 0-50% / 51-100%)
        </span>
        <span
          v-if="decouplingReport.available"
          class="drift-badge font-num"
          :class="decouplingReport.decoupling < 5 ? 'badge-pill-green' : 'badge-pill-amber'"
        >
          {{ decouplingReport.decoupling.toFixed(2) }}%
        </span>
      </div>

      <div v-if="decouplingReport.available" class="font-num">
        <div class="ef-compare-row d-flex align-center justify-space-between py-1">
          <span class="ef-half-label">前半 (0〜50%時間)</span>
          <span class="ef-half-metrics">
            {{ decouplingReport.firstSpeed.toFixed(1) }} m/分 ÷ {{ decouplingReport.firstHr.toFixed(1) }} bpm = <strong>EF {{ decouplingReport.firstEF.toFixed(3) }}</strong>
          </span>
        </div>
        <div class="ef-compare-row d-flex align-center justify-space-between py-1">
          <span class="ef-half-label">後半 (51〜100%時間)</span>
          <span class="ef-half-metrics">
            {{ decouplingReport.secondSpeed.toFixed(1) }} m/分 ÷ {{ decouplingReport.secondHr.toFixed(1) }} bpm = <strong>EF {{ decouplingReport.secondEF.toFixed(3) }}</strong>
          </span>
        </div>
        <div class="subcard-footnote mt-1">
          対象: {{ decouplingReport.workoutDate }} {{ decouplingReport.activityName }} ({{ decouplingReport.distanceKm.toFixed(1) }}km)
        </div>
      </div>
      <div v-else class="subcard-empty py-2">
        心拍スプリット付きのワークアウトデータが不足しています
      </div>
    </div>

    <!-- セクション3: Banister TRIMP (男性版) & 負荷サマリー -->
    <div class="science-subcard pa-3 rounded-xl mt-auto">
      <div class="d-flex align-center justify-space-between mb-1.5">
        <span class="subcard-heading">
          3. Banister TRIMP (男性係数)
        </span>
        <span class="subcard-formula font-num">min × HRR × 0.64 × e^(1.92×HRR)</span>
      </div>
      <div class="d-flex align-center justify-space-between font-num" style="font-size: 0.75rem; color: #334155;">
        <span>直近ラン TRIMP: <strong>{{ latestWorkoutTrimp.toFixed(1) }}</strong> (HRR {{ (latestWorkoutHrr * 100).toFixed(1) }}%)</span>
        <span>7日累積: <strong>{{ last7DaysTrimp.toFixed(1) }}</strong></span>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'
import { getAthleteHrConfig } from '~/config/athleteSettings'
import {
  parseWorkoutLocalDate,
  formatSecondsToHMS,
  findBestRiegelPrediction,
  workoutSplitsToTrackingData,
  calculateAerobicDecouplingDetails,
  calculateWorkoutTrimp,
  buildDailyPmcSeries
} from '~/utils/sportsScience'

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
      default: 'sub3.5'
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
    let runtimePublic = null
    try {
      const rc = useRuntimeConfig()
      runtimePublic = rc?.public || null
    } catch (_e) {
      runtimePublic = null
    }

    const hrConfig = computed(() => getAthleteHrConfig(runtimePublic))

    // 基準日（最新ワークアウトが45日以上前の場合は最新ワークアウト日、それ以外は現在日）
    const referenceLatestDate = computed(() => {
      const now = new Date()
      if (!props.workouts || props.workouts.length === 0) return now
      const dates = props.workouts
        .map(w => parseWorkoutLocalDate(w.workoutDate))
        .filter(d => d.getTime() > 0)
      if (dates.length === 0) return now
      const maxWorkoutDate = new Date(Math.max(...dates))
      const diffDays = (now.getTime() - maxWorkoutDate.getTime()) / (1000 * 60 * 60 * 24)
      return diffDays > 45 ? maxWorkoutDate : now
    })

    // 直近30日走行距離
    const last30DaysDistance = computed(() => {
      if (props.workouts.length === 0) return 0
      const thirtyDaysAgo = new Date(referenceLatestDate.value.getTime())
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      return props.workouts
        .filter(w => {
          const d = parseWorkoutLocalDate(w.workoutDate)
          return d >= thirtyDaysAgo && d <= referenceLatestDate.value
        })
        .reduce((sum, w) => sum + Number(w.distance || 0), 0)
    })

    // 1. Riegelの法則: 直近42日間の10km以上ベストエフォートによる予測完走タイム
    const riegelBest = computed(() => {
      return findBestRiegelPrediction(
        props.workouts,
        referenceLatestDate.value,
        42195,
        42,
        10000
      )
    })

    const targetMarathonSeconds = computed(() => {
      if (props.targetGoal === 'sub4') return 4 * 3600
      if (props.targetGoal === 'sub3.5') return 3.5 * 3600
      return 3 * 3600
    })

    const riegelAchievementPct = computed(() => {
      if (!riegelBest.value || !riegelBest.value.predFullSeconds) return 0
      const ratio = (targetMarathonSeconds.value / riegelBest.value.predFullSeconds) * 100
      return Math.max(0, Math.min(100, Math.round(ratio)))
    })

    // 2. 心肺ドリフト (Aerobic Decoupling: 時間ベース 0-50% vs 51-100%)
    // 10km以上（優先: 15km以上）の心拍スプリット付き最新ワークアウトを対象に算出
    const decouplingReport = computed(() => {
      if (!props.workouts || props.workouts.length === 0) {
        return { available: false }
      }

      const sorted = [...props.workouts].sort(
        (a, b) => parseWorkoutLocalDate(b.workoutDate) - parseWorkoutLocalDate(a.workoutDate)
      )

      // まず15km以上を探索し、なければスプリット心拍を持つ最長/最新のランを対象とする
      const candidates = [
        ...sorted.filter(w => Number(w.distance || 0) >= 15),
        ...sorted.filter(w => Number(w.distance || 0) >= 5 && Number(w.distance || 0) < 15)
      ]

      for (const w of candidates) {
        const trackingData = workoutSplitsToTrackingData(w)
        if (!trackingData) continue
        const details = calculateAerobicDecouplingDetails(trackingData)
        if (details) {
          return {
            available: true,
            workoutDate: w.workoutDate ? w.workoutDate.split(/[ T]/)[0] : '',
            activityName: w.activityName || 'ランニング',
            distanceKm: Number(w.distance || 0),
            decoupling: details.decoupling,
            firstEF: details.firstHalf.ef,
            secondEF: details.secondHalf.ef,
            firstSpeed: details.firstHalf.avgSpeedMPerMin,
            secondSpeed: details.secondHalf.avgSpeedMPerMin,
            firstHr: details.firstHalf.avgHr,
            secondHr: details.secondHalf.avgHr
          }
        }
      }

      return { available: false }
    })

    // 3 & 4. Banister TRIMP ＆ PMC (CTL / ATL / TSB)
    const pmcResult = computed(() => {
      return buildDailyPmcSeries(props.workouts, referenceLatestDate.value, hrConfig.value, 90)
    })

    const latestWorkoutStats = computed(() => {
      if (!props.workouts || props.workouts.length === 0) {
        return { trimp: 0, hrrRatio: 0 }
      }
      const sorted = [...props.workouts].sort(
        (a, b) => parseWorkoutLocalDate(b.workoutDate) - parseWorkoutLocalDate(a.workoutDate)
      )
      return calculateWorkoutTrimp(sorted[0], hrConfig.value)
    })

    const latestWorkoutTrimp = computed(() => latestWorkoutStats.value.trimp)
    const latestWorkoutHrr = computed(() => latestWorkoutStats.value.hrrRatio)

    const last7DaysTrimp = computed(() => {
      const series = pmcResult.value.series
      if (!series || series.length === 0) return 0
      return series.slice(-7).reduce((acc, d) => acc + Number(d.trimp || 0), 0)
    })

    const targetCtl = computed(() => {
      if (props.targetGoal === 'sub4') return 45
      if (props.targetGoal === 'sub3.5') return 65
      return 85
    })

    const tsbStateLabel = computed(() => {
      const tsb = pmcResult.value.TSB
      if (tsb >= 15) return 'テーパリング完了'
      if (tsb >= 0) return 'レース好調圏 (+)'
      if (tsb >= -15) return '適正トレーニング圏'
      if (tsb >= -30) return '高負荷・疲労蓄積'
      return 'オーバートレーニング注意'
    })

    return {
      hrConfig,
      last30DaysDistance,
      riegelBest,
      riegelAchievementPct,
      decouplingReport,
      pmcResult,
      latestWorkoutTrimp,
      latestWorkoutHrr,
      last7DaysTrimp,
      targetCtl,
      tsbStateLabel,
      formatHMS: formatSecondsToHMS
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

/* TSB プラス時：青背景カード */
.tile-tsb-positive {
  background: linear-gradient(135deg, #DBEAFE 0%, #EFF6FF 100%) !important;
  border: 1px solid #93C5FD !important;
}

.tile-tsb-positive .tsb-eyebrow {
  color: #1E40AF !important;
}

.tile-tsb-positive .tsb-label {
  color: #1E3A8A !important;
  font-weight: 700;
}

.tile-tsb-positive .tsb-value {
  color: #1D4ED8 !important;
}

.tile-tsb-positive .tsb-meta {
  color: #1E40AF !important;
}

.tile-tsb-positive .tsb-meta-strong {
  color: #1E3A8A !important;
  font-weight: 800;
}

/* TSB マイナス時：赤/オレンジ背景カード */
.tile-tsb-negative {
  background: linear-gradient(135deg, #FFEDD5 0%, #FEF2F2 100%) !important;
  border: 1px solid #FDBA74 !important;
}

.tile-tsb-negative .tsb-eyebrow {
  color: #9A3412 !important;
}

.tile-tsb-negative .tsb-label {
  color: #7C2D12 !important;
  font-weight: 700;
}

.tile-tsb-negative .tsb-value {
  color: #C2410C !important;
}

.tile-tsb-negative .tsb-meta {
  color: #9A3412 !important;
}

.tile-tsb-negative .tsb-meta-strong {
  color: #7C2D12 !important;
  font-weight: 800;
}

.badge-tsb-pos {
  background: rgba(37, 99, 235, 0.14) !important;
}

.badge-tsb-neg {
  background: rgba(234, 88, 12, 0.14) !important;
}

.tsb-pill-pos {
  background: #2563EB;
  color: #FFFFFF !important;
  padding: 3px 9px;
  border-radius: 6px;
  font-weight: 700;
}

.tsb-pill-neg {
  background: #EA580C;
  color: #FFFFFF !important;
  padding: 3px 9px;
  border-radius: 6px;
  font-weight: 700;
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

.badge-ctl {
  background: #DBEAFE;
}

.badge-atl {
  background: #FCE7F3;
}

.tile-value {
  font-size: 1.75rem;
  font-weight: 800;
  color: #1E293B;
  line-height: 1.05;
}

.tile-unit {
  font-size: 0.75rem;
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

.badge-pill-pink {
  background: #FCE7F3;
  color: #9D174D;
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

.fill-ctl {
  background: #2563EB;
}

.fill-atl {
  background: #EC4899;
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

/* スポーツ科学メトリクス内訳パネル */
.bento-science-panel {
  background: #F2F4F8;
  border: 1px solid #D5DBE3;
  border-radius: 16px;
  padding: 20px 22px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}

.panel-title {
  font-size: 0.92rem;
  font-weight: 700;
  color: #1E293B;
  letter-spacing: -0.01em;
}

.hr-config-pill {
  font-size: 0.68rem;
  font-weight: 600;
  color: #475569;
  background: #E2E7EE;
  border: 1px solid #D1D8E2;
  padding: 2px 8px;
  border-radius: 99px;
}

.science-subcard {
  background: #E8ECF2;
  border: 1px solid #D5DBE3;
}

.subcard-heading {
  font-size: 0.76rem;
  font-weight: 700;
  color: #1E293B;
}

.subcard-formula {
  font-size: 0.66rem;
  font-weight: 600;
  color: #526071;
}

.riegel-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
}

.riegel-cell {
  background: #F2F4F8;
  border: 1px solid #D5DBE3;
  border-radius: 8px;
  padding: 6px 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.riegel-cell-highlight {
  background: #E4EAF5;
  border-color: #B8C8E6;
}

.r-label {
  font-size: 0.68rem;
  font-weight: 600;
  color: #526071;
}

.r-val {
  font-size: 0.82rem;
  font-weight: 800;
  color: #1E293B;
}

.r-val-primary {
  color: #2563EB;
}

.ef-compare-row {
  font-size: 0.73rem;
  border-bottom: 1px dashed #D5DBE3;
}

.ef-compare-row:last-of-type {
  border-bottom: none;
}

.ef-half-label {
  color: #526071;
  font-weight: 600;
}

.ef-half-metrics {
  color: #1E293B;
}

.drift-badge {
  font-size: 0.7rem;
}

.subcard-footnote {
  font-size: 0.66rem;
  color: #526071;
}

.subcard-empty {
  font-size: 0.74rem;
  color: #526071;
  text-align: center;
}
</style>
