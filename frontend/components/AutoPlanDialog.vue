<template>
  <v-dialog v-model="internalActive" max-width="580px" persistent>
    <v-card class="auto-plan-dialog-card pa-6" elevation="8">
      <div class="d-flex justify-space-between align-start mb-3">
        <div>
          <div class="dialog-title d-flex align-center">
            <v-icon color="#2563EB" icon="mdi-auto-fix" class="mr-2" size="22"></v-icon>
            練習プランの一括作成
          </div>
          <div class="dialog-subtitle font-num mt-0.5">
            翌日からの7日間（{{ generatedPlan[0]?.dateStr.replace(/-/g, '/') }} 〜 {{ generatedPlan[6]?.dateStr.replace(/-/g, '/') }}）の予定メニューを一括作成
          </div>
        </div>
        <v-btn icon="mdi-close" variant="text" color="#64748B" size="small" @click="close"></v-btn>
      </div>

      <v-tabs v-model="activeTab" color="primary" class="mb-3" align-tabs="start">
        <v-tab :value="0" class="font-weight-bold text-caption">テンプレート選択</v-tab>
        <v-tab :value="1" class="font-weight-bold text-caption">おすすめ自動推薦</v-tab>
      </v-tabs>

      <v-window v-model="activeTab" class="mb-4">
        <v-window-item :value="0">
          <div class="mb-2 text-caption" style="color: #64748B;">
            強度の異なる3種類の基本テンプレートから選択できます：
          </div>
          <v-btn-toggle
            v-model="selectedIntensity"
            color="primary"
            mandatory
            class="w-100 border rounded-lg d-flex"
          >
            <v-btn value="low" class="flex-grow-1 font-weight-bold text-caption">
              低強度 (量重視)
            </v-btn>
            <v-btn value="mid" class="flex-grow-1 font-weight-bold text-caption">
              中強度 (標準)
            </v-btn>
            <v-btn value="high" class="flex-grow-1 font-weight-bold text-caption">
              高強度 (実戦)
            </v-btn>
          </v-btn-toggle>
        </v-window-item>

        <v-window-item :value="1">
          <div class="recommendation-badge pa-3.5 rounded-xl d-flex align-center">
            <v-avatar :color="recommendation.color" size="36" class="mr-3 text-white font-weight-black text-caption">
              {{ recommendation.level }}
            </v-avatar>
            <div>
              <div class="font-weight-bold" style="font-size: 0.85rem; color: #0F172A;">
                {{ recommendation.title }}（直近30日: {{ last30DaysDistance.toFixed(1) }}km / 目標 {{ targetGoalDistance }}km）
              </div>
              <div class="text-caption mt-0.5" style="color: #475569; line-height: 1.4;">
                {{ recommendation.description }}
              </div>
            </div>
          </div>
        </v-window-item>
      </v-window>

      <div class="d-flex align-center justify-space-between mb-2">
        <span class="font-weight-bold" style="font-size: 0.82rem; color: #334155;">
          適用される7日間のメニュープレビュー
        </span>
        <span class="total-badge font-num">
          週間合計: {{ generatedPlanTotalDistance }} km
        </span>
      </div>

      <div class="plan-preview-list mb-4">
        <div
          v-for="(day, idx) in generatedPlan"
          :key="idx"
          class="plan-preview-row d-flex align-center justify-space-between py-2 px-3 mb-1.5"
          :class="{ 'quality-row': day.isQuality, 'rest-row': day.targetDistance === 0 }"
        >
          <div class="d-flex align-center flex-shrink-0" style="width: 84px">
            <span class="font-weight-bold text-caption mr-2" :class="getDayColor(day.dayName)">
              {{ day.dayName }}
            </span>
            <span class="font-num" style="font-size: 0.72rem; color: #64748B;">
              {{ day.dateStr.substring(5).replace('-', '/') }}
            </span>
          </div>

          <div class="flex-grow-1 text-truncate px-2">
            <span class="font-weight-bold" style="font-size: 0.8rem; color: #0F172A;">
              {{ day.menuText }}
            </span>
          </div>

          <div class="d-flex align-center flex-shrink-0 text-right justify-end gap-1" style="width: 110px">
            <span v-if="day.targetDistance > 0" class="dist-pill font-num">
              {{ day.targetDistance }}km
            </span>
            <span v-if="day.isQuality" class="quality-pill">
              ポイント
            </span>
            <span v-else-if="day.targetDistance === 0" class="rest-label">
              休み
            </span>
          </div>
        </div>
      </div>

      <div class="d-flex justify-end align-center pt-2">
        <v-btn
          variant="text"
          color="#64748B"
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
          class="font-weight-bold ml-2 text-white px-5"
          rounded="lg"
          @click="applyPlan"
          :loading="submitting"
        >
          このプランを一括適用
        </v-btn>
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  active: { type: Boolean, default: false },
  workouts: { type: Array, default: () => [] },
  targetGoal: { type: String, default: 'sub3.5' },
  weeklySchedule: { type: Array, required: true }
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

const safeParseDate = (dateStr) => {
  if (!dateStr) return new Date(0)
  const parts = dateStr.split(/[\s\-:]/)
  if (parts.length < 3) return new Date(0)
  return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10))
}

const last30DaysDistance = computed(() => {
  if (props.workouts.length === 0) return 0
  const dates = props.workouts.map(w => safeParseDate(w.workoutDate)).filter(d => d.getTime() > 0)
  const latest = dates.length > 0 ? new Date(Math.max(...dates)) : new Date()
  const thirtyDaysAgo = new Date(latest.getTime())
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  return props.workouts
    .filter(w => {
      const d = safeParseDate(w.workoutDate)
      return d >= thirtyDaysAgo && d <= latest
    })
    .reduce((sum, w) => sum + Number(w.distance || 0), 0)
})

const paces = computed(() => {
  if (props.targetGoal === 'sub3') {
    return { mPace: 255, tPace: 240, iPace: 225, easyPace: 300 }
  } else if (props.targetGoal === 'sub4') {
    return { mPace: 340, tPace: 320, iPace: 300, easyPace: 400 }
  }
  return { mPace: 295, tPace: 275, iPace: 255, easyPace: 345 }
})

const formatPaceText = (sec) => {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${String(s).padStart(2, '0')}/km`
}

const recommendation = computed(() => {
  const current = last30DaysDistance.value
  const target = targetGoalDistance.value

  if (current < target * 0.7) {
    return {
      level: 'A',
      color: 'primary',
      title: '基礎量構築期（ボリューム重視）',
      description: '目標走行距離に対して直近30日の実績が不足しています。無理なポイント練習を控え、ジョグと週末のLSDを中心にスタミナベースを構築しましょう。',
      mode: 'low_intensity'
    }
  } else if (current > target * 1.15) {
    return {
      level: 'S',
      color: 'success',
      title: '実戦スピード強化期',
      description: '十分な走行量を積めています！週2回のポイント練習を組み込み、スピード持久力を高めるメニューを推奨します。',
      mode: 'high_intensity'
    }
  } else {
    return {
      level: 'B',
      color: 'primary',
      title: '標準鍛錬期（バランス重視）',
      description: '順調な練習量を維持できています。週1回の閾値練習と週末のロング走で心肺と持久力をバランスよく底上げしましょう。',
      mode: 'mid_intensity'
    }
  }
})

const generatedPlan = computed(() => {
  if (props.weeklySchedule.length === 0) return []

  const p = paces.value
  const pM = formatPaceText(p.mPace)
  const pT = formatPaceText(p.tPace)
  const pI = formatPaceText(p.iPace)

  let mode = 'mid'
  if (Number(activeTab.value) === 0) {
    mode = selectedIntensity.value
  } else {
    const recMode = recommendation.value.mode
    if (recMode === 'low_intensity') mode = 'low'
    else if (recMode === 'high_intensity') mode = 'high'
    else mode = 'mid'
  }

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
      switch (dayName) {
        case '火': menuText = 'ジョグ 10km'; targetDistance = 10; break
        case '木': menuText = 'ジョグ 10km'; targetDistance = 10; break
        case '土': menuText = '週末ロングジョグ 15km'; targetDistance = 15; break
        case '日': menuText = '疲労抜きジョグ 5km'; targetDistance = 5; break
      }
    } else if (mode === 'high') {
      switch (dayName) {
        case '火': menuText = 'ジョグ 10km'; targetDistance = 10; break
        case '水': menuText = `インターバル 5x1000m (${pI})`; targetDistance = 5; isQuality = true; targetPace = p.iPace; break
        case '木': menuText = 'ジョグ 10km'; targetDistance = 10; break
        case '土': menuText = `レースペース走 15km (${pM})`; targetDistance = 15; isQuality = true; targetPace = p.mPace; break
      }
    } else {
      switch (dayName) {
        case '火': menuText = 'ジョグ 10km'; targetDistance = 10; break
        case '水': menuText = `閾値走 8km (${pT})`; targetDistance = 8; isQuality = true; targetPace = p.tPace; break
        case '木': menuText = 'ジョグ 10km'; targetDistance = 10; break
        case '土': menuText = 'ロングラン 20km'; targetDistance = 20; break
        case '日': menuText = '疲労抜きジョグ 5km'; targetDistance = 5; break
      }
    }

    result.push({ dateStr, dayName, menuText, targetDistance, isQuality, targetPace })
  }

  return result
})

const generatedPlanTotalDistance = computed(() => {
  return generatedPlan.value.reduce((sum, d) => sum + Number(d.targetDistance || 0), 0)
})

const getDayColor = (dayName) => {
  if (dayName === '土') return 'text-primary'
  if (dayName === '日') return 'text-error'
  return ''
}

const close = () => emit('close')

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
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.auto-plan-dialog-card {
  background: #FFFFFF !important;
  border: 1px solid #E2E8F0 !important;
  border-radius: 20px !important;
  color: #0F172A !important;
}

.dialog-title {
  font-size: 1.05rem;
  font-weight: 800;
  color: #0F172A;
}

.dialog-subtitle {
  font-size: 0.76rem;
  color: #64748B;
}

.recommendation-badge {
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
}

.total-badge {
  background: #EFF6FF;
  color: #1D4ED8;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 99px;
}

.plan-preview-list {
  max-height: 260px;
  overflow-y: auto;
}

.plan-preview-row {
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  border-radius: 10px;
}

.quality-row {
  border-left: 3px solid #2563EB !important;
  background: #EFF6FF !important;
}

.rest-row {
  opacity: 0.6;
}

.dist-pill {
  background: #FFFFFF;
  border: 1px solid #CBD5E1;
  color: #0F172A;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 6px;
}

.quality-pill {
  background: #2563EB;
  color: #FFFFFF;
  font-size: 0.65rem;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 5px;
}

.rest-label {
  font-size: 0.7rem;
  color: #94A3B8;
  font-weight: 600;
}
</style>
