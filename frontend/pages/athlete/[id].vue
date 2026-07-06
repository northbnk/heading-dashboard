<template>
  <v-container fluid class="dashboard-container px-3 px-sm-6 pt-3 pb-6 min-h-screen compact-grid">
    <!-- ヘッダーセクション -->
    <v-row class="mb-1 align-center">
      <v-col cols="12" class="d-flex flex-column flex-sm-row align-start align-sm-center justify-space-between py-1">
        <div class="d-flex align-center">
          <v-avatar color="primary" class="mr-3" size="32" elevation="2">
            <v-icon color="white" icon="mdi-run-fast" size="18"></v-icon>
          </v-avatar>
          <div>
            <h1 class="text-h5 font-weight-black text-white letter-spacing-1 d-flex align-center flex-wrap" style="line-height: 1.2">
              Heading 330 | Training Hub
            </h1>
          </div>
        </div>

        <!-- 目標設定切り替えトグル & Strava連携 & ログイン・ログアウト -->
        <div class="d-flex align-center mt-2 mt-sm-0 flex-wrap gap-1">
          <v-btn-toggle
            v-model="targetGoal"
            color="primary"
            density="compact"
            mandatory
            rounded="lg"
            class="text-white bg-surface mr-2"
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

          <!-- コピー用共有リンク (本人のみ) -->
          <v-btn
            v-if="isOwner"
            color="secondary"
            size="small"
            variant="outlined"
            rounded="lg"
            class="font-weight-bold text-white mr-2"
            prepend-icon="mdi-share-variant"
            @click="copySharingUrl"
          >
            共有URLをコピー
          </v-btn>

          <!-- Strava連携ステータス (本人のみ同期・連携表示) -->
          <template v-if="isOwner">
            <template v-if="stravaStatus.linked">
              <v-chip
                color="orange-darken-3"
                variant="flat"
                size="small"
                class="font-weight-bold text-white mr-2"
                prepend-icon="mdi-swap-horizontal"
              >
                連携中{{ athleteInfo ? `: ${athleteInfo.firstname}` : '' }}
              </v-chip>
              <v-btn
                color="orange-darken-3"
                size="small"
                variant="flat"
                rounded="lg"
                class="font-weight-bold text-white mr-2"
                prepend-icon="mdi-sync"
                :loading="syncing"
                @click="handleSyncWorkouts"
              >
                同期
              </v-btn>
            </template>
            <template v-else>
              <v-btn
                v-if="stravaStatus.configSetup"
                color="orange-darken-3"
                size="small"
                variant="flat"
                rounded="lg"
                class="font-weight-bold text-white mr-2"
                prepend-icon="mdi-swap-horizontal"
                href="/api/auth/strava/connect"
              >
                Stravaと連携
              </v-btn>
            </template>
          </template>
          
          <!-- 閲覧モード時、誰のダッシュボードかを表示 -->
          <v-chip
            v-if="!isOwner && athleteInfo"
            color="primary"
            variant="flat"
            size="small"
            class="font-weight-bold text-white mr-2 font-outfit"
            prepend-icon="mdi-account"
          >
            ランナー: {{ athleteInfo.firstname }} {{ athleteInfo.lastname }}
          </v-chip>

          <!-- ログイン・ログアウト -->
          <v-btn
            v-if="!isLoggedIn"
            color="primary"
            size="small"
            variant="flat"
            rounded="lg"
            class="font-weight-bold text-black"
            prepend-icon="mdi-login"
            to="/"
          >
            ログイン
          </v-btn>
          <v-btn
            v-else
            color="error"
            size="small"
            variant="outlined"
            rounded="lg"
            class="font-weight-bold"
            prepend-icon="mdi-logout"
            @click="handleLogout"
          >
            ログアウト
          </v-btn>
        </div>
      </v-col>
    </v-row>

    <!-- 大会予定 ＆ 今後一週間の練習プラン -->
    <v-row class="mb-2">
      <!-- 左側：大会スケジュール (cols="12" md="4") -->
      <v-col cols="12" md="4" class="d-flex">
        <v-card class="schedule-card px-3 py-3 w-100 d-flex flex-column justify-space-between" elevation="3">
          <div class="d-flex justify-space-between align-center mb-1">
            <div class="text-subtitle-2 font-weight-bold text-white d-flex align-center">
              <v-icon color="secondary" icon="mdi-calendar-star" class="mr-1" size="18"></v-icon>
              大会予定
            </div>
            <v-btn
              v-if="isOwner"
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
            <!-- Countdown Display -->
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
                  <template v-if="isOwner">
                    <v-btn
                      icon="mdi-pencil"
                      variant="text"
                      color="secondary"
                      density="compact"
                      size="small"
                      class="pa-0 mr-0.5"
                      style="width: 18px; height: 18px; min-width: 18px"
                      @click="openEditRaceForm(race)"
                    ></v-btn>
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
                  </template>
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
          <div class="text-subtitle-2 font-weight-bold text-white d-flex align-center mb-2 w-100 justify-space-between flex-wrap">
            <div class="d-flex align-center">
              <v-icon color="secondary" icon="mdi-calendar-week" class="mr-1" size="18"></v-icon>
              今後一週間の練習プラン ({{ weeklySchedule[0]?.dateStr ? weeklySchedule[0].dateStr.substring(5).replace('-', '/') : '' }}〜{{ weeklySchedule[6]?.dateStr ? weeklySchedule[6].dateStr.substring(5).replace('-', '/') : '' }})
            </div>
            <div class="d-flex align-center mt-1 mt-sm-0 flex-wrap gap-1">
              <v-chip size="small" variant="tonal" color="secondary" class="font-weight-bold text-caption">
                目標: {{ weeklyTotalTarget }}km
              </v-chip>
              <v-chip size="small" variant="tonal" color="success" class="font-weight-bold text-caption">
                実績: {{ weeklyTotalActual }}km
              </v-chip>
              <v-btn
                v-if="isOwner"
                color="primary"
                prepend-icon="mdi-wizard-hat"
                density="compact"
                variant="outlined"
                rounded="lg"
                class="font-weight-bold text-caption text-white ml-2"
                @click="openAutoPlanDialog"
              >
                プラン一括作成
              </v-btn>
            </div>
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
                <div class="d-flex align-center">
                  <v-btn
                    v-if="isOwner"
                    icon="mdi-pencil"
                    variant="text"
                    color="secondary"
                    density="compact"
                    size="small"
                    class="pa-0 mr-1"
                    style="width: 14px; height: 14px; min-width: 14px"
                    @click="openPlanForm(day)"
                  >
                    <v-icon size="10"></v-icon>
                  </v-btn>
                  <v-icon
                    v-if="day.isCleared"
                    color="success"
                    icon="mdi-check-circle"
                    size="12"
                    class="mt-0.5"
                  ></v-icon>
                </div>
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
    <v-row v-else class="mt-0">
      <!-- 左側カラム (スタッツ4項目 ＆ トレーニング診断) -->
      <v-col cols="12" lg="6">
        <!-- 距離、VDOT、目標ペース距離、心肺効率 -->
        <v-row>
          <v-col cols="12">
            <workout-stats :workouts="workouts" :target-goal="targetGoal" :upcoming-race="upcomingRace" display-mode="stats-only" class="mb-4"></workout-stats>
          </v-col>
          <v-col cols="12">
            <workout-stats :workouts="workouts" :target-goal="targetGoal" :upcoming-race="upcomingRace" display-mode="diagnosis-only" class="mb-4"></workout-stats>
          </v-col>
        </v-row>
      </v-col>

      <!-- 右側カラム (トレーニング統合分析グラフ ＆ アクティビティ履歴) -->
      <v-col cols="12" lg="6">
        <!-- グラフ -->
        <workout-chart :workouts="workouts" :target-goal="targetGoal" :height="270" class="mb-4"></workout-chart>
        
        <!-- アクティビティ履歴 -->
        <workout-table :workouts="workouts"></workout-table>
      </v-col>
    </v-row>

    <!-- マイシューズボックス パネル -->
    <v-row v-if="!loading" class="mt-4">
      <v-col cols="12">
        <v-card class="menu-card px-4 py-4 rounded-xl" elevation="3">
          <div class="text-subtitle-1 font-weight-bold text-white d-flex align-center justify-space-between mb-3 w-100 flex-wrap">
            <div class="d-flex align-center">
              <v-icon color="warning" icon="mdi-archive-outline" class="mr-2" size="22"></v-icon>
              マイシューズボックス (登録シューズコレクション)
            </div>
            <v-btn
              v-if="isOwner"
              color="warning"
              prepend-icon="mdi-plus"
              density="compact"
              variant="outlined"
              rounded="lg"
              class="font-weight-bold text-caption text-white mt-1 mt-sm-0"
              @click="openShoeForm"
            >
              シューズ登録
            </v-btn>
          </div>
          <v-divider class="mb-4" style="opacity: 0.08"></v-divider>

          <div v-if="allShoes.length === 0" class="text-grey text-body-2 py-8 text-center">
            <v-icon icon="mdi-shoe-sneaker" size="32" class="mb-2 text-grey-darken-2 d-block mx-auto"></v-icon>
            Stravaでランニングアクティビティと紐付いたシューズがまだ同期されていません。
          </div>
          <div v-else>
            <div class="shoes-box-grid">
              <v-card
                v-for="shoe in allShoes"
                :key="shoe.name"
                variant="outlined"
                class="shoe-box-item pa-3 rounded-lg border-grey-darken-3 d-flex flex-column align-center justify-start text-center"
                style="background: rgba(25, 28, 41, 0.4); position: relative; overflow: hidden;"
              >
                <!-- status chip & delete button -->
                <div class="shoe-status-tag w-100 d-flex justify-space-between align-center mb-1">
                  <v-btn
                    v-if="isOwner && shoe.isCustom"
                    icon="mdi-delete"
                    variant="text"
                    color="error"
                    density="compact"
                    size="x-small"
                    class="pa-0 mr-1"
                    style="width: 16px; height: 16px; min-width: 16px; z-index: 5;"
                    @click.stop="handleDeleteShoe(shoe.name)"
                  ></v-btn>
                  <div v-else></div>
                  <v-chip
                    size="x-small"
                    :color="shoe.color"
                    variant="flat"
                    class="font-weight-bold text-black px-1.5"
                    style="height: 16px; z-index: 5;"
                  >
                    {{ shoe.status }}
                  </v-chip>
                </div>

                <!-- Main display content: shifts up on hover -->
                <div class="shoe-main-content w-100 d-flex flex-column align-center justify-start mt-1">
                  <ShoeIcon :name="shoe.name" :category="shoe.category" :size="76" class="mb-2"></ShoeIcon>
                  <div class="text-caption font-weight-bold text-white mb-1 px-1" style="font-size: 0.72rem; line-height: 1.25; white-space: normal; word-break: break-word; overflow: visible;">
                    {{ shoe.name }}
                  </div>
                </div>

                <!-- Hover Overlay Content: slides up from bottom -->
                <div class="shoe-stats-overlay w-100 d-flex flex-column align-center justify-end px-2 pb-2">
                  <div class="text-h6 font-weight-black text-white" style="font-size: 1.05rem; line-height: 1.1;">
                    {{ shoe.distance.toFixed(0) }} <span class="text-caption text-grey" style="font-size: 0.65rem;">km</span>
                  </div>
                  <div class="text-caption text-grey-lighten-1" style="font-size: 0.6rem; margin-top: 1px;">
                    使用回数: {{ shoe.runs }}回
                  </div>
                  <div class="w-100 mt-1.5">
                    <v-progress-linear
                      :model-value="shoe.lifePercent"
                      :color="shoe.color"
                      height="3.5"
                      rounded
                    ></v-progress-linear>
                    <div class="d-flex justify-space-between text-grey-darken-1" style="font-size: 0.55rem; margin-top: 1.5px; line-height: 1;">
                      <span>0km</span>
                      <span>寿命 600km</span>
                    </div>
                  </div>
                </div>
              </v-card>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- 大会登録・編集ダイアログ -->
    <race-form
      :active="raceFormActive"
      :race-data="selectedRace"
      @close="closeRaceForm"
      @save="handleSaveRace"
    ></race-form>

    <!-- 練習メニュー個別編集ダイアログ -->
    <plan-form
      v-if="planFormDate"
      :active="planFormActive"
      :date-str="planFormDate"
      :day-name="planFormDayName"
      :plan-data="selectedPlanData"
      :has-override="hasCustomOverride(planFormDate)"
      @close="closePlanForm"
      @save="handleSavePlan"
      @revert="handleRevertPlan"
    ></plan-form>

    <!-- 練習プラン一括作成・自動推薦ダイアログ -->
    <auto-plan-dialog
      :active="autoPlanActive"
      :workouts="workouts"
      :target-goal="targetGoal"
      :weekly-schedule="weeklySchedule"
      @close="closeAutoPlanDialog"
      @save="handleSaveAutoPlan"
    ></auto-plan-dialog>

    <!-- シューズ登録ダイアログ -->
    <shoe-form
      :active="shoeFormActive"
      @close="closeShoeForm"
      @save="handleSaveShoe"
    ></shoe-form>

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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import ShoeIcon from '~/components/ShoeIcon.vue'
import ShoeForm from '~/components/ShoeForm.vue'

export default {
  name: 'AthleteDashboardView',
  components: {
    ShoeIcon,
    ShoeForm
  },
  setup() {
    const route = useRoute()
    const athleteId = route.params.id

    // 認証・権限状態
    const isLoggedIn = ref(false)
    const isOwner = ref(false)
    const athleteInfo = ref(null)

    // ダッシュボード表示用データ
    const workouts = ref([])
    const races = ref([])
    const customPlans = ref({})
    const loading = ref(true)
    const syncing = ref(false)
    const targetGoal = ref('sub3.5')
    let autoSyncInterval = null

    // フォーム関連状態
    const formActive = ref(false)
    const raceFormActive = ref(false)
    const selectedWorkout = ref(null)
    const selectedRace = ref(null)

    // 練習プラン個別編集用状態
    const planFormActive = ref(false)
    const planFormDate = ref('')
    const planFormDayName = ref('')
    const selectedPlanData = ref(null)

    // 練習プラン一括作成用状態
    const autoPlanActive = ref(false)

    // Strava連携ステータス
    const stravaStatus = ref({ linked: false, configSetup: false, athlete: null })

    // 通知スナックバー
    const snackbar = ref({
      show: false,
      text: '',
      color: 'success',
      icon: 'mdi-check-circle'
    })

    const showNotification = (text, color = 'success', icon = 'mdi-check-circle') => {
      snackbar.value = {
        show: true,
        text,
        color,
        icon
      }
    }

    // 共有リンクのコピー
    const copySharingUrl = () => {
      if (import.meta.client) {
        navigator.clipboard.writeText(window.location.href)
        showNotification('共有用URLをクリップボードにコピーしました！', 'success', 'mdi-clipboard-check')
      }
    }

    // 指定されたアスリートIDのデータを取得
    const loadAthleteData = async () => {
      loading.value = true
      try {
        const res = await fetch(`/api/athlete/${athleteId}/data`)
        if (res.ok) {
          const data = await res.json()
          workouts.value = data.workouts || []
          races.value = data.races || []
          customPlans.value = data.plans || {}
          athleteInfo.value = data.athlete || null
        } else {
          showNotification('指定されたアスリート情報が見つかりません。', 'error', 'mdi-alert-circle')
          setTimeout(() => navigateTo('/'), 1500)
        }
      } catch (err) {
        console.error('Failed to load athlete data:', err)
        showNotification('データの読み込みに失敗しました。', 'error', 'mdi-alert-circle')
      } finally {
        loading.value = false
      }
    }

    // ログインユーザーのセッション確認と所有者判定
    const checkOwnership = async () => {
      try {
        const res = await fetch('/api/auth/strava/status')
        if (res.ok) {
          const status = await res.json()
          stravaStatus.value = status
          isLoggedIn.value = status.linked && !!status.athlete?.id
          isOwner.value = status.linked && Number(status.athlete?.id) === Number(athleteId)
        } else {
          isLoggedIn.value = false
          isOwner.value = false
        }
      } catch (err) {
        console.error('Failed to retrieve Strava link status:', err)
        isLoggedIn.value = false
        isOwner.value = false
      }
    }

    // ログアウト処理
    const handleLogout = async () => {
      try {
        await fetch('/api/auth/logout', { method: 'POST' })
        isLoggedIn.value = false
        isOwner.value = false
        stravaStatus.value = { linked: false, configSetup: false, athlete: null }
        showNotification('ログアウトしました')
        navigateTo('/')
      } catch (err) {
        console.error('Logout error:', err)
      }
    }

    // 今後の大会リスト
    const upcomingRacesList = computed(() => {
      if (races.value.length === 0) return []
      const baseTime = new Date('2026-07-05').getTime()
      
      return races.value
        .filter(race => {
          const raceTime = new Date(race.date).getTime()
          return raceTime >= baseTime
        })
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    })

    // 直近のターゲット大会
    const upcomingRace = computed(() => {
      if (upcomingRacesList.value.length === 0) return null
      return upcomingRacesList.value[0]
    })

    // 残り日数
    const upcomingRaceDays = computed(() => {
      if (!upcomingRace.value) return 0
      return calculateDaysUntil(upcomingRace.value.date)
    })

    const calculateDaysUntil = (dateStr) => {
      const today = new Date('2026-07-05')
      const targetDate = new Date(dateStr)
      const diffTime = targetDate.getTime() - today.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays < 0 ? 0 : diffDays
    }

    // 目標に応じた月間走行距離のノルマ
    const monthlyGoalDistance = computed(() => {
      if (targetGoal.value === 'sub4') return 150
      if (targetGoal.value === 'sub3.5') return 200
      return 300
    })

    // 直近30日間の走行距離
    const last30DaysDistance = computed(() => {
      if (workouts.value.length === 0) return 0
      const thirtyDaysAgo = new Date('2026-07-05')
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

    // カレンダー情報の自動構築
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

      const getMenuForDay = (dayName, dateStr) => {
        if (customPlans.value && customPlans.value[dateStr]) {
          const override = customPlans.value[dateStr]
          return {
            menuText: override.menuText,
            targetDistance: override.targetDistance,
            isQuality: override.isQuality,
            targetPace: override.targetPace
          }
        }

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
        return { menuText: '休み', targetDistance: 0, isQuality: false }
      }

      const weekDates = []
      const daysOfWeek = ['日', '月', '火', '水', '木', '金', '土']
      const today = new Date('2026-07-05')
      
      for (let i = 0; i < 7; i++) {
        const currentDate = new Date(today)
        currentDate.setDate(today.getDate() + i)
        const dateStr = currentDate.toISOString().split('T')[0]
        const dayName = daysOfWeek[currentDate.getDay()]
        weekDates.push({ dateStr, dayName })
      }

      return weekDates.map(({ dateStr, dayName }) => {
        const menu = getMenuForDay(dayName, dateStr)
        const dailyWorkouts = workouts.value.filter(w => w.workoutDate && w.workoutDate.startsWith(dateStr))
        
        let actualDistance = 0
        let actualPace = null
        let hasRun = false
        
        if (dailyWorkouts.length > 0) {
          hasRun = true
          actualDistance = dailyWorkouts.reduce((sum, w) => sum + Number(w.distance || 0), 0)
          const totalMovingTime = dailyWorkouts.reduce((sum, w) => w.movingTimeSeconds || w.durationSeconds || 0, 0)
          if (actualDistance > 0 && totalMovingTime > 0) actualPace = Math.round(totalMovingTime / actualDistance)
        }

        let isCleared = false
        if (menu.targetDistance > 0 && hasRun) {
          if (!menu.isQuality) isCleared = actualDistance >= menu.targetDistance * 0.90
          else {
            const minPace = menu.targetPace ? menu.targetPace - 10 : 0
            const maxPace = menu.targetPace ? menu.targetPace + 20 : 9999
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

    const weeklyTotalTarget = computed(() => {
      const sum = weeklySchedule.value.reduce((total, d) => total + Number(d.targetDistance || 0), 0)
      return Math.round(sum * 10) / 10
    })

    const weeklyTotalActual = computed(() => {
      const sum = weeklySchedule.value.reduce((total, d) => total + Number(d.actualDistance || 0), 0)
      return Math.round(sum * 10) / 10
    })

    // 全てのシューズデータを集計 (マイシューズボックス用)
    const allShoes = computed(() => {
      const shoesMap = new Map()

      // 1. Strava等から同期されたワークアウトでの使用実績を集計
      workouts.value.forEach(w => {
        if (w.gearName) {
          const name = w.gearName
          if (!shoesMap.has(name)) {
            shoesMap.set(name, {
              name,
              totalDistance: 0,
              totalRuns: 0,
              category: '',
              isCustom: false
            })
          }
          const s = shoesMap.get(name)
          s.totalDistance += Number(w.distance || 0)
          s.totalRuns += 1
        }
      })

      // 2. ダッシュボードから直接登録されたカスタムシューズをマージ
      customShoes.value.forEach(cs => {
        if (!shoesMap.has(cs.name)) {
          shoesMap.set(cs.name, {
            name: cs.name,
            totalDistance: Number(cs.distance || 0),
            totalRuns: Number(cs.runs || 0),
            category: cs.category,
            isCustom: true
          })
        } else {
          // すでにStrava側で実績がある場合、手動入力分をオフセット加算
          const s = shoesMap.get(cs.name)
          s.totalDistance += Number(cs.distance || 0)
          s.totalRuns += Number(cs.runs || 0)
          s.category = cs.category
          s.isCustom = true
        }
      })

      return Array.from(shoesMap.values()).map(s => {
        const lifeLimit = 600
        const lifePercent = Math.min((s.totalDistance / lifeLimit) * 100, 100)
        
        let color = 'success'
        let status = '良好'
        if (s.totalDistance >= 500) {
          color = 'error'
          status = '交換推奨'
        } else if (s.totalDistance >= 400) {
          color = 'warning'
          status = 'そろそろ'
        }

        return {
          name: s.name,
          distance: s.totalDistance,
          runs: s.totalRuns,
          category: s.category,
          isCustom: s.isCustom,
          lifePercent: Math.round(lifePercent),
          color,
          status
        }
      }).sort((a, b) => b.distance - a.distance)
    })

    // 大会診断ステータス（アドバイス連動用）
    const raceDiagnosis = computed(() => {
      const race = upcomingRace.value
      const BASE_DATE = new Date('2026-07-05')
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

    // 大会登録ダイアログ制御
    const openRaceForm = () => {
      if (!isOwner.value) return
      selectedRace.value = null
      raceFormActive.value = true
    }

    const openEditRaceForm = (race) => {
      if (!isOwner.value) return
      selectedRace.value = { ...race }
      raceFormActive.value = true
    }

    const closeRaceForm = () => {
      raceFormActive.value = false
      selectedRace.value = null
    }

    const handleSaveRace = async (raceData) => {
      if (!isOwner.value) return
      try {
        const res = await fetch('/api/races', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(raceData)
        })
        if (res.ok) {
          showNotification('大会スケジュールを保存しました。')
          await loadAthleteData()
          closeRaceForm()
        } else {
          throw new Error('Save endpoint returned error status')
        }
      } catch (err) {
        showNotification('大会情報の保存に失敗しました: ' + err.message, 'error', 'mdi-alert-circle')
      }
    }

    const handleDeleteRace = async (id) => {
      if (!isOwner.value) return
      if (confirm('本当にこの大会予定を削除しますか？')) {
        try {
          const res = await fetch(`/api/races/${id}`, { method: 'DELETE' })
          if (res.ok) {
            showNotification('大会スケジュールを削除しました。')
            await loadAthleteData()
          } else {
            throw new Error('Delete endpoint returned error status')
          }
        } catch (err) {
          showNotification('大会情報の削除に失敗しました: ' + err.message, 'error', 'mdi-alert-circle')
        }
      }
    }

    // 練習プラン個別編集ダイアログ制御
    const openPlanForm = (day) => {
      if (!isOwner.value) return
      planFormDate.value = day.dateStr
      planFormDayName.value = day.day
      selectedPlanData.value = {
        menuText: day.menuText,
        targetDistance: day.targetDistance,
        isQuality: day.isQuality,
        targetPace: day.targetPace || null
      }
      planFormActive.value = true
    }

    const closePlanForm = () => {
      planFormActive.value = false
      selectedPlanData.value = null
    }

    const handleSavePlan = async (dateStr, planData) => {
      if (!isOwner.value) return
      try {
        const res = await fetch('/api/plans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dateStr, plan: planData })
        })
        if (res.ok) {
          showNotification('練習メニューを上書き設定しました。')
          await loadAthleteData()
          closePlanForm()
        } else {
          throw new Error('Save endpoint returned error status')
        }
      } catch (err) {
        showNotification('保存失敗: ' + err.message, 'error', 'mdi-alert-circle')
      }
    }

    const handleRevertPlan = async (dateStr) => {
      if (!isOwner.value) return
      try {
        const res = await fetch('/api/plans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dateStr, plan: null })
        })
        if (res.ok) {
          showNotification('メニューを初期状態に戻しました。')
          await loadAthleteData()
          closePlanForm()
        } else {
          throw new Error('Revert endpoint returned error status')
        }
      } catch (err) {
        showNotification('復元失敗: ' + err.message, 'error', 'mdi-alert-circle')
      }
    }

    const hasCustomOverride = (dateStr) => !!customPlans.value[dateStr]

    // 練習プラン一括作成ダイアログ制御
    const openAutoPlanDialog = () => {
      if (!isOwner.value) return
      autoPlanActive.value = true
    }

    const closeAutoPlanDialog = () => {
      autoPlanActive.value = false
    }

    const handleSaveAutoPlan = async (plansToSave) => {
      if (!isOwner.value) return
      try {
        const res = await fetch('/api/plans/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plans: plansToSave })
        })
        if (res.ok) {
          showNotification('1週間分の練習プランを一括適用しました。')
          await loadAthleteData()
          closeAutoPlanDialog()
        } else {
          throw new Error('Bulk save endpoint returned error status')
        }
      } catch (err) {
        showNotification('一括保存失敗: ' + err.message, 'error', 'mdi-alert-circle')
      }
    }

    // ワークアウト関連のダミーメソッド
    const openNewWorkoutForm = () => {}
    const openEditWorkoutForm = () => {}
    const closeWorkoutForm = () => {}
    const handleSaveWorkout = () => {}
    const handleDeleteWorkout = () => {}

    // 手動同期処理
    const handleSyncWorkouts = async () => {
      if (!isOwner.value) return
      syncing.value = true
      try {
        const response = await fetch('/api/workout/sync', { method: 'POST' })
        if (response.ok) {
          const result = await response.json()
          if (result && result.success) {
            showNotification(`同期完了: ${result.newlySynced}件の新規アクティビティを読み込みました`)
            await loadAthleteData()
          } else {
            showNotification('データはすべて同期済みです。')
          }
        } else {
          throw new Error('Sync endpoint returned error status')
        }
      } catch (err) {
        showNotification('同期に失敗しました: ' + err.message, 'error', 'mdi-alert-circle')
      } finally {
        syncing.value = false
      }
    }

    // シューズ登録関連処理
    const shoeFormActive = ref(false)
    const customShoes = ref([])

    const openShoeForm = () => {
      if (!isOwner.value) return
      shoeFormActive.value = true
    }

    const closeShoeForm = () => {
      shoeFormActive.value = false
    }

    const loadCustomShoes = () => {
      if (import.meta.client) {
        const stored = localStorage.getItem(`custom_shoes_${athleteId}`)
        customShoes.value = stored ? JSON.parse(stored) : []
      }
    }

    const handleSaveShoe = (shoeData) => {
      if (!isOwner.value) return
      if (customShoes.value.some(s => s.name === shoeData.name)) {
        showNotification('同じ名前のシューズが既に登録されています。', 'error', 'mdi-alert-circle')
        return
      }
      customShoes.value.push(shoeData)
      if (import.meta.client) {
        localStorage.setItem(`custom_shoes_${athleteId}`, JSON.stringify(customShoes.value))
      }
      showNotification('シューズを登録しました！', 'success', 'mdi-shoe-sneaker')
      closeShoeForm()
    }

    const handleDeleteShoe = (name) => {
      if (!isOwner.value) return
      if (confirm(`「${name}」の登録を解除しますか？`)) {
        customShoes.value = customShoes.value.filter(s => s.name !== name)
        if (import.meta.client) {
          localStorage.setItem(`custom_shoes_${athleteId}`, JSON.stringify(customShoes.value))
        }
        showNotification('シューズの登録を解除しました。')
      }
    }

    onMounted(async () => {
      loadCustomShoes()
      await loadAthleteData()
      await checkOwnership()

      // 所有者本人のみ15分ごとの自動同期
      autoSyncInterval = setInterval(async () => {
        if (isOwner.value && stravaStatus.value.linked) {
          try {
            await fetch('/api/workout/sync', { method: 'POST' })
            await loadAthleteData()
          } catch (e) {
            console.error(e)
          }
        }
      }, 900000)
    })

    onUnmounted(() => { if (autoSyncInterval) clearInterval(autoSyncInterval) })

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
      isLoggedIn,
      isOwner,
      athleteInfo,
      stravaStatus,
      selectedRace,
      planFormActive,
      planFormDate,
      planFormDayName,
      selectedPlanData,
      autoPlanActive,
      copySharingUrl,
      handleLogout,
      openEditRaceForm,
      openPlanForm,
      closePlanForm,
      handleSavePlan,
      handleRevertPlan,
      hasCustomOverride,
      openAutoPlanDialog,
      closeAutoPlanDialog,
      handleSaveAutoPlan,
      openNewWorkoutForm,
      openEditWorkoutForm,
      closeWorkoutForm,
      handleSaveWorkout,
      handleDeleteWorkout,
      handleSyncWorkouts,
      openRaceForm,
      closeRaceForm,
      handleSaveRace,
      handleDeleteRace,
      weeklyTotalTarget,
      weeklyTotalActual,
      allShoes,
      shoeFormActive,
      customShoes,
      openShoeForm,
      closeShoeForm,
      handleSaveShoe,
      handleDeleteShoe
    }
  }
}
</script>

<style scoped>
.shoes-box-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 12px;
}

.shoe-box-item {
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  min-height: 155px;
  height: 155px;
  position: relative;
  overflow: hidden;
}

.shoe-box-item:hover {
  transform: translateY(-4px);
  border-color: rgba(245, 158, 11, 0.3) !important;
  box-shadow: 0 8px 24px rgba(245, 158, 11, 0.08) !important;
}

.shoe-main-content {
  transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.shoe-box-item:hover .shoe-main-content {
  transform: translateY(-26px);
}

.shoe-stats-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  transform: translateY(100%);
  opacity: 0;
  transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1), opacity 0.3s ease;
  z-index: 2;
  background: linear-gradient(to top, rgba(15, 17, 26, 0.95) 75%, rgba(15, 17, 26, 0.7) 100%);
  backdrop-filter: blur(4px);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.shoe-box-item:hover .shoe-stats-overlay {
  transform: translateY(0);
  opacity: 1;
}

.dashboard-container {
  background: radial-gradient(circle at 80% 20%, rgba(99, 102, 241, 0.1) 0%, rgba(15, 17, 26, 1) 75%);
}
.letter-spacing-1 {
  letter-spacing: 2px;
}

/* グリッドおよび余白のコンパクト化 (やや余裕を持たせる) */

/* 各種カードの基本デザイン・パディングと余白 */
.compact-grid :deep(.v-card) {
  background: rgba(18, 20, 32, 0.8) !important;
  backdrop-filter: blur(20px) saturate(180%) !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  box-shadow: 0 8px 24px 0 rgba(0, 0, 0, 0.25) !important;
  padding: 14px 16px !important;
  border-radius: 16px !important;
  margin-bottom: 0px !important;
  position: relative !important;
}

/* Vuetifyのデフォルトオーバーレイ(グレー色)を完全に除去 */
.compact-grid :deep(.v-card__overlay) {
  opacity: 0 !important;
  background-color: transparent !important;
  display: none !important;
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

.compact-grid :deep(.stat-card > .v-progress-linear) {
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

<style>
/* ダッシュボード全体のグリッドレイアウト調整 (スコープ外で確実に適用) */
.compact-grid .v-row {
  margin: -8px !important;
}
.compact-grid .v-col {
  padding: 8px !important;
}
</style>
