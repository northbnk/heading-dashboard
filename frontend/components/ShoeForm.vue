<template>
  <v-dialog v-model="internalActive" max-width="500px" persistent>
    <v-card class="form-card" elevation="12">
      <v-card-title class="px-6 py-4 d-flex justify-space-between align-center border-b border-light">
        <span class="text-h6 font-weight-bold text-white">
          新規シューズ登録
        </span>
        <v-btn icon="mdi-close" variant="text" size="small" @click="closeForm"></v-btn>
      </v-card-title>

      <v-card-text class="px-6 py-4">
        <v-form ref="formRef" v-model="isValid" lazy-validation>
          <!-- シューズ名 (オートコンプリート候補付き) -->
          <v-combobox
            v-model="form.name"
            :items="shoeNames"
            label="シューズ名 *"
            placeholder="例: Nike Pegasus 40 (検索入力・新規入力どちらも可)"
            variant="outlined"
            :rules="[rules.required]"
            class="mb-3"
            clearable
            @update:model-value="onShoeNameChange"
          ></v-combobox>

          <!-- カテゴリ分類 (スプライトの行マッピング用) -->
          <v-select
            v-model="form.category"
            :items="categories"
            item-title="text"
            item-value="value"
            label="シューズのカテゴリ *"
            variant="outlined"
            :rules="[rules.required]"
            class="mb-3"
          ></v-select>

          <v-row dense>
            <!-- 初期走行距離 -->
            <v-col cols="12" sm="6">
              <v-text-field
                v-model.number="form.distance"
                label="これまでの走行距離 (任意)"
                type="number"
                min="0"
                suffix="km"
                placeholder="0"
                variant="outlined"
                class="mb-3"
              ></v-text-field>
            </v-col>

            <!-- 初期使用回数 -->
            <v-col cols="12" sm="6">
              <v-text-field
                v-model.number="form.runs"
                label="これまでの使用回数 (任意)"
                type="number"
                min="0"
                suffix="回"
                placeholder="0"
                variant="outlined"
                class="mb-3"
              ></v-text-field>
            </v-col>
          </v-row>
          <div class="text-caption text-grey mt-1 pl-1">
            ※既に他のシステムやStrava連携前に走った分の距離・回数をオフセットとして追加できます。0から記録する場合は空欄（または0）のままで登録してください。
          </div>
        </v-form>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="px-6 py-4 justify-end">
        <v-btn variant="outlined" rounded="lg" color="grey-lighten-1" @click="closeForm">キャンセル</v-btn>
        <v-btn variant="flat" rounded="lg" color="warning" class="px-6 text-black font-weight-bold" :disabled="!isValid" @click="submitForm">
          登録する
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { ref, watch, reactive, computed } from 'vue'
import { popularShoesList } from '~/utils/popularShoes'

export default {
  name: 'ShoeForm',
  props: {
    active: {
      type: Boolean,
      required: true
    }
  },
  emits: ['close', 'save'],
  setup(props, { emit }) {
    const internalActive = ref(props.active)
    const isValid = ref(true)
    const formRef = ref(null)

    const categories = [
      { text: 'レーシングシューズ（厚底・カーボン等）', value: 'racing' },
      { text: 'デイリートレーナー（ジョグ・普段用）', value: 'daily' },
      { text: 'マックスクッション（LSD・疲労抜き用）', value: 'cushion' },
      { text: 'トレイルランニングシューズ', value: 'trail' }
    ]

    const form = reactive({
      name: '',
      category: 'daily',
      distance: 0,
      runs: 0
    })

    const shoeNames = computed(() => popularShoesList.map(s => s.name))

    const onShoeNameChange = (val) => {
      if (!val) return
      // オブジェクト/文字列の安全な比較
      const nameStr = typeof val === 'string' ? val : val.name
      const matched = popularShoesList.find(s => s.name.toLowerCase() === nameStr.toLowerCase())
      if (matched && matched.category) {
        form.category = matched.category
      }
    }

    const rules = {
      required: v => !!v || '必須項目です。'
    }

    watch(() => props.active, (newVal) => {
      internalActive.value = newVal
      if (newVal) {
        form.name = ''
        form.category = 'daily'
        form.distance = 0
        form.runs = 0
      }
    })

    const closeForm = () => {
      emit('close')
    }

    const submitForm = async () => {
      const { valid } = await formRef.value.validate()
      if (!valid) return

      // v-combobox がオブジェクトを返す場合があるため、文字列に変換
      const finalName = typeof form.name === 'string' ? form.name : form.name.name

      emit('save', {
        name: finalName.trim(),
        category: form.category,
        distance: Number(form.distance || 0),
        runs: Number(form.runs || 0)
      })
    }

    return {
      internalActive,
      isValid,
      formRef,
      form,
      categories,
      shoeNames,
      onShoeNameChange,
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
