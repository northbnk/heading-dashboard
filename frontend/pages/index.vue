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
            <v-icon color="#2563EB" icon="mdi-check-decagram" size="15" class="mr-1.5"></v-icon>
            <span>Strava 連動ランニング分析プラットフォーム</span>
          </div>

          <h1 class="hero-heading mb-5">
            市民ランナーのための<br />
            <span class="hero-accent">科学的パフォーマンス分析</span>
          </h1>

          <p class="hero-lead mx-auto mb-9">
            独自のアカウント作成は不要。お使いの Strava アカウントと接続するだけで、推定VDOT・フルマラソン予測タイム・有酸素デカップリング（心肺ドリフト）・週間メニュー計画を1画面に可視化します。
          </p>

          <div class="d-flex flex-column flex-sm-row justify-center align-center gap-3 mb-14">
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
            <v-btn
              size="large"
              variant="outlined"
              rounded="xl"
              class="font-weight-bold px-7 py-3 demo-cta"
              prepend-icon="mdi-chart-box-outline"
              to="/athlete/21815751"
            >
              デモ（藤野さんのデータ）を見る
            </v-btn>
          </div>

          <v-row class="justify-center">
            <v-col cols="12" md="4">
              <div class="feature-card pa-6 text-left h-100">
                <div class="feature-icon mb-4">
                  <v-icon color="#2563EB" icon="mdi-heart-pulse" size="24"></v-icon>
                </div>
                <div class="feature-title mb-2">有酸素スタミナ判定</div>
                <div class="feature-desc">
                  15km以上の距離走から後半の心拍ドリフト（デカップリング率）を自動抽出し、30km以降の失速リスクを科学的に診断します。
                </div>
              </div>
            </v-col>
            <v-col cols="12" md="4">
              <div class="feature-card pa-6 text-left h-100">
                <div class="feature-icon mb-4">
                  <v-icon color="#2563EB" icon="mdi-chart-line-variant" size="24"></v-icon>
                </div>
                <div class="feature-title mb-2">リアルタイム推定VDOT</div>
                <div class="feature-desc">
                  直近40日間の走力トレンドから推定VDOT値とフルマラソン予測タイムを算出し、目標（サブ3 / サブ3.5 / サブ4）とのギャップを可視化します。
                </div>
              </div>
            </v-col>
            <v-col cols="12" md="4">
              <div class="feature-card pa-6 text-left h-100">
                <div class="feature-icon mb-4">
                  <v-icon color="#2563EB" icon="mdi-calendar-check-outline" size="24"></v-icon>
                </div>
                <div class="feature-title mb-2">期分け連動の週間プラン</div>
                <div class="feature-desc">
                  ターゲット大会までの残り日数（鍛錬期・実戦強化期・テーパリング期）に応じた最適な週間トレーニング計画を提案・管理します。
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
  background: #F4F6F9;
  color: #0F172A;
}

.landing-header {
  background: #FFFFFF;
  border-bottom: 1px solid #E2E8F0;
}

.brand-badge {
  width: 32px;
  height: 32px;
  border-radius: 9px;
  background: #0F172A;
  display: flex;
  align-items: center;
  justify-content: center;
}

.brand-title {
  font-size: 1.05rem;
  font-weight: 800;
  color: #0F172A;
  letter-spacing: -0.02em;
}

.brand-sub {
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748B;
}

.max-width-container {
  max-width: 1080px;
}

.eyebrow-pill {
  background: #EFF6FF;
  border: 1px solid #BFDBFE;
  border-radius: 99px;
  font-size: 0.76rem;
  font-weight: 700;
  color: #1D4ED8;
}

.hero-heading {
  font-size: clamp(2rem, 4.5vw, 3.1rem);
  font-weight: 800;
  line-height: 1.2;
  letter-spacing: -0.03em;
  color: #0F172A;
}

.hero-accent {
  color: #2563EB;
}

.hero-lead {
  max-width: 640px;
  font-size: 1rem;
  line-height: 1.75;
  color: #475569;
}

.strava-cta {
  background: #FC4C02 !important;
}

.demo-cta {
  border-color: #CBD5E1 !important;
  color: #0F172A !important;
  background: #FFFFFF !important;
}

.feature-card {
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.03), 0 4px 12px rgba(15, 23, 42, 0.02);
}

.feature-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: #EFF6FF;
  display: flex;
  align-items: center;
  justify-content: center;
}

.feature-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: #0F172A;
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
