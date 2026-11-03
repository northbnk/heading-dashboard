<template>
  <v-app>
    <v-main>
      <NuxtPage />
    </v-main>
  </v-app>
</template>

<style>
/* 洗練されたエディトリアル＆アスレチック・タイポグラフィ */
html, body, #__nuxt, .v-application {
  font-family: 'Plus Jakarta Sans', 'Noto Sans JP', -apple-system, BlinkMacSystemFont, 'Hiragino Sans', sans-serif !important;
  background-color: #F4F6F9 !important;
  color: #0F172A !important;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  letter-spacing: -0.01em;
}

.font-num {
  font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif !important;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.025em;
}

.font-mono-num {
  font-family: 'JetBrains Mono', monospace !important;
  font-variant-numeric: tabular-nums;
}

/* スクロールバー (ライトテーマ仕様) */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: #F1F5F9;
}
::-webkit-scrollbar-thumb {
  background: #CBD5E1;
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
  background: #94A3B8;
}
</style>
