<template>
  <div class="cockpit-root min-h-screen">
    <v-container fluid class="cockpit-container px-3 px-md-5 py-2">
      <!-- 1. トップ・コックピット・コマンドバー -->
      <header class="cockpit-topbar px-3 py-2 mb-2.5 d-flex flex-column flex-md-row align-start align-md-center justify-space-between gap-2">
        <!-- 左側：ブランドロゴ ＆ ランナー・フェーズ表示 -->
        <div class="d-flex align-center flex-wrap gap-2">
          <NuxtLink to="/" class="d-flex align-center text-decoration-none mr-1">
            <div class="brand-badge mr-2">
              <v-icon color="white" icon="mdi-sine-wave" size="18"></v-icon>
            </div>
            <div>
              <div class="d-flex align-center">
                <span class="font-outfit font-weight-black text-white tracking-wider" style="font-size: 1.05rem; letter-spacing: 0.06em;">
                  HEADING 330
                </span>
                <span class="cockpit-tag ml-2">COCKPIT</span>
              </div>
            </div>
          </NuxtLink>

          <div v-if="athleteInfo" class="runner-pill d-flex align-center px-2.5 py-1">
            <span class="status-dot mr-1.5" :class="stravaStatus.linked ? 'dot-online' : 'dot-demo'"></span>
            <span class="text-caption font-weight-bold text-white" style="font-size: 0.73rem;">
              {{ athleteInfo.firstname }} {{ athleteInfo.lastname }}
            </span>
          </div>

          <div v-if="raceDiagnosis?.heading" class="phase-pill d-none d-sm-flex align-center px-2.5 py-1">
            <v-icon color="secondary" icon="mdi-flag-checkered" size="13" class="mr-1"></v-icon>
            <span class="text-caption font-weight-bold text-cyan" style="font-size: 0.7rem;">
              {{ raceDiagnosis.heading }}
            </span>
          </div>
        </div>

        <!-- 右側：目標切替 ＆ Strava同期 ＆ アクション -->
        <div class="d-flex align-center flex-wrap gap-1.5 w-100 w-md-auto justify-end">
          <!-- 目標設定セグメントコントロール -->
          <div class="goal-segment d-flex align-center mr-1">
            <span class="text-caption text-grey px-2 d-none d-sm-inline" style="font-size: 0.66rem; font-weight: 700;">TARGET</span>
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
            color="grey-lighten-2"
            size="x-small"
            variant="tonal"
            rounded="lg"
            class="font-weight-bold px-2.5"
            style="height: 28px;"
            prepend-icon="mdi-share-variant"
            @click="copySharingUrl"
          >
            共有
          </v-btn>

          <!-- Strava同期・連携 -->
          <template v-if="isOwner">
            <v-btn
              v-if="stravaStatus.linked"
              color="orange-darken-3"
              size="x-small"
              variant="flat"
              rounded="lg"
              class="font-weight-bold text-white px-3"
              style="height: 28px; background: linear-gradient(135deg, #f97316, #ea580c) !important;"
              prepend-icon="mdi-sync"
              :loading="syncing"
              @click="handleSyncWorkouts"
            >
              Strava同期
            </v-btn>
            <v-btn
              v-else-if="stravaStatus.configSetup"
              color="orange-darken-3"
              size="x-small"
              variant="flat"
              rounded="lg"
              class="font-weight-bold text-white px-3"
              style="height: 28px;"
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
            size="x-small"
            variant="flat"
            rounded="lg"
            class="font-weight-bold text-black px-2.5"
            style="height: 28px;"
            prepend-icon="mdi-login"
            to="/"
          >
            ログイン
          </v-btn>
          <v-btn
            v-else
            color="grey-lighten-1"
            size="x-small"
            variant="text"
            rounded="lg"
            icon="mdi-logout"
            title="ログアウト"
            style="width: 28px; height: 28px;"
            @click="handleLogout"
          ></v-btn>
        </div>
      </header>

      <!-- ローディング状態 -->
      <div v-if="loading" class="d-flex flex-column align-center justify-center py-16">
        <v-progress-circular indeterminate color="primary" size="48" class="mb-3"></v-progress-circular>
        <div class="text-caption text-grey">コックピット・テレメトリを初期化中...</div>
      </div>

      <!-- 2. メイン Bento Grid コックピット -->
      <template v-else>
        <!-- Row 1: 6項目コア・テレメトリ・リボン -->
        <div class="mb-2.5">
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
          <v-col cols="12" lg="3" class="d-flex flex-column gap-2.5">
            <!-- Tile A1: 大会カウントダウン & スケジュール -->
            <div class="bento-panel">
              <div class="d-flex justify-space-between align-center mb-2">
                <div class="d-flex align-center">
                  <div class="cockpit-dot bg-amber mr-2"></div>
                  <span class="text-subtitle-2 font-weight-black text-white tracking-wide">
                    ターゲット大会
                  </span>
                </div>
                <v-btn
                  v-if="isOwner"
                  color="secondary"
                  prepend-icon="mdi-plus"
                  density="compact"
                  variant="tonal"
                  size="x-small"
                  rounded="md"
                  class="font-weight-bold px-2"
                  @click="openRaceForm"
                >
                  登録
                </v-btn>
              </div>

              <div v-if="upcomingRacesList.length > 0">
                <!-- メインカウントダウン -->
                <div class="next-race-hero pa-2.5 rounded-lg mb-2 d-flex align-center justify-space-between">
                  <div class="overflow-hidden pr-2">
                    <div class="d-flex align-center mb-0.5">
                      <v-icon color="warning" icon="mdi-trophy" size="12" class="mr-1"></v-icon>
                      <span class="text-amber font-weight-black" style="font-size: 0.62rem; letter-spacing: 0.08em;">NEXT TARGET</span>
                    </div>
                    <div class="text-subtitle-2 font-weight-black text-white text-truncate" style="line-height: 1.2;">
                      {{ upcomingRace.name }}
                    </div>
                    <div class="text-caption text-grey-lighten-1 mt-0.5" style="font-size: 0.68rem;">
                      {{ upcomingRace.date.replace(/-/g, '/') }} ｜ <span class="text-cyan font-weight-bold">{{ upcomingRace.targetTime }}</span>
                    </div>
                  </div>
                  <div class="countdown-box text-right flex-shrink-0 pl-2">
                    <div class="text-caption text-grey" style="font-size: 0.58rem; line-height: 1;">あと</div>
                    <div class="font-outfit font-weight-black text-secondary" style="font-size: 1.65rem; line-height: 1.05;">
                      {{ upcomingRaceDays }}
                    </div>
                    <div class="text-caption text-grey" style="font-size: 0.6rem; line-height: 1;">DAYS</div>
                  </div>
                </div>

                <!-- 大会リスト (複数登録時または編集操作用) -->
                <div class="race-compact-scroll">
                  <div
                    v-for="race in upcomingRacesList"
                    :key="race.id"
                    class="race-mini-row d-flex align-center justify-space-between px-2 py-1 rounded"
                  >
                    <div class="d-flex align-center overflow-hidden">
                      <v-icon
                        :color="race.id === upcomingRace.id ? 'warning' : 'grey-darken-1'"
                        :icon="race.id === upcomingRace.id ? 'mdi-star' : 'mdi-calendar-blank'"
                        size="12"
                        class="mr-1.5 flex-shrink-0"
                      ></v-icon>
                      <span class="text-caption text-white text-truncate font-weight-medium" style="font-size: 0.72rem;">
                        {{ race.name }}
                      </span>
                    </div>
                    <div class="d-flex align-center flex-shrink-0 ml-1">
                      <span class="text-caption text-grey mr-1" style="font-size: 0.65rem;">{{ calculateDaysUntil(race.date) }}日</span>
                      <template v-if="isOwner">
                        <v-btn
                          icon="mdi-pencil-outline"
                          variant="text"
                          color="grey-lighten-1"
                          density="compact"
                          size="x-small"
                          style="width: 18px; height: 18px;"
                          @click="openEditRaceForm(race)"
                        ></v-btn>
                        <v-btn
                          icon="mdi-close"
                          variant="text"
                          color="error"
                          density="compact"
                          size="x-small"
                          style="width: 18px; height: 18px;"
                          @click="handleDeleteRace(race.id)"
                        ></v-btn>
                      </template>
                    </div>
                  </div>
                </div>
              </div>

              <div v-else class="text-center py-4 text-grey text-caption">
                <v-icon icon="mdi-calendar-plus" size="20" class="mb-1 d-block mx-auto text-grey-darken-1"></v-icon>
                予定大会なし（右上の登録から追加）
              </div>
            </div>

            <!-- Tile A2: AI マラソン診断 ＆ 心肺持久力コックピット -->
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

          <!-- 中央カラム (lg="5"): 週間7Daysプラン ＆ 統合パフォーマンスチャート -->
          <v-col cols="12" lg="5" class="d-flex flex-column gap-2.5">
            <!-- Tile B1: 今後1週間の練習プラン -->
            <div class="bento-panel">
              <div class="d-flex align-center justify-space-between flex-wrap gap-1 mb-2">
                <div class="d-flex align-center">
                  <div class="cockpit-dot bg-emerald mr-2"></div>
                  <span class="text-subtitle-2 font-weight-black text-white tracking-wide">
                    週間トレーニングプラン
                  </span>
                  <span class="text-caption text-grey ml-1.5" style="font-size: 0.68rem;">
                    ({{ weeklySchedule[0]?.dateStr ? weeklySchedule[0].dateStr.substring(5).replace('-', '/') : '' }}〜{{ weeklySchedule[6]?.dateStr ? weeklySchedule[6].dateStr.substring(5).replace('-', '/') : '' }})
                  </span>
                </div>

                <div class="d-flex align-center gap-1.5">
                  <div class="weekly-progress-pill px-2 py-0.5 rounded d-flex align-center gap-1" style="font-size: 0.68rem;">
                    <span class="text-grey">実績</span>
                    <strong class="text-emerald font-outfit">{{ weeklyTotalActual }}</strong>
                    <span class="text-grey">/ {{ weeklyTotalTarget }}km</span>
                  </div>
                  <v-btn
                    v-if="isOwner"
                    color="primary"
                    prepend-icon="mdi-auto-fix"
                    density="compact"
                    variant="tonal"
                    size="x-small"
                    rounded="md"
                    class="font-weight-bold px-2"
                    @click="openAutoPlanDialog"
                  >
                    自動編成
                  </v-btn>
                </div>
              </div>

              <!-- 7日間コンパクト・ストリップ -->
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
                      class="font-weight-black"
                      :class="day.day === '日' ? 'text-rose' : day.day === '土' ? 'text-cyan' : 'text-white'"
                      style="font-size: 0.7rem;"
                    >
                      {{ day.day }}
                    </span>
                    <span class="text-grey" style="font-size: 0.58rem;">
                      {{ day.dateStr.substring(8) }}
                    </span>
                  </div>

                  <!-- メニュー内容 -->
                  <div class="my-1.5">
                    <div
                      class="font-weight-bold line-clamp-2"
                      :class="day.targetDistance === 0 ? 'text-grey-darken-1' : 'text-white'"
                      style="font-size: 0.66rem; line-height: 1.2;"
                    >
                      {{ day.menuText }}
                    </div>
                  </div>

                  <!-- ステータスフッター -->
                  <div class="d-flex align-center justify-space-between" style="font-size: 0.6rem;">
                    <span v-if="day.isCleared" class="text-emerald font-weight-bold d-flex align-center">
                      <v-icon icon="mdi-check-circle" size="10" class="mr-0.5"></v-icon>
                      {{ day.actualDistance.toFixed(0) }}k
                    </span>
                    <span v-else-if="day.hasRun" class="text-cyan font-weight-bold">
                      {{ day.actualDistance.toFixed(1) }}k
                    </span>
                    <span v-else-if="day.targetDistance > 0" class="text-grey-darken-1">
                      予定 {{ day.targetDistance }}k
                    </span>
                    <span v-else class="text-grey-darken-2">
                      REST
                    </span>

                    <v-icon
                      v-if="hasCustomOverride(day.dateStr)"
                      color="secondary"
                      icon="mdi-circle-medium"
                      size="10"
                      title="カスタム設定済み"
                    ></v-icon>
                  </div>
                </div>
              </div>
            </div>

            <!-- Tile B2: 統合テレメトリチャート -->
            <div class="flex-grow-1 d-flex flex-column">
              <workout-chart
                :workouts="workouts"
                :target-goal="targetGoal"
                :height="240"
                class="flex-grow-1"
              ></workout-chart>
            </div>
          </v-col>

          <!-- 右カラム (lg="4"): アクティビティ履歴 ＆ シューズガレージ (切替コックピット) -->
          <v-col cols="12" lg="4" class="d-flex flex-column">
            <div class="bento-panel d-flex flex-column h-100">
              <!-- パネルヘッダー (タブスイッチャー) -->
              <div class="d-flex align-center justify-space-between mb-2 flex-wrap gap-1">
                <div class="right-panel-tabs d-flex gap-1">
                  <button
                    type="button"
                    class="right-tab-btn"
                    :class="{ active: rightPanelTab === 'history' }"
                    @click="rightPanelTab = 'history'"
                  >
                    <v-icon icon="mdi-history" size="14" class="mr-1"></v-icon>
                    ラン履歴 ({{ workouts.length }})
                  </button>
                  <button
                    type="button"
                    class="right-tab-btn"
                    :class="{ active: rightPanelTab === 'shoes' }"
                    @click="rightPanelTab = 'shoes'"
                  >
                    <v-icon icon="mdi-shoe-sneaker" size="14" class="mr-1"></v-icon>
                    シューズガレージ ({{ allShoes.length }})
                  </button>
                </div>

                <v-btn
                  v-if="isOwner && rightPanelTab === 'shoes'"
                  color="warning"
                  prepend-icon="mdi-plus"
                  density="compact"
                  variant="tonal"
                  size="x-small"
                  rounded="md"
                  class="font-weight-bold px-2"
                  @click="openShoeForm"
                >
                  追加
                </v-btn>
              </div>

              <!-- View 1: ラン履歴リスト -->
              <div v-if="rightPanelTab === 'history'" class="d-flex flex-column flex-grow-1 justify-space-between">
                <workout-table :workouts="workouts" class="flex-grow-1"></workout-table>

                <!-- 下部ミニ・シューズガレージ・プレビューバー -->
                <div
                  v-if="allShoes.length > 0"
                  class="shoe-quick-strip mt-2 px-2.5 py-1.5 rounded-lg d-flex align-center justify-space-between"
                  @click="rightPanelTab = 'shoes'"
                >
                  <div class="d-flex align-center overflow-hidden pr-2">
                    <ShoeIcon :name="allShoes[0].name" :category="allShoes[0].category" :size="32" class="mr-2 flex-shrink-0"></ShoeIcon>
                    <div class="overflow-hidden">
                      <div class="text-caption font-weight-bold text-white text-truncate" style="font-size: 0.7rem; line-height: 1.15;">
                        {{ allShoes[0].name }}
                      </div>
                      <div class="text-caption text-grey" style="font-size: 0.62rem;">
                        累計 {{ allShoes[0].distance.toFixed(0) }}km ({{ allShoes[0].runs }}回) ｜ 他 {{ Math.max(0, allShoes.length - 1) }}足
                      </div>
                    </div>
                  </div>
                  <div class="d-flex align-center flex-shrink-0 text-amber font-weight-bold" style="font-size: 0.66rem;">
                    <span>ガレージ</span>
                    <v-icon icon="mdi-chevron-right" size="14"></v-icon>
                  </div>
                </div>
              </div>

              <!-- View 2: シューズガレージ (コレクション＆寿命管理) -->
              <div v-else class="d-flex flex-column flex-grow-1">
                <div v-if="allShoes.length === 0" class="text-grey text-caption py-12 text-center">
                  <v-icon icon="mdi-shoe-sneaker" size="32" class="mb-2 text-grey-darken-2 d-block mx-auto"></v-icon>
                  シューズがまだ登録されていません。
                </div>
                <div v-else class="shoes-cockpit-grid flex-grow-1">
                  <div
                    v-for="shoe in allShoes"
                    :key="shoe.name"
                    class="shoe-cockpit-card pa-2.5 rounded-lg d-flex flex-column justify-space-between"
                  >
                    <div class="d-flex justify-space-between align-center">
                      <v-chip
                        size="x-small"
                        :color="shoe.color"
                        variant="flat"
                        class="font-weight-bold text-black px-1.5"
                        style="height: 15px; font-size: 0.58rem;"
                      >
                        {{ shoe.status }}
                      </v-chip>
                      <v-btn
                        v-if="isOwner && shoe.isCustom"
                        icon="mdi-delete-outline"
                        variant="text"
                        color="error"
                        density="compact"
                        size="x-small"
                        style="width: 16px; height: 16px;"
                        @click.stop="handleDeleteShoe(shoe.name)"
                      ></v-btn>
                    </div>

                    <div class="d-flex flex-column align-center text-center my-1">
                      <ShoeIcon :name="shoe.name" :category="shoe.category" :size="64" class="mb-1"></ShoeIcon>
                      <div class="text-caption font-weight-bold text-white line-clamp-2" style="font-size: 0.7rem; line-height: 1.2;">
                        {{ shoe.name }}
                      </div>
                    </div>

                    <div>
                      <div class="d-flex justify-space-between align-baseline mb-1">
                        <span class="font-outfit font-weight-black text-white" style="font-size: 0.9rem;">
                          {{ shoe.distance.toFixed(0) }}<span class="text-grey ml-0.5" style="font-size: 0.6rem;">km</span>
                        </span>
                        <span class="text-grey" style="font-size: 0.6rem;">{{ shoe.runs }}回出走</span>
                      </div>
                      <v-progress-linear
                        :model-value="shoe.lifePercent"
                        :color="shoe.color"
                        height="4"
                        rounded
                      ></v-progress-linear>
                    </div>
                  </div>
                </div>
              </div>
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
  </div>
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
    const rightPanelTab = ref('history')
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

    const upcomingRacesList = computed(() => {
      if (races.value.length === 0) return []
      const baseTime = new Date('2026-07-05').getTime()
      return races.value
        .filter(race => new Date(race.date).getTime() >= baseTime)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    })

    const upcomingRace = computed(() => {
      if (upcomingRacesList.value.length === 0) return null
      return upcomingRacesList.value[0]
    })

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

    const monthlyGoalDistance = computed(() => {
      if (targetGoal.value === 'sub4') return 150
      if (targetGoal.value === 'sub3.5') return 200
      return 300
    })

    const last30DaysDistance = computed(() => {
      if (workouts.value.length === 0) return 0
      const thirtyDaysAgo = new Date('2026-07-05')
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      return workouts.value
        .filter(w => {
          if (!w.workoutDate) return false
          const parts = w.workoutDate.split(/[\s\-:]/)
          const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10))
          return d >= thirtyDaysAgo
        })
        .reduce((sum, w) => sum + Number(w.distance || 0), 0)
    })

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

    const allShoes = computed(() => {
      const shoesMap = new Map()

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
          status = '摩耗注意'
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
          heading: `${race.name} あと${weeksRemaining}週 ｜ ${phaseName}`,
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
      rightPanelTab,
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
.cockpit-root {
  background:
    radial-gradient(circle at 15% 10%, rgba(99, 102, 241, 0.12) 0%, transparent 40%),
    radial-gradient(circle at 85% 15%, rgba(6, 182, 212, 0.1) 0%, transparent 40%),
    #090b12;
  color: #fff;
}

.cockpit-container {
  max-width: 1680px;
  margin: 0 auto;
}

/* Top Command Bar */
.cockpit-topbar {
  background: rgba(16, 19, 30, 0.85);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
}

.brand-badge {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: linear-gradient(135deg, #6366f1 0%, #06b6d4 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 14px rgba(99, 102, 241, 0.4);
}

.cockpit-tag {
  font-size: 0.58rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(99, 102, 241, 0.18);
  color: #a5b4fc;
  border: 1px solid rgba(99, 102, 241, 0.35);
}

.runner-pill {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 99px;
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.dot-online {
  background: #10b981;
  box-shadow: 0 0 8px #10b981;
}

.dot-demo {
  background: #f59e0b;
  box-shadow: 0 0 8px #f59e0b;
}

.phase-pill {
  background: rgba(6, 182, 212, 0.08);
  border: 1px solid rgba(6, 182, 212, 0.22);
  border-radius: 99px;
}

.goal-segment {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 9px;
  padding: 2px;
}

.goal-seg-btn {
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.7rem;
  font-weight: 800;
  padding: 3px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.goal-seg-btn.active {
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.4);
}

/* Bento Panels */
.bento-panel {
  background: linear-gradient(165deg, rgba(20, 23, 36, 0.92) 0%, rgba(13, 15, 24, 0.96) 100%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 12px 14px;
}

.cockpit-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  box-shadow: 0 0 8px currentColor;
}

.bg-amber { background-color: #f59e0b; color: #f59e0b; }
.bg-emerald { background-color: #10b981; color: #10b981; }
.text-amber { color: #fbbf24; }
.text-emerald { color: #34d399; }
.text-cyan { color: #22d3ee; }
.text-rose { color: #fb7185; }

/* Next Race Hero */
.next-race-hero {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.14) 0%, rgba(6, 182, 212, 0.08) 100%);
  border: 1px solid rgba(99, 102, 241, 0.28);
}

.countdown-box {
  border-left: 1px solid rgba(255, 255, 255, 0.1);
}

.race-compact-scroll {
  max-height: 76px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.race-mini-row {
  background: rgba(255, 255, 255, 0.025);
  border: 1px solid rgba(255, 255, 255, 0.04);
}

/* Weekly 7-Day Strip */
.weekly-progress-pill {
  background: rgba(16, 185, 129, 0.08);
  border: 1px solid rgba(16, 185, 129, 0.22);
}

.bento-week-strip {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 5px;
}

@media (max-width: 600px) {
  .bento-week-strip {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.bento-day-cell {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  padding: 7px 6px;
  min-height: 82px;
  transition: all 0.15s ease;
}

.bento-day-cell.day-editable {
  cursor: pointer;
}

.bento-day-cell.day-editable:hover {
  border-color: rgba(99, 102, 241, 0.45);
  background: rgba(99, 102, 241, 0.08);
  transform: translateY(-1px);
}

.bento-day-cell.day-cleared {
  background: rgba(16, 185, 129, 0.08);
  border-color: rgba(16, 185, 129, 0.35);
}

.bento-day-cell.day-quality {
  border-color: rgba(6, 182, 212, 0.3);
  background: rgba(6, 182, 212, 0.05);
}

.bento-day-cell.day-rest {
  opacity: 0.62;
}

/* Right Panel Switcher & Shoe Garage */
.right-panel-tabs {
  background: rgba(255, 255, 255, 0.04);
  padding: 3px;
  border-radius: 9px;
}

.right-tab-btn {
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.72rem;
  font-weight: 800;
  padding: 4px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  display: inline-flex;
  align-items: center;
}

.right-tab-btn.active {
  background: rgba(99, 102, 241, 0.25);
  color: #fff;
  box-shadow: inset 0 0 0 1px rgba(99, 102, 241, 0.45);
}

.shoe-quick-strip {
  background: rgba(245, 158, 11, 0.07);
  border: 1px solid rgba(245, 158, 11, 0.22);
  cursor: pointer;
  transition: all 0.15s ease;
}

.shoe-quick-strip:hover {
  background: rgba(245, 158, 11, 0.14);
  border-color: rgba(245, 158, 11, 0.4);
}

.shoes-cockpit-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(135px, 1fr));
  gap: 8px;
  max-height: 410px;
  overflow-y: auto;
  padding-right: 2px;
}

.shoe-cockpit-card {
  background: rgba(255, 255, 255, 0.025);
  border: 1px solid rgba(255, 255, 255, 0.07);
  transition: all 0.2s ease;
}

.shoe-cockpit-card:hover {
  border-color: rgba(245, 158, 11, 0.35);
  transform: translateY(-2px);
}

.gap-1 { gap: 4px; }
.gap-1\.5 { gap: 6px; }
.gap-2 { gap: 8px; }
.gap-2\.5 { gap: 10px; }
</style>
