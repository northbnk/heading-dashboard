<template>
  <v-app>
    <v-main>
      <NuxtPage />
    </v-main>
  </v-app>
</template>

<style>
/* Inter × IBM Plex Sans JP ＋ 眩しさを抑えたマット・ライトテーマ */
html, body, #__nuxt, .v-application {
  font-family: 'Inter', 'IBM Plex Sans JP', -apple-system, BlinkMacSystemFont, 'Hiragino Sans', sans-serif !important;
  font-feature-settings: 'cv02', 'cv03', 'cv04', 'cv11';
  background-color: #E5E9F0 !important;
  color: #1E293B !important;
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

/* スクロールバー (マット・ライトテーマ仕様) */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: #E5E9F0;
}
::-webkit-scrollbar-thumb {
  background: #B8C2CC;
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
  background: #8795A1;
}
</style>
