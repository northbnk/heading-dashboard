<template>
  <v-dialog v-model="internalActive" max-width="600px" persistent>
    <v-card class="auto-plan-dialog-card px-4 py-3" elevation="12">
      <v-card-title class="text-h6 font-weight-bold text-white d-flex align-center pb-1">
        <v-icon color="primary" icon="mdi-wizard-hat" class="mr-2"></v-icon>
        練習プランの一括作成（テンプレート / 自動推薦）
      </v-card-title>
      <v-card-subtitle class="text-caption text-grey pa-0 pl-1 mb-2">
        翌日からの7日間（{{ generatedPlan[0]?.dateStr.replace(/-/g, '/') }} 〜 {{ generatedPlan[6]?.dateStr.replace(/-/g, '/') }}）の予定メニューを一括作成します。
      </v-card-subtitle>

      <v-tabs v-model="activeTab" color="primary" class="mb-3" align-tabs="start">
        <v-tab :value="0" class="font-weight-bold text-caption">テンプレート</v-tab>
        <v-tab :value="1" class="font-weight-bold text-caption">おすすめ推薦プラン</v-tab>
      </v-tabs>

      <v-divider class="mb-3" style="opacity: 0.08"></v-divider>

      <v-card-text class="pa-0">
        <!-- TAB 0: TEMPLATE SELECTION -->
        <v-window v-model="activeTab">
          <v-window-item :value="0">
            <div class="mb-3 text-caption text-grey">
              強度の異なる3種類の基本テンプレートから選択できます：
            </div>
            <v-btn-toggle
              v-model="selectedIntensity"
              color="primary"
              mandatory
              class="w-100 bg-surface border mb-4 rounded-lg d-flex"
            >
              <v-btn value="low" class="flex-grow-1 font-weight-bold text-caption">
                低強度 (量重視)
              </v-btn>
              <v-btn value="mid" class="flex-grow-1 font-weight-bold text-caption">
                中強度 (標準)
              </v-btn>
              <v-btn value="high" class="flex-grow-1 font-weight-bold text-caption">
                高強度 (調整/実戦)
              </v-btn>
            </v-btn-toggle>
          </v-window-item>

          <!-- TAB 1: AI / DATA ANALYSIS RECOMMENDATION -->
          <v-window-item :value="1">
            <v-alert
              type="info"
              variant="tonal"
              color="primary"
              class="mb-3 rounded-xl py-2 px-3 text-caption"
              icon="mdi-chart-line"
            >
              <div class="font-weight-bold mb-1">
                最近30日間の実績分析: {{ last30DaysDistance.toFixed(1) }} km
              </div>
              <div>
                目標走行距離（月換算 {{ targetGoalDistance }} km）との乖離を加味し、現在のあなたに最適なメニューを判定しました。
              </div>
            </v-alert>

            <!-- Recommendation Analysis Summary -->
            <div class="recommendation-badge pa-3 mb-4 rounded-xl d-flex align-center">
              <v-avatar :color="recommendation.color" size="36" class="mr-3 text-white font-weight-black text-caption">
                {{ recommendation.level }}
              </v-avatar>
              <div>
                <div class="text-subtitle-2 font-weight-black text-white">
                  {{ recommendation.title }}
                </div>
                <div class="text-caption text-grey" style="line-height: 1.3">
                  {{ recommendation.description }}
                </div>
              </div>
            </div>
          </v-window-item>
        </v-window>

        <!-- Preview Header -->
        <div class="text-subtitle-2 font-weight-bold text-white mb-2 d-flex align-center pl-1">
          <v-icon icon="mdi-table-eye" size="16" class="mr-1 text-grey"></v-icon>
          適用される7日間のメニュープレビュー
        </div>

        <!-- Scrollable Generated Plan List -->
        <div class="plan-preview-list mb-4">
          <div
            v-for="(day, idx) in generatedPlan"
            :key="idx"
            class="plan-preview-row d-flex align-center justify-space-between py-1.5 px-3 mb-1.5"
            :class="{ 'quality-row': day.isQuality, 'rest-row': day.targetDistance === 0 }"
          >
            <!-- Day & Date -->
            <div class="d-flex align-center flex-shrink-0" style="width: 80px">
              <span class="font-weight-black text-caption mr-2" :class="getDayColor(day.dayName)">
                {{ day.dayName }}
              </span>
              <span class="text-caption text-grey" style="font-size: 0.7rem">
                {{ day.dateStr.substring(5).replace('-', '/') }}
              </span>
            </div>

            <!-- Menu Content -->
            <div class="flex-grow-1 text-truncate px-2">
              <span class="text-caption text-white font-weight-bold">
                {{ day.menuText }}
              </span>
            </div>

            <!-- Distance & Pace info -->
            <div class="d-flex align-center flex-shrink-0 text-right justify-end" style="width: 120px">
              <v-chip
                v-if="day.targetDistance > 0"
                size="x-small"
                variant="outlined"
                color="secondary"
                class="font-weight-bold"
              >
                {{ day.targetDistance }}km
              </v-chip>
              <v-chip
                v-if="day.isQuality"
                size="x-small"
                color="orange-darken-3"
                variant="flat"
                class="font-weight-bold ml-1"
              >
                質重視
              </v-chip>
              <v-chip
                v-else-if="day.targetDistance === 0"
                size="x-small"
                color="grey"
                variant="text"
                class="font-weight-bold ml-1"
              >
                休み
              </v-chip>
            </div>
          </div>
        </div>
      </v-card-text>

      <v-divider class="mb-3" style="opacity: 0.08"></v-divider>

      <v-card-actions class="px-0 pb-0 pt-1 d-flex justify-end align-center">
        <v-btn
          variant="text"
          color="grey"
          class="font-weight-bold"
          rounded="lg"
          @click="close"
          :disabled="submitting"
        >
          閉じる
        </v-btn>
        <v-btn
          variant="flat"
          color="primary"
          class="font-weight-bold ml-2 text-white"
          rounded="lg"
          @click="applyPlan"
          :loading="submitting"
        >
          このプランを一括適用
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  active: {
    type: Boolean,
    default: false
  },
  workouts: {
    type: Array,
    default: () => []
  },
  targetGoal: {
    type: String,
    default: 'sub3.5'
  },
  weeklySchedule: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['close', 'save'])

const internalActive = computed({
  get: () => props.active,
  set: (val) => {
    if (!val) emit('close')
  }
})

const activeTab = ref(0)
const selectedIntensity = ref('mid')
const submitting = ref(false)

// Reset state when opened
watch(() => props.active, (newVal) => {
  if (newVal) {
    activeTab.value = 0
    selectedIntensity.value = 'mid'
    submitting.value = false
  }
})

const targetGoalDistance = computed(() => {
  if (props.targetGoal === 'sub4') return 150
  if (props.targetGoal === 'sub3.5') return 200
  return 300
})

// Calculate distance run in last 30 days
const last30DaysDistance = computed(() => {
  if (props.workouts.length === 0) return 0
  const thirtyDaysAgo = new Date('2026-07-04')
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  return props.workouts
    .filter(w => {
      if (!w.workoutDate) return false
      const parts = w.workoutDate.split(/[\s\-:]/)
      const year = parseInt(parts[0], 10)
      const month = parseInt(parts[1], 10) - 1
      const day = parseInt(parts[2], 10)
      const d = new Date(year, month, day)
      return d >= thirtyDaysAgo
    })
    .reduce((sum, w) => sum + Number(w.distance || 0), 0)
})

// Paces based on targetGoal
const paces = computed(() => {
  if (props.targetGoal === 'sub3') {
    return {
      mPace: 255,      // 4:15/km
      tPace: 240,      // 4:00/km
      iPace: 225,      // 3:45/km
      easyPace: 300    // 5:00/km
    }
  } else if (props.targetGoal === 'sub4') {
    return {
      mPace: 340,      // 5:40/km
      tPace: 320,      // 5:20/km
      iPace: 300,      // 5:00/km
      easyPace: 400    // 6:40/km
    }
  } else {
    // sub3.5 default
    return {
      mPace: 295,      // 4:55/km
      tPace: 275,      // 4:35/km
      iPace: 255,      // 4:15/km
      easyPace: 345    // 5:45/km
    }
  }
})

const formatPaceText = (sec) => {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${String(s).padStart(2, '0')}/km`
}

// AI/Data analysis recommended strategy
const recommendation = computed(() => {
  const current = last30DaysDistance.value
  const target = targetGoalDistance.value

  if (current < target * 0.7) {
    return {
      level: 'A',
      color: 'info',
      title: '基礎量構築期（ボリューム重視）',
      description: '目標走行距離に対して直近30日の実績が不足しています。怪我のリスクを避けるため、高強度なポイント練習を控え、適度な距離のジョグと週末のLSDを中心にスタミナベースを構築してください。',
      mode: 'low_intensity'
    }
  } else if (current > target * 1.15) {
    return {
      level: 'C',
      color: 'error',
      title: '実戦スピード強化期（質・テーパリング意識）',
      description: '十分な走行量を積めています！脚作りは完了しているため、週2回の高強度練習（インターバル・ビルドアップ走）を組み込み、スピード持久力と最大酸素摂取量を高めていくピークメニューを推奨します。',
      mode: 'high_intensity'
    }
  } else {
    return {
      level: 'B',
      color: 'secondary',
      title: '標準鍛錬期（バランス重視）',
      description: '順調な練習量を維持できています。バランス良く週1回のスピード・閾値練習（質重視）と、週末のロング走を組み込み、心肺能力と持久力の両輪をバランスよく底上げしていきましょう。',
      mode: 'mid_intensity'
    }
  }
})

// Generate generatedPlan daily menus (starts from tomorrow)
const generatedPlan = computed(() => {
  if (props.weeklySchedule.length === 0) return []

  const p = paces.value
  const pM = formatPaceText(p.mPace)
  const pT = formatPaceText(p.tPace)
  const pI = formatPaceText(p.iPace)

  // Choose generator mode based on activeTab
  let mode = 'mid'
  if (Number(activeTab.value) === 0) {
    mode = selectedIntensity.value
  } else {
    const recMode = recommendation.value.mode
    if (recMode === 'low_intensity') mode = 'low'
    else if (recMode === 'high_intensity') mode = 'high'
    else mode = 'mid'
  }

  // Base date is Today (weeklySchedule[0])
  const baseDate = new Date(props.weeklySchedule[0].dateStr)
  const daysOfWeek = ['日', '月', '火', '水', '木', '金', '土']

  const result = []
  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(baseDate)
    currentDate.setDate(baseDate.getDate() + 1 + i)
    const dateStr = currentDate.toISOString().split('T')[0]
    const dayName = daysOfWeek[currentDate.getDay()]

    let menuText = '休み'
    let targetDistance = 0
    let isQuality = false
    let targetPace = null

    if (mode === 'low') {
      // Mon: Rest, Tue: Jog 10, Wed: Rest, Thu: Jog 10, Fri: Rest, Sat: Long Jog 15, Sun: Jog 5
      switch (dayName) {
        case '火':
          menuText = 'ジョグ 10km (ベース走)'
          targetDistance = 10
          break
        case '木':
          menuText = 'ジョグ 10km (ベース走)'
          targetDistance = 10
          break
        case '土':
          menuText = '週末ロングジョグ 15km (LSD)'
          targetDistance = 15
          break
        case '日':
          menuText = '疲労抜きジョグ 5km'
          targetDistance = 5
          break
      }
    } else if (mode === 'high') {
      // Mon: Rest, Tue: Jog 10, Wed: Interval 5k, Thu: Jog 10, Fri: Rest, Sat: M-pace 15k, Sun: Rest
      switch (dayName) {
        case '火':
          menuText = 'ジョグ 10km'
          targetDistance = 10
          break
        case '水':
          menuText = `インターバル 5x1000m (設定 ${pI})`
          targetDistance = 5
          isQuality = true
          targetPace = p.iPace
          break
        case '木':
          menuText = 'ジョグ 10km'
          targetDistance = 10
          break
        case '土':
          menuText = `レースペース走 15km (設定 ${pM})`
          targetDistance = 15
          isQuality = true
          targetPace = p.mPace
          break
      }
    } else {
      // Mon: Rest, Tue: Jog 10, Wed: Threshold Run 8k, Thu: Jog 10, Fri: Rest, Sat: Long Run 20k, Sun: Jog 5
      switch (dayName) {
        case '火':
          menuText = 'ジョグ 10km'
          targetDistance = 10
          break
        case '水':
          menuText = `初中級 閾値走 8km (設定 ${pT})`
          targetDistance = 8
          isQuality = true
          targetPace = p.tPace
          break
        case '木':
          menuText = 'ジョグ 10km'
          targetDistance = 10
          break
        case '土':
          menuText = 'ロングラン 20km (ペース持久力)'
          targetDistance = 20
          break
        case '日':
          menuText = '疲労抜きジョグ 5km'
          targetDistance = 5
          break
      }
    }

    result.push({
      dateStr,
      dayName,
      menuText,
      targetDistance,
      isQuality,
      targetPace
    })
  }

  return result
})

const getDayColor = (dayName) => {
  if (dayName === '土') return 'text-info'
  if (dayName === '日') return 'text-error'
  return 'text-white'
}

const close = () => {
  emit('close')
}

const applyPlan = async () => {
  submitting.value = true
  try {
    const plansToSave = generatedPlan.value.map(day => ({
      dateStr: day.dateStr,
      plan: {
        menuText: day.menuText,
        targetDistance: day.targetDistance,
        isQuality: day.isQuality,
        targetPace: day.targetPace
      }
    }))
    emit('save', plansToSave)
  } catch (err) {
    console.error('Failed to apply generated plan:', err)
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.auto-plan-dialog-card {
  background: rgba(25, 28, 41, 0.95);
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 20px !important;
}

.recommendation-badge {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.plan-preview-list {
  max-height: 280px;
  overflow-y: auto;
  padding-right: 4px;
}

.plan-preview-row {
  background: rgba(15, 17, 26, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 12px;
  transition: all 0.2s ease;
}

.plan-preview-row:hover {
  background: rgba(15, 17, 26, 0.6);
  border-color: rgba(255, 255, 255, 0.1);
}

.quality-row {
  border-left: 4px solid #f57c00 !important;
  background: rgba(245, 124, 0, 0.03) !important;
}

.rest-row {
  opacity: 0.65;
}
</style>
