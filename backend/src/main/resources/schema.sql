-- running_workouts テーブルの作成
CREATE TABLE IF NOT EXISTS running_workouts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '自動生成ID',
    activity_id BIGINT UNIQUE COMMENT 'StravaアクティビティID',
    workout_date DATETIME NOT NULL COMMENT 'ワークアウト実施日時',
    activity_name VARCHAR(255) COMMENT 'アクティビティ名',
    distance DECIMAL(6, 2) NOT NULL COMMENT '走行距離 (km)',
    duration_seconds INT NOT NULL COMMENT '走行時間 (秒)',
    moving_time_seconds INT COMMENT '移動時間 (秒)',
    average_pace_seconds INT NOT NULL COMMENT '平均ペース (秒/km)',
    cadence INT DEFAULT NULL COMMENT 'ピッチ (spm)',
    average_heartrate DECIMAL(5, 2) DEFAULT NULL COMMENT '平均心拍数 (bpm)',
    max_heartrate INT DEFAULT NULL COMMENT '最高心拍数 (bpm)',
    elevation_gain DECIMAL(6, 2) DEFAULT NULL COMMENT '獲得標高 (m)',
    strava_link VARCHAR(255) DEFAULT NULL COMMENT 'Stravaリンク',
    average_stride DECIMAL(4, 2) DEFAULT NULL COMMENT '平均ストライド (m)',
    vertical_oscillation DECIMAL(3, 1) DEFAULT NULL COMMENT '上下動 (cm)',
    notes VARCHAR(500) DEFAULT NULL COMMENT 'メモ/気付き',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '作成日時',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新日時',
    INDEX idx_workout_date (workout_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ランニングワークアウト記録テーブル';

-- 初期検証用のサンプルデータの挿入
INSERT INTO running_workouts (activity_id, workout_date, activity_name, distance, duration_seconds, moving_time_seconds, average_pace_seconds, cadence, average_heartrate, max_heartrate, elevation_gain, strava_link, average_stride, vertical_oscillation, notes)
VALUES 
(18645728050, '2026-05-25 09:54:57', '夕方のランニング', 7.02, 2580, 2508, 358, 175, 153.1, 164, 12.0, 'https://www.strava.com/activities/18645728050', 1.07, 8.2, '軽いジョギング。体調も良く非常に気持ち良く走れました。'),
(18672727072, '2026-05-27 09:19:43', 'Evening Run', 7.01, 2603, 2502, 357, 176, 154.8, 173, 0.0, 'https://www.strava.com/activities/18672727072', 1.07, 7.9, '公園の周回コースでビルドアップ走。後半にかけてペースを上げられました。'),
(18687562468, '2026-05-28 10:03:27', 'Evening Run', 12.01, 4376, 4182, 348, 179, 152.7, 166, 22.0, 'https://www.strava.com/activities/18687562468', 1.09, 8.4, 'LSD（Long Slow Distance）トレーニング。フォームを意識してピッチを安定させました。'),
(18713646551, '2026-05-30 09:48:12', 'Evening Run', 12.33, 4444, 4291, 348, 177, 149.9, 162, 7.0, 'https://www.strava.com/activities/18713646551', 1.10, 7.6, 'インターバル走。ピッチを高めに維持し、上下動を抑えるように意識しました。');
