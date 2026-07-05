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
            v-if="!user"
            color="primary"
            variant="flat"
            rounded="lg"
            class="font-weight-bold px-4 text-black"
            prepend-icon="mdi-login"
            @click="openAuthDialog"
          >
            ログイン / 新規登録
          </v-btn>
          <v-btn
            v-else
            color="error"
            variant="outlined"
            rounded="lg"
            class="font-weight-bold px-4"
            prepend-icon="mdi-logout"
            @click="handleLogout"
          >
            ログアウト
          </v-btn>
        </div>
      </div>
    </v-app-bar>

    <v-main class="pt-16">
      <v-container class="py-10 max-width-container">
        <!-- 未ログイン時のメイン紹介ヒーロー -->
        <div v-if="!user" class="text-center py-10">
          <div class="d-inline-flex align-center px-4 py-1 rounded-full border border-primary-darken-3 mb-6 bg-surface-variant" style="border-radius: 99px; background: rgba(99, 102, 241, 0.05) !important;">
            <v-icon color="primary" icon="mdi-sparkles" size="14" class="mr-2"></v-icon>
            <span class="text-caption font-weight-bold text-primary">Supabase & Strava 統合マルチアスリート版</span>
          </div>

          <h1 class="text-h3 text-sm-h2 font-weight-black font-outfit text-white mb-6 leading-tight">
            市民ランナーのための<br>
            <span class="text-gradient">高度有酸素パフォーマンス分析</span>
          </h1>

          <p class="text-body-1 text-grey-lighten-1 max-w-xl mx-auto mb-10">
            StravaのGPSと心拍データから自動で心肺ドリフト（有酸素デカップリング）、推定VDOT、シューズ寿命とペース走行効率を精密に診断するアスリート専用の解析ダッシュボード。
          </p>

          <div class="d-flex flex-column flex-sm-row justify-center align-center gap-4 mb-16">
            <v-btn
              color="primary"
              size="large"
              variant="flat"
              rounded="xl"
              class="font-weight-black text-black px-8 font-outfit text-subtitle-1 py-4"
              prepend-icon="mdi-account-plus"
              @click="openAuthDialog"
            >
              今すぐ無料で始める
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

        <!-- ログイン済みだがStrava未設定時のセットアップ誘導画面 -->
        <div v-else class="py-10 text-center">
          <v-card class="setup-card pa-8 max-w-md mx-auto" elevation="8">
            <v-avatar color="rgba(249, 115, 22, 0.1)" size="72" class="mb-4">
              <v-icon color="orange-darken-3" icon="mdi-swap-horizontal" size="36"></v-icon>
            </v-avatar>
            
            <h2 class="text-h5 font-weight-bold text-white mb-3">ログイン完了しました！</h2>
            <p class="text-body-2 text-grey-lighten-1 mb-8">
              登録したアカウント：<strong>{{ user.email }}</strong><br><br>
              ダッシュボードにデータを表示するには、あなたのStravaアカウントとこのハブを連携する必要があります。以下のボタンから連携を完了してください。
            </p>

            <div class="d-flex flex-column gap-3">
              <v-btn
                color="orange-darken-3"
                size="large"
                variant="flat"
                rounded="lg"
                class="font-weight-bold text-white"
                prepend-icon="mdi-swap-horizontal"
                :href="`/api/auth/strava/connect?token=${sessionToken}`"
              >
                Stravaアカウントと連携する
              </v-btn>
              <v-btn
                color="grey-darken-3"
                variant="flat"
                rounded="lg"
                class="font-weight-bold mt-2"
                prepend-icon="mdi-logout"
                @click="handleLogout"
              >
                ログアウト
              </v-btn>
            </div>
          </v-card>
        </div>
      </v-container>
    </v-main>

    <!-- ログイン・新規登録ダイアログ -->
    <v-dialog v-model="authDialog" max-width="420" persistent>
      <v-card class="auth-dialog pa-6 rounded-xl border border-grey-darken-3" style="background: #11131e;">
        <div class="text-h6 font-weight-bold text-white text-center mb-6 font-outfit">
          {{ isSignUp ? '新規アカウント登録' : '管理者 / ランナーログイン' }}
        </div>
        
        <v-alert v-if="authError" type="error" variant="tonal" density="compact" class="mb-4 text-caption">
          {{ authError }}
        </v-alert>

        <v-form @submit.prevent="handleAuth">
          <v-text-field
            v-model="email"
            label="メールアドレス"
            type="email"
            variant="outlined"
            density="comfortable"
            color="primary"
            class="mb-3"
            required
            prepend-inner-icon="mdi-email-outline"
          ></v-text-field>

          <v-text-field
            v-model="password"
            label="パスワード"
            type="password"
            variant="outlined"
            density="comfortable"
            color="primary"
            class="mb-4"
            required
            prepend-inner-icon="mdi-lock-outline"
          ></v-text-field>

          <v-btn
            type="submit"
            color="primary"
            variant="flat"
            rounded="lg"
            block
            class="font-weight-bold text-black py-4 mb-4"
            :loading="authLoading"
          >
            {{ isSignUp ? '登録する' : 'ログイン' }}
          </v-btn>
        </v-form>

        <div class="text-center text-caption text-grey">
          {{ isSignUp ? 'すでにアカウントをお持ちですか？' : 'アカウントを新規作成しますか？' }}
          <a href="#" class="text-primary font-weight-bold ml-1" @click.prevent="isSignUp = !isSignUp">
            {{ isSignUp ? 'ログインはこちら' : '新規登録はこちら' }}
          </a>
        </div>

        <v-divider class="my-4" style="opacity: 0.1"></v-divider>

        <v-btn
          color="grey-darken-3"
          variant="flat"
          rounded="lg"
          block
          class="font-weight-bold text-white"
          prepend-icon="mdi-close"
          @click="authDialog = false"
        >
          閉じる
        </v-btn>
      </v-card>
    </v-dialog>
  </v-app>
</template>

<script>
import { ref, onMounted } from 'vue'

export default {
  name: 'LandingPage',
  setup() {
    const { $supabase } = useNuxtApp()
    
    const user = ref(null)
    const sessionToken = ref('')
    const authDialog = ref(false)
    const isSignUp = ref(false)
    const email = ref('')
    const password = ref('')
    const authLoading = ref(false)
    const authError = ref('')

    // ログイン状態とリダイレクト確認
    const checkUserSession = async () => {
      if (!$supabase) return
      
      const { data: { session } } = await $supabase.auth.getSession()
      if (session) {
        user.value = session.user
        sessionToken.value = session.access_token

        // すでにログインしている場合は、Strava連携状況をチェックしてリダイレクト
        try {
          const res = await fetch('/api/auth/strava/status', {
            headers: {
              'Authorization': `Bearer ${session.access_token}`
            }
          })
          if (res.ok) {
            const status = await res.json()
            if (status.linked && status.athlete?.id) {
              // 自身の個別アスリートURLへ自動ジャンプ！
              navigateTo(`/athlete/${status.athlete.id}`)
            }
          }
        } catch (err) {
          console.error('Failed to retrieve Strava status on landing:', err)
        }
      } else {
        user.value = null
        sessionToken.value = ''
      }
    }

    onMounted(() => {
      checkUserSession()

      // セッション状態の変化を監視
      if ($supabase) {
        $supabase.auth.onAuthStateChange((event, session) => {
          if (session) {
            user.value = session.user
            sessionToken.value = session.access_token
            checkUserSession()
          } else {
            user.value = null
            sessionToken.value = ''
          }
        })
      }
    })

    const openAuthDialog = () => {
      authError.value = ''
      authDialog.value = true
    }

    // 認証処理（サインイン / サインアップ）
    const handleAuth = async () => {
      if (!$supabase) {
        authError.value = 'Supabaseが初期化されていません。.envファイルを確認してください。'
        return
      }

      authLoading.value = true
      authError.value = ''

      try {
        if (isSignUp.value) {
          // サインアップ
          const { data, error } = await $supabase.auth.signUp({
            email: email.value,
            password: password.value
          })
          if (error) throw error
          alert('アカウント登録が完了しました！ログインしてください。')
          isSignUp.value = false
        } else {
          // サインイン
          const { data, error } = await $supabase.auth.signInWithPassword({
            email: email.value,
            password: password.value
          })
          if (error) throw error
          authDialog.value = false
          checkUserSession()
        }
      } catch (err) {
        authError.value = err.message || '認証エラーが発生しました。'
      } finally {
        authLoading.value = false
      }
    }

    // ログアウト
    const handleLogout = async () => {
      if (!$supabase) return
      await $supabase.auth.signOut()
      user.value = null
      sessionToken.value = ''
      navigateTo('/')
    }

    return {
      user,
      sessionToken,
      authDialog,
      isSignUp,
      email,
      password,
      authLoading,
      authError,
      openAuthDialog,
      handleAuth,
      handleLogout
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

.setup-card {
  background: rgba(25, 28, 41, 0.6);
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 28px !important;
}

.auth-dialog {
  border-radius: 28px !important;
}
</style>
