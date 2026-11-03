<template>
  <v-dialog v-model="internalActive" max-width="480px" persistent>
    <v-card class="plan-dialog-card pa-6" elevation="8">
      <div class="d-flex justify-space-between align-start mb-4">
        <div>
          <div class="dialog-title d-flex align-center">
            <v-icon color="#2563EB" icon="mdi-calendar-edit" class="mr-2" size="22"></v-icon>
            練習プランの編集
          </div>
          <div class="dialog-subtitle font-num mt-0.5">
            {{ dateStr.replace(/-/g, '/') }} ({{ dayName }}) のメニュー
          </div>
        </div>
        <v-btn icon="mdi-close" variant="text" color="#64748B" size="small" @click="close"></v-btn>
      </div>

      <v-form ref="form" v-model="isFormValid">
        <v-text-field
          v-model="plan.menuText"
          label="メニュー内容"
          placeholder="例: ジョグ 10km / 休み / 閾値走"
          variant="outlined"
          density="comfortable"
          color="primary"
          class="mb-3"
          :rules="[v => !!v || 'メニュー内容は必須項目です']"
          required
        ></v-text-field>

        <v-text-field
          v-model.number="plan.targetDistance"
          label="目標距離"
          type="number"
          suffix="km"
          min="0"
          step="0.1"
          variant="outlined"
          density="comfortable"
          color="primary"
          class="mb-2"
          required
        ></v-text-field>

        <v-checkbox
          v-model="plan.isQuality"
          label="ポイント練習（質重視セッション）"
          color="primary"
          hide-details
          class="mb-3"
        ></v-checkbox>

        <v-row v-if="plan.isQuality" class="mx-0 mb-3 align-center">
          <v-col cols="12" class="pa-0 mb-1 text-caption" style="color: #64748B;">
            目標ペース
          </v-col>
          <v-col cols="6" class="pa-0 pr-2">
            <v-text-field
              v-model.number="paceInput.minutes"
              label="分"
              type="number"
              min="2"
              max="10"
              variant="outlined"
              density="compact"
              color="primary"
              suffix="/km"
            ></v-text-field>
          </v-col>
          <v-col cols="6" class="pa-0 pl-2">
            <v-text-field
              v-model.number="paceInput.seconds"
              label="秒"
              type="number"
              min="0"
              max="59"
              variant="outlined"
              density="compact"
              color="primary"
            ></v-text-field>
          </v-col>
        </v-row>
      </v-form>

      <div class="d-flex justify-end align-center pt-2">
        <v-btn
          variant="text"
          color="error"
          class="font-weight-bold px-2"
          @click="revert"
          :disabled="submitting"
          v-if="hasOverride"
        >
          初期メニューに戻す
        </v-btn>
        <v-spacer></v-spacer>
        <v-btn
          variant="text"
          color="#64748B"
          class="font-weight-bold"
          rounded="lg"
          @click="close"
          :disabled="submitting"
        >
          キャンセル
        </v-btn>
        <v-btn
          variant="flat"
          color="primary"
          class="font-weight-bold ml-2 text-white px-5"
          rounded="lg"
          @click="save"
          :loading="submitting"
          :disabled="!isFormValid || submitting"
        >
          保存する
        </v-btn>
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  active: { type: Boolean, default: false },
  dateStr: { type: String, required: true },
  dayName: { type: String, required: true },
  planData: { type: Object, default: null },
  hasOverride: { type: Boolean, default: false }
})

const emit = defineEmits(['close', 'save', 'revert'])

const internalActive = computed({
  get: () => props.active,
  set: (val) => {
    if (!val) emit('close')
  }
})

const isFormValid = ref(false)
const submitting = ref(false)
const form = ref(null)

const plan = ref({
  menuText: '',
  targetDistance: 0,
  isQuality: false,
  targetPace: null
})

const paceInput = ref({ minutes: 4, seconds: 30 })

watch(() => props.active, (newVal) => {
  if (newVal) {
    if (props.planData) {
      plan.value = {
        menuText: props.planData.menuText || '',
        targetDistance: props.planData.targetDistance || 0,
        isQuality: !!props.planData.isQuality,
        targetPace: props.planData.targetPace || null
      }
      if (plan.value.targetPace) {
        paceInput.value.minutes = Math.floor(plan.value.targetPace / 60)
        paceInput.value.seconds = plan.value.targetPace % 60
      } else {
        paceInput.value = { minutes: 4, seconds: 30 }
      }
    } else {
      plan.value = { menuText: '', targetDistance: 0, isQuality: false, targetPace: null }
      paceInput.value = { minutes: 4, seconds: 30 }
    }
    if (form.value) form.value.resetValidation()
  }
})

const close = () => emit('close')

const revert = async () => {
  submitting.value = true
  try {
    emit('revert', props.dateStr)
  } finally {
    submitting.value = false
  }
}

const save = async () => {
  if (!isFormValid.value) return
  submitting.value = true
  try {
    let targetPaceSec = null
    if (plan.value.isQuality) {
      targetPaceSec = Number(paceInput.value.minutes || 0) * 60 + Number(paceInput.value.seconds || 0)
    }
    emit('save', props.dateStr, {
      menuText: plan.value.menuText,
      targetDistance: plan.value.targetDistance,
      isQuality: plan.value.isQuality,
      targetPace: targetPaceSec
    })
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.plan-dialog-card {
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
</style>
