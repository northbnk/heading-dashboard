<template>
  <v-container fluid class="dashboard-container px-3 px-sm-6 pt-3 pb-6 min-h-screen">
    <!-- ヘッダーセクション (スッキリとコンパクト化) -->
    <v-row class="mb-2 align-center">
      <v-col cols="12" class="d-flex flex-column flex-sm-row align-start align-sm-center flex-wrap gap-y-3">
        <div class="d-flex align-center">
          <v-avatar color="primary" class="mr-3" size="36" elevation="2">
            <v-icon color="white" icon="mdi-run-fast" size="20"></v-icon>
          </v-avatar>
          <div>
            <h1 class="text-h5 font-weight-black text-white letter-spacing-1 d-flex align-center flex-wrap">
              Heading 330 | Training Hub
              <span class="text-caption text-grey ml-sm-2 d-block d-sm-inline font-weight-regular">(サブ3.5への道しるべ)</span>
            </h1>
          </div>
        </div>

        <!-- 目標設定切り替えトグル -->
        <v-btn-toggle
          v-model="targetGoal"
          color="primary"
          density="compact"
          mandatory
          rounded="lg"
          class="ml-sm-6 text-white bg-surface"
        >
          <v-btn value="sub4" size="small" class="px-4 font-weight-bold">
            サブ4
          </v-btn>
          <v-btn value="sub3.5" size="small" class="px-4 font-weight-bold">
            サブ3.5
          </v-btn>
          <v-btn value="sub3" size="small" class="px-4 font-weight-bold">
            サブ3
          </v-btn>
        </v-btn-toggle>
      </v-col>
    </v-row>

    <!-- ローディング状態 -->
    <div v-if="loading" class="d-flex flex-column align-center justify-center py-16">
      <v-progress-circular indeterminate color="primary" size="64" class="mb-4"></v-progress-circular>
      <div class="text-grey">データをロード中...</div>
    </div>

    <!-- ユーザー指定のレイアウト構成 -->
    <v-row v-else class="mt-2">
      <!-- 左側カラム (スタッツ4項目 ＆ トレーニング診断) -->
      <v-col cols="12" lg="6">
        <!-- 距離、VDOT、目標ペース距離、心肺効率 (2x2で配置) -->
        <workout-stats :workouts="workouts" :target-goal="targetGoal" display-mode="stats-only" class="mb-6"></workout-stats>
        
        <!-- トレーニング診断 (全幅) -->
        <workout-stats :workouts="workouts" :target-goal="targetGoal" display-mode="diagnosis-only" class="mb-6"></workout-stats>
      </v-col>

      <!-- 右側カラム (トレーニング統合分析グラフ ＆ アクティビティ履歴) -->
      <v-col cols="12" lg="6">
        <!-- グラフ (高さを300pxにスリム化してスマートに表示) -->
        <workout-chart :workouts="workouts" :target-goal="targetGoal" :height="300" class="mb-6"></workout-chart>
        
        <!-- アクティビティ履歴 (グラフの下に配置) -->
        <workout-table :workouts="workouts"></workout-table>
      </v-col>
    </v-row>

    <!-- ワークアウト登録・編集ダイアログフォーム (バックアップ用、非表示) -->
    <workout-form
      :active="formActive"
      :workout="selectedWorkout"
      @close="closeWorkoutForm"
      @save="handleSaveWorkout"
    ></workout-form>

    <!-- スナックバーによる通知フィードバック -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      timeout="3000"
      rounded="pill"
      elevation="6"
    >
      <div class="d-flex align-center font-weight-medium">
        <v-icon :icon="snackbar.icon" class="mr-2"></v-icon>
        {{ snackbar.text }}
      </div>
    </v-snackbar>
  </v-container>
</template>

<script>
import workoutApi from '~/utils/workout'

export default {
  name: 'DashboardView',
  setup() {
    const workouts = ref([])
    const loading = ref(true)
    const formActive = ref(false)
    const selectedWorkout = ref(null)
    const syncing = ref(false)
    const targetGoal = ref('sub3.5') // デフォルトはサブ3.5
    let autoSyncInterval = null

    // 通知スナックバー設定
    const snackbar = ref({
      show: false,
      text: '',
      color: 'success',
      icon: 'mdi-check-circle'
    })

    // 全ワークアウトの読み込み
    const loadWorkouts = async () => {
      loading.value = true
      try {
        workouts.value = await workoutApi.getAllWorkouts()
      } catch (err) {
        console.error('データの取得に失敗しました', err)
        showNotification('データの取得に失敗しました。接続を確認してください。', 'error', 'mdi-alert-circle')
      } finally {
        loading.value = false
      }
    }

    // スナックバー通知の表示ユーティリティ
    const showNotification = (text, color = 'success', icon = 'mdi-check-circle') => {
      snackbar.value = {
        show: true,
        text,
        color,
        icon
      }
    }

    // 新規登録フォームを開く (バックアップ用)
    const openNewWorkoutForm = () => {
      selectedWorkout.value = null
      formActive.value = true
    }

    // 編集フォームを開く (バックアップ用)
    const openEditWorkoutForm = (workout) => {
      selectedWorkout.value = { ...workout }
      formActive.value = true
    }

    const closeWorkoutForm = () => {
      formActive.value = false
      selectedWorkout.value = null
    }

    // ワークアウトデータの追加または更新 (リードオンリー構成のため基本的には不活性)
    const handleSaveWorkout = async (workoutData) => {
      try {
        if (selectedWorkout.value) {
          await workoutApi.updateWorkout(selectedWorkout.value.id, workoutData)
          showNotification('ワークアウトを更新しました')
        } else {
          await workoutApi.createWorkout(workoutData)
          showNotification('ワークアウトを新規追加しました')
        }
        await loadWorkouts()
        closeWorkoutForm()
      } catch (err) {
        console.error('保存に失敗しました', err)
        showNotification('データの保存に失敗しました', 'error', 'mdi-alert-circle')
      }
    }

    const handleDeleteWorkout = async (id) => {
      if (confirm('本当にこの記録を削除しますか？')) {
        try {
          await workoutApi.deleteWorkout(id)
          showNotification('ワークアウトを削除しました')
          await loadWorkouts()
        } catch (err) {
          console.error('削除に失敗しました', err)
          showNotification('データの削除に失敗しました', 'error', 'mdi-alert-circle')
        }
      }
    }

    // 手動同期処理
    const handleSyncWorkouts = async () => {
      syncing.value = true
      try {
        const result = await workoutApi.syncWorkouts()
        if (result && result.success) {
          showNotification(`同期完了: ${result.count}件のアクティビティを読み込みました`)
        } else {
          showNotification('同期に成功しましたが、新しいデータはありませんでした')
        }
        await loadWorkouts()
      } catch (err) {
        console.error('同期に失敗しました', err)
        showNotification('スプレッドシートとの同期に失敗しました', 'error', 'mdi-alert-circle')
      } finally {
        syncing.value = false
      }
    }

    onMounted(() => {
      loadWorkouts()
      // 15分ごとに自動でスプレッドシートからフェッチしてデータを更新 (15分 = 900000ms)
      autoSyncInterval = setInterval(async () => {
        console.log('Auto-syncing workouts from Google Sheets...')
        try {
          await workoutApi.syncWorkouts()
          workouts.value = await workoutApi.getAllWorkouts()
        } catch (err) {
          console.error('Auto-sync failed', err)
        }
      }, 900000)
    })

    onUnmounted(() => {
      if (autoSyncInterval) {
        clearInterval(autoSyncInterval)
      }
    })

    return {
      workouts,
      loading,
      formActive,
      selectedWorkout,
      snackbar,
      syncing,
      targetGoal,
      openNewWorkoutForm,
      openEditWorkoutForm,
      closeWorkoutForm,
      handleSaveWorkout,
      handleDeleteWorkout,
      handleSyncWorkouts
    }
  }
}
</script>

<style scoped>
.dashboard-container {
  background: radial-gradient(circle at 80% 20%, rgba(99, 102, 241, 0.1) 0%, rgba(15, 17, 26, 1) 75%);
}
.letter-spacing-1 {
  letter-spacing: 2px;
}
</style>
