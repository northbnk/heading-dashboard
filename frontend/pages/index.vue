<template>
  <v-container fluid class="dashboard-container px-3 px-sm-6 pt-3 pb-6 min-h-screen compact-grid">
    <!-- ヘッダーセクション -->
    <v-row class="mb-3 align-center">
      <v-col cols="12" class="d-flex flex-column flex-sm-row align-start align-sm-center justify-space-between py-1">
        <div class="d-flex align-center">
          <v-avatar color="primary" class="mr-3" size="32" elevation="2">
            <v-icon color="white" icon="mdi-run-fast" size="18"></v-icon>
          </v-avatar>
          <div>
            <h1 class="text-h5 font-weight-black text-white letter-spacing-1 d-flex align-center flex-wrap" style="line-height: 1.2">
              Heading 330 | Training Hub
              <span class="text-caption text-grey ml-sm-2 font-weight-regular">(サブ3.5への道しるべ)</span>
            </h1>
          </div>
        </div>

        <!-- 目標設定切り替えトグル -->
        <div class="d-flex align-center mt-2 mt-sm-0">
          <v-btn-toggle
            v-model="targetGoal"
            color="primary"
            density="compact"
            mandatory
            rounded="lg"
            class="text-white bg-surface"
          >
            <v-btn value="sub4" size="small" class="px-3 font-weight-bold">
              サブ4
            </v-btn>
            <v-btn value="sub3.5" size="small" class="px-3 font-weight-bold">
              サブ3.5
            </v-btn>
            <v-btn value="sub3" size="small" class="px-3 font-weight-bold">
              サブ3
            </v-btn>
          </v-btn-toggle>
        </div>
      </v-col>
    </v-row>

    <!-- 大会予定 ＆ 今後一週間の練習プラン -->
    <v-row class="mb-4">
      <!-- 左側：大会スケジュール (cols="12" md="4") -->
      <v-col cols="12" md="4" class="d-flex">
        <v-card class="schedule-card px-3 py-3 w-100 d-flex flex-column justify-space-between" elevation="3">
          <div class="d-flex justify-space-between align-center mb-1">
            <div class="text-subtitle-2 font-weight-bold text-white d-flex align-center">
              <v-icon color="secondary" icon="mdi-calendar-star" class="mr-1" size="18"></v-icon>
              大会予定
            </div>
            <v-btn
              color="secondary"
              prepend-icon="mdi-plus"
              density="compact"
              variant="text"
              class="font-weight-bold text-caption text-secondary"
              @click="openRaceForm"
            >
              登録
            </v-btn>
          </div>

          <v-divider class="mb-2" style="opacity: 0.08"></v-divider>

          <div v-if="upcomingRacesList.length > 0" class="d-flex flex-column justify-space-between flex-grow-1">
            <!-- Sleek Countdown Display -->
            <div class="main-countdown-compact pa-2 mb-2 d-flex align-center justify-space-between">
              <div class="overflow-hidden">
                <div class="text-caption text-primary font-weight-bold mb-0.5" style="font-size: 0.7rem">
                  <v-icon icon="mdi-trophy" size="11" class="mr-0.5"></v-icon>
                  NEXT TARGET
                </div>
                <div class="text-subtitle-2 font-weight-bold text-white text-truncate">
                  {{ upcomingRace.name }}
                </div>
                <div class="text-caption text-grey-lighten-1" style="font-size: 0.75rem">
                  {{ upcomingRace.date.replace(/-/g, '/') }} ｜ {{ upcomingRace.targetTime }}
                </div>
              </div>
              <div class="d-flex align-baseline ml-2">
                <span class="text-h4 font-weight-black text-secondary">{{ upcomingRaceDays }}</span>
                <span class="text-caption text-grey ml-0.5">日</span>
              </div>
            </div>

            <!-- Scrollable list of other races -->
            <div class="race-list-wrapper-compact">
              <div
                v-for="race in upcomingRacesList"
                :key="race.id"
                class="race-item-row-compact d-flex align-center justify-space-between py-1 px-2 mb-1"
                :class="{ 'main-race-row-compact': race.id === upcomingRace.id }"
              >
                <div class="d-flex align-center overflow-hidden">
                  <v-icon
                    :color="race.id === upcomingRace.id ? 'secondary' : 'grey-darken-2'"
                    :icon="race.id === upcomingRace.id ? 'mdi-star' : 'mdi-star-outline'"
                    class="mr-1 flex-shrink-0"
                    size="13"
                  ></v-icon>
                  <span class="text-caption text-white text-truncate font-weight-bold" style="font-size: 0.75rem">{{ race.name }}</span>
                </div>
                <div class="d-flex align-center flex-shrink-0 ml-2">
                  <span class="text-caption text-grey mr-1" style="font-size: 0.7rem">{{ calculateDaysUntil(race.date) }}日後</span>
                  <v-btn
                    icon="mdi-delete"
                    variant="text"
                    color="error"
                    density="compact"
                    size="small"
                    class="pa-0"
                    style="width: 18px; height: 18px; min-width: 18px"
                    @click="handleDeleteRace(race.id)"
                  ></v-btn>
                </div>
              </div>
            </div>
          </div>

          <!-- Empty state -->
          <div v-else class="d-flex flex-column align-center justify-center py-6 text-grey text-caption flex-grow-1">
            <v-icon icon="mdi-calendar-remove" size="24" class="mb-1 text-grey-darken-2"></v-icon>
            <div>予定された大会はありません。</div>
          </div>
        </v-card>
      </v-col>

      <!-- 右側：今後一週間の練習プラン (cols="12" md="8") -->
      <v-col cols="12" md="8" class="d-flex">
        <v-card class="menu-card px-3 py-3 w-100 d-flex flex-column justify-space-between" elevation="3">
          <div class="text-subtitle-2 font-weight-bold text-white d-flex align-center mb-2">
            <v-icon color="secondary" icon="mdi-calendar-week" class="mr-1" size="18"></v-icon>
            今後一週間の練習プラン (7/4〜7/10)
          </div>

          <v-divider class="mb-2" style="opacity: 0.08"></v-divider>

          <!-- 7つの曜日のスロット -->
          <div class="weekly-grid-compact flex-grow-1">
            <div
              v-for="day in weeklySchedule"
              :key="day.dateStr"
              class="day-slot-card-compact d-flex flex-column justify-space-between"
              :class="{ 'cleared-slot-compact': day.isCleared, 'rest-slot-compact': day.targetDistance === 0 }"
            >
              <!-- 曜日・日付 -->
              <div class="d-flex justify-space-between align-start">
                <div class="overflow-hidden">
                  <span class="day-name-compact font-weight-black text-caption" style="font-size: 0.75rem">{{ day.day }}</span>
                  <span class="day-date-compact d-block text-grey" style="font-size: 0.65rem">{{ day.dateStr.substring(5).replace('-', '/') }}</span>
                </div>
                <v-icon
                  v-if="day.isCleared"
                  color="success"
                  icon="mdi-check-circle"
                  size="12"
                  class="mt-0.5"
                ></v-icon>
              </div>

              <!-- 予定メニュー -->
              <div class="menu-content-compact my-1">
                <div class="text-caption font-weight-bold text-white line-clamp-2" style="font-size: 0.75rem; line-height: 1.2">
                  {{ day.menuText }}
                </div>
              </div>

              <!-- 実績値 -->
              <div class="actual-content-compact" style="font-size: 0.65rem">
                <div v-if="!day.isCleared && day.hasRun" class="text-grey text-truncate">
                  {{ day.actualDistance.toFixed(1) }}k / {{ day.actualPaceStr }}
                </div>
                <div v-else-if="day.targetDistance > 0 && !day.hasRun" class="text-grey-darken-1 italic">
                  未出走
                </div>
                <div v-else-if="day.targetDistance === 0" class="text-grey-darken-1">
                  リカバリー
                </div>
                <div v-else class="text-success font-weight-bold d-flex align-center">
                  <v-icon icon="mdi-checkbox-marked-circle-outline" size="10" class="mr-0.5"></v-icon>
                  クリア
                </div>
              </div>
            </div>
          </div>
        </v-card>
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
        <workout-stats :workouts="workouts" :target-goal="targetGoal" :upcoming-race="upcomingRace" display-mode="stats-only" class="mb-4"></workout-stats>
        
        <!-- トレーニング診断 (全幅) -->
        <workout-stats :workouts="workouts" :target-goal="targetGoal" :upcoming-race="upcomingRace" display-mode="diagnosis-only" class="mb-4"></workout-stats>
      </v-col>

      <!-- 右側カラム (トレーニング統合分析グラフ ＆ アクティビティ履歴) -->
      <v-col cols="12" lg="6">
        <!-- グラフ -->
        <workout-chart :workouts="workouts" :target-goal="targetGoal" :height="270" class="mb-4"></workout-chart>
        
        <!-- アクティビティ履歴 -->
        <workout-table :workouts="workouts"></workout-table>
      </v-col>
    </v-row>

    <!-- ワークアウト登録・編集ダイアログフォーム -->
    <workout-form
      :active="formActive"
      :workout="selectedWorkout"
      @close="closeWorkoutForm"
      @save="handleSaveWorkout"
    ></workout-form>

    <!-- 大会登録ダイアログ -->
    <race-form
      :active="raceFormActive"
      @close="closeRaceForm"
      @save="handleSaveRace"
    ></race-form>

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
import raceApi from '~/utils/race'

export default {
  name: 'DashboardView',
  setup() {
    const workouts = ref([])
    const races = ref([])
    const loading = ref(true)
    const formActive = ref(false)
    const raceFormActive = ref(false)
    const selectedWorkout = ref(null)
    const syncing = ref(false)
    const targetGoal = ref('sub3.5')
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

    // 大会データの読み込み
    const loadRaces = async () => {
      try {
        races.value = await raceApi.getRaces()
      } catch (err) {
        console.error('大会情報の取得に失敗しました', err)
      }
    }

    // エントリー済みのすべての今後の大会（今日 2026-07-04 以降）
    const upcomingRacesList = computed(() => {
      if (races.value.length === 0) return []
      const baseTime = new Date('2026-07-04').getTime()
      
      return races.value
        .filter(race => {
          const raceTime = new Date(race.date).getTime()
          return raceTime >= baseTime
        })
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    })

    // 直近の大会（今日以降で最も近いもの）
    const upcomingRace = computed(() => {
      if (upcomingRacesList.value.length === 0) return null
      return upcomingRacesList.value[0]
    })

    // 直近レースまでのカウントダウン日数
    const upcomingRaceDays = computed(() => {
      if (!upcomingRace.value) return 0
      return calculateDaysUntil(upcomingRace.value.date)
    })

    // 日付差分の計算ユーティリティ
    const calculateDaysUntil = (dateStr) => {
      const BASE_DATE = new Date('2026-07-04')
      const raceTime = new Date(dateStr).getTime()
      const diffTime = raceTime - BASE_DATE.getTime()
      return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
    }

    // 大会診断ステータス（アドバイス連動用）
    const raceDiagnosis = computed(() => {
      const race = upcomingRace.value
      const BASE_DATE = new Date('2026-07-04')
      if (!race) return null
      
      const raceTime = new Date(race.date).getTime()
      const diffTime = raceTime - BASE_DATE.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      if (diffDays >= 91) {
        return {
          mode: 'VOLUME_ADJUSTMENT',
          heading: 'ベースアップ期間（走行ボリューム意識）'
        }
      } else {
        const weeksRemaining = Math.max(0, Math.ceil(diffDays / 7))
        let phaseName = ''
        if (weeksRemaining >= 9) {
          phaseName = '鍛錬期（脚作り）'
        } else if (weeksRemaining >= 5) {
          phaseName = '実戦強化期'
        } else if (weeksRemaining >= 2) {
          phaseName = '調整期（テーパリング）'
        } else {
          phaseName = '直前期'
        }
        
        return {
          mode: 'PERIODIZATION',
          heading: `${race.name} まで あと ${weeksRemaining}週 ｜ ${phaseName}`,
          phaseName,
          weeksRemaining
        }
      }
    })

    // 目標に応じた月間走行距離のノルマ
    const monthlyGoalDistance = computed(() => {
      if (targetGoal.value === 'sub4') return 150
      if (targetGoal.value === 'sub3.5') return 200
      return 300
    })

    // 直近30日間の走行距離
    const last30DaysDistance = computed(() => {
      if (workouts.value.length === 0) return 0
      const thirtyDaysAgo = new Date('2026-07-04')
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      return workouts.value
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

    // 今後一週間の練習メニューデータ生成
    const weeklySchedule = computed(() => {
      const diag = raceDiagnosis.value
      const G = monthlyGoalDistance.value
      const D = last30DaysDistance.value
      
      let mPaceSec = 295
      let thresholdPaceSec = 275
      if (targetGoal.value === 'sub3') {
        mPaceSec = 255
        thresholdPaceSec = 240
      } else if (targetGoal.value === 'sub4') {
        mPaceSec = 340
        thresholdPaceSec = 320
      }
      
      const formatPaceMinSec = (sec) => {
        const m = Math.floor(sec / 60)
        const s = sec % 60
        return `${m}:${String(s).padStart(2, '0')}/km`
      }

      const getMenuForDay = (dayName) => {
        if (!upcomingRace.value || (diag && diag.mode === 'VOLUME_ADJUSTMENT')) {
          const gap = Math.max(0, G - D)
          const weeklyTarget = gap > 0 ? gap : G / 4
          const longJogDist = Math.round(weeklyTarget * 0.45)
          const weekdayJogDist = Math.round(((weeklyTarget - longJogDist) / 2) * 10) / 10
          
          switch (dayName) {
            case '月': return { menuText: '休み', targetDistance: 0, isQuality: false }
            case '火': return { menuText: `ジョグ ${weekdayJogDist}km`, targetDistance: weekdayJogDist, isQuality: false }
            case '水': return { menuText: '休み', targetDistance: 0, isQuality: false }
            case '木': return { menuText: `ジョグ ${weekdayJogDist}km`, targetDistance: weekdayJogDist, isQuality: false }
            case '金': return { menuText: '休み', targetDistance: 0, isQuality: false }
            case '土': return { menuText: `ロングジョグ ${longJogDist}km`, targetDistance: longJogDist, isQuality: false }
            case '日': return { menuText: '休み', targetDistance: 0, isQuality: false }
          }
        } else {
          const weeks = diag.weeksRemaining
          if (weeks >= 9) {
            switch (dayName) {
              case '月': return { menuText: '休み', targetDistance: 0, isQuality: false }
              case '火': return { menuText: 'ジョグ 10km', targetDistance: 10, isQuality: false }
              case '水': return { menuText: `閾値走 8km (${formatPaceMinSec(thresholdPaceSec)})`, targetDistance: 8, isQuality: true, targetPace: thresholdPaceSec }
              case '木': return { menuText: 'ジョグ 10km', targetDistance: 10, isQuality: false }
              case '金': return { menuText: '休み', targetDistance: 0, isQuality: false }
              case '土': return { menuText: 'ロングジョグ 20km', targetDistance: 20, isQuality: false }
              case '日': return { menuText: 'ジョグ 10km', targetDistance: 10, isQuality: false }
            }
          } else if (weeks >= 5) {
            const longRunPace = mPaceSec + 20
            switch (dayName) {
              case '月': return { menuText: '休み', targetDistance: 0, isQuality: false }
              case '火': return { menuText: 'ジョグ 10km', targetDistance: 10, isQuality: false }
              case '水': return { menuText: `Mペース走 5km (${formatPaceMinSec(mPaceSec)})`, targetDistance: 5, isQuality: true, targetPace: mPaceSec }
              case '木': return { menuText: 'ジョグ 10km', targetDistance: 10, isQuality: false }
              case '金': return { menuText: '休み', targetDistance: 0, isQuality: false }
              case '土': return { menuText: `30kmロングラン (${formatPaceMinSec(longRunPace)})`, targetDistance: 30, isQuality: true, targetPace: longRunPace }
              case '日': return { menuText: '疲労抜きジョグ 5km', targetDistance: 5, isQuality: false }
            }
          } else if (weeks >= 2) {
            switch (dayName) {
              case '月': return { menuText: '休み', targetDistance: 0, isQuality: false }
              case '火': return { menuText: 'ジョグ 5km', targetDistance: 5, isQuality: false }
              case '水': return { menuText: `Mペース走 3km (${formatPaceMinSec(mPaceSec)})`, targetDistance: 3, isQuality: true, targetPace: mPaceSec }
              case '木': return { menuText: 'ジョグ 5km', targetDistance: 5, isQuality: false }
              case '金': return { menuText: '休み', targetDistance: 0, isQuality: false }
              case '土': return { menuText: `レースペース走 20km (${formatPaceMinSec(mPaceSec)})`, targetDistance: 20, isQuality: true, targetPace: mPaceSec }
              case '日': return { menuText: '休み', targetDistance: 0, isQuality: false }
            }
          } else {
            switch (dayName) {
              case '月': return { menuText: '休み', targetDistance: 0, isQuality: false }
              case '火': return { menuText: '軽いジョグ 2km', targetDistance: 2, isQuality: false }
              case '水': return { menuText: `3km刺激入れ (${formatPaceMinSec(mPaceSec)})`, targetDistance: 3, isQuality: true, targetPace: mPaceSec }
              case '木': return { menuText: '軽いジョグ 2km', targetDistance: 2, isQuality: false }
              case '金': return { menuText: '休み', targetDistance: 0, isQuality: false }
              case '土': return { menuText: '休み', targetDistance: 0, isQuality: false }
              case '日': return { menuText: '休み', targetDistance: 0, isQuality: false }
            }
          }
        }
      }

      // 今日(2026-07-04)から7日分の予定を生成
      const weekDates = []
      const daysOfWeek = ['日', '月', '火', '水', '木', '金', '土']
      for (let i = 0; i < 7; i++) {
        const d = new Date('2026-07-04')
        d.setDate(d.getDate() + i)
        const yyyy = d.getFullYear()
        const mm = String(d.getMonth() + 1).padStart(2, '0')
        const dd = String(d.getDate()).padStart(2, '0')
        const dateStr = `${yyyy}-${mm}-${dd}`
        const dayName = daysOfWeek[d.getDay()]
        weekDates.push({ dateStr, dayName })
      }

      return weekDates.map(({ dateStr, dayName }) => {
        const menu = getMenuForDay(dayName)
        const dailyWorkouts = workouts.value.filter(w => w.workoutDate && w.workoutDate.startsWith(dateStr))
        
        let actualDistance = 0
        let actualPace = null
        let hasRun = false
        
        if (dailyWorkouts.length > 0) {
          hasRun = true
          actualDistance = dailyWorkouts.reduce((sum, w) => sum + Number(w.distance || 0), 0)
          const totalMovingTime = dailyWorkouts.reduce((sum, w) => w.movingTimeSeconds || w.durationSeconds || 0, 0)
          
          if (actualDistance > 0 && totalMovingTime > 0) {
            actualPace = Math.round(totalMovingTime / actualDistance)
          }
        }

        let isCleared = false
        if (menu.targetDistance > 0 && hasRun) {
          if (!menu.isQuality) {
            isCleared = actualDistance >= menu.targetDistance * 0.90
          } else {
            const minPace = menu.targetPace - 10
            const maxPace = menu.targetPace + 20
            const paceOk = actualPace && actualPace >= minPace && actualPace <= maxPace
            isCleared = actualDistance >= menu.targetDistance && paceOk
          }
        }

        const formatPaceText = (sec) => {
          if (!sec) return ''
          const m = Math.floor(sec / 60)
          const s = sec % 60
          return `${m}:${String(s).padStart(2, '0')}/km`
        }

        return {
          ...menu,
          day: dayName,
          dateStr,
          hasRun,
          actualDistance,
          actualPace,
          actualPaceStr: actualPace ? formatPaceText(actualPace) : '',
          isCleared
        }
      })
    })

    // スナックバー通知の表示ユーティリティ
    const showNotification = (text, color = 'success', icon = 'mdi-check-circle') => {
      snackbar.value = {
        show: true,
        text,
        color,
        icon
      }
    }

    // 大会登録ダイアログ制御
    const openRaceForm = () => {
      raceFormActive.value = true
    }
    const closeRaceForm = () => {
      raceFormActive.value = false
    }

    const handleSaveRace = async (raceData) => {
      try {
        await raceApi.createRace(raceData)
        showNotification('大会情報を登録しました')
        await loadRaces()
        closeRaceForm()
      } catch (err) {
        console.error('大会登録に失敗しました', err)
        showNotification('大会の保存に失敗しました', 'error', 'mdi-alert-circle')
      }
    }

    // 大会削除
    const handleDeleteRace = async (id) => {
      if (confirm('この大会エントリー予定を削除しますか？')) {
        try {
          await raceApi.deleteRace(id)
          showNotification('大会情報を削除しました')
          await loadRaces()
        } catch (err) {
          console.error('大会の削除に失敗しました', err)
          showNotification('大会の削除に失敗しました', 'error', 'mdi-alert-circle')
        }
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

    // ワークアウトデータの追加または更新
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
      loadRaces()
      autoSyncInterval = setInterval(async () => {
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
      races,
      upcomingRacesList,
      upcomingRace,
      upcomingRaceDays,
      calculateDaysUntil,
      raceDiagnosis,
      weeklySchedule,
      loading,
      formActive,
      raceFormActive,
      selectedWorkout,
      snackbar,
      syncing,
      targetGoal,
      openNewWorkoutForm,
      openEditWorkoutForm,
      closeWorkoutForm,
      handleSaveWorkout,
      handleDeleteWorkout,
      handleSyncWorkouts,
      openRaceForm,
      closeRaceForm,
      handleSaveRace,
      handleDeleteRace
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

/* グリッドおよび余白のコンパクト化 (やや余裕を持たせる) */
.compact-grid :deep(.v-row) {
  margin: -8px !important;
}

.compact-grid :deep(.v-col) {
  padding: 8px !important;
}

/* 各種カードのパディングと余白 (Vuetifyの標準に近い心地よさに) */
.schedule-card, .menu-card,
.compact-grid :deep(.stat-card),
.compact-grid :deep(.diagnosis-card),
.compact-grid :deep(.chart-card),
.compact-grid :deep(.table-card) {
  padding: 14px 16px !important;
  border-radius: 16px !important;
  margin-bottom: 0px !important;
}

/* グラフ・テーブル内のヘッダーサイズとマージン */
.compact-grid :deep(.text-h6) {
  font-size: 1.1rem !important;
  line-height: 1.3 !important;
}

.compact-grid :deep(.v-icon) {
  font-size: 1.25rem !important;
}

.compact-grid :deep(.mb-4),
.compact-grid :deep(.mb-3),
.compact-grid :deep(.my-3) {
  margin-bottom: 10px !important;
  margin-top: 4px !important;
}

/* スタッツカードの数値とレイアウト */
.compact-grid :deep(.text-h4) {
  font-size: 1.85rem !important;
  margin: 4px 0 !important;
}

.compact-grid :deep(.v-progress-linear) {
  margin-top: 10px !important;
  height: 16px !important;
}

.compact-grid :deep(.v-avatar) {
  width: 44px !important;
  height: 44px !important;
}

.compact-grid :deep(.v-avatar .v-icon) {
  font-size: 1.4rem !important;
}

/* チップのサイズ調整 */
.compact-grid :deep(.v-chip) {
  height: 26px !important;
  font-size: 0.78rem !important;
}

.compact-grid :deep(.v-chip--size-large) {
  height: 30px !important;
  font-size: 0.82rem !important;
}

/* テーブルセルのコンパクト化 */
.compact-grid :deep(.v-table td) {
  height: 38px !important;
  padding: 4px 8px !important;
  font-size: 0.78rem !important;
}

.compact-grid :deep(.v-table th) {
  height: 32px !important;
  padding: 4px 8px !important;
  font-size: 0.78rem !important;
}

.compact-grid :deep(.v-table .v-btn) {
  width: 24px !important;
  height: 24px !important;
}

/* リストアイテム */
.compact-grid :deep(.diagnosis-list li) {
  margin-bottom: 6px !important;
  font-size: 0.8rem !important;
}

.compact-grid :deep(.diagnosis-list li .v-icon) {
  font-size: 1.0rem !important;
  margin-top: 2px !important;
}

/* 今後の予定・練習メニューコンパクト化 */
.main-countdown-compact {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(16, 185, 129, 0.04) 100%);
  border: 1px solid rgba(99, 102, 241, 0.2);
  border-radius: 10px;
}

.race-list-wrapper-compact {
  max-height: 85px;
  overflow-y: auto;
  padding-right: 4px;
}

.race-item-row-compact {
  background: rgba(15, 17, 26, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 8px;
  transition: all 0.2s ease;
}

.race-item-row-compact:hover {
  border-color: rgba(255, 255, 255, 0.12);
  background: rgba(15, 17, 26, 0.5);
}

.main-race-row-compact {
  border-color: rgba(99, 102, 241, 0.2);
  background: rgba(99, 102, 241, 0.04);
}

.weekly-grid-compact {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 10px;
}

.day-slot-card-compact {
  background: rgba(15, 17, 26, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 12px;
  padding: 10px 12px;
  min-height: 125px;
  transition: all 0.2s ease;
}

.day-slot-card-compact:hover {
  border-color: rgba(99, 102, 241, 0.25);
  transform: translateY(-2px);
}

.cleared-slot-compact {
  background: rgba(16, 185, 129, 0.04);
  border-color: rgba(16, 185, 129, 0.15);
}

.rest-slot-compact {
  opacity: 0.65;
}

.day-name-compact {
  color: rgba(255, 255, 255, 0.9);
}

.italic {
  font-style: italic;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (max-width: 960px) {
  .weekly-grid-compact {
    display: flex;
    overflow-x: auto;
    gap: 10px;
    padding-bottom: 4px;
  }
  .day-slot-card-compact {
    min-width: 130px;
    flex-shrink: 0;
  }
}
</style>
