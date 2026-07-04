<template>
  <v-app>
    <v-main>
      <NuxtPage />
    </v-main>
  </v-app>
</template>

<style>
/* グローバルフォントの適用 */
html, body, #__nuxt, .v-application {
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
