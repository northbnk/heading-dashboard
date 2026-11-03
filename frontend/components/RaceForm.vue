<template>
  <v-dialog v-model="internalActive" max-width="480px" persistent>
    <v-card class="race-dialog-card pa-6" elevation="8">
      <div class="d-flex justify-space-between align-center mb-4">
        <div class="dialog-title d-flex align-center">
          <v-icon color="#3653B3" icon="mdi-trophy-outline" class="mr-2" size="22"></v-icon>
          {{ raceData ? '大会エントリーの編集' : '大会エントリーの登録' }}
        </div>
        <v-btn icon="mdi-close" variant="text" color="#526071" size="small" @click="close"></v-btn>
      </div>

      <v-form ref="form" v-model="isFormValid">
        <v-text-field
          v-model="race.name"
          label="大会名"
          placeholder="例: 福岡マラソン2026"
          variant="outlined"
          density="comfortable"
          color="primary"
          class="mb-3"
          :rules="[v => !!v || '大会名は必須項目です']"
          required
        ></v-text-field>

        <v-text-field
          v-model="race.date"
          label="開催日"
          type="date"
          variant="outlined"
          density="comfortable"
          color="primary"
          class="mb-3"
          :rules="[v => !!v || '開催日は必須項目です']"
          required
        ></v-text-field>

        <v-select
          v-model="race.category"
          label="種目"
          :items="categories"
          variant="outlined"
          density="comfortable"
          color="primary"
          class="mb-3"
          required
        ></v-select>

        <v-select
          v-model="race.targetTime"
          label="目標タイム"
          :items="targetTimes"
          variant="outlined"
          density="comfortable"
          color="primary"
          class="mb-4"
          required
        ></v-select>
      </v-form>

      <div class="d-flex justify-end gap-2 pt-2">
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
          class="font-weight-bold text-white px-5"
          rounded="lg"
          @click="save"
          :loading="submitting"
          :disabled="!isFormValid || submitting"
        >
          {{ raceData ? '更新する' : '登録する' }}
        </v-btn>
      </div>
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
  raceData: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'save'])

const internalActive = computed({
  get: () => props.active,
  set: (val) => {
    if (!val) emit('close')
  }
})

const isFormValid = ref(false)
const submitting = ref(false)
const form = ref(null)

const categories = ['フルマラソン', 'ハーフマラソン', '10km', 'その他']
const targetTimes = ['サブ3', 'サブ3.5', 'サブ4', 'その他']

const defaultDateStr = () => {
  const d = new Date()
  d.setMonth(d.getMonth() + 1)
  return d.toISOString().split('T')[0]
}

const race = ref({
  name: '',
  date: defaultDateStr(),
  category: 'フルマラソン',
  targetTime: 'サブ3.5'
})

watch(() => props.active, (newVal) => {
  if (newVal) {
    if (props.raceData) {
      race.value = { ...props.raceData }
    } else {
      race.value = {
        name: '',
        date: defaultDateStr(),
        category: 'フルマラソン',
        targetTime: 'サブ3.5'
      }
    }
    if (form.value) {
      form.value.resetValidation()
    }
  }
})

const close = () => emit('close')

const save = async () => {
  if (!isFormValid.value) return
  submitting.value = true
  try {
    emit('save', { ...race.value })
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.race-dialog-card {
  background: #F2F4F8 !important;
  border: 1px solid #D5DBE3 !important;
  border-radius: 20px !important;
  color: #1E293B !important;
}

.dialog-title {
  font-size: 1.05rem;
  font-weight: 800;
  color: #1E293B;
}
</style>
