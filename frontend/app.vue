<template>
  <v-app>
    <v-main>
      <NuxtPage />
    </v-main>
  </v-app>
</template>

<style>
/* Inter × IBM Plex Sans JP によるシャープで都会的なUIタイポグラフィ */
html, body, #__nuxt, .v-application {
  font-family: 'Inter', 'IBM Plex Sans JP', -apple-system, BlinkMacSystemFont, 'Hiragino Sans', sans-serif !important;
  font-feature-settings: 'cv02', 'cv03', 'cv04', 'cv11';
  background-color: #F4F6F9 !important;
  color: #0F172A !important;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  letter-spacing: -0.012em;
}

.font-num {
  font-family: 'Inter', 'IBM Plex Sans JP', -apple-system, BlinkMacSystemFont, sans-serif !important;
  font-variant-numeric: tabular-nums;
  font-feature-settings: 'tnum', 'cv02', 'cv03', 'cv04', 'cv11';
  letter-spacing: -0.03em;
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
