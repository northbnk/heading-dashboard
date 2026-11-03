<template>
  <div class="cockpit-root min-h-screen">
    <v-container fluid class="cockpit-container px-4 px-md-6 py-3">
      <!-- 1. トップ・ヘッダーバー -->
      <header class="cockpit-topbar px-5 py-3 mb-3 d-flex flex-column flex-md-row align-start align-md-center justify-space-between gap-3">
        <!-- 左側：ブランドロゴ ＆ ランナー・フェーズ表示 -->
        <div class="d-flex align-center flex-wrap gap-3">
          <NuxtLink to="/" class="d-flex align-center text-decoration-none">
            <div class="brand-badge mr-2.5">
              <v-icon color="white" icon="mdi-sine-wave" size="18"></v-icon>
            </div>
            <div class="d-flex align-center">
              <span class="brand-title">
                HEADING 330
              </span>
              <span class="brand-sub ml-2">Training Hub</span>
            </div>
          </NuxtLink>

          <div v-if="athleteInfo" class="runner-pill d-flex align-center px-3 py-1">
            <span class="status-dot mr-2" :class="stravaStatus.linked ? 'dot-online' : 'dot-demo'"></span>
            <span class="runner-name">
              {{ athleteInfo.firstname }} {{ athleteInfo.lastname }}
            </span>
          </div>

          <div v-if="raceDiagnosis?.heading" class="phase-pill d-none d-sm-flex align-center px-3 py-1">
            <v-icon color="#3653B3" icon="mdi-flag-checkered" size="14" class="mr-1.5"></v-icon>
            <span class="phase-text">
              {{ raceDiagnosis.heading }}
            </span>
          </div>
        </div>

        <!-- 右側：目標切替 ＆ Strava同期 ＆ アクション -->
        <div class="d-flex align-center flex-wrap gap-2 w-100 w-md-auto justify-end">
          <!-- 目標設定セグメントコントロール -->
          <div class="goal-segment d-flex align-center mr-1">
            <span class="goal-label px-2.5 d-none d-sm-inline">目標</span>
            <button
              v-for="g in [{ val: 'sub4', label: 'サブ4' }, { val: 'sub3.5', label: 'サブ3.5' }, { val: 'sub3', label: 'サブ3' }]"
              :key="g.val"
              type="button"
              class="goal-seg-btn"
              :class="{ active: targetGoal === g.val }"
              @click="targetGoal = g.val"
            >
              {{ g.label }}
            </button>
          </div>

          <!-- 共有リンク -->
          <v-btn
            v-if="isOwner"
            color="#334155"
            size="small"
            variant="outlined"
            rounded="lg"
            class="font-weight-bold px-3 action-btn-outline"
            prepend-icon="mdi-share-variant-outline"
            @click="copySharingUrl"
          >
            共有
          </v-btn>

          <!-- Strava同期・連携 -->
          <template v-if="isOwner">
            <v-btn
              v-if="stravaStatus.linked"
              size="small"
              variant="flat"
              rounded="lg"
              class="font-weight-bold text-white px-3.5 strava-btn"
              prepend-icon="mdi-sync"
              :loading="syncing"
              @click="handleSyncWorkouts"
            >
              Strava同期
            </v-btn>
            <v-btn
              v-else-if="stravaStatus.configSetup"
              size="small"
              variant="flat"
              rounded="lg"
              class="font-weight-bold text-white px-3.5 strava-btn"
              prepend-icon="mdi-swap-horizontal"
              href="/api/auth/strava/connect"
            >
              Strava連携
            </v-btn>
          </template>

          <!-- ログイン / ログアウト -->
          <v-btn
            v-if="!isLoggedIn"
            color="primary"
            size="small"
            variant="flat"
            rounded="lg"
            class="font-weight-bold text-white px-3.5"
            prepend-icon="mdi-login"
            to="/"
          >
            ログイン
          </v-btn>
          <v-btn
            v-else
            color="#64748B"
            size="small"
            variant="text"
            rounded="lg"
            icon="mdi-logout"
            title="ログアウト"
            @click="handleLogout"
          ></v-btn>
        </div>
      </header>

      <!-- ローディング状態 -->
      <div v-if="loading" class="d-flex flex-column align-center justify-center py-16">
        <v-progress-circular indeterminate color="primary" size="44" class="mb-3"></v-progress-circular>
        <div class="text-caption" style="color: #64748B;">データを読み込み中...</div>
      </div>

      <!-- 2. メイン Bento Grid コックピット -->
      <template v-else>
        <!-- Row 1: 5項目コア・指標リボン -->
        <div class="mb-3">
          <workout-stats
            :workouts="workouts"
            :target-goal="targetGoal"
            :upcoming-race="upcomingRace"
            display-mode="stats-only"
          ></workout-stats>
        </div>

        <!-- Row 2: 3カラム非対称 Bento Grid -->
        <v-row dense class="bento-main-grid">
          <!-- 左カラム (lg="3"): ターゲット大会 ＆ AI総合診断 -->
          <v-col cols="12" lg="3" class="d-flex flex-column gap-3">
            <!-- Tile A1: 大会カウントダウン & スケジュール -->
            <div class="bento-panel">
              <div class="d-flex justify-space-between align-center mb-3">
                <span class="panel-title">
                  ターゲット大会
                </span>
                <v-btn
                  v-if="isOwner"
                  color="primary"
                  prepend-icon="mdi-plus"
                  density="compact"
                  variant="tonal"
                  size="small"
                  rounded="lg"
                  class="font-weight-bold px-2.5"
                  @click="openRaceForm"
                >
                  大会登録
                </v-btn>
              </div>

              <div v-if="upcomingRacesList.length > 0">
                <!-- メインカウントダウン -->
                <div class="next-race-hero pa-4 rounded-xl mb-3 d-flex align-center justify-space-between">
                  <div class="overflow-hidden pr-3">
                    <div class="race-eyebrow mb-1">
                      NEXT TARGET RACE
                    </div>
                    <div class="race-main-name text-truncate">
                      {{ upcomingRace.name }}
                    </div>
                    <div class="race-main-meta font-num mt-1">
                      {{ upcomingRace.date.replace(/-/g, '/') }}
                      <span class="mx-1">•</span>
                      <span class="race-goal-tag">{{ upcomingRace.targetTime }}</span>
                    </div>
                  </div>
                  <div class="countdown-box text-right flex-shrink-0 pl-3">
                    <div class="countdown-label">残り</div>
                    <div class="countdown-number font-num">
                      {{ upcomingRaceDays }}<span class="countdown-unit">日</span>
                    </div>
                  </div>
                </div>

                <!-- 大会リスト -->
                <div class="race-compact-scroll">
                  <div
                    v-for="race in upcomingRacesList"
                    :key="race.id"
                    class="race-mini-row d-flex align-center justify-space-between px-3 py-2 rounded-lg"
                  >
                    <div class="d-flex align-center overflow-hidden">
                      <v-icon
                        :color="race.id === upcomingRace.id ? '#3653B3' : '#7C8B9E'"
                        :icon="race.id === upcomingRace.id ? 'mdi-flag-variant' : 'mdi-calendar-blank-outline'"
                        size="15"
                        class="mr-2 flex-shrink-0"
                      ></v-icon>
                      <span class="race-row-name text-truncate">
                        {{ race.name }}
                      </span>
                    </div>
                    <div class="d-flex align-center flex-shrink-0 ml-2">
                      <span class="race-row-days font-num mr-1.5">あと{{ calculateDaysUntil(race.date) }}日</span>
                      <template v-if="isOwner">
                        <v-btn
                          icon="mdi-pencil-outline"
                          variant="text"
                          color="#64748B"
                          density="compact"
                          size="x-small"
                          style="width: 22px; height: 22px;"
                          @click="openEditRaceForm(race)"
                        ></v-btn>
                        <v-btn
                          icon="mdi-close"
                          variant="text"
                          color="#DC2626"
                          density="compact"
                          size="x-small"
                          style="width: 22px; height: 22px;"
                          @click="handleDeleteRace(race.id)"
                        ></v-btn>
                      </template>
                    </div>
                  </div>
                </div>
              </div>

              <div v-else class="text-center py-6 empty-state-text">
                <v-icon icon="mdi-calendar-plus-outline" size="24" class="mb-1.5 d-block mx-auto" color="#94A3B8"></v-icon>
                予定されている大会はありません
              </div>
            </div>

            <!-- Tile A2: AI マラソン診断 ＆ 心肺持久力 -->
            <div class="flex-grow-1 d-flex flex-column">
              <workout-stats
                :workouts="workouts"
                :target-goal="targetGoal"
                :upcoming-race="upcomingRace"
                display-mode="diagnosis-only"
                class="flex-grow-1"
              ></workout-stats>
            </div>
          </v-col>

          <!-- 中央カラム (lg="5"): 週間7Daysプラン ＆ パフォーマンス推移チャート -->
          <v-col cols="12" lg="5" class="d-flex flex-column gap-3">
            <!-- Tile B1: 今後1週間の練習プラン -->
            <div class="bento-panel">
              <div class="d-flex align-center justify-space-between flex-wrap gap-2 mb-3">
                <div class="d-flex align-center">
                  <span class="panel-title">
                    週間トレーニング計画
                  </span>
                  <span class="panel-subdate font-num ml-2">
                    ({{ weeklySchedule[0]?.dateStr ? weeklySchedule[0].dateStr.substring(5).replace('-', '/') : '' }}〜{{ weeklySchedule[6]?.dateStr ? weeklySchedule[6].dateStr.substring(5).replace('-', '/') : '' }})
                  </span>
                </div>

                <div class="d-flex align-center gap-2">
                  <div class="weekly-progress-pill px-2.5 py-1 rounded-lg d-flex align-center gap-1 font-num">
                    <span class="pill-muted">実績</span>
                    <strong class="pill-strong">{{ weeklyTotalActual }}</strong>
                    <span class="pill-muted">/ {{ weeklyTotalTarget }} km</span>
                  </div>
                  <v-btn
                    v-if="isOwner"
                    color="primary"
                    prepend-icon="mdi-auto-fix"
                    density="compact"
                    variant="tonal"
                    size="small"
                    rounded="lg"
                    class="font-weight-bold px-2.5"
                    @click="openAutoPlanDialog"
                  >
                    一括作成
                  </v-btn>
                </div>
              </div>

              <!-- 7日間ストリップ -->
              <div class="bento-week-strip">
                <div
                  v-for="day in weeklySchedule"
                  :key="day.dateStr"
                  class="bento-day-cell d-flex flex-column justify-space-between"
                  :class="{
                    'day-cleared': day.isCleared,
                    'day-quality': day.isQuality && !day.isCleared,
                    'day-rest': day.targetDistance === 0,
                    'day-editable': isOwner
                  }"
                  @click="isOwner ? openPlanForm(day) : null"
                >
                  <!-- 曜日ヘッダー -->
                  <div class="d-flex justify-space-between align-center">
                    <span
                      class="day-label"
                      :class="day.day === '日' ? 'day-sun' : day.day === '土' ? 'day-sat' : ''"
                    >
                      {{ day.day }}
                    </span>
                    <span class="day-date-num font-num">
                      {{ parseInt(day.dateStr.substring(8), 10) }}
                    </span>
                  </div>

                  <!-- メニュー内容 -->
                  <div class="my-2">
                    <div
                      class="day-menu-text line-clamp-2"
                      :class="day.targetDistance === 0 ? 'menu-rest' : ''"
                    >
                      {{ day.menuText }}
                    </div>
                  </div>

                  <!-- ステータスフッター -->
                  <div class="d-flex align-center justify-space-between font-num" style="font-size: 0.66rem;">
                    <span v-if="day.isCleared" class="day-status-cleared d-flex align-center">
                      <v-icon icon="mdi-check-circle" size="12" class="mr-0.5" color="#1E7E5C"></v-icon>
                      {{ day.actualDistance.toFixed(0) }}k
                    </span>
                    <span v-else-if="day.hasRun" class="day-status-run">
                      {{ day.actualDistance.toFixed(1) }}k
                    </span>
                    <span v-else-if="day.targetDistance > 0" class="day-status-target">
                      {{ day.targetDistance }}km
                    </span>
                    <span v-else class="day-status-rest">
                      OFF
                    </span>

                    <span
                      v-if="hasCustomOverride(day.dateStr)"
                      class="custom-dot"
                      title="カスタム設定済み"
                    ></span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Tile B2: 統合パフォーマンス推移チャート -->
            <div class="flex-grow-1 d-flex flex-column">
              <workout-chart
                :workouts="workouts"
                :target-goal="targetGoal"
                :height="250"
                class="flex-grow-1"
              ></workout-chart>
            </div>
          </v-col>

          <!-- 右カラム (lg="4"): アクティビティ履歴 -->
          <v-col cols="12" lg="4" class="d-flex flex-column">
            <div class="bento-panel d-flex flex-column h-100">
              <div class="d-flex align-center justify-space-between mb-2">
                <span class="panel-title">
                  アクティビティ履歴
                </span>
                <span class="panel-subdate">
                  クリックでルート＆ラップ詳細
                </span>
              </div>

              <workout-table :workouts="workouts" class="flex-grow-1"></workout-table>
            </div>
          </v-col>
        </v-row>
      </template>

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

      <!-- スナックバーによる通知フィードバック -->
      <v-snackbar
        v-model="snackbar.show"
        :color="snackbar.color"
        timeout="3000"
        rounded="pill"
        elevation="4"
      >
        <div class="d-flex align-center font-weight-medium">
          <v-icon :icon="snackbar.icon" class="mr-2"></v-icon>
          {{ snackbar.text }}
        </div>
      </v-snackbar>
    </v-container>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue'

export default {
  name: 'AthleteDashboardView',
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
    const raceFormActive = ref(false)
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
      snackbar.value = { show: true, text, color, icon }
    }

    const copySharingUrl = () => {
      if (import.meta.client) {
        navigator.clipboard.writeText(window.location.href)
        showNotification('共有用URLをクリップボードにコピーしました！', 'success', 'mdi-clipboard-check')
      }
    }

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

    // 今日の日付（時刻00:00:00）を取得
    const getTodayStart = () => {
      const now = new Date()
      now.setHours(0, 0, 0, 0)
      return now
    }

    const parseLocalDate = (dateStr) => {
      if (!dateStr) return new Date(0)
      const parts = dateStr.split(/[\s\-:]/)
      return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10))
    }

    // 実際の現在日付を基準に今後の大会リストを抽出
    const upcomingRacesList = computed(() => {
      if (races.value.length === 0) return []
      const todayTime = getTodayStart().getTime()
      return races.value
        .filter(race => parseLocalDate(race.date).getTime() >= todayTime)
        .sort((a, b) => parseLocalDate(a.date).getTime() - parseLocalDate(b.date).getTime())
    })

    const upcomingRace = computed(() => {
      if (upcomingRacesList.value.length === 0) return null
      return upcomingRacesList.value[0]
    })

    const calculateDaysUntil = (dateStr) => {
      const today = getTodayStart()
      const targetDate = parseLocalDate(dateStr)
      const diffTime = targetDate.getTime() - today.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays < 0 ? 0 : diffDays
    }

    const upcomingRaceDays = computed(() => {
      if (!upcomingRace.value) return 0
      return calculateDaysUntil(upcomingRace.value.date)
    })

    const monthlyGoalDistance = computed(() => {
      if (targetGoal.value === 'sub4') return 150
      if (targetGoal.value === 'sub3.5') return 200
      return 300
    })

    const last30DaysDistance = computed(() => {
      if (workouts.value.length === 0) return 0
      const dates = workouts.value.map(w => parseLocalDate(w.workoutDate)).filter(d => d.getTime() > 0)
      const now = getTodayStart()
      const maxDate = dates.length > 0 ? new Date(Math.max(...dates)) : now
      const refDate = (now.getTime() - maxDate.getTime()) / (1000 * 60 * 60 * 24) > 45 ? maxDate : now

      const thirtyDaysAgo = new Date(refDate.getTime())
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      return workouts.value
        .filter(w => {
          if (!w.workoutDate) return false
          const d = parseLocalDate(w.workoutDate)
          return d >= thirtyDaysAgo && d <= refDate
        })
        .reduce((sum, w) => sum + Number(w.distance || 0), 0)
    })

    const formatDateISO = (d) => {
      const yyyy = d.getFullYear()
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      const dd = String(d.getDate()).padStart(2, '0')
      return `${yyyy}-${mm}-${dd}`
    }

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
        return `${m}:${String(s).padStart(2, '0')}/k`
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
            case '火': return { menuText: `ジョグ ${weekdayJogDist}k`, targetDistance: weekdayJogDist, isQuality: false }
            case '水': return { menuText: '休み', targetDistance: 0, isQuality: false }
            case '木': return { menuText: `ジョグ ${weekdayJogDist}k`, targetDistance: weekdayJogDist, isQuality: false }
            case '金': return { menuText: '休み', targetDistance: 0, isQuality: false }
            case '土': return { menuText: `ロング ${longJogDist}k`, targetDistance: longJogDist, isQuality: false }
            case '日': return { menuText: '休み', targetDistance: 0, isQuality: false }
          }
        } else {
          const weeks = diag.weeksRemaining
          if (weeks >= 9) {
            switch (dayName) {
              case '月': return { menuText: '休み', targetDistance: 0, isQuality: false }
              case '火': return { menuText: 'ジョグ 10k', targetDistance: 10, isQuality: false }
              case '水': return { menuText: `閾値走 8k (${formatPaceMinSec(thresholdPaceSec)})`, targetDistance: 8, isQuality: true, targetPace: thresholdPaceSec }
              case '木': return { menuText: 'ジョグ 10k', targetDistance: 10, isQuality: false }
              case '金': return { menuText: '休み', targetDistance: 0, isQuality: false }
              case '土': return { menuText: 'ロング 20k', targetDistance: 20, isQuality: false }
              case '日': return { menuText: 'ジョグ 10k', targetDistance: 10, isQuality: false }
            }
          } else if (weeks >= 5) {
            const longRunPace = mPaceSec + 20
            switch (dayName) {
              case '月': return { menuText: '休み', targetDistance: 0, isQuality: false }
              case '火': return { menuText: 'ジョグ 10k', targetDistance: 10, isQuality: false }
              case '水': return { menuText: `Mペース 5k (${formatPaceMinSec(mPaceSec)})`, targetDistance: 5, isQuality: true, targetPace: mPaceSec }
              case '木': return { menuText: 'ジョグ 10k', targetDistance: 10, isQuality: false }
              case '金': return { menuText: '休み', targetDistance: 0, isQuality: false }
              case '土': return { menuText: `30k走 (${formatPaceMinSec(longRunPace)})`, targetDistance: 30, isQuality: true, targetPace: longRunPace }
              case '日': return { menuText: '疲労抜き 5k', targetDistance: 5, isQuality: false }
            }
          } else if (weeks >= 2) {
            switch (dayName) {
              case '月': return { menuText: '休み', targetDistance: 0, isQuality: false }
              case '火': return { menuText: 'ジョグ 5k', targetDistance: 5, isQuality: false }
              case '水': return { menuText: `Mペース 3k`, targetDistance: 3, isQuality: true, targetPace: mPaceSec }
              case '木': return { menuText: 'ジョグ 5k', targetDistance: 5, isQuality: false }
              case '金': return { menuText: '休み', targetDistance: 0, isQuality: false }
              case '土': return { menuText: `レースペース 20k`, targetDistance: 20, isQuality: true, targetPace: mPaceSec }
              case '日': return { menuText: '休み', targetDistance: 0, isQuality: false }
            }
          } else {
            switch (dayName) {
              case '月': return { menuText: '休み', targetDistance: 0, isQuality: false }
              case '火': return { menuText: 'ジョグ 2k', targetDistance: 2, isQuality: false }
              case '水': return { menuText: `刺激入れ 3k`, targetDistance: 3, isQuality: true, targetPace: mPaceSec }
              case '木': return { menuText: 'ジョグ 2k', targetDistance: 2, isQuality: false }
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
      const today = getTodayStart()
      
      for (let i = 0; i < 7; i++) {
        const currentDate = new Date(today.getTime())
        currentDate.setDate(today.getDate() + i)
        const dateStr = formatDateISO(currentDate)
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

    const raceDiagnosis = computed(() => {
      const race = upcomingRace.value
      if (!race) return null
      
      const diffDays = calculateDaysUntil(race.date)
      
      if (diffDays >= 91) {
        return {
          mode: 'VOLUME_ADJUSTMENT',
          heading: 'ベースアップ期（走行量強化）'
        }
      } else {
        const weeksRemaining = Math.max(0, Math.ceil(diffDays / 7))
        let phaseName = ''
        if (weeksRemaining >= 9) phaseName = '鍛錬期（脚作り）'
        else if (weeksRemaining >= 5) phaseName = '実戦強化期'
        else if (weeksRemaining >= 2) phaseName = '調整期（テーパリング）'
        else phaseName = '直前期'
        
        return {
          mode: 'PERIODIZATION',
          heading: `${race.name} あと${diffDays}日 ｜ ${phaseName}`,
          phaseName,
          weeksRemaining
        }
      }
    })

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

    onMounted(async () => {
      await loadAthleteData()
      await checkOwnership()

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
      raceFormActive,
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
      handleSyncWorkouts,
      openRaceForm,
      closeRaceForm,
      handleSaveRace,
      handleDeleteRace,
      weeklyTotalTarget,
      weeklyTotalActual
    }
  }
}
</script>

<style scoped>
.cockpit-root {
  background-color: #E5E9F0;
  color: #1E293B;
}

.cockpit-container {
  max-width: 1640px;
  margin: 0 auto;
}

/* Top Header Bar (落ち着いたオフホワイト・スレート) */
.cockpit-topbar {
  background: #F2F4F8;
  border: 1px solid #D5DBE3;
  border-radius: 16px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}

.brand-badge {
  width: 32px;
  height: 32px;
  border-radius: 9px;
  background: #1E293B;
  display: flex;
  align-items: center;
  justify-content: center;
}

.brand-title {
  font-size: 1.05rem;
  font-weight: 800;
  color: #1E293B;
  letter-spacing: -0.02em;
}

.brand-sub {
  font-size: 0.72rem;
  font-weight: 600;
  color: #526071;
}

.runner-pill {
  background: #E8ECF2;
  border: 1px solid #D5DBE3;
  border-radius: 99px;
}

.runner-name {
  font-size: 0.78rem;
  font-weight: 700;
  color: #1E293B;
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.dot-online {
  background: #1E7E5C;
}

.dot-demo {
  background: #3653B3;
}

.phase-pill {
  background: #E4EAF5;
  border: 1px solid #C5D1E8;
  border-radius: 99px;
}

.phase-text {
  font-size: 0.74rem;
  font-weight: 700;
  color: #2B4494;
}

.goal-segment {
  background: #E2E7EE;
  border: 1px solid #D1D8E2;
  border-radius: 10px;
  padding: 3px;
}

.goal-label {
  font-size: 0.7rem;
  font-weight: 700;
  color: #526071;
}

.goal-seg-btn {
  border: none;
  background: transparent;
  color: #526071;
  font-size: 0.74rem;
  font-weight: 600;
  padding: 5px 12px;
  border-radius: 7px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.goal-seg-btn.active {
  background: #F8FAFC;
  color: #1E293B;
  font-weight: 700;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.08);
}

.action-btn-outline {
  border-color: #C4CDD9 !important;
}

.strava-btn {
  background: #D9480F !important;
}

/* Bento Panels (眩しさを抑えたソフトマット表面 + たっぷりの内部余白) */
.bento-panel {
  background: #F2F4F8;
  border: 1px solid #D5DBE3;
  border-radius: 16px;
  padding: 20px 24px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}

.panel-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: #1E293B;
  letter-spacing: -0.01em;
}

.panel-subdate {
  font-size: 0.74rem;
  color: #526071;
  font-weight: 500;
}

/* Next Race Hero */
.next-race-hero {
  background: #E8ECF2;
  border: 1px solid #D5DBE3;
}

.race-eyebrow {
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: #3653B3;
}

.race-main-name {
  font-size: 1rem;
  font-weight: 800;
  color: #1E293B;
  line-height: 1.25;
}

.race-main-meta {
  font-size: 0.76rem;
  color: #475569;
  font-weight: 500;
}

.race-goal-tag {
  color: #1E293B;
  font-weight: 700;
}

.countdown-box {
  border-left: 1px solid #D1D8E2;
}

.countdown-label {
  font-size: 0.65rem;
  font-weight: 600;
  color: #526071;
  line-height: 1;
  margin-bottom: 2px;
}

.countdown-number {
  font-size: 1.9rem;
  font-weight: 800;
  color: #3653B3;
  line-height: 1;
}

.countdown-unit {
  font-size: 0.78rem;
  font-weight: 700;
  color: #475569;
  margin-left: 2px;
}

.race-compact-scroll {
  max-height: 88px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.race-mini-row {
  background: #E8ECF2;
  border: 1px solid #D5DBE3;
}

.race-row-name {
  font-size: 0.78rem;
  font-weight: 600;
  color: #1E293B;
}

.race-row-days {
  font-size: 0.72rem;
  font-weight: 600;
  color: #526071;
}

.empty-state-text {
  font-size: 0.8rem;
  color: #526071;
}

/* Weekly 7-Day Strip */
.weekly-progress-pill {
  background: #E8ECF2;
  border: 1px solid #D5DBE3;
  font-size: 0.74rem;
}

.pill-muted {
  color: #526071;
}

.pill-strong {
  color: #1E293B;
  font-weight: 800;
}

.bento-week-strip {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 8px;
}

@media (max-width: 650px) {
  .bento-week-strip {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.bento-day-cell {
  background: #E8ECF2;
  border: 1px solid #D5DBE3;
  border-radius: 12px;
  padding: 12px 10px;
  min-height: 98px;
  transition: all 0.15s ease;
}

.bento-day-cell.day-editable {
  cursor: pointer;
}

.bento-day-cell.day-editable:hover {
  border-color: #9BB0D6;
  background: #DFE6F2;
  transform: translateY(-1px);
}

.bento-day-cell.day-cleared {
  background: #E2EFE9;
  border-color: #B4D6C6;
}

.bento-day-cell.day-quality {
  background: #E3EAF6;
  border-color: #BCCCE8;
}

.bento-day-cell.day-rest {
  background: #ECEFF4;
  opacity: 0.75;
}

.day-label {
  font-size: 0.76rem;
  font-weight: 700;
  color: #1E293B;
}

.day-sun {
  color: #B83232;
}

.day-sat {
  color: #3653B3;
}

.day-date-num {
  font-size: 0.68rem;
  font-weight: 600;
  color: #526071;
}

.day-menu-text {
  font-size: 0.72rem;
  font-weight: 700;
  color: #1E293B;
  line-height: 1.35;
}

.menu-rest {
  color: #7C8B9E;
  font-weight: 500;
}

.day-status-cleared {
  color: #1E7E5C;
  font-weight: 700;
}

.day-status-run {
  color: #3653B3;
  font-weight: 700;
}

.day-status-target {
  color: #526071;
  font-weight: 600;
}

.day-status-rest {
  color: #7C8B9E;
  font-weight: 600;
}

.custom-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #3653B3;
}

.gap-2 { gap: 8px; }
.gap-3 { gap: 12px; }
</style>
