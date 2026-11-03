/**
 * ランニングダッシュボード スポーツ科学コアアルゴリズム
 *
 * AIの独自解釈や近似式を排し、指定された4つのスポーツ科学数式・手順に完全準拠した純粋関数群。
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
 * 秒数を "H:MM:SS" または "MM:SS" にフォーマット
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

  // 配列内で min()（最も予測タイムが短いベストエフォート）を採用
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

  // エッジケース: 心拍数データの欠損または0以下をチェック
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

  // 入力が累積値か区間値（ラップごと・サンプルごとの差分）かを判定して正規化
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
    const hr = Number(trackingData[i].heart_rate)

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
      time_s: dt,
      distance_m: dd,
      heart_rate: hr,
      startTime,
      endTime
    })
  }

  const totalTimeS = runningTime
  if (totalTimeS <= 0 || segments.length < 2) {
    return null
  }

  // 1. アクティビティ全体を時間ベースで前半（0〜50%）と後半（51〜100%）に分割する
  // 50%境界 (halfTimeS) をまたぐ区間は時間比率で前半・後半に正確に按分する
  const halfTimeS = totalTimeS * 0.5
  const firstHalf = []
  const secondHalf = []

  for (const seg of segments) {
    if (seg.endTime <= halfTimeS) {
      firstHalf.push({
        time_s: seg.time_s,
        distance_m: seg.distance_m,
        heart_rate: seg.heart_rate
      })
    } else if (seg.startTime >= halfTimeS) {
      secondHalf.push({
        time_s: seg.time_s,
        distance_m: seg.distance_m,
        heart_rate: seg.heart_rate
      })
    } else {
      // 50%境界をまたぐセグメントを時間ベースで分割
      const firstDuration = halfTimeS - seg.startTime
      const secondDuration = seg.endTime - halfTimeS
      const firstRatio = firstDuration / seg.time_s
      const secondRatio = secondDuration / seg.time_s

      if (firstDuration > 0) {
        firstHalf.push({
          time_s: firstDuration,
          distance_m: seg.distance_m * firstRatio,
          heart_rate: seg.heart_rate
        })
      }
      if (secondDuration > 0) {
        secondHalf.push({
          time_s: secondDuration,
          distance_m: seg.distance_m * secondRatio,
          heart_rate: seg.heart_rate
        })
      }
    }
  }

  if (firstHalf.length === 0 || secondHalf.length === 0) {
    return null
  }

  // 2. 前半・後半それぞれの「平均スピード (m/min)」と「平均心拍数 (bpm)」を算出する
  const calcHalfStats = (halfArray) => {
    const sumTimeS = halfArray.reduce((acc, item) => acc + item.time_s, 0)
    const sumDistM = halfArray.reduce((acc, item) => acc + item.distance_m, 0)
    const weightedHrSum = halfArray.reduce((acc, item) => acc + item.heart_rate * item.time_s, 0)

    if (sumTimeS <= 0) return null
    const timeMin = sumTimeS / 60
    const avgSpeedMPerMin = sumDistM / timeMin
    const avgHr = weightedHrSum / sumTimeS

    if (avgHr <= 0 || avgSpeedMPerMin <= 0) return null

    // 3. 各ハーフの Efficiency Factor (EF) を計算: EF = 平均スピード(m/min) / 平均心拍数(bpm)
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

  // 4. デカップリング率を計算: Decoupling = ((前半のEF - 後半のEF) / 前半のEF) * 100
  const decoupling = ((firstStats.ef - secondStats.ef) / firstStats.ef) * 100

  return {
    decoupling,
    firstHalf: firstStats,
    secondHalf: secondStats
  }
}

/**
 * 仕様2の純粋関数インターフェース: デカップリング率 (%) の数値を返す（計算不可時は null）
 */
export function calculateAerobicDecoupling(trackingData) {
  const details = calculateAerobicDecouplingDetails(trackingData)
  return details ? details.decoupling : null
}

/**
 * ワークアウトの splits 配列を `{ time_s, distance_m, heart_rate }` のトラッキング配列に変換
 */
export function workoutSplitsToTrackingData(workout) {
  if (!workout || !Array.isArray(workout.splits) || workout.splits.length < 2) {
    return null
  }

  const totalDistMeters = Number(workout.distance || 0) * 1000
  const splits = workout.splits
  const n = splits.length

  return splits.map((s, idx) => {
    const time_s = Number(s.movingTime || s.elapsedTime || 0)
    // Stravaの1kmスプリットは最終ラップのみ端数距離の場合があるため補正
    let distance_m = Number(s.distance || 0)
    if (!distance_m || distance_m <= 0) {
      if (idx === n - 1 && totalDistMeters > (n - 1) * 1000) {
        const remainder = totalDistMeters - (n - 1) * 1000
        distance_m = remainder > 50 && remainder <= 1500 ? remainder : 1000
      } else {
        distance_m = 1000
      }
    }
    const heart_rate = Number(s.averageHeartrate || 0)
    return { time_s, distance_m, heart_rate }
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

/**
 * 単一ワークアウトオブジェクトから Banister TRIMP と HRR_ratio を算出
 */
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
 * - 出力: 指定日の CTL, ATL, TSB のオブジェクト（および日次推移配列）
 * - 計算手順（指数移動平均: EMA）:
 *   1. CTL (42日間のEMA): CTL_today = (TRIMP_today * (2/43)) + (CTL_yesterday * (1 - 2/43))
 *   2. ATL (7日間のEMA): ATL_today = (TRIMP_today * (2/8)) + (ATL_yesterday * (1 - 2/8))
 *   3. TSBの計算: TSB_today = CTL_yesterday - ATL_yesterday
 *   ※TSBは「前日の疲労度」から「今日のフレッシュさ」を算出するため、必ず昨日のCTLとATLを用いること。
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

    // 3. TSBの計算: TSB_today = CTL_yesterday - ATL_yesterday (必ず昨日のCTLとATLを用いる)
    const tsbToday = ctlYesterday - atlYesterday

    // 1. CTL (42日間のEMA)
    const ctlToday = (trimpToday * kCTL) + (ctlYesterday * (1 - kCTL))

    // 2. ATL (7日間のEMA)
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

/**
 * ワークアウト配列から時系列昇順の日次TRIMP配列（最低でも直近90日以上または全期間）を生成し、
 * PMC (CTL, ATL, TSB) を計算する。
 */
export function buildDailyPmcSeries(workouts, referenceDate = new Date(), hrConfig = DEFAULT_ATHLETE_HR_CONFIG, minDays = 90) {
  const endDay = new Date(referenceDate.getTime())
  endDay.setHours(0, 0, 0, 0)

  // 最古のワークアウト日または基準日から minDays 日前のいずれか早い方を開始日に設定（必ず42日以上を確保）
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

  // 日付ごとのTRIMPと走行距離を集計マップ化
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
