<template>
  <v-dialog v-model="internalActive" max-width="500px" persistent>
    <v-card class="race-dialog-card px-4 py-3" elevation="12">
      <v-card-title class="text-h6 font-weight-bold text-white d-flex align-center pb-2">
        <v-icon color="primary" icon="mdi-trophy-outline" class="mr-2"></v-icon>
        大会エントリーの登録
      </v-card-title>
      <v-divider class="mb-4" style="opacity: 0.1"></v-divider>

      <v-card-text class="pa-0">
        <v-form ref="form" v-model="isFormValid">
          <!-- 大会名 -->
          <v-text-field
            v-model="race.name"
            label="大会名"
            placeholder="例: 東京マラソン2027"
            variant="outlined"
            density="comfortable"
            color="primary"
            class="mb-3"
            :rules="[v => !!v || '大会名は必須項目です']"
            required
          ></v-text-field>

          <!-- 開催日 -->
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

          <!-- 種目 -->
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

          <!-- 目標タイム -->
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
      </v-card-text>

      <v-card-actions class="px-0 pb-0 pt-2 d-flex justify-end">
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
          登録する
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

const race = ref({
  name: '',
  date: '2026-10-04', // デフォルトは3ヶ月先付近
  category: 'フルマラソン',
  targetTime: 'サブ3.5'
})

// ダイアログが開いたときに初期化
watch(() => props.active, (newVal) => {
  if (newVal) {
    race.value = {
      name: '',
      date: '2026-10-04',
      category: 'フルマラソン',
      targetTime: 'サブ3.5'
    }
    if (form.value) {
      form.value.resetValidation()
    }
  }
})

const close = () => {
  emit('close')
}

const save = async () => {
  if (!isFormValid.value) return
  submitting.value = true
  try {
    emit('save', { ...race.value })
  } catch (err) {
    console.error('Failed to submit race:', err)
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.race-dialog-card {
  background: rgba(25, 28, 41, 0.95);
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 20px !important;
}
</style>
