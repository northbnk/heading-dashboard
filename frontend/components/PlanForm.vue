<template>
  <v-dialog v-model="internalActive" max-width="500px" persistent>
    <v-card class="plan-dialog-card px-4 py-3" elevation="12">
      <v-card-title class="text-h6 font-weight-bold text-white d-flex align-center pb-2">
        <v-icon color="secondary" icon="mdi-calendar-edit" class="mr-2"></v-icon>
        練習プランの編集
      </v-card-title>
      <v-card-subtitle class="text-caption text-grey pa-0 pl-1">
        {{ dateStr.replace(/-/g, '/') }} ({{ dayName }}) のメニュー
      </v-card-subtitle>
      <v-divider class="mb-4 mt-2" style="opacity: 0.1"></v-divider>

      <v-card-text class="pa-0">
        <v-form ref="form" v-model="isFormValid">
          <!-- メニュー名 -->
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

          <!-- 目標距離 -->
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
            class="mb-3"
            required
          ></v-text-field>

          <!-- 質重視フラグ -->
          <v-checkbox
            v-model="plan.isQuality"
            label="ポイント練習（質重視セッション）"
            color="secondary"
            hide-details
            class="mb-3"
          ></v-checkbox>

          <!-- 目標ペース (質重視の場合のみ表示) -->
          <v-row v-if="plan.isQuality" class="mx-0 mb-3 align-center">
            <v-col cols="12" class="pa-0 mb-1 text-caption text-grey">
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
      </v-card-text>

      <v-card-actions class="px-0 pb-0 pt-2 d-flex justify-end align-center">
        <v-btn
          variant="text"
          color="error"
          class="font-weight-bold pa-0"
          style="min-width: unset"
          @click="revert"
          :disabled="submitting"
          v-if="hasOverride"
        >
          元に戻す
        </v-btn>
        <v-spacer></v-spacer>
        <v-btn
          variant="text"
          color="grey"
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
          class="font-weight-bold ml-2 text-white"
          rounded="lg"
          @click="save"
          :loading="submitting"
          :disabled="!isFormValid || submitting"
        >
          保存する
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
  dateStr: {
    type: String,
    required: true
  },
  dayName: {
    type: String,
    required: true
  },
  planData: {
    type: Object,
    default: null
  },
  hasOverride: {
    type: Boolean,
    default: false
  }
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

const paceInput = ref({
  minutes: 4,
  seconds: 30
})

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
        paceInput.value.minutes = 4
        paceInput.value.seconds = 30
      }
    } else {
      plan.value = {
        menuText: '',
        targetDistance: 0,
        isQuality: false,
        targetPace: null
      }
      paceInput.value = {
        minutes: 4,
        seconds: 30
      }
    }
    if (form.value) {
      form.value.resetValidation()
    }
  }
})

const close = () => {
  emit('close')
}

const revert = async () => {
  submitting.value = true
  try {
    emit('revert', props.dateStr)
  } catch (err) {
    console.error('Failed to revert plan:', err)
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
      const mins = Number(paceInput.value.minutes || 0)
      const secs = Number(paceInput.value.seconds || 0)
      targetPaceSec = mins * 60 + secs
    }
    
    emit('save', props.dateStr, {
      menuText: plan.value.menuText,
      targetDistance: plan.value.targetDistance,
      isQuality: plan.value.isQuality,
      targetPace: targetPaceSec
    })
  } catch (err) {
    console.error('Failed to save plan:', err)
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.plan-dialog-card {
  background: rgba(25, 28, 41, 0.95);
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 20px !important;
}
</style>
