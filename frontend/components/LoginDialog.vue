<template>
  <v-dialog v-model="internalActive" max-width="400px" persistent>
    <v-card class="login-dialog-card px-4 py-3" elevation="12">
      <v-card-title class="text-h6 font-weight-bold text-white d-flex align-center pb-2">
        <v-icon color="primary" icon="mdi-lock-outline" class="mr-2"></v-icon>
        管理者ログイン
      </v-card-title>
      <v-divider class="mb-4" style="opacity: 0.1"></v-divider>

      <v-card-text class="pa-0">
        <v-form ref="form" v-model="isFormValid" @submit.prevent="login">
          <v-text-field
            v-model="password"
            label="パスワード"
            type="password"
            placeholder="管理者パスワードを入力してください"
            variant="outlined"
            density="comfortable"
            color="primary"
            class="mb-2"
            :rules="[v => !!v || 'パスワードは必須項目です']"
            required
            autofocus
          ></v-text-field>
          <div v-if="errorMessage" class="text-caption text-error mb-3 pl-1 font-weight-bold">
            {{ errorMessage }}
          </div>
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
          @click="login"
          :loading="submitting"
          :disabled="!isFormValid || submitting"
        >
          ログイン
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

const emit = defineEmits(['close', 'success'])

const internalActive = computed({
  get: () => props.active,
  set: (val) => {
    if (!val) emit('close')
  }
})

const isFormValid = ref(false)
const submitting = ref(false)
const password = ref('')
const errorMessage = ref('')
const form = ref(null)

watch(() => props.active, (newVal) => {
  if (newVal) {
    password.value = ''
    errorMessage.value = ''
    if (form.value) {
      form.value.resetValidation()
    }
  }
})

const close = () => {
  emit('close')
}

const login = async () => {
  if (!isFormValid.value) return
  submitting.value = true
  errorMessage.value = ''
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ password: password.value })
    })
    
    if (res.ok) {
      emit('success')
    } else {
      const data = await res.json()
      errorMessage.value = data.statusMessage || 'パスワードが間違っています。'
    }
  } catch (err) {
    console.error('Login error:', err)
    errorMessage.value = '通信エラーが発生しました。'
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.login-dialog-card {
  background: rgba(25, 28, 41, 0.95);
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 20px !important;
}
</style>
