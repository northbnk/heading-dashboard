<template>
  <v-dialog v-model="internalActive" max-width="600px" persistent>
    <v-card class="form-card" elevation="12">
      <v-card-title class="px-6 py-4 d-flex justify-space-between align-center border-b border-light">
        <span class="text-h6 font-weight-bold text-white">
          {{ isEdit ? 'ワークアウトの編集' : '新規ワークアウト登録' }}
        </span>
        <v-btn icon="mdi-close" variant="text" size="small" @click="closeForm"></v-btn>
      </v-card-title>

      <v-card-text class="px-6 py-4">
        <v-form ref="formRef" v-model="isValid" lazy-validation>
          <!-- 日付選択 -->
          <v-text-field
            v-model="form.workoutDate"
            label="日付 *"
            type="date"
            variant="outlined"
            :rules="[rules.required]"
            class="mb-3"
          ></v-text-field>

          <v-row>
            <!-- 距離入力 -->
            <v-col cols="12" sm="6">
              <v-text-field
                v-model.number="form.distance"
                label="走行距離 *"
                type="number"
                step="0.01"
                min="0.01"
                suffix="km"
                variant="outlined"
                :rules="[rules.required, rules.positiveNumber]"
                class="mb-3"
              ></v-text-field>
            </v-col>

            <!-- タイム入力（分割型で直感的に！） -->
            <v-col cols="12" sm="6">
              <div class="text-caption text-grey mb-1">走行時間 *</div>
              <v-row dense>
                <v-col cols="4">
                  <v-text-field
                    v-model.number="timeInput.hours"
                    label="時間"
                    type="number"
                    min="0"
                    max="23"
                    placeholder="0"
                    variant="outlined"
                    density="compact"
                  ></v-text-field>
                </v-col>
                <v-col cols="4">
                  <v-text-field
                    v-model.number="timeInput.minutes"
                    label="分"
                    type="number"
                    min="0"
                    max="59"
                    placeholder="00"
                    variant="outlined"
                    density="compact"
                  ></v-text-field>
                </v-col>
                <v-col cols="4">
                  <v-text-field
                    v-model.number="timeInput.seconds"
                    label="秒"
                    type="number"
                    min="0"
                    max="59"
                    placeholder="00"
                    variant="outlined"
                    density="compact"
                  ></v-text-field>
                </v-col>
              </v-row>
            </v-col>
          </v-row>

          <v-row>
            <!-- ピッチ -->
            <v-col cols="12" sm="6">
              <v-text-field
                v-model.number="form.cadence"
                label="ピッチ (任意)"
                type="number"
                min="50"
                max="250"
                suffix="spm"
                variant="outlined"
                class="mb-3"
              ></v-text-field>
            </v-col>

            <!-- 上下動 -->
            <v-col cols="12" sm="6">
              <v-text-field
                v-model.number="form.verticalOscillation"
                label="上下動 (任意)"
                type="number"
                step="0.1"
                min="1.0"
                max="30.0"
                suffix="cm"
                variant="outlined"
                class="mb-3"
              ></v-text-field>
            </v-col>
          </v-row>

          <!-- メモ -->
          <v-textarea
            v-model="form.notes"
            label="メモ/気付き (任意)"
            rows="3"
            maxlength="500"
            variant="outlined"
            placeholder="走った時の気候、体調、シューズなどを記録しましょう"
          ></v-textarea>
        </v-form>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="px-6 py-4 justify-end">
        <v-btn variant="outlined" rounded="lg" color="grey-lighten-1" @click="closeForm">キャンセル</v-btn>
        <v-btn variant="flat" rounded="lg" color="primary" class="px-6" :disabled="!isValid" @click="submitForm">
          {{ isEdit ? '更新する' : '登録する' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { ref, watch, reactive } from 'vue'

export default {
  name: 'WorkoutForm',
  props: {
    active: {
      type: Boolean,
      required: true
    },
    workout: {
      type: Object,
      default: null
    }
  },
  emits: ['close', 'save'],
  setup(props, { emit }) {
    const internalActive = ref(props.active)
    const isEdit = ref(false)
    const isValid = ref(true)
    const formRef = ref(null)

    // 基本フォームデータ
    const form = reactive({
      id: null,
      workoutDate: new Date().toISOString().substring(0, 10),
      distance: null,
      durationSeconds: 0,
      cadence: null,
      verticalOscillation: null,
      notes: ''
    })

    // ユーザーフレンドリーな時間入力用リアクティブオブジェクト
    const timeInput = reactive({
      hours: 0,
      minutes: 0,
      seconds: 0
    })

    const rules = {
      required: v => !!v || '必須項目です。',
      positiveNumber: v => (v && Number(v) > 0) || '0より大きい数値を入力してください。'
    }

    // ダイアログの開閉監視
    watch(() => props.active, (newVal) => {
      internalActive.value = newVal
      if (newVal) {
        initializeForm()
      }
    })

    // フォーム初期化処理 (新規登録 vs 編集モード)
    const initializeForm = () => {
      if (props.workout) {
        isEdit.value = true
        form.id = props.workout.id
        form.workoutDate = props.workout.workoutDate
        form.distance = props.workout.distance
        form.durationSeconds = props.workout.durationSeconds
        form.cadence = props.workout.cadence
        form.verticalOscillation = props.workout.verticalOscillation
        form.notes = props.workout.notes || ''

        // 秒数を 時・分・秒 に分解してセット
        const totalSecs = props.workout.durationSeconds || 0
        timeInput.hours = Math.floor(totalSecs / 3600)
        timeInput.minutes = Math.floor((totalSecs % 3600) / 60)
        timeInput.seconds = totalSecs % 60
      } else {
        isEdit.value = false
        form.id = null
        form.workoutDate = new Date().toISOString().substring(0, 10)
        form.distance = null
        form.durationSeconds = 0
        form.cadence = null
        form.verticalOscillation = null
        form.notes = ''
        
        timeInput.hours = 0
        timeInput.minutes = 0
        timeInput.seconds = 0
      }
    }

    const closeForm = () => {
      emit('close')
    }

    const submitForm = async () => {
      // バリデーション実行
      const { valid } = await formRef.value.validate()
      if (!valid) return

      // 時・分・秒を総秒数に統合
      const hrs = Number(timeInput.hours || 0)
      const mins = Number(timeInput.minutes || 0)
      const secs = Number(timeInput.seconds || 0)
      
      const totalSeconds = (hrs * 3600) + (mins * 60) + secs
      if (totalSeconds === 0) {
        alert('走行時間を入力してください。')
        return
      }

      form.durationSeconds = totalSeconds

      // バックエンド送信用にクローンして emit
      const submitData = { ...form }
      
      // 空文字の任意フィールドを null に変換
      if (submitData.cadence === '' || submitData.cadence === 0) submitData.cadence = null
      if (submitData.verticalOscillation === '' || submitData.verticalOscillation === 0) submitData.verticalOscillation = null

      emit('save', submitData)
    }

    return {
      internalActive,
      isEdit,
      isValid,
      formRef,
      form,
      timeInput,
      rules,
      closeForm,
      submitForm
    }
  }
}
</script>

<style scoped>
.form-card {
  background: #1A1A1E;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px !important;
}

.border-b {
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}
</style>
