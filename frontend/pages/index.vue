<template>
  <v-container fluid class="dashboard-container px-3 px-sm-6 pt-3 pb-6 min-h-screen">
    <!-- ヘッダーセクション -->
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
        <div class="d-flex align-center flex-wrap gap-3 ml-sm-auto">
          <v-btn-toggle
            v-model="targetGoal"
            color="primary"
            density="compact"
            mandatory
            rounded="lg"
            class="text-white bg-surface"
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
        </div>
      </v-col>
    </v-row>

    <!-- メイン：今後の大会予定 ＆ カウントダウンカード -->
    <v-row class="mb-4">
      <v-col cols="12">
        <v-card class="schedule-card px-4 py-4" elevation="4">
          <div class="d-flex flex-column flex-sm-row justify-space-between align-start align-sm-center mb-3">
            <div class="text-h6 font-weight-bold text-white d-flex align-center">
              <v-icon color="secondary" icon="mdi-calendar-star" class="mr-2"></v-icon>
              エントリー済みの大会予定・今後の予定
              <span class="text-caption text-grey ml-2 font-weight-regular d-none d-sm-inline">(Upcoming Race Schedule)</span>
            </div>
            <!-- 大会登録ボタン -->
            <v-btn
              color="secondary"
              prepend-icon="mdi-plus"
              density="comfortable"
              rounded="lg"
              class="font-weight-bold text-white mt-2 mt-sm-0"
              @click="openRaceForm"
            >
              新しい大会を登録
            </v-btn>
          </div>

          <v-divider class="mb-4" style="opacity: 0.1"></v-divider>

          <v-row v-if="upcomingRacesList.length > 0">
            <!-- 直近メインレースのカウントダウン (大きく表示) -->
            <v-col cols="12" md="5" class="d-flex">
              <v-card class="main-countdown-card pa-4 w-100 d-flex flex-column justify-space-between" variant="flat">
                <div>
                  <div class="text-caption text-primary font-weight-bold uppercase mb-1 d-flex align-center">
                    <v-icon icon="mdi-trophy" size="14" class="mr-1"></v-icon>
                    NEXT TARGET RACE
                  </div>
                  <div class="text-h5 font-weight-black text-white mb-2">
                    {{ upcomingRace.name }}
                  </div>
                  <div class="text-body-2 text-grey-lighten-1 mb-1">
                    <v-icon icon="mdi-run" size="14" class="mr-1" color="grey-darken-1"></v-icon>
                    種目: {{ upcomingRace.category }}
                  </div>
                  <div class="text-body-2 text-grey-lighten-1 mb-1">
                    <v-icon icon="mdi-bullseye-arrow" size="14" class="mr-1" color="grey-darken-1"></v-icon>
                    目標: {{ upcomingRace.targetTime }}
                  </div>
                  <div class="text-body-2 text-grey-lighten-1">
                    <v-icon icon="mdi-calendar-clock" size="14" class="mr-1" color="grey-darken-1"></v-icon>
                    開催日: {{ upcomingRace.date.replace(/-/g, '/') }}
                  </div>
                </div>

                <!-- カウントダウン数値 -->
                <div class="mt-4 pt-2 d-flex align-baseline">
                  <span class="text-caption text-grey mr-2">開催まであと</span>
                  <span class="text-h3 font-weight-black text-secondary mr-1">{{ upcomingRaceDays }}</span>
                  <span class="text-h6 font-weight-bold text-grey">日</span>
                </div>
              </v-card>
            </v-col>

            <!-- すべての大会予定リスト -->
            <v-col cols="12" md="7">
              <v-card class="bg-transparent" variant="flat">
                <div class="text-subtitle-2 font-weight-bold text-grey mb-3">
                  すべての予定大会リスト
                </div>
                <div class="race-list-wrapper">
                  <div
                    v-for="race in upcomingRacesList"
                    :key="race.id"
                    class="race-item-row d-flex align-center justify-space-between py-2 px-3 mb-2"
                    :class="{ 'main-race-row': race.id === upcomingRace.id }"
                  >
                    <div class="d-flex align-center overflow-hidden">
                      <v-icon
                        :color="race.id === upcomingRace.id ? 'secondary' : 'grey-darken-1'"
                        :icon="race.id === upcomingRace.id ? 'mdi-star' : 'mdi-star-outline'"
                        class="mr-2 flex-shrink-0"
                      ></v-icon>
                      <div class="text-truncate">
                        <span class="font-weight-bold text-white d-block text-truncate">{{ race.name }}</span>
                        <span class="text-caption text-grey">
                          {{ race.date.replace(/-/g, '/') }} ｜ {{ race.category }} ｜ {{ race.targetTime }}
                        </span>
                      </div>
                    </div>

                    <div class="d-flex align-center flex-shrink-0 ml-3">
                      <!-- カウントダウンバッジ -->
                      <v-chip
                        :color="race.id === upcomingRace.id ? 'secondary' : 'grey-darken-2'"
                        size="small"
                        class="font-weight-bold text-black mr-2"
                        variant="flat"
                      >
                        あと {{ calculateDaysUntil(race.date) }}日
                      </v-chip>
                      <!-- 削除ボタン -->
                      <v-btn
                        icon="mdi-delete"
                        variant="text"
                        color="error"
                        density="compact"
                        @click="handleDeleteRace(race.id)"
                      ></v-btn>
                    </div>
                  </div>
                </div>
              </v-card>
            </v-col>
          </v-row>

          <!-- 登録がない場合 -->
          <div v-else class="d-flex flex-column align-center justify-center py-10 text-grey">
            <v-icon icon="mdi-calendar-remove" size="48" class="mb-2 text-grey-darken-2"></v-icon>
            <div>登録された今後の大会予定はありません。</div>
            <div class="text-caption text-grey-darken-1 mt-1">「新しい大会を登録」ボタンからエントリー情報を入力してください。</div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- 今週の練習メニュー表示エリア (月曜〜日曜) -->
    <v-row class="mb-4">
      <v-col cols="12">
        <v-card class="menu-card px-4 py-4" elevation="4">
          <div class="text-h6 font-weight-bold text-white d-flex align-center mb-3">
            <v-icon color="secondary" icon="mdi-calendar-week" class="mr-2"></v-icon>
            今週の練習メニュー (6/29〜7/5)
            <span class="text-caption text-grey ml-2 font-weight-regular d-none d-sm-inline">(Weekly Training Plan)</span>
          </div>

          <v-divider class="mb-4" style="opacity: 0.1"></v-divider>

          <!-- 7つの曜日のスロット -->
          <div class="weekly-grid">
            <div
              v-for="day in weeklySchedule"
              :key="day.dateStr"
              class="day-slot-card d-flex flex-column justify-space-between"
              :class="{ 'cleared-slot': day.isCleared, 'rest-slot': day.targetDistance === 0 }"
            >
              <!-- 曜日・日付 -->
              <div class="d-flex justify-space-between align-center">
                <div>
                  <span class="day-name font-weight-black text-body-2">{{ day.day }}曜日</span>
                  <span class="day-date d-block text-caption text-grey">{{ day.dateStr.substring(5).replace('-', '/') }}</span>
                </div>
                <!-- クリアアイコン -->
                <v-icon
                  v-if="day.isCleared"
                  color="success"
                  icon="mdi-check-circle"
                  size="20"
                ></v-icon>
              </div>

              <!-- 予定メニュー -->
              <div class="menu-content my-3">
                <div class="text-body-2 font-weight-bold text-white">
                  {{ day.menuText }}
                </div>
              </div>

              <!-- 実績値 -->
              <div class="actual-content">
                <div v-if="!day.isCleared && day.hasRun" class="text-caption text-grey">
                  実績: {{ day.actualDistance.toFixed(2) }}km / {{ day.actualPaceStr }}
                </div>
                <div v-else-if="day.targetDistance > 0 && !day.hasRun" class="text-caption text-grey-darken-1 italic">
                  未出走
                </div>
                <div v-else-if="day.targetDistance === 0" class="text-caption text-grey-darken-1">
                  リカバリー
                </div>
                <div v-else class="text-caption text-success font-weight-bold d-flex align-center">
                  <v-icon icon="mdi-checkbox-marked-circle-outline" size="14" class="mr-1"></v-icon>
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
        <workout-stats :workouts="workouts" :target-goal="targetGoal" :upcoming-race="upcomingRace" display-mode="stats-only" class="mb-6"></workout-stats>
        
        <!-- トレーニング診断 (全幅) -->
        <workout-stats :workouts="workouts" :target-goal="targetGoal" :upcoming-race="upcomingRace" display-mode="diagnosis-only" class="mb-6"></workout-stats>
      </v-col>

      <!-- 右側カラム (トレーニング統合分析グラフ ＆ アクティビティ履歴) -->
      <v-col cols="12" lg="6">
        <!-- グラフ -->
        <workout-chart :workouts="workouts" :target-goal="targetGoal" :height="300" class="mb-6"></workout-chart>
        
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

      let menus = []

      if (!upcomingRace.value || (diag && diag.mode === 'VOLUME_ADJUSTMENT')) {
        const gap = Math.max(0, G - D)
        const weeklyTarget = gap > 0 ? gap : G / 4
        
        const longJogDist = Math.round(weeklyTarget * 0.45)
        const weekdayJogDist = Math.round(((weeklyTarget - longJogDist) / 2) * 10) / 10
        
        menus = [
          { day: '月', menuText: '休み', targetDistance: 0, isQuality: false },
          { day: '火', menuText: `ジョグ ${weekdayJogDist}km`, targetDistance: weekdayJogDist, isQuality: false },
          { day: '水', menuText: '休み', targetDistance: 0, isQuality: false },
          { day: '木', menuText: `ジョグ ${weekdayJogDist}km`, targetDistance: weekdayJogDist, isQuality: false },
          { day: '金', menuText: '休み', targetDistance: 0, isQuality: false },
          { day: '土', menuText: `ロングジョグ ${longJogDist}km`, targetDistance: longJogDist, isQuality: false },
          { day: '日', menuText: '休み', targetDistance: 0, isQuality: false }
        ]
      } else {
        const weeks = diag.weeksRemaining
        
        if (weeks >= 9) {
          menus = [
            { day: '月', menuText: '休み', targetDistance: 0, isQuality: false },
            { day: '火', menuText: 'ジョグ 10km', targetDistance: 10, isQuality: false },
            { day: '水', menuText: `閾値走 8km (${formatPaceMinSec(thresholdPaceSec)})`, targetDistance: 8, isQuality: true, targetPace: thresholdPaceSec },
            { day: '木', menuText: 'ジョグ 10km', targetDistance: 10, isQuality: false },
            { day: '金', menuText: '休み', targetDistance: 0, isQuality: false },
            { day: '土', menuText: 'ロングジョグ 20km', targetDistance: 20, isQuality: false },
            { day: '日', menuText: 'ジョグ 10km', targetDistance: 10, isQuality: false }
          ]
        } else if (weeks >= 5) {
          const longRunPace = mPaceSec + 20
          menus = [
            { day: '月', menuText: '休み', targetDistance: 0, isQuality: false },
            { day: '火', menuText: 'ジョグ 10km', targetDistance: 10, isQuality: false },
            { day: '水', menuText: `Mペース走 5km (${formatPaceMinSec(mPaceSec)})`, targetDistance: 5, isQuality: true, targetPace: mPaceSec },
            { day: '木', menuText: 'ジョグ 10km', targetDistance: 10, isQuality: false },
            { day: '金', menuText: '休み', targetDistance: 0, isQuality: false },
            { day: '土', menuText: `30kmロングラン (${formatPaceMinSec(longRunPace)})`, targetDistance: 30, isQuality: true, targetPace: longRunPace },
            { day: '日', menuText: '疲労抜きジョグ 5km', targetDistance: 5, isQuality: false }
          ]
        } else if (weeks >= 2) {
          menus = [
            { day: '月', menuText: '休み', targetDistance: 0, isQuality: false },
            { day: '火', menuText: 'ジョグ 5km', targetDistance: 5, isQuality: false },
            { day: '水', menuText: `Mペース走 3km (${formatPaceMinSec(mPaceSec)})`, targetDistance: 3, isQuality: true, targetPace: mPaceSec },
            { day: '木', menuText: 'ジョグ 5km', targetDistance: 5, isQuality: false },
            { day: '金', menuText: '休み', targetDistance: 0, isQuality: false },
            { day: '土', menuText: `レースペース走 20km (${formatPaceMinSec(mPaceSec)})`, targetDistance: 20, isQuality: true, targetPace: mPaceSec },
            { day: '日', menuText: '休み', targetDistance: 0, isQuality: false }
          ]
        } else {
          menus = [
            { day: '月', menuText: '休み', targetDistance: 0, isQuality: false },
            { day: '火', menuText: '軽いジョグ 2km', targetDistance: 2, isQuality: false },
            { day: '水', menuText: `3km刺激入れ (${formatPaceMinSec(mPaceSec)})`, targetDistance: 3, isQuality: true, targetPace: mPaceSec },
            { day: '木', menuText: '軽いジョグ 2km', targetDistance: 2, isQuality: false },
            { day: '金', menuText: '休み', targetDistance: 0, isQuality: false },
            { day: '土', menuText: '休み', targetDistance: 0, isQuality: false },
            { day: '日', menuText: '休み', targetDistance: 0, isQuality: false }
          ]
        }
      }

      const weekDates = [
        '2026-06-29',
        '2026-06-30',
        '2026-07-01',
        '2026-07-02',
        '2026-07-03',
        '2026-07-04',
        '2026-07-05'
      ]

      return menus.map((menu, index) => {
        const dateStr = weekDates[index]
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

/* 今後の大会予定・スケジュールカード */
.schedule-card {
  background: rgba(25, 28, 41, 0.65);
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px !important;
  box-shadow: 0 10px 30px 0 rgba(0, 0, 0, 0.3) !important;
}

.main-countdown-card {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%);
  border: 1px solid rgba(99, 102, 241, 0.25);
  border-radius: 16px !important;
}

.race-list-wrapper {
  max-height: 180px;
  overflow-y: auto;
  padding-right: 4px;
}

.race-item-row {
  background: rgba(15, 17, 26, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  transition: all 0.3s ease;
}

.race-item-row:hover {
  border-color: rgba(255, 255, 255, 0.15);
  background: rgba(15, 17, 26, 0.6);
}

.main-race-row {
  border-color: rgba(99, 102, 241, 0.35);
  background: rgba(99, 102, 241, 0.05);
}

/* 今週の練習メニューカードスタイル */
.menu-card {
  background: rgba(25, 28, 41, 0.65);
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px !important;
  box-shadow: 0 10px 30px 0 rgba(0, 0, 0, 0.3) !important;
}

/* 7つの曜日配置用グリッド・レイアウト */
.weekly-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 12px;
}

.day-slot-card {
  background: rgba(15, 17, 26, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 12px;
  min-height: 140px;
  transition: all 0.3s ease;
}

.day-slot-card:hover {
  border-color: rgba(99, 102, 241, 0.3);
  transform: translateY(-2px);
}

.cleared-slot {
  background: rgba(16, 185, 129, 0.05);
  border-color: rgba(16, 185, 129, 0.2);
}

.rest-slot {
  opacity: 0.7;
}

.day-name {
  color: rgba(255, 255, 255, 0.9);
}

.italic {
  font-style: italic;
}

@media (max-width: 960px) {
  .weekly-grid {
    display: flex;
    overflow-x: auto;
    gap: 12px;
    padding-bottom: 8px;
  }
  .day-slot-card {
    min-width: 150px;
    flex-shrink: 0;
  }
}
</style>
