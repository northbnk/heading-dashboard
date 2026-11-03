/**
 * アスリート心拍設定定数 (Banister TRIMP 算出用)
 *
 * センサーのスパイクノイズ等で過去の全履歴から動的に最大心拍数を取得すると
 * TRIMPの計算根拠がブレるため、実測値ベースの固定定数として定義します。
 * 環境変数 (NUXT_PUBLIC_REST_HR / NUXT_PUBLIC_MAX_HR) が設定されている場合はそちらを優先します。
 */
export const DEFAULT_ATHLETE_HR_CONFIG = Object.freeze({
  restHr: 52, // 安静時心拍数 (bpm)
  maxHr: 188  // 最大心拍数 (bpm)
})

export function getAthleteHrConfig(runtimePublicConfig = null) {
  const envRest = Number(runtimePublicConfig?.restHr)
  const envMax = Number(runtimePublicConfig?.maxHr)

  const restHr = !Number.isNaN(envRest) && envRest >= 30 && envRest <= 100
    ? envRest
    : DEFAULT_ATHLETE_HR_CONFIG.restHr

  const maxHr = !Number.isNaN(envMax) && envMax >= 140 && envMax <= 230
    ? envMax
    : DEFAULT_ATHLETE_HR_CONFIG.maxHr

  return { restHr, maxHr }
}
