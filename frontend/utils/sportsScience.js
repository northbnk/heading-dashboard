/**
 * ランニングダッシュボード スポーツ科学コアアルゴリズム
 *
 * AIの独自解釈や近似式を排し、指定された8つのスポーツ科学数式・手順に完全準拠した純粋関数群。
 *
 * [Phase 1 実装指標]
 *  1. 予測完走タイム (Riegelの法則): T2 = T1 * (D2 / D1)^1.06
 *  2. 心肺ドリフト (Aerobic Decoupling): 時間ベース前半(0-50%)・後半(51-100%)のEF低下率 (%)
 *  3. TRIMP (Banister男性版): duration_min * HRR_ratio * 0.64 * exp(1.92 * HRR_ratio)
 *  4. TSB / CTL / ATL: CTL(42日EMA: 2/43), ATL(7日EMA: 2/8), TSB_today = CTL_yesterday - ATL_yesterday
 *
 * [Phase 2 追加実装指標]
 *  5. EF (Efficiency Factor / 効率係数): EF = 平均スピード(m/min) / 平均心拍数(bpm) ＋ ラップ/区間別時系列EF配列
 *  6. Pace / HR 比 (ペース・心拍比の推移): 速度 / 平均心拍数 の日次・週次・月次トレンド集計
 *  7. 安静時心拍数 (RHR) トレンド: 昇順RHR配列 ＋ 直近7日間移動平均 ＋ 要疲労注意フラグ (+3bpm以上)
 *  8. ピッチ (SPM) 安定度: 時間ベース前半(0-50%)・後半(51-100%)分割による (SPM_second / SPM_first) * 100
 */

import { DEFAULT_ATHLETE_HR_CONFIG } from '~/config/athleteSettings'

/**
 * 日付文字列 ("YYYY-MM-DD HH:mm:ss" または "YYYY-MM-DD") をローカルDateに変換
 */
export function parseWorkoutLocalDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return new Date(0)
  const parts = dateStr.trim().split(/[\sT\-:]/)
  if (parts.length < 3) return new Date(0)
  const year = parseInt(parts[0], 10)
  const month = parseInt(parts[1], 10) - 1
  const day = parseInt(parts[2], 10)
  const hour = parts[3] ? parseInt(parts[3], 10) : 0
  const minute = parts[4] ? parseInt(parts[4], 10) : 0
  const second = parts[5] ? parseInt(parts[5], 10) : 0
  return new Date(year, month, day, hour, minute, second)
}

/**
 * Dateオブジェクトを "YYYY-MM-DD" 形式にフォーマット
 */
export function formatDateYMD(dateObj) {
  const yyyy = dateObj.getFullYear()
  const mm = String(dateObj.getMonth() + 1).padStart(2, '0')
  const dd = String(dateObj.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

/**
 * 秒数を "H:MM:SS" 形式にフォーマット
 */
export function formatSecondsToHMS(totalSeconds) {
  if (totalSeconds === null || totalSeconds === undefined || Number.isNaN(totalSeconds) || totalSeconds <= 0) {
    return '--:--:--'
  }
  const rounded = Math.round(totalSeconds)
  const hrs = Math.floor(rounded / 3600)
  const mins = Math.floor((rounded % 3600) / 60)
  const secs = rounded % 60
  return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

/**
 * トラッキング配列が累積値か区間差分値かを判定し、区間差分 (dt, dd) と経過時間 (startTime, endTime) に正規化する内部ヘルパー
 */
function normalizeTimeAndDistanceSegments(trackingData) {
  let isCumulative = trackingData.length >= 3
  for (let i = 1; i < trackingData.length; i++) {
    if (
      Number(trackingData[i].time_s) <= Number(trackingData[i - 1].time_s) ||
      Number(trackingData[i].distance_m) < Number(trackingData[i - 1].distance_m)
    ) {
      isCumulative = false
      break
    }
  }
  if (isCumulative) {
    const firstDist = Number(trackingData[0].distance_m)
    const lastDist = Number(trackingData[trackingData.length - 1].distance_m)
    if (lastDist < firstDist * 1.5) {
      isCumulative = false
    }
  }

  const segments = []
  let runningTime = 0

  for (let i = 0; i < trackingData.length; i++) {
    const rawTime = Number(trackingData[i].time_s)
    const rawDist = Number(trackingData[i].distance_m)

    let dt = rawTime
    let dd = rawDist
    if (isCumulative) {
      dt = i === 0 ? rawTime : rawTime - Number(trackingData[i - 1].time_s)
      dd = i === 0 ? rawDist : rawDist - Number(trackingData[i - 1].distance_m)
    }

    if (dt <= 0) continue

    const startTime = runningTime
    runningTime += dt
    const endTime = runningTime

    segments.push({
      ...trackingData[i],
      index: i + 1,
      time_s: dt,
      distance_m: dd,
      startTime,
      endTime
    })
  }

  return { segments, totalTimeS: runningTime }
}

/**
 * ============================================================================
 * 1. 予測完走タイム (Riegelの法則)
 * ============================================================================
 * - 入力: distance_m (今回の走行距離/メートル), time_s (今回の走行時間/秒), target_distance_m (予測したい目標距離/メートル)
 * - 出力: 予測タイム (秒)
 * - 計算式: T2 = T1 * (D2 / D1)^1.06
 *   T1 = time_s, D1 = distance_m, D2 = target_distance_m
 * - 要件: 距離が0以下の場合は null を返すこと。
 */
export function calculateRiegelTime(distance_m, time_s, target_distance_m) {
  const D1 = Number(distance_m)
  const T1 = Number(time_s)
  const D2 = Number(target_distance_m)

  if (
    Number.isNaN(D1) ||
    Number.isNaN(T1) ||
    Number.isNaN(D2) ||
    D1 <= 0 ||
    T1 <= 0 ||
    D2 <= 0
  ) {
    return null
  }

  return T1 * Math.pow(D2 / D1, 1.06)
}

/**
 * 直近42日間（6週間）の中で「10km以上かつ最も予測タイムが速くなる（ベストエフォートの）ラン」を基準に
 * Riegelの法則で目標距離の予測タイムを算出する。
 */
export function findBestRiegelPrediction(workouts, referenceDate = new Date(), targetDistanceM = 42195, windowDays = 42, minDistanceM = 10000) {
  if (!Array.isArray(workouts) || workouts.length === 0) return null

  const refEnd = new Date(referenceDate.getTime())
  refEnd.setHours(23, 59, 59, 999)

  const windowStart = new Date(refEnd.getTime())
  windowStart.setDate(windowStart.getDate() - windowDays)
  windowStart.setHours(0, 0, 0, 0)

  const candidates = []

  for (const w of workouts) {
    const d = parseWorkoutLocalDate(w.workoutDate)
    if (d < windowStart || d > refEnd) continue

    const distanceM = Number(w.distance || 0) * 1000
    const timeS = Number(w.movingTimeSeconds || w.durationSeconds || 0)

    if (distanceM < minDistanceM || timeS <= 0) continue

    const predictedSeconds = calculateRiegelTime(distanceM, timeS, targetDistanceM)
    if (predictedSeconds !== null && predictedSeconds > 0) {
      candidates.push({
        workout: w,
        distanceM,
        distanceKm: distanceM / 1000,
        timeS,
        workoutDate: w.workoutDate ? w.workoutDate.split(/[ T]/)[0] : '',
        activityName: w.activityName || 'ランニング',
        predictedSeconds,
        pred10kSeconds: calculateRiegelTime(distanceM, timeS, 10000),
        predHalfSeconds: calculateRiegelTime(distanceM, timeS, 21097.5),
        pred30kSeconds: calculateRiegelTime(distanceM, timeS, 30000),
        predFullSeconds: calculateRiegelTime(distanceM, timeS, 42195)
      })
    }
  }

  if (candidates.length === 0) return null

  let best = candidates[0]
  for (let i = 1; i < candidates.length; i++) {
    if (candidates[i].predictedSeconds < best.predictedSeconds) {
      best = candidates[i]
    }
  }

  return best
}

/**
 * ============================================================================
 * 2. 心肺ドリフト (Aerobic Decoupling)
 * ============================================================================
 * - 入力: 時系列のトラッキングデータ配列（`time_s`, `distance_m`, `heart_rate` を持つオブジェクトのリスト）
 * - 出力: デカップリング率 (%)
 * - 処理手順:
 *   1. アクティビティ全体を時間ベースで前半（0〜50%）と後半（51〜100%）に分割する。
 *   2. 前半・後半それぞれの「平均スピード (m/min)」と「平均心拍数 (bpm)」を算出する。
 *   3. 各ハーフの Efficiency Factor (EF) を計算: EF = 平均スピード(m/min) / 平均心拍数(bpm)
 *   4. デカップリング率を計算: Decoupling = ((前半のEF - 後半のEF) / 前半のEF) * 100
 * - エッジケース: 心拍数データが欠損している場合、または平均心拍数が0の場合は計算不可として null を返す。
 */
export function calculateAerobicDecouplingDetails(trackingData) {
  if (!Array.isArray(trackingData) || trackingData.length < 2) {
    return null
  }

  for (const point of trackingData) {
    if (
      !point ||
      point.heart_rate === null ||
      point.heart_rate === undefined ||
      Number.isNaN(Number(point.heart_rate)) ||
      Number(point.heart_rate) <= 0 ||
      point.time_s === null ||
      point.time_s === undefined ||
      Number.isNaN(Number(point.time_s)) ||
      Number(point.time_s) <= 0 ||
      point.distance_m === null ||
      point.distance_m === undefined ||
      Number.isNaN(Number(point.distance_m)) ||
      Number(point.distance_m) < 0
    ) {
      return null
    }
  }

  const { segments, totalTimeS } = normalizeTimeAndDistanceSegments(trackingData)
  if (totalTimeS <= 0 || segments.length < 2) {
    return null
  }

  const halfTimeS = totalTimeS * 0.5
  const firstHalf = []
  const secondHalf = []

  for (const seg of segments) {
    const hr = Number(seg.heart_rate)
    if (seg.endTime <= halfTimeS) {
      firstHalf.push({
        time_s: seg.time_s,
        distance_m: seg.distance_m,
        heart_rate: hr
      })
    } else if (seg.startTime >= halfTimeS) {
      secondHalf.push({
        time_s: seg.time_s,
        distance_m: seg.distance_m,
        heart_rate: hr
      })
    } else {
      const firstDuration = halfTimeS - seg.startTime
      const secondDuration = seg.endTime - halfTimeS
      const firstRatio = firstDuration / seg.time_s
      const secondRatio = secondDuration / seg.time_s

      if (firstDuration > 0) {
        firstHalf.push({
          time_s: firstDuration,
          distance_m: seg.distance_m * firstRatio,
          heart_rate: hr
        })
      }
      if (secondDuration > 0) {
        secondHalf.push({
          time_s: secondDuration,
          distance_m: seg.distance_m * secondRatio,
          heart_rate: hr
        })
      }
    }
  }

  if (firstHalf.length === 0 || secondHalf.length === 0) {
    return null
  }

  const calcHalfStats = (halfArray) => {
    const sumTimeS = halfArray.reduce((acc, item) => acc + item.time_s, 0)
    const sumDistM = halfArray.reduce((acc, item) => acc + item.distance_m, 0)
    const weightedHrSum = halfArray.reduce((acc, item) => acc + item.heart_rate * item.time_s, 0)

    if (sumTimeS <= 0) return null
    const timeMin = sumTimeS / 60
    const avgSpeedMPerMin = sumDistM / timeMin
    const avgHr = weightedHrSum / sumTimeS

    if (avgHr <= 0 || avgSpeedMPerMin <= 0) return null

    const ef = avgSpeedMPerMin / avgHr
    return {
      timeS: sumTimeS,
      distanceM: sumDistM,
      avgSpeedMPerMin,
      avgHr,
      ef
    }
  }

  const firstStats = calcHalfStats(firstHalf)
  const secondStats = calcHalfStats(secondHalf)

  if (!firstStats || !secondStats || firstStats.ef <= 0) {
    return null
  }

  const decoupling = ((firstStats.ef - secondStats.ef) / firstStats.ef) * 100

  return {
    decoupling,
    firstHalf: firstStats,
    secondHalf: secondStats
  }
}

export function calculateAerobicDecoupling(trackingData) {
  const details = calculateAerobicDecouplingDetails(trackingData)
  return details ? details.decoupling : null
}

/**
 * ワークアウトの splits 配列を `{ time_s, distance_m, heart_rate, cadence }` のトラッキング配列に変換
 */
export function workoutSplitsToTrackingData(workout) {
  if (!workout || !Array.isArray(workout.splits) || workout.splits.length < 1) {
    return null
  }

  const totalDistMeters = Number(workout.distance || 0) * 1000
  const splits = workout.splits
  const n = splits.length

  return splits.map((s, idx) => {
    const time_s = Number(s.movingTime || s.elapsedTime || 0)
    let distance_m = Number(s.distance || 0)
    if (!distance_m || distance_m <= 0) {
      if (idx === n - 1 && totalDistMeters > (n - 1) * 1000) {
        const remainder = totalDistMeters - (n - 1) * 1000
        distance_m = remainder > 50 && remainder <= 1500 ? remainder : 1000
      } else {
        distance_m = 1000
      }
    }
    const heart_rate = s.averageHeartrate !== null && s.averageHeartrate !== undefined
      ? Number(s.averageHeartrate)
      : null
    const cadence = s.cadence || s.spm || s.averageCadence || null
    return {
      split: s.split || (idx + 1),
      time_s,
      distance_m,
      heart_rate,
      cadence: cadence ? Number(cadence) : null
    }
  })
}

/**
 * ============================================================================
 * 3. TRIMP (Banister's Training Impulse - 男性版)
 * ============================================================================
 * - 入力: duration_min (運動時間/分), avg_hr (平均心拍数), max_hr (最大心拍数), rest_hr (安静時心拍数)
 * - 出力: TRIMPスコア (数値)
 * - 計算式:
 *   1. 心拍予備能割合 (HRR) を計算: HRR_ratio = (avg_hr - rest_hr) / (max_hr - rest_hr)
 *   2. TRIMP計算 (男性用係数を使用): TRIMP = duration_min * HRR_ratio * 0.64 * exp(1.92 * HRR_ratio)
 */
export function calculateBanisterTrimp(duration_min, avg_hr, max_hr, rest_hr) {
  const dur = Number(duration_min)
  const avg = Number(avg_hr)
  const max = Number(max_hr)
  const rest = Number(rest_hr)

  if (
    Number.isNaN(dur) ||
    Number.isNaN(avg) ||
    Number.isNaN(max) ||
    Number.isNaN(rest) ||
    dur <= 0 ||
    avg <= 0 ||
    max <= rest
  ) {
    return 0
  }

  const HRR_ratio = (avg - rest) / (max - rest)
  if (HRR_ratio <= 0) return 0

  return dur * HRR_ratio * 0.64 * Math.exp(1.92 * HRR_ratio)
}

export function calculateWorkoutTrimp(workout, hrConfig = DEFAULT_ATHLETE_HR_CONFIG) {
  if (!workout) return { trimp: 0, hrrRatio: 0, durationMin: 0 }
  const timeSeconds = Number(workout.movingTimeSeconds || workout.durationSeconds || 0)
  const durationMin = timeSeconds / 60
  const avgHr = Number(workout.averageHeartrate || 0)
  const maxHr = Number(hrConfig?.maxHr || DEFAULT_ATHLETE_HR_CONFIG.maxHr)
  const restHr = Number(hrConfig?.restHr || DEFAULT_ATHLETE_HR_CONFIG.restHr)

  if (durationMin <= 0 || avgHr <= restHr || maxHr <= restHr) {
    return { trimp: 0, hrrRatio: 0, durationMin }
  }

  const hrrRatio = (avgHr - restHr) / (maxHr - restHr)
  const trimp = calculateBanisterTrimp(durationMin, avgHr, maxHr, restHr)

  return {
    trimp,
    hrrRatio,
    durationMin
  }
}

/**
 * ============================================================================
 * 4. TSB (Training Stress Balance) とコンディション
 * ============================================================================
 * - 入力: 日ごとのTRIMPスコアの配列（時系列昇順、直近42日以上）
 * - 出力: 指定日の CTL, ATL, TSB のオブジェクト
 * - 計算手順（指数移動平均: EMA）:
 *   1. CTL (42日間のEMA): CTL_today = (TRIMP_today * (2/43)) + (CTL_yesterday * (1 - 2/43))
 *   2. ATL (7日間のEMA): ATL_today = (TRIMP_today * (2/8)) + (ATL_yesterday * (1 - 2/8))
 *   3. TSBの計算: TSB_today = CTL_yesterday - ATL_yesterday
 */
export function calculateTSBAndCondition(dailyTrimpArray) {
  if (!Array.isArray(dailyTrimpArray) || dailyTrimpArray.length === 0) {
    return { CTL: 0, ATL: 0, TSB: 0, series: [] }
  }

  const kCTL = 2 / 43
  const kATL = 2 / 8

  let ctlYesterday = 0
  let atlYesterday = 0
  const series = []

  for (let i = 0; i < dailyTrimpArray.length; i++) {
    const item = dailyTrimpArray[i]
    const trimpToday = typeof item === 'number' ? Number(item) : Number(item?.trimp || 0)
    const dateStr = typeof item === 'object' && item !== null ? (item.dateStr || null) : null
    const distanceKm = typeof item === 'object' && item !== null ? Number(item?.distanceKm || 0) : 0

    const tsbToday = ctlYesterday - atlYesterday
    const ctlToday = (trimpToday * kCTL) + (ctlYesterday * (1 - kCTL))
    const atlToday = (trimpToday * kATL) + (atlYesterday * (1 - kATL))

    series.push({
      dateStr,
      trimp: trimpToday,
      distanceKm,
      CTL: ctlToday,
      ATL: atlToday,
      TSB: tsbToday
    })

    ctlYesterday = ctlToday
    atlYesterday = atlToday
  }

  const latest = series[series.length - 1]
  return {
    CTL: latest.CTL,
    ATL: latest.ATL,
    TSB: latest.TSB,
    series
  }
}

export function buildDailyPmcSeries(workouts, referenceDate = new Date(), hrConfig = DEFAULT_ATHLETE_HR_CONFIG, minDays = 90) {
  const endDay = new Date(referenceDate.getTime())
  endDay.setHours(0, 0, 0, 0)

  const guaranteedDays = Math.max(42, minDays)
  let startDay = new Date(endDay.getTime())
  startDay.setDate(startDay.getDate() - guaranteedDays)
  startDay.setHours(0, 0, 0, 0)

  if (Array.isArray(workouts) && workouts.length > 0) {
    for (const w of workouts) {
      const d = parseWorkoutLocalDate(w.workoutDate)
      if (d.getTime() > 0) {
        d.setHours(0, 0, 0, 0)
        if (d < startDay) {
          startDay = new Date(d.getTime())
        }
      }
    }
  }

  const dailyMap = new Map()
  if (Array.isArray(workouts)) {
    for (const w of workouts) {
      if (!w.workoutDate) continue
      const d = parseWorkoutLocalDate(w.workoutDate)
      if (d.getTime() <= 0) continue
      const key = formatDateYMD(d)
      const { trimp } = calculateWorkoutTrimp(w, hrConfig)
      const dist = Number(w.distance || 0)
      const prev = dailyMap.get(key) || { trimp: 0, distanceKm: 0 }
      dailyMap.set(key, {
        trimp: prev.trimp + trimp,
        distanceKm: prev.distanceKm + dist
      })
    }
  }

  const dailyArray = []
  const cursor = new Date(startDay.getTime())
  while (cursor <= endDay) {
    const dateStr = formatDateYMD(cursor)
    const entry = dailyMap.get(dateStr) || { trimp: 0, distanceKm: 0 }
    dailyArray.push({
      dateStr,
      trimp: entry.trimp,
      distanceKm: entry.distanceKm
    })
    cursor.setDate(cursor.getDate() + 1)
  }

  return calculateTSBAndCondition(dailyArray)
}

/**
 * ============================================================================
 * 5. EF (Efficiency Factor / 効率係数)
 * ============================================================================
 * - 入力: アクティビティ内の時系列データ配列（`time_s`, `distance_m`, `heart_rate` を持つオブジェクトのリスト）
 * - 計算式:
 *   1. ワークアウト全体の「平均スピード (m/min)」を算出する。
 *   2. ワークアウト全体の「平均心拍数 (bpm)」を算出する。
 *   3. EF = 平均スピード (m/min) / 平均心拍数 (bpm)
 * - 要件: 心拍数が0または欠損している場合は null を返すこと。
 *   時系列の推移（ラップごとや区間ごとのEF）もチャート化できるように時系列配列として出力すること。
 */
export function calculateEfficiencyFactor(trackingData) {
  if (!Array.isArray(trackingData) || trackingData.length === 0) {
    return null
  }

  for (const point of trackingData) {
    if (
      !point ||
      point.heart_rate === null ||
      point.heart_rate === undefined ||
      Number.isNaN(Number(point.heart_rate)) ||
      Number(point.heart_rate) <= 0 ||
      point.time_s === null ||
      point.time_s === undefined ||
      Number.isNaN(Number(point.time_s)) ||
      Number(point.time_s) <= 0 ||
      point.distance_m === null ||
      point.distance_m === undefined ||
      Number.isNaN(Number(point.distance_m)) ||
      Number(point.distance_m) <= 0
    ) {
      return null
    }
  }

  const { segments, totalTimeS } = normalizeTimeAndDistanceSegments(trackingData)
  if (totalTimeS <= 0 || segments.length === 0) {
    return null
  }

  const totalDistanceM = segments.reduce((acc, s) => acc + s.distance_m, 0)
  const weightedHrSum = segments.reduce((acc, s) => acc + Number(s.heart_rate) * s.time_s, 0)

  const totalTimeMin = totalTimeS / 60
  if (totalTimeMin <= 0 || totalDistanceM <= 0) {
    return null
  }

  // 1. ワークアウト全体の「平均スピード (m/min)」を算出
  const avgSpeedMPerMin = totalDistanceM / totalTimeMin

  // 2. ワークアウト全体の「平均心拍数 (bpm)」を算出
  const avgHr = weightedHrSum / totalTimeS
  if (avgHr <= 0) {
    return null
  }

  // 3. EF = 平均スピード (m/min) / 平均心拍数 (bpm)
  const overallEF = avgSpeedMPerMin / avgHr

  // 時系列（ラップ・区間ごと）のEF配列を作成
  const series = segments.map((s, idx) => {
    const segTimeMin = s.time_s / 60
    const segSpeedMPerMin = segTimeMin > 0 ? s.distance_m / segTimeMin : 0
    const segHr = Number(s.heart_rate)
    const segEF = segHr > 0 ? segSpeedMPerMin / segHr : null
    return {
      segmentIndex: s.split || s.index || (idx + 1),
      time_s: s.time_s,
      cumulative_time_s: s.endTime,
      distance_m: s.distance_m,
      heart_rate: segHr,
      speed_m_min: segSpeedMPerMin,
      ef: segEF
    }
  })

  return {
    ef: overallEF,
    avgSpeedMPerMin,
    avgHr,
    totalDistanceM,
    totalTimeS,
    series
  }
}

/**
 * ワークアウトオブジェクトから直接EF（およびラップ別EF時系列）を算出するヘルパー
 */
export function calculateWorkoutEF(workout) {
  if (!workout) return null
  const tracking = workoutSplitsToTrackingData(workout)
  if (tracking && tracking.length > 0 && tracking.every(t => t.heart_rate && t.heart_rate > 0)) {
    return calculateEfficiencyFactor(tracking)
  }
  // スプリットがない場合はワークアウト全体の数値から算出
  const distM = Number(workout.distance || 0) * 1000
  const timeS = Number(workout.movingTimeSeconds || workout.durationSeconds || 0)
  const hr = Number(workout.averageHeartrate || 0)
  if (distM <= 0 || timeS <= 0 || hr <= 0) return null
  return calculateEfficiencyFactor([{ time_s: timeS, distance_m: distM, heart_rate: hr }])
}

/**
 * ============================================================================
 * 6. Pace / HR 比 (ペース・心拍比の推移)
 * ============================================================================
 * - 入力: 複数ワークアウトの履歴データ（`date`, `avg_pace_min_km`, `avg_hr` を持つオブジェクトのリスト）
 * - 計算式:
 *   1. 各ワークアウトの「平均ペース（分/km）」を「速度 (m/min または km/h)」に変換する。
 *      - speed_m_min = 1000 / avg_pace_min_km
 *      - speed_km_h  = 60 / avg_pace_min_km
 *   2. Pace_HR_Ratio = 速度 / 平均心拍数
 * - 要件: 週単位・月単位でこの比率の推移（トレンド）をグラフ描画できるように集計すること。
 */
export function calculatePaceHrRatioTrend(historyList) {
  if (!Array.isArray(historyList) || historyList.length === 0) {
    return { workouts: [], weekly: [], monthly: [] }
  }

  const validItems = []

  for (const item of historyList) {
    if (!item || !item.date) continue
    const avgPaceMinKm = Number(item.avg_pace_min_km)
    const avgHr = Number(item.avg_hr)

    if (
      Number.isNaN(avgPaceMinKm) ||
      Number.isNaN(avgHr) ||
      avgPaceMinKm <= 0 ||
      avgHr <= 0
    ) {
      continue
    }

    // 1. 平均ペース (分/km) を 速度 (m/min および km/h) に変換
    const speed_m_min = 1000 / avgPaceMinKm
    const speed_km_h = 60 / avgPaceMinKm

    // 2. Pace_HR_Ratio = 速度 / 平均心拍数
    const ratio_m_min = speed_m_min / avgHr
    const ratio_km_h = speed_km_h / avgHr

    const dateObj = parseWorkoutLocalDate(item.date)
    if (dateObj.getTime() <= 0) continue

    validItems.push({
      date: formatDateYMD(dateObj),
      timestamp: dateObj.getTime(),
      avg_pace_min_km: avgPaceMinKm,
      avg_hr: avgHr,
      speed_m_min,
      speed_km_h,
      pace_hr_ratio: ratio_m_min,
      pace_hr_ratio_kmh: ratio_km_h
    })
  }

  // 昇順ソート
  validItems.sort((a, b) => a.timestamp - b.timestamp)

  // 週単位集計 (月曜始まりの週初日 YYYY-MM-DD をキーに集計)
  const weeklyMap = new Map()
  // 月単位集計 (YYYY-MM をキーに集計)
  const monthlyMap = new Map()

  for (const rec of validItems) {
    const d = parseWorkoutLocalDate(rec.date)
    const dayOfWeek = d.getDay() // 0(Sun) .. 6(Sat)
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    const monday = new Date(d.getTime())
    monday.setDate(d.getDate() + diffToMonday)
    const weekKey = formatDateYMD(monday)
    const monthKey = rec.date.substring(0, 7)

    const wGroup = weeklyMap.get(weekKey) || []
    wGroup.push(rec)
    weeklyMap.set(weekKey, wGroup)

    const mGroup = monthlyMap.get(monthKey) || []
    mGroup.push(rec)
    monthlyMap.set(monthKey, mGroup)
  }

  const aggregateGroup = (key, group) => {
    const count = group.length
    const avgRatioMMin = group.reduce((acc, r) => acc + r.pace_hr_ratio, 0) / count
    const avgRatioKmH = group.reduce((acc, r) => acc + r.pace_hr_ratio_kmh, 0) / count
    const avgSpeedMMin = group.reduce((acc, r) => acc + r.speed_m_min, 0) / count
    const avgHr = group.reduce((acc, r) => acc + r.avg_hr, 0) / count
    return {
      period: key,
      count,
      pace_hr_ratio: avgRatioMMin,
      pace_hr_ratio_kmh: avgRatioKmH,
      avg_speed_m_min: avgSpeedMMin,
      avg_hr: avgHr
    }
  }

  const weekly = Array.from(weeklyMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, group]) => aggregateGroup(key, group))

  const monthly = Array.from(monthlyMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, group]) => aggregateGroup(key, group))

  return {
    workouts: validItems,
    weekly,
    monthly
  }
}

/**
 * ワークアウト配列を `{ date, avg_pace_min_km, avg_hr }` に変換して Pace/HR比トレンドを算出するヘルパー
 */
export function buildPaceHrTrendFromWorkouts(workouts) {
  if (!Array.isArray(workouts) || workouts.length === 0) {
    return { workouts: [], weekly: [], monthly: [] }
  }

  const inputList = workouts
    .filter(w => {
      const hr = Number(w.averageHeartrate || 0)
      const paceSec = Number(w.averagePaceSeconds || 0)
      const dist = Number(w.distance || 0)
      const timeS = Number(w.movingTimeSeconds || w.durationSeconds || 0)
      return hr > 0 && (paceSec > 0 || (dist > 0 && timeS > 0))
    })
    .map(w => {
      const dist = Number(w.distance || 0)
      const timeS = Number(w.movingTimeSeconds || w.durationSeconds || 0)
      // 秒/km を 分/km に正確に変換
      const exactPaceMinKm = (dist > 0 && timeS > 0)
        ? (timeS / 60) / dist
        : Number(w.averagePaceSeconds) / 60
      return {
        date: w.workoutDate,
        avg_pace_min_km: exactPaceMinKm,
        avg_hr: Number(w.averageHeartrate)
      }
    })

  return calculatePaceHrRatioTrend(inputList)
}

/**
 * ============================================================================
 * 7. 安静時心拍数 (RHR) トレンド
 * ============================================================================
 * - 入力: 日付ごとの安静時心拍数（RHR）の時系列データ配列（`date`, `rhr_bpm` を持つオブジェクトのリスト）
 * - 処理手順:
 *   1. 日々のRHRデータを昇順で保持する。
 *   2. 直近7日間の移動平均（Moving Average）を算出し、「短期トレンドライン」として描画する。
 * - 要件: TSB（疲労バランス）の補助指標として、RHRが直近平均より数拍跳ね上がっている日（例: +3bpm以上）には
 *   「要疲労注意」のフラグを立てられるようにすること。
 */
export function calculateRhrTrend(rhrDataList, spikeThresholdBpm = 3) {
  if (!Array.isArray(rhrDataList) || rhrDataList.length === 0) {
    return []
  }

  // 1. 日々のRHRデータを昇順で保持する（同一日付がある場合は最新値に正規化）
  const byDateMap = new Map()
  for (const item of rhrDataList) {
    if (!item || !item.date) continue
    const bpm = Number(item.rhr_bpm)
    if (Number.isNaN(bpm) || bpm <= 0) continue
    const d = parseWorkoutLocalDate(item.date)
    if (d.getTime() <= 0) continue
    const dateKey = formatDateYMD(d)
    byDateMap.set(dateKey, {
      date: dateKey,
      timestamp: d.getTime(),
      rhr_bpm: bpm
    })
  }

  const sorted = Array.from(byDateMap.values()).sort((a, b) => a.timestamp - b.timestamp)
  if (sorted.length === 0) return []

  // 2. 直近7日間の移動平均（Moving Average）を算出し、+3bpm以上の跳ね上がりに要疲労注意フラグを付与
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000

  return sorted.map((current, idx) => {
    // 当日を含む直近7日間（カレンダー上7日以内、または最大直近7データポイント）のウィンドウを取得
    const windowItems = sorted
      .slice(Math.max(0, idx - 6), idx + 1)
      .filter(entry => (current.timestamp - entry.timestamp) <= sevenDaysMs)

    const movingAverage7d = windowItems.reduce((sum, e) => sum + e.rhr_bpm, 0) / windowItems.length

    // ベースライン比較（当日以前の直近平均、初日の場合は7日移動平均）
    const baselineItems = idx > 0
      ? sorted.slice(Math.max(0, idx - 7), idx)
      : windowItems
    const baselineAvg = baselineItems.reduce((sum, e) => sum + e.rhr_bpm, 0) / baselineItems.length

    const deltaFromAvg = current.rhr_bpm - baselineAvg
    const deltaFromMa7 = current.rhr_bpm - movingAverage7d
    const fatigueWarning = deltaFromAvg >= spikeThresholdBpm || deltaFromMa7 >= spikeThresholdBpm

    return {
      date: current.date,
      rhr_bpm: current.rhr_bpm,
      moving_avg_7d: Number(movingAverage7d.toFixed(2)),
      baseline_avg: Number(baselineAvg.toFixed(2)),
      delta_bpm: Number(deltaFromAvg.toFixed(1)),
      fatigueWarning,
      warningLabel: fatigueWarning ? '要疲労注意' : '正常範囲'
    }
  })
}

/**
 * ============================================================================
 * 8. ピッチ (SPM) 安定度
 * ============================================================================
 * - 入力: アクティビティ内の時系列データ配列（`time_s`, `cadence` または `spm` を持つオブジェクトのリスト）
 * - 計算式:
 *   1. アクティビティ全体を時間ベースで前半（0〜50%）と後半（51〜100%）に分割する。
 *   2. 前半の平均ピッチ（SPM_first）と、後半の平均ピッチ（SPM_second）を算出する。
 *   3. ピッチ変動率（安定度）を計算: Pitch_Stability_Ratio = (SPM_second / SPM_first) * 100
 * - 要件:
 *   - 100に近いほど「後半までフォーム（ピッチ）が崩れずに維持できている」と評価する。
 *   - 疲労による極端なピッチ低下（例: 90%未満）や、逆にストライドが伸びすぎてバタついた挙動を検知できるようにする。
 */
export function calculatePitchStability(trackingData) {
  if (!Array.isArray(trackingData) || trackingData.length < 2) {
    return null
  }

  const normalizedInput = []
  for (const point of trackingData) {
    if (!point) return null
    const rawSpm = point.spm !== undefined && point.spm !== null ? point.spm : point.cadence
    const spm = Number(rawSpm)
    const timeS = Number(point.time_s)

    if (
      rawSpm === null ||
      rawSpm === undefined ||
      Number.isNaN(spm) ||
      spm <= 0 ||
      point.time_s === null ||
      point.time_s === undefined ||
      Number.isNaN(timeS) ||
      timeS <= 0
    ) {
      return null
    }

    normalizedInput.push({
      time_s: timeS,
      spm
    })
  }

  // 累積秒か区間秒かを判定
  let isCumulative = normalizedInput.length >= 3
  for (let i = 1; i < normalizedInput.length; i++) {
    if (normalizedInput[i].time_s <= normalizedInput[i - 1].time_s) {
      isCumulative = false
      break
    }
  }
  if (isCumulative) {
    const firstT = normalizedInput[0].time_s
    const lastT = normalizedInput[normalizedInput.length - 1].time_s
    if (lastT < firstT * (normalizedInput.length * 0.6)) {
      isCumulative = false
    }
  }

  const segments = []
  let runningTime = 0
  for (let i = 0; i < normalizedInput.length; i++) {
    const dt = isCumulative
      ? (i === 0 ? normalizedInput[0].time_s : normalizedInput[i].time_s - normalizedInput[i - 1].time_s)
      : normalizedInput[i].time_s
    if (dt <= 0) continue
    const startTime = runningTime
    runningTime += dt
    const endTime = runningTime
    segments.push({
      time_s: dt,
      spm: normalizedInput[i].spm,
      startTime,
      endTime
    })
  }

  const totalTimeS = runningTime
  if (totalTimeS <= 0 || segments.length < 2) {
    return null
  }

  // 1. アクティビティ全体を時間ベースで前半（0〜50%）と後半（51〜100%）に分割する
  const halfTimeS = totalTimeS * 0.5
  const firstHalf = []
  const secondHalf = []

  for (const seg of segments) {
    if (seg.endTime <= halfTimeS) {
      firstHalf.push({ time_s: seg.time_s, spm: seg.spm })
    } else if (seg.startTime >= halfTimeS) {
      secondHalf.push({ time_s: seg.time_s, spm: seg.spm })
    } else {
      const firstDuration = halfTimeS - seg.startTime
      const secondDuration = seg.endTime - halfTimeS
      if (firstDuration > 0) {
        firstHalf.push({ time_s: firstDuration, spm: seg.spm })
      }
      if (secondDuration > 0) {
        secondHalf.push({ time_s: secondDuration, spm: seg.spm })
      }
    }
  }

  if (firstHalf.length === 0 || secondHalf.length === 0) {
    return null
  }

  // 2. 前半の平均ピッチ (SPM_first) と、後半の平均ピッチ (SPM_second) を算出する
  const firstTimeSum = firstHalf.reduce((acc, s) => acc + s.time_s, 0)
  const secondTimeSum = secondHalf.reduce((acc, s) => acc + s.time_s, 0)
  if (firstTimeSum <= 0 || secondTimeSum <= 0) {
    return null
  }

  const spmFirst = firstHalf.reduce((acc, s) => acc + s.spm * s.time_s, 0) / firstTimeSum
  const spmSecond = secondHalf.reduce((acc, s) => acc + s.spm * s.time_s, 0) / secondTimeSum
  if (spmFirst <= 0) {
    return null
  }

  // 3. ピッチ変動率（安定度）を計算: Pitch_Stability_Ratio = (SPM_second / SPM_first) * 100
  const pitchStabilityRatio = (spmSecond / spmFirst) * 100

  let status = 'stable'
  let evaluation = '後半までフォーム（ピッチ）が安定して維持されています'
  if (pitchStabilityRatio < 90) {
    status = 'drop_warning'
    evaluation = '要警戒: 後半に疲労による極端なピッチ低下（90%未満）が発生しています'
  } else if (pitchStabilityRatio < 96) {
    status = 'slight_drop'
    evaluation = '後半にややピッチ低下が見られます（体幹・臀部疲労の兆候）'
  } else if (pitchStabilityRatio > 105) {
    status = 'overstride_warning'
    evaluation = '注意: 前後半でピッチが大きく変動し、フォームのバタつきが見られます'
  }

  return {
    pitchStabilityRatio,
    spmFirst,
    spmSecond,
    status,
    evaluation
  }
}
