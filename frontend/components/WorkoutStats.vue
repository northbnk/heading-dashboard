<template>
  <!-- 1. 上段5項目 スポーツ科学KPIリボン (CTL / ATL / TSB / Riegel予測 / EF & 心肺ドリフト) -->
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
          <span>前日CTL − 前日ATL</span>
          <span v-if="latestRhrEntry" class="tsb-meta-strong">
            RHR {{ latestRhrEntry.rhr_bpm }}bpm {{ latestRhrEntry.fatigueWarning ? '⚠️要疲労注意' : '' }}
          </span>
          <span v-else class="tsb-meta-strong">{{ pmcResult.TSB >= 0 ? 'フレッシュ圏' : '鍛錬・負荷圏' }}</span>
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

    <!-- KPI 5: 心肺ドリフト & EF (時間ベース前半0-50% vs 後半51-100%) -->
    <div class="bento-stat-tile">
      <div class="d-flex justify-space-between align-start mb-2">
        <div>
          <div class="tile-eyebrow">EF & AEROBIC DECOUPLING</div>
          <div class="tile-label">心肺ドリフト率 / EF</div>
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
          :class="latestEfResult ? 'badge-pill-green' : ''"
        >
          {{ latestEfResult ? `最新EF ${latestEfResult.ef.toFixed(2)}` : '心拍データ要' }}
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
          <span>{{ decouplingReport.available ? `EF ${decouplingReport.firstEF.toFixed(2)}→${decouplingReport.secondEF.toFixed(2)}` : '基準 5.0%未満' }}</span>
          <span class="meta-strong">{{ decouplingReport.available ? `${decouplingReport.distanceKm.toFixed(1)}km走` : '--' }}</span>
        </div>
      </div>
    </div>
  </div>

  <!-- 2. 左カラム下部: スポーツ科学メトリクス定量パネル (全8指標の詳細数値・トレンド・RHR管理) -->
  <div v-if="displayMode === 'all' || displayMode === 'diagnosis-only'" class="bento-science-panel d-flex flex-column h-100">
    <div class="d-flex align-center justify-space-between mb-2.5 flex-wrap gap-1">
      <span class="panel-title">
        スポーツ科学メトリクス解析
      </span>
      <span class="hr-config-pill font-num">
        HR定数: 安静 {{ hrConfig.restHr }} / 最大 {{ hrConfig.maxHr }} bpm
      </span>
    </div>

    <!-- 4タブ切替: [0. 総合能力レーダー] [1. Riegel & EF/ドリフト] [2. Pace/HR & ピッチ安定度] [3. 安静時心拍(RHR)] -->
    <div class="science-tabs d-flex gap-1 mb-3">
      <button
        type="button"
        class="science-tab-btn flex-grow-1"
        :class="{ active: activeScienceTab === 'radar' }"
        @click="activeScienceTab = 'radar'"
      >
        能力レーダー
      </button>
      <button
        type="button"
        class="science-tab-btn flex-grow-1"
        :class="{ active: activeScienceTab === 'riegel_ef' }"
        @click="activeScienceTab = 'riegel_ef'"
      >
        Riegel・EF
      </button>
      <button
        type="button"
        class="science-tab-btn flex-grow-1"
        :class="{ active: activeScienceTab === 'pace_pitch' }"
        @click="activeScienceTab = 'pace_pitch'"
      >
        Pace/HR・ピッチ
      </button>
      <button
        type="button"
        class="science-tab-btn flex-grow-1"
        :class="{ active: activeScienceTab === 'rhr' }"
        @click="activeScienceTab = 'rhr'"
      >
        RHR
        <span v-if="latestRhrEntry?.fatigueWarning" class="warning-dot ml-1"></span>
      </button>
    </div>

    <!-- タブ0: ランニング能力レーダーチャート ＆ 5段階スコアバランス評価UI -->
    <div v-if="activeScienceTab === 'radar'" class="d-flex flex-column gap-2.5 flex-grow-1">
      <!-- ワンフレーズ総合判定バナー -->
      <div
        class="radar-verdict-banner pa-3 rounded-xl"
        :class="`verdict-${abilityRadar.readinessTone}`"
      >
        <div class="d-flex align-center justify-space-between mb-1">
          <span class="verdict-eyebrow d-flex align-center">
            <v-icon
              :icon="abilityRadar.readinessTone === 'caution' ? 'mdi-alert-circle-outline' : 'mdi-shield-star-outline'"
              size="14"
              class="mr-1"
            ></v-icon>
            TOTAL PERFORMANCE VERDICT
          </span>
          <span class="verdict-grade-pill font-num">
            総合Rank {{ abilityRadar.overallGrade }} ({{ abilityRadar.overallStage }}/5)
          </span>
        </div>
        <div class="verdict-headline font-num">
          {{ abilityRadar.oneLineSummary }}
        </div>
        <div class="verdict-subtext mt-1">
          {{ abilityRadar.actionAdvice }}
        </div>
      </div>

      <!-- レーダーチャート ＋ 5軸バランス内訳 -->
      <div class="science-subcard pa-3 rounded-xl flex-grow-1 d-flex flex-column justify-space-between">
        <div class="radar-chart-box mx-auto">
          <ClientOnly>
            <apexchart
              type="radar"
              height="215"
              :options="radarChartOptions"
              :series="radarChartSeries"
            ></apexchart>
            <template #fallback>
              <div class="d-flex align-center justify-center" style="height: 215px;">
                <v-progress-circular indeterminate color="primary" size="24"></v-progress-circular>
              </div>
            </template>
          </ClientOnly>
        </div>

        <!-- 5項目スコア・5段階バランスバー一覧 -->
        <div class="radar-score-list d-flex flex-column gap-1.5 mt-1 pt-2 border-top-subtle">
          <div
            v-for="axis in abilityRadar.axes"
            :key="axis.key"
            class="radar-axis-row"
          >
            <div class="d-flex align-center justify-space-between mb-0.5">
              <div class="d-flex align-center gap-1.5">
                <span class="axis-grade-badge font-num" :class="`grade-${axis.grade.toLowerCase()}`">
                  {{ axis.grade }}
                </span>
                <span class="axis-name">{{ axis.label }}</span>
              </div>
              <div class="d-flex align-center gap-1.5 font-num">
                <span class="axis-raw-meta">{{ axis.rawDisplay }}</span>
                <span class="axis-score-val">{{ axis.score }}<small>pt</small></span>
              </div>
            </div>

            <!-- 5段階セグメントバー -->
            <div class="stage-segment-bar d-flex gap-05">
              <div
                v-for="step in 5"
                :key="step"
                class="stage-seg flex-grow-1"
                :class="{
                  'seg-active': step <= axis.stage,
                  'seg-peak': step <= axis.stage && axis.stage >= 4,
                  'seg-warn': step <= axis.stage && axis.stage <= 2
                }"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- タブ1: Riegel距離別予測 ＆ EF / 心肺ドリフト内訳 -->
    <div v-else-if="activeScienceTab === 'riegel_ef'" class="d-flex flex-column gap-2.5 flex-grow-1">
      <!-- Riegel 距離別予測タイム -->
      <div class="science-subcard pa-3 rounded-xl">
        <div class="d-flex align-center justify-space-between mb-2">
          <span class="subcard-heading">Riegel 距離別予測タイム</span>
          <span class="subcard-formula font-num">T2 = T1 × (D2/D1)^1.06</span>
        </div>

        <div v-if="riegelBest">
          <div class="riegel-grid font-num mb-1.5">
            <div class="riegel-cell">
              <span class="r-label">10km</span>
              <span class="r-val">{{ formatHMS(riegelBest.pred10kSeconds) }}</span>
            </div>
            <div class="riegel-cell">
              <span class="r-label">ハーフ</span>
              <span class="r-val">{{ formatHMS(riegelBest.predHalfSeconds) }}</span>
            </div>
            <div class="riegel-cell">
              <span class="r-label">30km</span>
              <span class="r-val">{{ formatHMS(riegelBest.pred30kSeconds) }}</span>
            </div>
            <div class="riegel-cell riegel-cell-highlight">
              <span class="r-label">フル</span>
              <span class="r-val r-val-primary">{{ formatHMS(riegelBest.predFullSeconds) }}</span>
            </div>
          </div>
          <div class="subcard-footnote font-num">
            基準: {{ riegelBest.workoutDate }} ({{ riegelBest.distanceKm.toFixed(2) }}km / {{ formatHMS(riegelBest.timeS) }})
          </div>
        </div>
        <div v-else class="subcard-empty py-2">
          直近42日間に10km以上のワークアウトがないため算出不可
        </div>
      </div>

      <!-- EF (効率係数) & 時間ベース50/50 心肺ドリフト -->
      <div class="science-subcard pa-3 rounded-xl flex-grow-1 d-flex flex-column justify-space-between">
        <div>
          <div class="d-flex align-center justify-space-between mb-1.5">
            <span class="subcard-heading">EF (効率係数) ＆ 時間分割ドリフト</span>
            <span class="subcard-formula font-num">EF = 速度(m/分) ÷ 心拍(bpm)</span>
          </div>

          <div v-if="decouplingReport.available" class="font-num">
            <div class="ef-compare-row d-flex align-center justify-space-between py-1">
              <span class="ef-half-label">全体平均 EF</span>
              <span class="ef-half-metrics">
                {{ decouplingReport.overallSpeed.toFixed(1) }} m/分 ÷ {{ decouplingReport.overallHr.toFixed(1) }} bpm = <strong>{{ decouplingReport.overallEF.toFixed(3) }}</strong>
              </span>
            </div>
            <div class="ef-compare-row d-flex align-center justify-space-between py-1">
              <span class="ef-half-label">前半 (0〜50%時間)</span>
              <span class="ef-half-metrics">
                {{ decouplingReport.firstSpeed.toFixed(1) }} m/分 ÷ {{ decouplingReport.firstHr.toFixed(1) }} bpm = <strong>{{ decouplingReport.firstEF.toFixed(3) }}</strong>
              </span>
            </div>
            <div class="ef-compare-row d-flex align-center justify-space-between py-1">
              <span class="ef-half-label">後半 (51〜100%時間)</span>
              <span class="ef-half-metrics">
                {{ decouplingReport.secondSpeed.toFixed(1) }} m/分 ÷ {{ decouplingReport.secondHr.toFixed(1) }} bpm = <strong>{{ decouplingReport.secondEF.toFixed(3) }}</strong>
              </span>
            </div>
          </div>
          <div v-else class="subcard-empty py-2">
            心拍データ付きのスプリット記録がありません
          </div>
        </div>

        <!-- ラップごとEF時系列ミニバー -->
        <div v-if="decouplingReport.available && decouplingReport.efSeries.length > 0" class="mt-2 pt-1.5 border-top-subtle">
          <div class="d-flex justify-space-between align-center mb-1">
            <span class="subcard-footnote">ラップ別 EF 時系列推移 ({{ decouplingReport.efSeries.length }}ラップ)</span>
            <span class="subcard-footnote font-num">ドリフト率: <strong>{{ decouplingReport.decoupling.toFixed(2) }}%</strong></span>
          </div>
          <div class="ef-spark-bars d-flex align-end gap-05">
            <div
              v-for="seg in decouplingReport.efSeries.slice(0, 25)"
              :key="seg.segmentIndex"
              class="ef-spark-col flex-grow-1"
              :title="`Lap ${seg.segmentIndex}: EF ${seg.ef ? seg.ef.toFixed(2) : '--'} (${seg.speed_m_min.toFixed(0)}m/min, ${seg.heart_rate}bpm)`"
            >
              <div
                class="ef-spark-bar"
                :style="{ height: Math.max(20, Math.min(100, ((seg.ef || 0) / 1.8) * 100)) + '%' }"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- タブ2: Pace/HR比トレンド ＆ ピッチ(SPM)安定度 -->
    <div v-else-if="activeScienceTab === 'pace_pitch'" class="d-flex flex-column gap-2.5 flex-grow-1">
      <!-- Pace / HR 比 (週次・月次推移) -->
      <div class="science-subcard pa-3 rounded-xl">
        <div class="d-flex align-center justify-space-between mb-1.5">
          <span class="subcard-heading">Pace / HR 比 (速度 ÷ 平均心拍)</span>
          <span
            v-if="paceHrSummary.trendDelta !== null"
            class="font-num"
            :class="paceHrSummary.trendDelta >= 0 ? 'badge-pill-green' : 'badge-pill-amber'"
            style="font-size: 0.68rem;"
          >
            {{ paceHrSummary.trendDelta >= 0 ? `+${paceHrSummary.trendDelta.toFixed(3)} 向上` : `${paceHrSummary.trendDelta.toFixed(3)}` }}
          </span>
        </div>

        <div v-if="paceHrSummary.available" class="font-num">
          <div class="ef-compare-row d-flex align-center justify-space-between py-1">
            <span class="ef-half-label">最新週平均 ({{ paceHrSummary.latestWeekLabel }})</span>
            <span class="ef-half-metrics">
              <strong>{{ paceHrSummary.latestWeekRatio.toFixed(3) }}</strong> m/min/bpm
              ({{ paceHrSummary.latestWeekKmhRatio.toFixed(4) }} km/h/bpm)
            </span>
          </div>
          <div class="ef-compare-row d-flex align-center justify-space-between py-1">
            <span class="ef-half-label">最新月平均 ({{ paceHrSummary.latestMonthLabel }})</span>
            <span class="ef-half-metrics">
              <strong>{{ paceHrSummary.latestMonthRatio.toFixed(3) }}</strong> m/min/bpm
              <span v-if="paceHrSummary.prevMonthRatio" class="ml-1" style="color: #526071;">
                (前月 {{ paceHrSummary.prevMonthRatio.toFixed(3) }})
              </span>
            </span>
          </div>
          <div class="subcard-footnote mt-1">
            ※右側の推移チャートの「Pace/HR比」タブで週次・月次グラフを表示できます
          </div>
        </div>
        <div v-else class="subcard-empty py-2">
          ペース・心拍データ付きのワークアウトがありません
        </div>
      </div>

      <!-- ピッチ (SPM) 安定度 -->
      <div class="science-subcard pa-3 rounded-xl flex-grow-1 d-flex flex-column justify-space-between">
        <div>
          <div class="d-flex align-center justify-space-between mb-1.5">
            <span class="subcard-heading">ピッチ (SPM) 安定度 (時間 50/50)</span>
            <span class="subcard-formula font-num">(SPM後半 ÷ SPM前半) × 100</span>
          </div>

          <div v-if="pitchStabilityReport.available" class="font-num">
            <div class="d-flex align-baseline justify-space-between my-1">
              <div>
                <span class="r-val" style="font-size: 1.25rem;">
                  {{ pitchStabilityReport.ratio.toFixed(1) }}%
                </span>
                <span class="subcard-footnote ml-1.5">
                  (前半 {{ pitchStabilityReport.spmFirst.toFixed(1) }} → 後半 {{ pitchStabilityReport.spmSecond.toFixed(1) }} spm)
                </span>
              </div>
              <span
                :class="pitchStabilityReport.status === 'stable' ? 'badge-pill-green' : 'badge-pill-amber'"
                style="font-size: 0.68rem;"
              >
                {{ pitchStabilityReport.status === 'stable' ? 'フォーム安定' : 'ピッチ変動注意' }}
              </span>
            </div>
            <div class="subcard-footnote mt-1">
              {{ pitchStabilityReport.evaluation }}（対象: {{ pitchStabilityReport.workoutDate }} {{ pitchStabilityReport.activityName }}）
            </div>
          </div>
          <div v-else class="py-1">
            <div class="subcard-empty text-left mb-1">
              既存ワークアウトのラップ内にピッチ(spm)配列が未収録です（次回Strava同期より自動取得）。
            </div>
            <div v-if="latestOverallCadence" class="ef-compare-row d-flex align-center justify-space-between py-1 font-num">
              <span class="ef-half-label">直近ラン全体平均ピッチ</span>
              <span class="ef-half-metrics">
                <strong>{{ latestOverallCadence.cadence }} spm</strong>
                <span v-if="latestOverallCadence.stride"> (ストライド {{ latestOverallCadence.stride }}m)</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- タブ3: 安静時心拍数 (RHR) トレンド ＆ 要疲労注意フラグ -->
    <div v-else-if="activeScienceTab === 'rhr'" class="d-flex flex-column gap-2.5 flex-grow-1">
      <div class="science-subcard pa-3 rounded-xl flex-grow-1 d-flex flex-column justify-space-between">
        <div>
          <div class="d-flex align-center justify-space-between mb-2">
            <span class="subcard-heading">安静時心拍数 (RHR) ＆ 7日移動平均</span>
            <span
              v-if="latestRhrEntry"
              :class="latestRhrEntry.fatigueWarning ? 'tsb-pill-neg' : 'badge-pill-green'"
              style="font-size: 0.68rem;"
            >
              {{ latestRhrEntry.fatigueWarning ? '⚠️ 要疲労注意 (+3bpm超)' : '正常範囲' }}
            </span>
          </div>

          <div v-if="latestRhrEntry" class="font-num mb-2">
            <div class="ef-compare-row d-flex align-center justify-space-between py-1">
              <span class="ef-half-label">最新 RHR ({{ latestRhrEntry.date }})</span>
              <span class="ef-half-metrics">
                <strong>{{ latestRhrEntry.rhr_bpm }} bpm</strong>
                <span class="ml-1" :style="{ color: latestRhrEntry.delta_bpm >= 3 ? '#C2410C' : '#526071' }">
                  (基準比 {{ latestRhrEntry.delta_bpm >= 0 ? '+' : '' }}{{ latestRhrEntry.delta_bpm }} bpm)
                </span>
              </span>
            </div>
            <div class="ef-compare-row d-flex align-center justify-space-between py-1">
              <span class="ef-half-label">直近7日間 移動平均 (7d MA)</span>
              <span class="ef-half-metrics">
                <strong>{{ latestRhrEntry.moving_avg_7d.toFixed(1) }} bpm</strong>
              </span>
            </div>
          </div>

          <!-- 直近5件のRHRミニ履歴 -->
          <div v-if="rhrTrendSeries.length > 0" class="rhr-mini-list font-num mb-2">
            <div
              v-for="item in rhrTrendSeries.slice(-4).reverse()"
              :key="item.date"
              class="d-flex align-center justify-space-between py-0.5"
              style="font-size: 0.7rem; color: #475569;"
            >
              <span>{{ item.date.substring(5).replace('-', '/') }}</span>
              <span>RHR <strong>{{ item.rhr_bpm }}</strong> bpm (7d平均 {{ item.moving_avg_7d.toFixed(1) }})</span>
              <span :style="{ color: item.fatigueWarning ? '#C2410C' : '#1E7E5C', fontWeight: 700 }">
                {{ item.fatigueWarning ? '要疲労注意' : 'OK' }}
              </span>
            </div>
          </div>
        </div>

        <!-- RHR クイック記録 (オーナーログイン時) -->
        <div v-if="isOwner" class="d-flex align-center gap-1.5 pt-2 border-top-subtle">
          <input
            v-model="rhrFormDate"
            type="date"
            class="rhr-input font-num"
            style="width: 118px;"
          />
          <input
            v-model.number="rhrFormBpm"
            type="number"
            min="35"
            max="110"
            placeholder="bpm"
            class="rhr-input font-num"
            style="width: 68px;"
          />
          <v-btn
            color="primary"
            size="x-small"
            variant="flat"
            rounded="lg"
            class="font-weight-bold text-white px-2.5 flex-grow-1"
            style="height: 28px;"
            @click="submitRhr"
          >
            RHR記録
          </v-btn>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { getAthleteHrConfig } from '~/config/athleteSettings'
import {
  parseWorkoutLocalDate,
  formatDateYMD,
  formatSecondsToHMS,
  findBestRiegelPrediction,
  workoutSplitsToTrackingData,
  calculateAerobicDecouplingDetails,
  calculateWorkoutTrimp,
  buildDailyPmcSeries,
  calculateWorkoutEF,
  buildPaceHrTrendFromWorkouts,
  calculateRhrTrend,
  calculatePitchStability,
  calculateAbilityRadarEvaluation
} from '~/utils/sportsScience'

export default {
  name: 'WorkoutStats',
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
    isOwner: {
      type: Boolean,
      default: false
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
  emits: ['save-rhr'],
  setup(props, { emit }) {
    const activeScienceTab = ref('radar')
    const rhrFormDate = ref(formatDateYMD(new Date()))
    const rhrFormBpm = ref(52)

    let runtimePublic = null
    try {
      const rc = useRuntimeConfig()
      runtimePublic = rc?.public || null
    } catch (_e) {
      runtimePublic = null
    }

    const hrConfig = computed(() => getAthleteHrConfig(runtimePublic))

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

    // 最新ワークアウトの EF (Efficiency Factor)
    const latestEfResult = computed(() => {
      if (!props.workouts || props.workouts.length === 0) return null
      const sorted = [...props.workouts].sort(
        (a, b) => parseWorkoutLocalDate(b.workoutDate) - parseWorkoutLocalDate(a.workoutDate)
      )
      for (const w of sorted) {
        const res = calculateWorkoutEF(w)
        if (res) return res
      }
      return null
    })

    // 2 & 5. 心肺ドリフト (Aerobic Decoupling: 時間ベース 0-50% vs 51-100%) ＆ ラップ別EF時系列
    const decouplingReport = computed(() => {
      if (!props.workouts || props.workouts.length === 0) {
        return { available: false }
      }

      const sorted = [...props.workouts].sort(
        (a, b) => parseWorkoutLocalDate(b.workoutDate) - parseWorkoutLocalDate(a.workoutDate)
      )

      const candidates = [
        ...sorted.filter(w => Number(w.distance || 0) >= 15),
        ...sorted.filter(w => Number(w.distance || 0) >= 5 && Number(w.distance || 0) < 15)
      ]

      for (const w of candidates) {
        const trackingData = workoutSplitsToTrackingData(w)
        if (!trackingData) continue
        const details = calculateAerobicDecouplingDetails(trackingData)
        const efDetails = calculateWorkoutEF(w)
        if (details && efDetails) {
          return {
            available: true,
            workoutDate: w.workoutDate ? w.workoutDate.split(/[ T]/)[0] : '',
            activityName: w.activityName || 'ランニング',
            distanceKm: Number(w.distance || 0),
            decoupling: details.decoupling,
            overallEF: efDetails.ef,
            overallSpeed: efDetails.avgSpeedMPerMin,
            overallHr: efDetails.avgHr,
            efSeries: efDetails.series || [],
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

    // 6. Pace / HR 比 (週単位・月単位トレンド)
    const paceHrSummary = computed(() => {
      const trend = buildPaceHrTrendFromWorkouts(props.workouts)
      if (!trend.weekly.length || !trend.monthly.length) {
        return { available: false, trendDelta: null }
      }
      const latestWeek = trend.weekly[trend.weekly.length - 1]
      const latestMonth = trend.monthly[trend.monthly.length - 1]
      const prevMonth = trend.monthly.length >= 2 ? trend.monthly[trend.monthly.length - 2] : null
      const trendDelta = prevMonth ? (latestMonth.pace_hr_ratio - prevMonth.pace_hr_ratio) : null

      return {
        available: true,
        latestWeekLabel: latestWeek.period.substring(5).replace('-', '/') + '週',
        latestWeekRatio: latestWeek.pace_hr_ratio,
        latestWeekKmhRatio: latestWeek.pace_hr_ratio_kmh,
        latestMonthLabel: latestMonth.period,
        latestMonthRatio: latestMonth.pace_hr_ratio,
        prevMonthRatio: prevMonth ? prevMonth.pace_hr_ratio : null,
        trendDelta
      }
    })

    // 7. 安静時心拍数 (RHR) トレンド ＆ 要疲労注意フラグ
    const rhrTrendSeries = computed(() => {
      return calculateRhrTrend(props.rhrLogs, 3)
    })

    const latestRhrEntry = computed(() => {
      if (rhrTrendSeries.value.length === 0) return null
      return rhrTrendSeries.value[rhrTrendSeries.value.length - 1]
    })

    const submitRhr = () => {
      if (!rhrFormDate.value || !rhrFormBpm.value) return
      emit('save-rhr', {
        date: rhrFormDate.value,
        rhr_bpm: Number(rhrFormBpm.value)
      })
    }

    // 8. ピッチ (SPM) 安定度 (時間ベース前半 0-50% vs 後半 51-100%)
    const pitchStabilityReport = computed(() => {
      if (!props.workouts || props.workouts.length === 0) {
        return { available: false }
      }
      const sorted = [...props.workouts].sort(
        (a, b) => parseWorkoutLocalDate(b.workoutDate) - parseWorkoutLocalDate(a.workoutDate)
      )
      for (const w of sorted) {
        const tracking = workoutSplitsToTrackingData(w)
        if (!tracking) continue
        const res = calculatePitchStability(tracking)
        if (res) {
          return {
            available: true,
            workoutDate: w.workoutDate ? w.workoutDate.split(/[ T]/)[0] : '',
            activityName: w.activityName || 'ランニング',
            ratio: res.pitchStabilityRatio,
            spmFirst: res.spmFirst,
            spmSecond: res.spmSecond,
            status: res.status,
            evaluation: res.evaluation
          }
        }
      }
      return { available: false }
    })

    const latestOverallCadence = computed(() => {
      if (!props.workouts || props.workouts.length === 0) return null
      const sorted = [...props.workouts].sort(
        (a, b) => parseWorkoutLocalDate(b.workoutDate) - parseWorkoutLocalDate(a.workoutDate)
      )
      const found = sorted.find(w => Number(w.cadence || 0) > 0)
      if (!found) return null
      return {
        cadence: found.cadence,
        stride: found.averageStride
      }
    })

    // 9. ランニング能力 5軸レーダーチャート ＆ 総合仕上がり度判定
    const abilityRadar = computed(() => {
      return calculateAbilityRadarEvaluation({
        ctl: pmcResult.value.CTL,
        targetCtl: targetCtl.value,
        tsb: pmcResult.value.TSB,
        decouplingReport: decouplingReport.value,
        latestEfResult: latestEfResult.value,
        pitchStabilityReport: pitchStabilityReport.value,
        latestOverallCadence: latestOverallCadence.value,
        workouts: props.workouts,
        riegelBest: riegelBest.value,
        targetGoal: props.targetGoal,
        latestRhrEntry: latestRhrEntry.value
      })
    })

    const radarChartSeries = computed(() => [
      {
        name: '現在スコア',
        data: abilityRadar.value.axes.map(a => a.score)
      },
      {
        name: '目標基準ライン (80pt)',
        data: [80, 80, 80, 80, 80]
      }
    ])

    const radarChartOptions = computed(() => {
      const toneColor =
        abilityRadar.value.readinessTone === 'peak'
          ? '#0D9488'
          : abilityRadar.value.readinessTone === 'caution'
            ? '#EA580C'
            : '#2563EB'

      return {
        chart: {
          type: 'radar',
          toolbar: { show: false },
          background: 'transparent',
          fontFamily: "'Inter', 'IBM Plex Sans JP', sans-serif",
          sparkline: { enabled: false },
          parentHeightOffset: 0
        },
        colors: [toneColor, '#94A3B8'],
        stroke: {
          width: [2.5, 1.5],
          dashArray: [0, 4]
        },
        fill: {
          opacity: [0.26, 0.04]
        },
        markers: {
          size: [4, 0],
          colors: ['#FFFFFF'],
          strokeColors: toneColor,
          strokeWidth: 2,
          hover: { size: 6 }
        },
        xaxis: {
          categories: abilityRadar.value.axes.map(a => a.shortLabel),
          labels: {
            show: true,
            style: {
              colors: ['#1E293B', '#1E293B', '#1E293B', '#1E293B', '#1E293B'],
              fontSize: '10.5px',
              fontWeight: 700,
              fontFamily: "'Inter', 'IBM Plex Sans JP', sans-serif"
            }
          }
        },
        yaxis: {
          min: 0,
          max: 100,
          tickAmount: 4,
          labels: {
            show: false
          }
        },
        plotOptions: {
          radar: {
            size: 74,
            polygons: {
              strokeColors: '#CBD5E1',
              strokeWidth: 1,
              connectorColors: '#CBD5E1',
              fill: {
                colors: ['#F8FAFC', '#EEF2F7']
              }
            }
          }
        },
        legend: {
          show: false
        },
        tooltip: {
          theme: 'light',
          y: {
            formatter: (val) => `${val} / 100 pt`
          }
        }
      }
    })

    return {
      activeScienceTab,
      rhrFormDate,
      rhrFormBpm,
      hrConfig,
      last30DaysDistance,
      riegelBest,
      riegelAchievementPct,
      latestEfResult,
      decouplingReport,
      pmcResult,
      latestWorkoutTrimp,
      latestWorkoutHrr,
      last7DaysTrimp,
      targetCtl,
      tsbStateLabel,
      paceHrSummary,
      rhrTrendSeries,
      latestRhrEntry,
      submitRhr,
      pitchStabilityReport,
      latestOverallCadence,
      abilityRadar,
      radarChartSeries,
      radarChartOptions,
      formatHMS: formatSecondsToHMS
    }
  }
}
</script>

<style scoped>
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

/* スポーツ科学メトリクス解析パネル */
.bento-science-panel {
  background: #F2F4F8;
  border: 1px solid #D5DBE3;
  border-radius: 16px;
  padding: 18px 20px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}

.panel-title {
  font-size: 0.92rem;
  font-weight: 700;
  color: #1E293B;
  letter-spacing: -0.01em;
}

.hr-config-pill {
  font-size: 0.66rem;
  font-weight: 600;
  color: #475569;
  background: #E2E7EE;
  border: 1px solid #D1D8E2;
  padding: 2px 8px;
  border-radius: 99px;
}

.science-tabs {
  background: #E2E7EE;
  padding: 3px;
  border-radius: 10px;
}

.science-tab-btn {
  border: none;
  background: transparent;
  color: #526071;
  font-size: 0.7rem;
  font-weight: 600;
  padding: 5px 6px;
  border-radius: 7px;
  cursor: pointer;
  transition: all 0.15s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.science-tab-btn.active {
  background: #F8FAFC;
  color: #1E293B;
  font-weight: 700;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.08);
}

.warning-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #EA580C;
  display: inline-block;
}

.science-subcard {
  background: #E8ECF2;
  border: 1px solid #D5DBE3;
}

.subcard-heading {
  font-size: 0.75rem;
  font-weight: 700;
  color: #1E293B;
}

.subcard-formula {
  font-size: 0.64rem;
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
  padding: 5px 9px;
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
  font-size: 0.8rem;
  font-weight: 800;
  color: #1E293B;
}

.r-val-primary {
  color: #2563EB;
}

.ef-compare-row {
  font-size: 0.72rem;
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

.border-top-subtle {
  border-top: 1px solid #D5DBE3;
}

.ef-spark-bars {
  height: 28px;
}

.ef-spark-col {
  height: 100%;
  display: flex;
  align-items: flex-end;
}

.ef-spark-bar {
  width: 100%;
  background: #3653B3;
  border-radius: 2px 2px 0 0;
  opacity: 0.85;
}

.rhr-input {
  background: #F2F4F8;
  border: 1px solid #C4CDD9;
  border-radius: 6px;
  padding: 3px 6px;
  font-size: 0.72rem;
  color: #1E293B;
}

.subcard-footnote {
  font-size: 0.66rem;
  color: #526071;
}

.subcard-empty {
  font-size: 0.72rem;
  color: #526071;
  text-align: center;
}

/* ランニング能力レーダーチャート & 総合判定バナー */
.radar-verdict-banner {
  border: 1px solid #C5D1E8;
  background: linear-gradient(135deg, #E2EBF8 0%, #EEF3FB 100%);
  position: relative;
  overflow: hidden;
}

.radar-verdict-banner.verdict-peak {
  border-color: #99E6D8;
  background: linear-gradient(135deg, #D9F7F0 0%, #ECFEF9 100%);
}

.radar-verdict-banner.verdict-ready {
  border-color: #B4CEF5;
  background: linear-gradient(135deg, #DFECFF 0%, #EFF6FF 100%);
}

.radar-verdict-banner.verdict-caution {
  border-color: #FDBA74;
  background: linear-gradient(135deg, #FFEDD5 0%, #FFF7ED 100%);
}

.verdict-eyebrow {
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: #2B4494;
}

.verdict-peak .verdict-eyebrow {
  color: #0F766E;
}

.verdict-caution .verdict-eyebrow {
  color: #9A3412;
}

.verdict-grade-pill {
  font-size: 0.66rem;
  font-weight: 800;
  padding: 2px 8px;
  border-radius: 99px;
  background: rgba(30, 41, 59, 0.08);
  color: #1E293B;
}

.verdict-headline {
  font-size: 0.84rem;
  font-weight: 800;
  color: #0F172A;
  line-height: 1.35;
  letter-spacing: -0.015em;
}

.verdict-subtext {
  font-size: 0.68rem;
  font-weight: 600;
  color: #475569;
  line-height: 1.35;
}

.radar-chart-box {
  width: 100%;
  max-width: 280px;
  margin-top: -6px;
  margin-bottom: -8px;
}

.radar-axis-row {
  padding: 2px 0;
}

.axis-grade-badge {
  width: 18px;
  height: 18px;
  border-radius: 5px;
  font-size: 0.64rem;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.grade-s {
  background: #0D9488;
  color: #FFFFFF;
}

.grade-a {
  background: #2563EB;
  color: #FFFFFF;
}

.grade-b {
  background: #4F46E5;
  color: #FFFFFF;
}

.grade-c {
  background: #D97706;
  color: #FFFFFF;
}

.grade-d {
  background: #64748B;
  color: #FFFFFF;
}

.axis-name {
  font-size: 0.71rem;
  font-weight: 700;
  color: #1E293B;
}

.axis-raw-meta {
  font-size: 0.66rem;
  font-weight: 600;
  color: #526071;
}

.axis-score-val {
  font-size: 0.74rem;
  font-weight: 800;
  color: #0F172A;
  min-width: 34px;
  text-align: right;
}

.axis-score-val small {
  font-size: 0.58rem;
  font-weight: 600;
  color: #64748B;
  margin-left: 1px;
}

.stage-segment-bar {
  height: 5px;
}

.stage-seg {
  height: 100%;
  border-radius: 99px;
  background: #D5DBE3;
  transition: background-color 0.25s ease;
}

.stage-seg.seg-active {
  background: #3B82F6;
}

.stage-seg.seg-peak {
  background: #0D9488;
}

.stage-seg.seg-warn {
  background: #EA580C;
}

.gap-05 { gap: 2px; }
.gap-1 { gap: 4px; }
.gap-1\.5 { gap: 6px; }
.gap-2\.5 { gap: 10px; }
</style>
