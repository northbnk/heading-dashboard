<template>
  <!-- 統計スタッツカード ( displayMode が all または stats-only の時に表示 ) -->
  <v-row v-if="displayMode === 'all' || displayMode === 'stats-only'">
    <!-- 直近30日間の走行距離 (進捗バー付き) -->
    <v-col cols="12" sm="6" md="4" lg="4" class="d-flex">
      <v-card class="stat-card px-3 px-sm-4 py-3 w-100" elevation="4">
        <div class="d-flex justify-space-between align-center">
          <div>
            <div class="text-caption text-grey">直近30日の走行ボリューム</div>
            <div class="text-h4 font-weight-bold text-primary my-1">
              {{ last30DaysDistance.toFixed(1) }} <span class="text-caption text-grey-darken-1">km</span>
            </div>
          </div>
          <v-avatar color="rgba(99, 102, 241, 0.1)" rounded size="48">
            <v-icon color="primary" icon="mdi-calendar-range" size="28"></v-icon>
          </v-avatar>
        </div>
        <!-- プログレスバー（目標連動 - ゲージ内に目標・％を表示） -->
        <v-progress-linear
          :model-value="Math.min((last30DaysDistance / monthlyGoalDistance) * 100, 100)"
          color="primary"
          height="18"
          rounded
          class="mt-3"
        >
          <template v-slot:default="{ value }">
            <!-- 目標値 (右寄せ) -->
            <span class="text-caption font-weight-bold position-absolute" style="right: 8px; z-index: 2; color: rgba(255, 255, 255, 0.85);">
              {{ monthlyGoalDistance }} km
            </span>
            <!-- パーセンテージ (現在のゲージに対して中央揃え、低い場合は左寄せ) -->
            <div
              :style="{
                position: 'absolute',
                left: 0,
                width: value < 15 ? 'auto' : value + '%',
                paddingLeft: value < 15 ? '8px' : '0',
                textAlign: value < 15 ? 'left' : 'center',
                zIndex: 2,
                color: 'white'
              }"
              class="text-caption font-weight-bold"
            >
              {{ Math.round(value) }}%
            </div>
          </template>
        </v-progress-linear>
      </v-card>
    </v-col>

    <!-- 推定VDOT & 予測タイム (進捗バー付き) -->
    <v-col cols="12" sm="6" md="4" lg="4" class="d-flex">
      <v-card class="stat-card px-3 px-sm-4 py-3 w-100" elevation="4">
        <div class="d-flex justify-space-between align-center">
          <div>
            <div class="text-caption text-grey">推定最高VDOT</div>
            <div>
              <div class="text-h4 font-weight-bold text-success my-1">
                {{ estimatedVDOT > 0 ? estimatedVDOT.toFixed(1) : '--' }}
              </div>
              <div class="text-caption text-grey-lighten-1 mt-0.5" v-if="estimatedVDOT > 0">
                (フル予測: <span class="text-success font-weight-bold">{{ formattedPredictedTime }}</span>)
              </div>
            </div>
          </div>
          <v-avatar color="rgba(16, 185, 129, 0.1)" rounded size="48">
            <v-icon color="success" icon="mdi-chart-bell-curve-cumulative" size="28"></v-icon>
          </v-avatar>
        </div>
        <!-- プログレスバー（目標VDOT連動 - ゲージ内に目標・％を表示） -->
        <v-progress-linear
          :model-value="Math.min((estimatedVDOT / requiredVDOT) * 100, 100)"
          color="success"
          height="18"
          rounded
          class="mt-3"
        >
          <template v-slot:default="{ value }">
            <!-- 目標値 (右寄せ) -->
            <span class="text-caption font-weight-bold position-absolute" style="right: 8px; z-index: 2; color: rgba(255, 255, 255, 0.85);">
              {{ requiredVDOT.toFixed(1) }}
            </span>
            <!-- パーセンテージ (現在のゲージに対して中央揃え、低い場合は左寄せ) -->
            <div
              :style="{
                position: 'absolute',
                left: 0,
                width: value < 15 ? 'auto' : value + '%',
                paddingLeft: value < 15 ? '8px' : '0',
                textAlign: value < 15 ? 'left' : 'center',
                zIndex: 2,
                color: 'white'
              }"
              class="text-caption font-weight-bold"
            >
              {{ estimatedVDOT > 0 ? Math.round(value) : 0 }}%
            </div>
          </template>
        </v-progress-linear>
      </v-card>
    </v-col>

    <!-- 目標ペース最長距離 (進捗バー付き) -->
    <v-col cols="12" sm="6" md="4" lg="4" class="d-flex">
      <v-card class="stat-card px-3 px-sm-4 py-3 w-100" elevation="4">
        <div class="d-flex justify-space-between align-center">
          <div>
            <div class="text-caption text-grey">{{ goalLabel }}ペース最長距離 {{ goalPaceLimitLabel }}</div>
            <div>
              <div class="text-h4 font-weight-bold text-secondary my-1">
                {{ targetPaceMaxDistance.distance > 0 ? targetPaceMaxDistance.distance.toFixed(1) : '--' }} <span class="text-caption text-grey-darken-1">km</span>
              </div>
              <div class="text-caption text-grey-lighten-1 mt-0.5" v-if="targetPaceMaxDistance.date">
                (記録日: <span class="text-white">{{ targetPaceMaxDistance.date }}</span>)
              </div>
            </div>
          </div>
          <v-avatar color="rgba(0, 229, 255, 0.1)" rounded size="48">
            <v-icon color="secondary" icon="mdi-run-fast" size="28"></v-icon>
          </v-avatar>
        </div>
        <!-- プログレスバー（目標ロングラン距離連動 - ゲージ内に目標・％を表示） -->
        <v-progress-linear
          :model-value="Math.min((targetPaceMaxDistance.distance / goalLongRunLimit) * 100, 100)"
          color="secondary"
          height="18"
          rounded
          class="mt-3"
        >
          <template v-slot:default="{ value }">
            <!-- 目標値 (右寄せ) -->
            <span class="text-caption font-weight-bold position-absolute" style="right: 8px; z-index: 2; color: rgba(0, 0, 0, 0.85);">
              {{ goalLongRunLimit }} km
            </span>
            <!-- パーセンテージ (現在のゲージに対して中央揃え、低い場合は左寄せ) -->
            <div
              :style="{
                position: 'absolute',
                left: 0,
                width: value < 15 ? 'auto' : value + '%',
                paddingLeft: value < 15 ? '8px' : '0',
                textAlign: value < 15 ? 'left' : 'center',
                zIndex: 2,
                color: 'black'
              }"
              class="text-caption font-weight-bold"
            >
              {{ targetPaceMaxDistance.distance > 0 ? Math.round(value) : 0 }}%
            </div>
          </template>
        </v-progress-linear>
      </v-card>
    </v-col>

    <!-- 心拍効率 & 平均心拍数 (進捗バー付き) -->
    <v-col cols="12" sm="6" md="4" lg="4" class="d-flex">
      <v-card class="stat-card px-3 px-sm-4 py-3 w-100" elevation="4">
        <div class="d-flex justify-space-between align-center">
          <div>
            <div class="text-caption text-grey">ランニング心拍効率</div>
            <div>
              <div class="text-h4 font-weight-bold text-accent my-1">
                {{ heartEfficiency > 0 ? heartEfficiency.toFixed(2) : '--' }} <span class="text-caption text-grey-darken-1">m/b</span>
              </div>
              <div class="text-caption text-grey-lighten-1 mt-0.5" v-if="heartEfficiency > 0 && averageHeartRate > 0">
                (平均心拍: <span class="text-white">{{ Math.round(averageHeartRate) }} bpm</span>)
              </div>
            </div>
          </div>
          <v-avatar color="rgba(139, 92, 246, 0.1)" rounded size="48">
            <v-icon color="accent" icon="mdi-heart-flash" size="28"></v-icon>
          </v-avatar>
        </div>
        <!-- プログレスバー（目標心拍効率連動 - ゲージ内に目標・％を表示） -->
        <v-progress-linear
          :model-value="Math.min((heartEfficiency / targetEI) * 100, 100)"
          color="accent"
          height="18"
          rounded
          class="mt-3"
        >
          <template v-slot:default="{ value }">
            <!-- 目標値 (右寄せ) -->
            <span class="text-caption font-weight-bold position-absolute" style="right: 8px; z-index: 2; color: rgba(255, 255, 255, 0.85);">
              {{ targetEI.toFixed(2) }} m/b
            </span>
            <!-- パーセンテージ (現在のゲージに対して中央揃え、低い場合は左寄せ) -->
            <div
              :style="{
                position: 'absolute',
                left: 0,
                width: value < 15 ? 'auto' : value + '%',
                paddingLeft: value < 15 ? '8px' : '0',
                textAlign: value < 15 ? 'left' : 'center',
                zIndex: 2,
                color: 'white'
              }"
              class="text-caption font-weight-bold"
            >
              {{ heartEfficiency > 0 ? Math.round(value) : 0 }}%
            </div>
          </template>
        </v-progress-linear>
      </v-card>
    </v-col>

    <!-- 心肺スタミナ・デカップリング値 (進捗バー付き) -->
    <v-col cols="12" sm="6" md="4" lg="4" class="d-flex">
      <v-card class="stat-card px-3 px-sm-4 py-3 w-100" elevation="4">
        <div class="d-flex justify-space-between align-center">
          <div>
            <div class="text-caption text-grey">心肺デカップリング値</div>
            <div>
              <div class="text-h4 font-weight-bold text-deep-purple-accent-3 my-1">
                {{ staminaDecouplingAnalysis.available ? staminaDecouplingAnalysis.decoupling.toFixed(1) : '--' }} <span class="text-caption text-grey-darken-1">%</span>
              </div>
              <div class="text-caption text-grey-lighten-1 mt-0.5" v-if="staminaDecouplingAnalysis.available">
                (判定: <span class="text-white font-weight-bold">{{ staminaDecouplingAnalysis.rating.split(' ')[0] }}</span>)
              </div>
            </div>
          </div>
          <v-avatar color="rgba(139, 92, 246, 0.1)" rounded size="48">
            <v-icon color="deep-purple-accent-3" icon="mdi-heart-pulse" size="28"></v-icon>
          </v-avatar>
        </div>
        <!-- プログレスバー（目標デカップリング連動 - 100%からデカップリング値を引いてスタミナ強度を表す） -->
        <v-progress-linear
          :model-value="staminaDecouplingAnalysis.available ? Math.max(0, 100 - (staminaDecouplingAnalysis.decoupling * 8)) : 0"
          color="deep-purple-accent-3"
          height="18"
          rounded
          class="mt-3"
        >
          <template v-slot:default="{ value }">
            <!-- 目標値 (右寄せ) -->
            <span class="text-caption font-weight-bold position-absolute" style="right: 8px; z-index: 2; color: rgba(255, 255, 255, 0.85);">
              目標: 5%未満
            </span>
            <!-- 充足度パーセンテージ -->
            <div
              :style="{
                position: 'absolute',
                left: 0,
                width: value < 15 ? 'auto' : value + '%',
                paddingLeft: value < 15 ? '8px' : '0',
                textAlign: value < 15 ? 'left' : 'center',
                zIndex: 2,
                color: 'white'
              }"
              class="text-caption font-weight-bold"
            >
              {{ staminaDecouplingAnalysis.available ? Math.round(value) : 0 }}%
            </div>
          </template>
        </v-progress-linear>
      </v-card>
    </v-col>

    <!-- メインシューズ走行寿命 (進捗バー付き) -->
    <v-col cols="12" sm="6" md="4" lg="4" class="d-flex">
      <v-card class="stat-card px-3 px-sm-4 py-3 w-100" elevation="4">
        <div class="d-flex justify-space-between align-center">
          <div>
            <div class="text-caption text-grey">メインシューズ走行距離</div>
            <div class="d-flex flex-column flex-sm-row align-baseline">
              <div class="text-h4 font-weight-bold text-orange-darken-3 my-1">
                {{ mainShoe.distance > 0 ? mainShoe.distance.toFixed(1) : '--' }} <span class="text-caption text-grey-darken-1">km</span>
              </div>
              <div class="text-caption text-grey-lighten-1 ml-sm-2" v-if="mainShoe.name">
                ({{ mainShoe.name.substring(0, 10) }}{{ mainShoe.name.length > 10 ? '...' : '' }})
              </div>
            </div>
          </div>
          <v-avatar color="rgba(245, 158, 11, 0.1)" rounded size="48">
            <v-icon color="orange-darken-3" icon="mdi-shoe-run" size="28"></v-icon>
          </v-avatar>
        </div>
        <!-- プログレスバー（シューズ寿命600kmに対する割合） -->
        <v-progress-linear
          :model-value="mainShoe.lifePercent"
          :color="mainShoe.color"
          height="18"
          rounded
          class="mt-3"
        >
          <template v-slot:default="{ value }">
            <!-- 目標値 (右寄せ) -->
            <span class="text-caption font-weight-bold position-absolute" style="right: 8px; z-index: 2; color: rgba(255, 255, 255, 0.85);">
              寿命: 600km
            </span>
            <!-- 寿命進行％ -->
            <div
              :style="{
                position: 'absolute',
                left: 0,
                width: value < 15 ? 'auto' : value + '%',
                paddingLeft: value < 15 ? '8px' : '0',
                textAlign: value < 15 ? 'left' : 'center',
                zIndex: 2,
                color: 'white'
              }"
              class="text-caption font-weight-bold"
            >
              {{ mainShoe.distance > 0 ? Math.round(value) : 0 }}%
            </div>
          </template>
        </v-progress-linear>
      </v-card>
    </v-col>
  </v-row>

  <!-- 診断カードセクション ( displayMode が all または diagnosis-only の時に表示 ) -->
  <v-row :class="displayMode === 'all' ? 'mt-6' : ''" v-if="displayMode === 'all' || displayMode === 'diagnosis-only'">
    <v-col cols="12">
      <v-card class="diagnosis-card px-3 px-sm-6 py-5" elevation="4">
        <!-- 総合タイトル -->
        <div class="text-h6 font-weight-bold text-white d-flex align-center mb-4">
          <v-icon color="secondary" icon="mdi-clipboard-text-search" class="mr-2" size="24"></v-icon>
          ランニング総合診断・パフォーマンス分析報告
        </div>
        
        <v-divider class="mb-5" style="opacity: 0.15"></v-divider>

        <!-- 1. マラソン特化トレーニング診断 -->
        <div class="mb-6">
          <div class="d-flex flex-column flex-sm-row justify-space-between align-start align-sm-center mb-4">
            <div class="text-subtitle-1 font-weight-bold text-white d-flex align-center">
              <v-icon color="secondary" icon="mdi-trophy-outline" class="mr-2" size="20"></v-icon>
              {{ goalLabel }} マラソン特化トレーニング診断
            </div>
            <!-- 総合評価バッジ -->
            <v-chip
              :color="marathonDiagnosis.color"
              variant="flat"
              size="medium"
              class="font-weight-bold px-3 mt-2 mt-sm-0 text-black"
            >
              判定: {{ marathonDiagnosis.rating }}
            </v-chip>
          </div>

          <v-row>
            <!-- 強み / 達成できている項目 -->
            <v-col cols="12" md="6">
              <div class="text-subtitle-2 font-weight-bold text-success mb-3 d-flex align-center">
                <v-icon icon="mdi-check-decagram" class="mr-1" size="18"></v-icon>
                目標基準をクリアしている項目 (強み)
              </div>
              <ul class="diagnosis-list">
                <li v-for="(item, idx) in marathonDiagnosis.strengths" :key="'s-'+idx" class="d-flex align-start mb-3 text-grey-lighten-2 text-body-2">
                  <v-icon color="success" icon="mdi-check-circle" size="16" class="mr-2 mt-1"></v-icon>
                  {{ item }}
                </li>
                <li v-if="marathonDiagnosis.strengths.length === 0" class="text-grey text-body-2 px-6">
                  現在、設定された目標基準をクリアした項目は検出されていません。
                </li>
              </ul>
            </v-col>

            <!-- 課題 / 不足している項目 -->
            <v-col cols="12" md="6" class="mt-4 mt-md-0">
              <div class="text-subtitle-2 font-weight-bold text-warning mb-3 d-flex align-center">
                <v-icon icon="mdi-alert-decagram" class="mr-1" size="18"></v-icon>
                さらなるトレーニングが必要な項目 (課題)
              </div>
              <ul class="diagnosis-list">
                <li v-for="(item, idx) in marathonDiagnosis.issues" :key="'i-'+idx" class="d-flex align-start mb-3 text-grey-lighten-2 text-body-2">
                  <v-icon color="warning" icon="mdi-alert-circle" size="16" class="mr-2 mt-1"></v-icon>
                  {{ item }}
                </li>
                <li v-if="marathonDiagnosis.issues.length === 0" class="text-success font-weight-bold text-body-2 px-6">
                  目標とする難易度のトレーニング項目をすべて完璧にクリアしています！この調子をキープしましょう。
                </li>
              </ul>
            </v-col>
          </v-row>
        </div>

        <v-divider class="my-6" style="opacity: 0.15"></v-divider>

        <!-- 2. 心肺耐久スタミナ（デカップリング）診断 -->
        <div class="mb-6">
          <div class="d-flex justify-space-between align-center mb-3">
            <div class="text-subtitle-1 font-weight-bold text-white d-flex align-center">
              <v-icon color="accent" icon="mdi-heart-pulse" class="mr-2" size="20"></v-icon>
              心肺耐久スタミナ（デカップリング）診断
            </div>
            <v-chip
              v-if="staminaDecouplingAnalysis.available"
              :color="staminaDecouplingAnalysis.color"
              variant="flat"
              size="small"
              class="font-weight-bold text-black"
            >
              {{ staminaDecouplingAnalysis.rating }}
            </v-chip>
          </div>

          <div v-if="!staminaDecouplingAnalysis.available" class="text-grey text-body-2 py-4 text-center">
            {{ staminaDecouplingAnalysis.message }}
          </div>
          <div v-else>
            <div class="text-caption text-grey mb-3">
              直近の最長距離走: <strong>{{ staminaDecouplingAnalysis.activityName }}</strong> ({{ staminaDecouplingAnalysis.workoutDate }} / {{ staminaDecouplingAnalysis.distance.toFixed(1) }}km)
            </div>
            
            <div class="d-flex align-baseline mb-4">
              <div class="text-h3 font-weight-black text-white mr-2">
                {{ staminaDecouplingAnalysis.decoupling }}%
              </div>
              <div class="text-caption text-grey">後半の心肺出力低下度（デカップリング値）</div>
            </div>
            
            <div class="description-box px-3 py-2 rounded-lg text-body-2 text-grey-lighten-2" style="background: rgba(255,255,255,0.02); border-left: 3px solid #8B5CF6;">
              {{ staminaDecouplingAnalysis.advice }}
            </div>
          </div>
        </div>

        <v-divider class="my-6" style="opacity: 0.15"></v-divider>

        <!-- 3. シューズ走行寿命 & 効率分析 -->
        <div>
          <div class="text-subtitle-1 font-weight-bold text-white d-flex align-center mb-3">
            <v-icon color="warning" icon="mdi-shoe-run" class="mr-2" size="20"></v-icon>
            シューズ走行寿命 & 効率分析
          </div>

          <div v-if="!shoeAnalytics.available" class="text-grey text-body-2 py-4 text-center">
            Stravaで使用シューズを登録すると、シューズごとの走行距離とパフォーマンス効率がここに表示されます。
          </div>
          
          <div v-else class="w-100">
            <v-row>
              <v-col v-for="shoe in shoeAnalytics.shoes" :key="shoe.name" cols="12" sm="6" md="4" class="mb-2">
                <v-card variant="outlined" class="pa-4 rounded-lg border-grey-darken-3" style="background: rgba(255,255,255,0.01)">
                  <div class="d-flex justify-space-between align-center text-body-2 mb-1">
                    <span class="font-weight-bold text-white">{{ shoe.name }}</span>
                    <span class="text-caption text-grey">
                      累計: <strong class="text-white">{{ shoe.distance }} km</strong> ({{ shoe.runs }}回)
                    </span>
                  </div>
                  <div class="d-flex justify-space-between align-center text-caption text-grey-lighten-1 mb-2">
                    <span>平均ペース: {{ shoe.paceStr }}/km <span v-if="shoe.avgHR">| 心拍: {{ shoe.avgHR }} bpm</span></span>
                    <span :class="`text-${shoe.color} font-weight-bold`">{{ shoe.status }}</span>
                  </div>
                  <v-progress-linear
                    :model-value="shoe.lifePercent"
                    :color="shoe.color"
                    height="8"
                    rounded
                  ></v-progress-linear>
                </v-card>
              </v-col>
            </v-row>
          </div>
        </div>
      </v-card>
    </v-col>
  </v-row>
</template>

<script>
import { computed } from 'vue'

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
      default: 'all' // 'all', 'stats-only', 'diagnosis-only'
    },
    upcomingRace: {
      type: Object,
      default: null
    }
  },
  setup(props) {
    // すべてのブラウザで一桁時間を含む日付を安全にパースするためのヘルパー
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

    // 目標の表示用日本語ラベル
    const goalLabel = computed(() => {
      if (props.targetGoal === 'sub4') return 'サブ4'
      if (props.targetGoal === 'sub3.5') return 'サブ3.5'
      return 'サブ3'
    })

    // 目標に応じた月間走行距離のノルマ
    const monthlyGoalDistance = computed(() => {
      if (props.targetGoal === 'sub4') return 150
      if (props.targetGoal === 'sub3.5') return 200
      return 300
    })

    // 目標に応じた必要VDOT値
    const requiredVDOT = computed(() => {
      if (props.targetGoal === 'sub4') return 38.0
      if (props.targetGoal === 'sub3.5') return 44.8
      return 53.6
    })

    // 目標に応じた推奨平均心拍上限 [NEW]
    const targetHeartRate = computed(() => {
      if (props.targetGoal === 'sub4') return 145
      if (props.targetGoal === 'sub3.5') return 150
      return 155
    })

    // 目標に応じたMペース（マラソンペース）判定秒数範囲 (分/km)
    // サブ3: 4:15/km (255s) -> 4:05〜4:25/km (245s〜265s)
    // サブ3.5: 4:55/km (295s) -> 4:45〜5:05/km (285s〜305s)
    // サブ4: 5:40/km (340s) -> 5:25〜5:55/km (325s〜355s)
    const mPaceRange = computed(() => {
      if (props.targetGoal === 'sub4') {
        return { min: 325, max: 355, paceStr: '5:40' }
      }
      if (props.targetGoal === 'sub3.5') {
        return { min: 285, max: 305, paceStr: '4:55' }
      }
      return { min: 245, max: 265, paceStr: '4:15' }
    })

    // 目標ペース最長距離カード用の表示ラベル
    const goalPaceLimitLabel = computed(() => {
      if (props.targetGoal === 'sub4') return '(≦5:45)'
      if (props.targetGoal === 'sub3.5') return '(≦5:00)'
      return '(≦4:20)'
    })

    // 直近30日間の走行距離
    const last30DaysDistance = computed(() => {
      if (props.workouts.length === 0) return 0
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      return props.workouts
        .filter(w => safeParseDate(w.workoutDate) >= thirtyDaysAgo)
        .reduce((sum, w) => sum + Number(w.distance || 0), 0)
    })

    // 各ワークアウトの VDOT 計算
    const calculateVDOT = (distanceKm, durationSeconds) => {
      if (!distanceKm || !durationSeconds || distanceKm <= 0 || durationSeconds <= 0) return 0
      
      const t = durationSeconds / 60 // 分
      const v = (distanceKm * 1000) / t // m/min
      
      // VO2 の算出
      const vo2 = -4.60 + 0.182258 * v + 0.000104 * Math.pow(v, 2)
      
      // PercentMax の算出
      const percentMax = 0.8 + 0.1894393 * Math.exp(-0.012778 * t) + 0.2989558 * Math.exp(-0.1932605 * t)
      
      return vo2 / percentMax
    }

    // 心拍数とペースの相関から、最大酸素摂取量（VDOT）を推定する生理学的モデル (COROS等のアルゴリズムの簡易再現)
    const calculateHeartrateBasedVDOT = (distanceKm, durationSeconds, averageHeartrate, maxHeartrate) => {
      if (!distanceKm || !durationSeconds || distanceKm <= 0 || durationSeconds <= 0) return 0
      
      const t = durationSeconds / 60 // 分
      const v = (distanceKm * 1000) / t // 走行速度 (m/min)
      
      // その走行速度に必要な酸素摂取量 (VO2)
      const vo2 = 0.2 * v + 0.9
      
      // 心拍数による運動強度 (%VO2Max) の推定
      const hrRest = 55 // 静止時心拍数 (想定)
      const hrMax = maxHeartrate && maxHeartrate > 140 ? maxHeartrate : 185 // 最大心拍数
      const hrActive = averageHeartrate && averageHeartrate > 100 ? averageHeartrate : 0
      
      if (hrActive <= hrRest) {
        // 心拍データがない場合は、通常の全力走モデルで計算
        return calculateVDOT(distanceKm, durationSeconds)
      }
      
      // 予備心拍数比による運動強度の算出
      const percentVO2Max = (hrActive - hrRest) / (hrMax - hrRest)
      if (percentVO2Max <= 0.3) return 0 // 強度が低すぎるデータは除外
      
      // 最大酸素摂取量 (VO2Max) = 走行時VO2 / 運動強度
      const estimatedVO2Max = vo2 / percentVO2Max
      
      // 上限を65（フル2時間37分相当）に制限して異常値を除外
      return Math.min(estimatedVO2Max, 65)
    }

    // 保存データ全体の最高 VDOT を推定 (直近30日間の心拍数ベースの走力推定を優先)
    const estimatedVDOT = computed(() => {
      const thirtyDaysAgo = new Date('2026-07-05')
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const validWorkouts = props.workouts.filter(w => {
        const d = safeParseDate(w.workoutDate)
        return d >= thirtyDaysAgo &&
          Number(w.distance || 0) >= 5.0 && 
          w.movingTimeSeconds > 0 && 
          w.averageHeartrate && 
          w.averageHeartrate >= 120
      })
      
      if (validWorkouts.length === 0) {
        const longWorkouts = props.workouts.filter(w => {
          const d = safeParseDate(w.workoutDate)
          return d >= thirtyDaysAgo &&
            Number(w.distance || 0) >= 5.0 && 
            w.durationSeconds > 0
        })
        if (longWorkouts.length === 0) return 0
        const vdots = longWorkouts.map(w => calculateVDOT(Number(w.distance), w.durationSeconds))
        return Math.max(...vdots, 0)
      }
      
      const vdots = validWorkouts.map(w => {
        return calculateHeartrateBasedVDOT(
          Number(w.distance),
          w.movingTimeSeconds,
          w.averageHeartrate,
          w.maxHeartrate
        )
      }).filter(v => v >= 30 && v <= 65)
      
      if (vdots.length === 0) return 0
      
      vdots.sort((a, b) => b - a)
      const topCount = Math.min(3, vdots.length)
      const sum = vdots.slice(0, topCount).reduce((acc, v) => acc + v, 0)
      return Number((sum / topCount).toFixed(1))
    })

    // VDOTからフルマラソン予測タイムを線形補間
    const vdotTable = [
      { vdot: 40, time: 13980 }, // 3:53:00
      { vdot: 41, time: 13650 }, // 3:47:30
      { vdot: 42, time: 13334 }, // 3:42:14
      { vdot: 43, time: 13030 }, // 3:37:10
      { vdot: 44, time: 12764 }, // 3:32:44
      { vdot: 45, time: 12506 }, // 3:28:26
      { vdot: 46, time: 12262 }, // 3:24:22
      { vdot: 47, time: 12025 }, // 3:20:25
      { vdot: 48, time: 11795 }, // 3:16:35
      { vdot: 49, time: 11571 }, // 3:12:51
      { vdot: 50, time: 11354 }, // 3:09:14
      { vdot: 51, time: 11143 }, // 3:05:43
      { vdot: 52, time: 10938 }, // 3:02:18
      { vdot: 53, time: 10738 }, // 2:58:58
      { vdot: 54, time: 10543 }, // 2:55:43
      { vdot: 55, time: 10353 }, // 2:52:33
      { vdot: 56, time: 10168 }, // 2:49:28
      { vdot: 57, time: 9988 },  // 2:46:28
      { vdot: 58, time: 9812 },  // 2:43:32
      { vdot: 59, time: 9641 },  // 2:40:41
      { vdot: 60, time: 9474 }   // 2:37:54
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
      return `${hrs}時間${mins}分${secs}秒`
    })

    // 目標設定に応じた目標ペース最長距離
    const targetPaceMaxDistance = computed(() => {
      let limitSeconds = 260 // サブ3: 4:20/km以下
      if (props.targetGoal === 'sub4') {
        limitSeconds = 345 // サブ4: 5:45/km以下
      } else if (props.targetGoal === 'sub3.5') {
        limitSeconds = 300 // サブ3.5: 5:00/km以下
      }

      const matchingRuns = props.workouts.filter(w => w.averagePaceSeconds > 0 && w.averagePaceSeconds <= limitSeconds)
      if (matchingRuns.length === 0) return { distance: 0, date: '' }
      
      const sorted = [...matchingRuns].sort((a, b) => Number(b.distance) - Number(a.distance))
      return {
        distance: Number(sorted[0].distance),
        date: sorted[0].workoutDate.split(' ')[0]
      }
    })

    // 平均心拍効率
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

    // --- [NEW] マラソン特化分析ロジック ---

    // 直近30日間のロングラン実績
    const longRunsCount = computed(() => {
      if (props.workouts.length === 0) return { over30k: 0, over20k: 0 }
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      const recentWorkouts = props.workouts.filter(w => safeParseDate(w.workoutDate) >= thirtyDaysAgo)
      const over30k = recentWorkouts.filter(w => Number(w.distance) >= 30.0).length
      const over20k = recentWorkouts.filter(w => Number(w.distance) >= 20.0 && Number(w.distance) < 30.0).length
      
      return { over30k, over20k }
    })

    // 各目標に合わせた設定Mペースでの練習スタッツ
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

    // 大会登録状況に基づいた動的診断アドバイス
    const raceDiagnosis = computed(() => {
      const race = props.upcomingRace
      const BASE_DATE = new Date('2026-07-05')
      
      if (!race) {
        const G = monthlyGoalDistance.value
        const D = last30DaysDistance.value
        const gap = Math.max(0, G - D)
        const weeklyTarget = gap > 0 ? gap : G / 4
        
        let advice = ''
        if (gap > 0) {
          advice = `今週はあと${weeklyTarget.toFixed(1)}kmを目標に走りましょう。`
        } else {
          advice = `月間目標である${G}kmをクリアしています！今週は調整（週平均の目標${weeklyTarget.toFixed(1)}km）を目安に走りましょう。`
        }
        
        return {
          mode: 'VOLUME_ADJUSTMENT',
          heading: 'ベースアップ期間（走行ボリューム意識）',
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
        
        let advice = ''
        if (gap > 0) {
          advice = `今週はあと${weeklyTarget.toFixed(1)}kmを目標に走りましょう。`
        } else {
          advice = `月間目標である${G}kmをクリアしています！今週は調整（週平均の目標${weeklyTarget.toFixed(1)}km）を目安に走りましょう。`
        }
        
        return {
          mode: 'VOLUME_ADJUSTMENT',
          heading: 'ベースアップ期間（走行ボリューム意識）',
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
          advice = '一番重要な時期です！今週末に30kmロングラン（設定 4:30〜4:40/km）を計画し、平日は目標ペースでの5km走を入れてください。'
        } else if (weeksRemaining >= 2) {
          phaseName = '調整期（テーパリング）'
          advice = '走行ボリュームを落とし、疲労を抜く時期です。週末は20kmをレースペースで走りましょう。'
        } else {
          phaseName = '直前期'
          advice = '完全な疲労回復に努めましょう。レース3日前に3kmの刺激入れを行うだけで十分です。'
        }
        
        return {
          mode: 'PERIODIZATION',
          heading: `${race.name} まで あと ${weeksRemaining}週 ｜ ${phaseName}`,
          advice
        }
      }
    })

    // マラソン特化トレーニング診断（目標設定に連動）
    const marathonDiagnosis = computed(() => {
      const strengths = []
      const issues = []
      const label = goalLabel.value
      const targetDist = monthlyGoalDistance.value
      const targetHR = targetHeartRate.value
      const range = mPaceRange.value
      
      // 1. 走行ボリューム診断 (目標距離に応じて動的変化)
      const dist30d = last30DaysDistance.value
      if (dist30d >= targetDist) {
        strengths.push(`直近30日の走行距離が${targetDist}km以上あり、${label}達成に向けた強固な有酸素ベースが構築されています。`)
      } else if (dist30d >= targetDist * 0.8) {
        strengths.push(`直近30日の走行距離は${dist30d.toFixed(1)}kmです。目標とする${targetDist}kmに向け、週数キロのイージージョグを追加すると仕上がりがさらに安定します。`)
      } else {
        issues.push(`直近30日の走行距離が${dist30d.toFixed(1)}kmと少なめです。${label}に必要な脚作りのため、まずは月間${targetDist}km付近を安定させましょう。`)
      }
      
      // 2. ロングラン(持久力・スタミナ)診断 (目標設定に応じて推奨回数を変化)
      const lr = longRunsCount.value
      if (props.targetGoal === 'sub3') {
        // サブ3: 30km走1回以上 ＆ 20k走3回以上
        if (lr.over30k >= 1) {
          strengths.push(`直近30日に30km以上の距離走をクリアしており、後半のエネルギー枯渇対策と脚の耐性ができています。`)
        } else {
          issues.push('直近30日以内に30km以上のロングラン実績がありません。30km走をレースの3〜4週間前までに少なくとも1〜2回実施することを推奨します。')
        }
        if (lr.over20k >= 3) {
          strengths.push(`20km以上の距離走を${lr.over20k}回消化しており、高い持久レベルが維持されています。`)
        } else if (lr.over20k < 2) {
          issues.push('20km〜25kmの中距離走の頻度が不足しています。週末のロングジョグを増やし、脚作りを進めましょう。')
        }
      } else if (props.targetGoal === 'sub3.5') {
        // サブ3.5: 30km走1回以上（または25km走2回以上）
        if (lr.over30k >= 1) {
          strengths.push(`直近30日に30km以上のロングランをクリアしており、サブ3.5突破に必要なスタミナは十分です。`)
        } else if (lr.over20k >= 2) {
          strengths.push(`20km〜29kmのロングランを${lr.over20k}回消化しており、サブ3.5に向けて良好な脚耐久性が作られています。`)
        } else {
          issues.push('サブ3.5後半の失速を防ぐため、20km〜25km以上の距離走の頻度を直近で2回以上に増やしましょう。')
        }
      } else {
        // サブ4: 20km走が1〜2回あれば十分
        if (lr.over30k >= 1 || lr.over20k >= 1) {
          strengths.push(`20km以上のロングランをクリアしており、サブ4突破に必要な有酸素心肺・脚耐久性が育っています。`)
        } else {
          issues.push('サブ4達成の鍵は後半に歩かない脚力です。週末に15km〜20km程度のロングジョグを取り入れてください。')
        }
      }
      
      // 3. Mペース (目標ペース: 4:15 / 4:55 / 5:40) 診断 (目標設定連動)
      const mp = mPaceStats.value
      if (mp) {
        const diffHR = mp.avgHeartrate ? mp.avgHeartrate - targetHR : 0
        if (mp.avgHeartrate && mp.avgHeartrate <= targetHR) {
          strengths.push(`${label}目標ペース（${range.paceStr}/km付近）での平均心拍数が${mp.avgHeartrate} bpmと低く、目標心拍（≦${targetHR} bpm）内で極めて低燃費に走れています。`)
        } else if (mp.avgHeartrate) {
          issues.push(`${label}目標ペース時の平均心拍数が${mp.avgHeartrate} bpmと、目標心拍上限（${targetHR} bpm）を${diffHR} bpm上回っています。本番後半にオーバーヒートして失速する危険があるため、より低い心拍で同じペースを維持できるよう有酸素ジョグを強化してください。`)
        }
        
        // 必要とするMペースでの走破距離の診断
        let targetMdist = 15.0
        if (props.targetGoal === 'sub4') targetMdist = 10.0
        if (props.targetGoal === 'sub3') targetMdist = 20.0

        if (mp.maxDist >= targetMdist) {
          strengths.push(`目標ペースで${targetMdist}km以上の単独走（最長${mp.maxDist.toFixed(1)}km）をクリアしており、ペースの再現能力はバッチリです。`)
        } else {
          issues.push(`目標ペースでの最長走行距離が${mp.maxDist.toFixed(1)}kmと短めです。本番ペース走の距離を${targetMdist}km程度まで伸ばして心肺とフォームを慣らしましょう。`)
        }
      } else {
        issues.push(`目標とする${label}ペース（${range.paceStr}/km付近）で走った5km以上の練習データが見つかりません。目標ペースの感覚と心肺能力を身につけるため、ポイント練習にMペース走を追加してください。`)
      }
      
      // 4. 総合評価の算出
      let rating = `${label} 準備不足`
      let color = 'error'
      const strengthPoints = strengths.length
      const issuePoints = issues.length
      
      if (strengthPoints >= 3 && issuePoints === 0) {
        rating = `${label} 合格圏内 (S)`
        color = 'success'
      } else if (strengthPoints >= 2 && issuePoints <= 1) {
        rating = `${label} 射程圏内 (A)`
        color = 'success'
      } else if (strengthPoints >= 1 && issuePoints <= 2) {
        rating = `${label} 挑戦可能 (B)`
        color = 'warning'
      }
      
      // 大会アドバイスを課題（指示）の先頭に差し込み
      if (raceDiagnosis.value && raceDiagnosis.value.advice) {
        issues.unshift(raceDiagnosis.value.advice)
      }
      
      return { strengths, issues, rating, color }
    })

    // 目標ロングラン距離目安
    const goalLongRunLimit = computed(() => {
      if (props.targetGoal === 'sub4') return 20
      if (props.targetGoal === 'sub3.5') return 25
      return 30
    })

    // 目標心拍効率（m/b）
    const targetEI = computed(() => {
      if (props.targetGoal === 'sub4') return 1.10
      if (props.targetGoal === 'sub3.5') return 1.30
      return 1.55
    })

    // 心拍耐久スタミナ（デカップリング）分析
    const staminaDecouplingAnalysis = computed(() => {
      // 15km以上の距離走で、スプリット情報があり、かつ心拍データが揃っているものをフィルタリング
      const longRuns = props.workouts.filter(w => 
        Number(w.distance) >= 15.0 && 
        w.splits && 
        w.splits.length >= 6 && 
        w.splits.every(s => s.averageHeartrate > 0)
      )

      if (longRuns.length === 0) {
        return {
          available: false,
          message: '15km以上の距離走（心拍データ付き）の練習ログが同期されると、スタミナ心肺ドリフト（デカップリング）分析がここに表示されます。'
        }
      }

      // 直近の最長距離走を取得
      const latestRun = [...longRuns].sort((a, b) => safeParseDate(b.workoutDate) - safeParseDate(a.workoutDate))[0]
      const splits = latestRun.splits
      const n = splits.length
      const mid = Math.floor(n / 2)

      const firstHalf = splits.slice(0, mid)
      const secondHalf = splits.slice(mid)

      // 前半の心拍効率(EF = 速度(m/分) / 心拍数)を算出
      const firstTimeSec = firstHalf.reduce((sum, s) => sum + (s.movingTime || s.elapsedTime), 0)
      const firstAvgHR = firstHalf.reduce((sum, s) => sum + s.averageHeartrate, 0) / mid
      const firstSpeed = (mid * 1000) / (firstTimeSec / 60)
      const firstEF = firstSpeed / firstAvgHR

      // 後半の心拍効率(EF)を算出
      const secondTimeSec = secondHalf.reduce((sum, s) => sum + (s.movingTime || s.elapsedTime), 0)
      const secondAvgHR = secondHalf.reduce((sum, s) => sum + s.averageHeartrate, 0) / (n - mid)
      const secondSpeed = ((n - mid) * 1000) / (secondTimeSec / 60)
      const secondEF = secondSpeed / secondAvgHR

      // 心拍ドリフト低下率 (Decoupling %)
      const decoupling = ((firstEF - secondEF) / firstEF) * 100

      let rating = ''
      let color = ''
      let advice = ''

      if (decoupling < 5.0) {
        rating = '優良 (スタミナ十分)'
        color = 'success'
        advice = '長距離走でも心肺の出力低下（ドリフト）が5%未満に抑えられており、強固な有酸素スタミナの土台があります。この心肺安定性があれば、レース後半の失速リスクは非常に低いです。'
      } else if (decoupling <= 10.0) {
        rating = '標準 (スタミナ構築中)'
        color = 'warning'
        advice = '後半にかけて5〜10%の緩やかな心拍の上の上昇が見られます。長距離への適応は進んでいますが、さらなるスタミナ強化のために、低強度（心拍130〜140台）での2〜3時間LSD（ロング・スロー・ディスタンス）を月2回ほど取り入れると、後半の余裕度が一段と増します。'
      } else {
        rating = '課題あり (スタミナ不足)'
        color = 'error'
        advice = '後半の心拍ドリフトが10%を超えており、心肺が後半にオーバーヒート（乳酸閾値の低下）を起こしています。この状態では本番30km以降に急激に失速する可能性が高いため、ペース設定を落とした距離ジョグを優先し、毛細血管を発達させて低燃費な有酸素システムを育て直しましょう。'
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

    // シューズ走行寿命および効率分析
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
          if (w.averagePaceSeconds > 0) {
            s.totalPaceSum += w.averagePaceSeconds
          }
          if (w.averageHeartrate > 0) {
            s.totalHRSum += w.averageHeartrate
            s.hrCount += 1
          }
        }
      })

      if (shoesMap.size === 0) {
        return {
          available: false,
          shoes: []
        }
      }

      const shoes = Array.from(shoesMap.values()).map(s => {
        const avgPaceSec = Math.round(s.totalPaceSum / s.totalRuns)
        const avgHR = s.hrCount > 0 ? Math.round(s.totalHRSum / s.hrCount) : null
        
        const mins = Math.floor(avgPaceSec / 60)
        const secs = avgPaceSec % 60
        const paceStr = `${mins}:${String(secs).padStart(2, '0')}`

        const lifeLimit = 600 // 推奨最大寿命 600km
        const lifePercent = Math.min((s.totalDistance / lifeLimit) * 100, 100)
        
        let color = 'success'
        let status = '良好'
        if (s.totalDistance >= 500) {
          color = 'error'
          status = '寿命・交換推奨'
        } else if (s.totalDistance >= 400) {
          color = 'warning'
          status = '摩耗・そろそろ交換'
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

      return {
        available: true,
        shoes
      }
    })

    // メイン（走行距離最長）のシューズ情報
    const mainShoe = computed(() => {
      const stats = shoeAnalytics.value
      if (!stats.available || stats.shoes.length === 0) {
        return { name: '', distance: 0, lifePercent: 0, color: 'grey', status: '未登録' }
      }
      return stats.shoes[0]
    })

    return {
      last30DaysDistance,
      estimatedVDOT,
      predictedTimeSeconds,
      formattedPredictedTime,
      heartEfficiency,
      averageHeartRate,
      longRunsCount,
      mPaceStats,
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
.stat-card {
  background: rgba(25, 28, 41, 0.65);
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px !important;
  transition: all 0.35s cubic-bezier(0.25, 0.8, 0.25, 1);
  box-shadow: 0 10px 30px 0 rgba(0, 0, 0, 0.3) !important;
  display: flex !important;
  flex-direction: column !important;
  justify-content: space-between !important;
  height: 100% !important;
}

.stat-card:hover {
  transform: translateY(-6px);
  border-color: rgba(99, 102, 241, 0.4);
  box-shadow: 0 12px 30px 0 rgba(99, 102, 241, 0.06) !important;
}

.diagnosis-card {
  background: rgba(25, 28, 41, 0.65);
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px !important;
  box-shadow: 0 10px 30px 0 rgba(0, 0, 0, 0.3) !important;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

.diagnosis-card:hover {
  border-color: rgba(99, 102, 241, 0.25);
  box-shadow: 0 10px 30px 0 rgba(99, 102, 241, 0.03) !important;
}

.diagnosis-list {
  list-style: none;
  padding-left: 0;
}
</style>
