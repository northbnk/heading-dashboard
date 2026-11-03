<template>
  <div class="landing-root min-h-screen d-flex flex-column">
    <!-- ヘッダー -->
    <header class="landing-header px-6 py-4 d-flex align-center justify-space-between">
      <div class="d-flex align-center">
        <div class="brand-badge mr-2.5">
          <v-icon color="white" icon="mdi-sine-wave" size="18"></v-icon>
        </div>
        <span class="brand-title">HEADING 330</span>
        <span class="brand-sub ml-2">Training Hub</span>
      </div>

      <div>
        <v-btn
          v-if="isLoggedIn && athleteId"
          color="primary"
          variant="flat"
          rounded="lg"
          class="font-weight-bold px-4 text-white"
          prepend-icon="mdi-view-dashboard-outline"
          :to="`/athlete/${athleteId}`"
        >
          マイダッシュボードへ
        </v-btn>
      </div>
    </header>

    <!-- メインヒーロー -->
    <main class="flex-grow-1 d-flex align-center">
      <v-container class="py-12 max-width-container">
        <div class="text-center">
          <div class="eyebrow-pill d-inline-flex align-center px-3.5 py-1 mb-6">
            <v-icon color="#3653B3" icon="mdi-check-decagram" size="15" class="mr-1.5"></v-icon>
            <span>Strava 連動ランニング分析プラットフォーム</span>
          </div>

          <h1 class="hero-heading mb-5">
            市民ランナーのための<br />
            <span class="hero-accent">科学的パフォーマンス分析</span>
          </h1>

          <p class="hero-lead mx-auto mb-9">
            独自のアカウント作成は不要。お使いの Strava アカウントと接続するだけで、Banister TRIMP に基づく CTL・ATL・TSB（PMCチャート）、Riegelの法則による完走予測タイム、時間分割（0-50% / 51-100%）の心肺ドリフト率を1画面に可視化します。
          </p>

          <div class="d-flex justify-center align-center mb-14">
            <v-btn
              size="large"
              variant="flat"
              rounded="xl"
              class="font-weight-bold text-white px-7 py-3 strava-cta"
              prepend-icon="mdi-swap-horizontal"
              href="/api/auth/strava/connect"
            >
              Stravaでログイン・連携
            </v-btn>
          </div>

          <v-row class="justify-center">
            <v-col cols="12" md="4">
              <div class="feature-card pa-6 text-left h-100">
                <div class="feature-icon mb-4">
                  <v-icon color="#3653B3" icon="mdi-chart-bell-curve-cumulative" size="24"></v-icon>
                </div>
                <div class="feature-title mb-2">PMC (CTL / ATL / TSB) 管理</div>
                <div class="feature-desc">
                  Banister TRIMP から 42日EMA（CTL: 体力）・7日EMA（ATL: 疲労）・前日差（TSB: コンディション）を算出し、ピーキングの波を可視化します。
                </div>
              </div>
            </v-col>
            <v-col cols="12" md="4">
              <div class="feature-card pa-6 text-left h-100">
                <div class="feature-icon mb-4">
                  <v-icon color="#3653B3" icon="mdi-timer-check-outline" size="24"></v-icon>
                </div>
                <div class="feature-title mb-2">Riegelの法則 完走予測</div>
                <div class="feature-desc">
                  直近42日間の10km以上のベストエフォート走から Riegelの法則（T2 = T1 × (D2/D1)^1.06）に基づきフルマラソン等の予測タイムを算出します。
                </div>
              </div>
            </v-col>
            <v-col cols="12" md="4">
              <div class="feature-card pa-6 text-left h-100">
                <div class="feature-icon mb-4">
                  <v-icon color="#3653B3" icon="mdi-heart-pulse" size="24"></v-icon>
                </div>
                <div class="feature-title mb-2">時間分割 心肺ドリフト解析</div>
                <div class="feature-desc">
                  アクティビティを時間ベースで前半（0〜50%）と後半（51〜100%）に分割し、Efficiency Factor (EF) の低下率から有酸素持久力を定量評価します。
                </div>
              </div>
            </v-col>
          </v-row>
        </div>
      </v-container>
    </main>
  </div>
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
.landing-root {
  background: #E5E9F0;
  color: #1E293B;
}

.landing-header {
  background: #F2F4F8;
  border-bottom: 1px solid #D5DBE3;
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
  font-size: 0.75rem;
  font-weight: 600;
  color: #526071;
}

.max-width-container {
  max-width: 1080px;
}

.eyebrow-pill {
  background: #E4EAF5;
  border: 1px solid #C5D1E8;
  border-radius: 99px;
  font-size: 0.76rem;
  font-weight: 700;
  color: #2B4494;
}

.hero-heading {
  font-size: clamp(2rem, 4.5vw, 3.1rem);
  font-weight: 800;
  line-height: 1.2;
  letter-spacing: -0.03em;
  color: #1E293B;
}

.hero-accent {
  color: #3653B3;
}

.hero-lead {
  max-width: 640px;
  font-size: 1rem;
  line-height: 1.75;
  color: #475569;
}

.strava-cta {
  background: #D9480F !important;
}

.feature-card {
  background: #F2F4F8;
  border: 1px solid #D5DBE3;
  border-radius: 16px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}

.feature-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: #E4EAF5;
  display: flex;
  align-items: center;
  justify-content: center;
}

.feature-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: #1E293B;
}

.feature-desc {
  font-size: 0.86rem;
  line-height: 1.65;
  color: #475569;
}

.gap-3 {
  gap: 12px;
}
</style>
