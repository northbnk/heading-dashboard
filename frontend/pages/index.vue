<template>
  <v-app theme="dark" class="landing-bg">
    <!-- ヘッダー -->
    <v-app-bar flat class="app-bar border-b border-grey-darken-4 px-3 px-sm-6" style="background: rgba(10, 12, 22, 0.8) !important; backdrop-filter: blur(12px);">
      <div class="d-flex align-center w-100 justify-space-between">
        <div class="text-h6 font-weight-black text-white d-flex align-center font-outfit tracking-wider">
          <v-icon color="primary" icon="mdi-sine-wave" class="mr-2" size="28"></v-icon>
          HEADING 330 <span class="text-caption text-primary ml-2 font-weight-bold">Training Hub</span>
        </div>
        
        <div>
          <v-btn
            v-if="isLoggedIn && athleteId"
            color="primary"
            variant="flat"
            rounded="lg"
            class="font-weight-bold px-4 text-black"
            prepend-icon="mdi-view-dashboard"
            :to="`/athlete/${athleteId}`"
          >
            マイダッシュボードへ
          </v-btn>
        </div>
      </div>
    </v-app-bar>

    <v-main class="pt-16">
      <v-container class="py-10 max-width-container">
        <!-- メイン紹介ヒーロー -->
        <div class="text-center py-10">
          <div class="d-inline-flex align-center px-4 py-1 rounded-full border border-primary-darken-3 mb-6 bg-surface-variant" style="border-radius: 99px; background: rgba(99, 102, 241, 0.05) !important;">
            <v-icon color="primary" icon="mdi-sparkles" size="14" class="mr-2"></v-icon>
            <span class="text-caption font-weight-bold text-primary">Strava アカウントID連動ダッシュボード</span>
          </div>

          <h1 class="text-h3 text-sm-h2 font-weight-black font-outfit text-white mb-6 leading-tight">
            市民ランナーのための<br>
            <span class="text-gradient">高度有酸素パフォーマンス分析</span>
          </h1>

          <p class="text-body-1 text-grey-lighten-1 max-w-xl mx-auto mb-10">
            ダッシュボード独自のアカウント登録は一切不要。お使いの Strava アカウントと接続するだけで、心肺ドリフト（有酸素デカップリング）、推定VDOT、シューズ寿命とペース走行効率を自動で分析します。
          </p>

          <div class="d-flex flex-column flex-sm-row justify-center align-center gap-4 mb-16">
            <v-btn
              color="orange-darken-3"
              size="large"
              variant="flat"
              rounded="xl"
              class="font-weight-black text-white px-8 font-outfit text-subtitle-1 py-4"
              style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%) !important;"
              prepend-icon="mdi-swap-horizontal"
              href="/api/auth/strava/connect"
            >
              Stravaでログイン・ダッシュボード作成
            </v-btn>
            <v-btn
              color="white"
              size="large"
              variant="outlined"
              rounded="xl"
              class="font-weight-bold px-8 text-white text-subtitle-1 py-4 border-grey-lighten-1"
              prepend-icon="mdi-account-search"
              to="/athlete/21815751"
            >
              デモ（藤野さんのデータ）を見る
            </v-btn>
          </div>

          <!-- 機能特徴プレビューカード -->
          <v-row class="mt-8 justify-center">
            <v-col cols="12" md="4">
              <v-card class="feature-card pa-6 text-center" elevation="4">
                <v-avatar color="rgba(99, 102, 241, 0.1)" size="64" class="mb-4">
                  <v-icon color="primary" icon="mdi-heart-pulse" size="32"></v-icon>
                </v-avatar>
                <div class="text-h6 font-weight-bold text-white mb-2">有酸素スタミナ判定</div>
                <div class="text-body-2 text-grey-lighten-2">
                  15km以上の長距離練習から心拍ドリフト（デカップリング）を自動抽出し、レース後半のスタミナ不足や失速リスクを科学的に診断します。
                </div>
              </v-card>
            </v-col>
            <v-col cols="12" md="4">
              <v-card class="feature-card pa-6 text-center" elevation="4">
                <v-avatar color="rgba(16, 185, 129, 0.1)" size="64" class="mb-4">
                  <v-icon color="success" icon="mdi-chart-bell-curve-cumulative" size="32"></v-icon>
                </v-avatar>
                <div class="text-h6 font-weight-bold text-white mb-2">リアルタイム推定VDOT</div>
                <div class="text-body-2 text-grey-lighten-2">
                  直近の走力から現在の推定VDOT値とフルマラソン予測タイムを動的算出。設定目標（サブ3.5など）に対する現在のギャップを可視化します。
                </div>
              </v-card>
            </v-col>
            <v-col cols="12" md="4">
              <v-card class="feature-card pa-6 text-center" elevation="4">
                <v-avatar color="rgba(245, 158, 11, 0.1)" size="64" class="mb-4">
                  <v-icon color="warning" icon="mdi-shoe-run" size="32"></v-icon>
                </v-avatar>
                <div class="text-h6 font-weight-bold text-white mb-2">シューズ寿命 ＆ 燃費管理</div>
                <div class="text-body-2 text-grey-lighten-2">
                  使用シューズごとの走行距離を自動集計し、寿命警告をお知らせ。さらにシューズごとの平均ペースと心拍数から「最も走力効率の高いシューズ」を判定します。
                </div>
              </v-card>
            </v-col>
          </v-row>
        </div>
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
import { ref, onMounted } from 'vue'

export default {
  name: 'LandingPage',
  setup() {
    const isLoggedIn = ref(false)
    const athleteId = ref(null)

    const checkUserSession = async () => {
      try {
        const res = await fetch('/api/auth/strava/status')
        if (res.ok) {
          const status = await res.json()
          if (status.linked && status.athlete?.id) {
            isLoggedIn.value = true
            athleteId.value = status.athlete.id
            // すでにログインしている場合は自動リダイレクト
            navigateTo(`/athlete/${status.athlete.id}`)
          }
        }
      } catch (err) {
        console.error('Failed to retrieve Strava status on landing:', err)
      }
    }

    onMounted(() => {
      checkUserSession()
    })

    return {
      isLoggedIn,
      athleteId
    }
  }
}
</script>

<style scoped>
.landing-bg {
  background: radial-gradient(circle at top, #141728 0%, #0a0c16 100%) !important;
  min-height: 100vh;
}

.max-width-container {
  max-width: 1100px;
}

.text-gradient {
  background: linear-gradient(135deg, #8b5cf6 0%, #3b82f6 50%, #06b6d4 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.feature-card {
  background: rgba(25, 28, 41, 0.4);
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 24px !important;
  transition: all 0.35s cubic-bezier(0.25, 0.8, 0.25, 1);
  min-height: 250px;
}

.feature-card:hover {
  transform: translateY(-8px);
  border-color: rgba(99, 102, 241, 0.3);
  box-shadow: 0 15px 40px 0 rgba(99, 102, 241, 0.08) !important;
}
</style>
