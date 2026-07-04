package com.example.runningdashboard.service;

import com.example.runningdashboard.entity.RunningWorkout;
import com.example.runningdashboard.repository.RunningWorkoutRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.BufferedReader;
import java.io.StringReader;
import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class DataSyncService {

    private final RunningWorkoutRepository repository;
    private static final String SPREADSHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/1PgHvfRXUPPLRvlhOMPSmm14Xuupx0wOnb4MqVEeoPF0/export?format=csv&gid=0";
    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    /**
     * 手動または自動でデータ同期を実行します。
     * @return 同期されたレコード件数
     */
    @Transactional
    public int syncData() {
        log.info("Starting Google Spreadsheet data sync...");
        try {
            HttpClient client = HttpClient.newBuilder()
                    .followRedirects(HttpClient.Redirect.ALWAYS)
                    .build();
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(SPREADSHEET_CSV_URL))
                    .GET()
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                log.error("Failed to fetch CSV. HTTP Status: {}", response.statusCode());
                throw new RuntimeException("Spreadsheet fetch returned status " + response.statusCode());
            }

            String csvData = response.body();
            int count = parseAndSaveCsv(csvData);
            log.info("Data sync completed successfully. Synced {} workouts.", count);
            return count;
        } catch (Exception e) {
            log.error("Error occurred during data sync", e);
            throw new RuntimeException("Sync failed", e);
        }
    }

    /**
     * 30分ごとに定期実行します（コンテナ・アプリ起動中）
     */
    @Scheduled(cron = "0 0/30 * * * *")
    public void scheduledSync() {
        log.info("Running scheduled data sync...");
        try {
            syncData();
        } catch (Exception e) {
            log.error("Scheduled sync failed", e);
        }
    }

    private int parseAndSaveCsv(String csvData) throws Exception {
        BufferedReader reader = new BufferedReader(new StringReader(csvData));
        String line;
        int lineCount = 0;
        int syncCount = 0;

        while ((line = reader.readLine()) != null) {
            lineCount++;
            if (lineCount == 1) {
                // ヘッダー行をスキップ
                continue;
            }

            if (line.trim().isEmpty()) {
                continue;
            }

            // CSVパース（ダブルクォーテーション対応）
            String[] columns = line.split(",(?=([^\"]*\"[^\"]*\")*[^\"]*$)");
            if (columns.length < 21) {
                log.warn("Line {} does not have enough columns (size: {}). Skipping.", lineCount, columns.length);
                continue;
            }

            try {
                // カラムのクリーニング（前後のクォーテーション削除）
                for (int i = 0; i < columns.length; i++) {
                    columns[i] = cleanColumn(columns[i]);
                }

                // 必須項目の解析
                String dateStr = columns[0]; // 日付(ローカル)
                LocalDateTime workoutDate = LocalDateTime.parse(dateStr, DATE_TIME_FORMATTER);

                String activityIdStr = columns[1]; // アクティビティID
                Long activityId = Long.parseLong(activityIdStr);

                String activityName = columns[2]; // アクティビティ名

                // 距離(km) のパース
                String distanceStr = columns[19]; // 走行距離(km)
                BigDecimal distance = new BigDecimal(distanceStr);

                // 経過時間(秒) のパース
                String durationStr = columns[4]; // 経過時間(秒)
                Integer durationSeconds = Integer.parseInt(durationStr);

                // 移動時間(秒) のパース
                Integer movingTimeSeconds = null;
                if (!columns[5].isEmpty()) {
                    movingTimeSeconds = Integer.parseInt(columns[5]);
                }

                // 平均ペース（秒/km）の算出
                Integer averagePaceSeconds = null;
                String paceStr = columns[20]; // 平均ペース (MM:SS)
                if (paceStr != null && paceStr.contains(":")) {
                    String[] parts = paceStr.split(":");
                    averagePaceSeconds = Integer.parseInt(parts[0]) * 60 + Integer.parseInt(parts[1]);
                } else {
                    // 自動計算
                    averagePaceSeconds = BigDecimal.valueOf(durationSeconds)
                            .divide(distance, 0, java.math.RoundingMode.HALF_UP).intValue();
                }

                // 平均ピッチ
                Integer cadence = null;
                if (!columns[6].isEmpty()) {
                    try {
                        cadence = (int) Double.parseDouble(columns[6]);
                    } catch (NumberFormatException e) {
                        // ignore
                    }
                }

                // 平均心拍数
                BigDecimal averageHeartrate = null;
                if (!columns[8].isEmpty()) {
                    averageHeartrate = new BigDecimal(columns[8]);
                }

                // 最高心拍数
                Integer maxHeartrate = null;
                if (!columns[9].isEmpty()) {
                    maxHeartrate = (int) Double.parseDouble(columns[9]);
                }

                // 獲得標高
                BigDecimal elevationGain = null;
                if (!columns[10].isEmpty()) {
                    elevationGain = new BigDecimal(columns[10]);
                }

                // Stravaリンク
                String stravaLink = columns[18];

                // 平均ストライド(m)
                BigDecimal averageStride = null;
                if (columns.length > 22 && !columns[22].isEmpty()) {
                    averageStride = new BigDecimal(columns[22]);
                }

                // 既存のワークアウトを探す
                Optional<RunningWorkout> existingOpt = repository.findByActivityId(activityId);
                RunningWorkout workout;
                if (existingOpt.isPresent()) {
                    workout = existingOpt.get();
                } else {
                    workout = new RunningWorkout();
                    workout.setActivityId(activityId);
                }

                workout.setWorkoutDate(workoutDate);
                workout.setActivityName(activityName);
                workout.setDistance(distance);
                workout.setDurationSeconds(durationSeconds);
                workout.setMovingTimeSeconds(movingTimeSeconds);
                workout.setAveragePaceSeconds(averagePaceSeconds);
                workout.setCadence(cadence);
                workout.setAverageHeartrate(averageHeartrate);
                workout.setMaxHeartrate(maxHeartrate);
                workout.setElevationGain(elevationGain);
                workout.setStravaLink(stravaLink);
                workout.setAverageStride(averageStride);

                repository.save(workout);
                syncCount++;

            } catch (Exception e) {
                log.error("Failed to parse line {}: {}", lineCount, line, e);
            }
        }
        return syncCount;
    }

    private String cleanColumn(String col) {
        if (col == null) return "";
        col = col.trim();
        if (col.startsWith("\"") && col.endsWith("\"")) {
            col = col.substring(1, col.length() - 1);
        }
        return col.trim();
    }
}
