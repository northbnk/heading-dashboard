<template>
  <v-app>
    <v-main>
      <dashboard-view />
    </v-main>
  </v-app>
</template>

<script setup>
import DashboardView from './views/DashboardView.vue'
</script>

<style>
/* グローバルフォントの適用 */
html, body, #app, .v-application {
  font-family: 'Outfit', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif !important;
  background-color: #0F111A !important;
}

/* グローバルスクロールバーのカスタマイズ */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: #0F111A;
}
::-webkit-scrollbar-thumb {
  background: #25283C;
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
  background: #6366F1;
}
</style>
