package com.example.runningdashboard.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "running_workouts")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RunningWorkout {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "activity_id", unique = true)
    private Long activityId;

    @NotNull(message = "ワークアウト実施日は必須です。")
    @Column(name = "workout_date", nullable = false)
    private LocalDateTime workoutDate;

    @Column(name = "activity_name")
    private String activityName;

    @NotNull(message = "走行距離は必須です。")
    @Column(name = "distance", nullable = false, precision = 6, scale = 2)
    private BigDecimal distance;

    @NotNull(message = "走行時間は必須です。")
    @Column(name = "duration_seconds", nullable = false)
    private Integer durationSeconds;

    @Column(name = "moving_time_seconds")
    private Integer movingTimeSeconds;

    @NotNull(message = "平均ペースは必須です。")
    @Column(name = "average_pace_seconds", nullable = false)
    private Integer averagePaceSeconds;

    @Column(name = "cadence")
    private Integer cadence;

    @Column(name = "average_heartrate", precision = 5, scale = 2)
    private BigDecimal averageHeartrate;

    @Column(name = "max_heartrate")
    private Integer maxHeartrate;

    @Column(name = "elevation_gain", precision = 6, scale = 2)
    private BigDecimal elevationGain;

    @Column(name = "strava_link")
    private String stravaLink;

    @Column(name = "average_stride", precision = 4, scale = 2)
    private BigDecimal averageStride;

    @Column(name = "vertical_oscillation", precision = 3, scale = 1)
    private BigDecimal verticalOscillation;

    @Column(name = "notes", length = 500)
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
