package com.example.runningdashboard.service;

import com.example.runningdashboard.entity.RunningWorkout;
import com.example.runningdashboard.repository.RunningWorkoutRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class RunningWorkoutService {

    private final RunningWorkoutRepository repository;

    @Autowired
    public RunningWorkoutService(RunningWorkoutRepository repository) {
        this.repository = repository;
    }

    /**
     * すべてのワークアウトを実施日の降順で取得します。
     */
    @Transactional(readOnly = true)
    public List<RunningWorkout> getAllWorkouts() {
        return repository.findAllByOrderByWorkoutDateDesc();
    }

    /**
     * 指定されたIDのワークアウトを取得します。
     */
    @Transactional(readOnly = true)
    public Optional<RunningWorkout> getWorkoutById(Long id) {
        return repository.findById(id);
    }

    /**
     * 新しいワークアウトを保存します。
     * 平均ペースが未指定、または距離・時間から自動計算可能な場合は自動算出します。
     */
    public RunningWorkout saveWorkout(RunningWorkout workout) {
        calculateAndSetAveragePace(workout);
        return repository.save(workout);
    }

    /**
     * 既存のワークアウト情報を更新します。
     */
    public RunningWorkout updateWorkout(Long id, RunningWorkout updatedWorkout) {
        return repository.findById(id)
                .map(existingWorkout -> {
                    existingWorkout.setWorkoutDate(updatedWorkout.getWorkoutDate());
                    existingWorkout.setDistance(updatedWorkout.getDistance());
                    existingWorkout.setDurationSeconds(updatedWorkout.getDurationSeconds());
                    existingWorkout.setCadence(updatedWorkout.getCadence());
                    existingWorkout.setVerticalOscillation(updatedWorkout.getVerticalOscillation());
                    existingWorkout.setNotes(updatedWorkout.getNotes());
                    existingWorkout.setActivityId(updatedWorkout.getActivityId());
                    existingWorkout.setActivityName(updatedWorkout.getActivityName());
                    existingWorkout.setMovingTimeSeconds(updatedWorkout.getMovingTimeSeconds());
                    existingWorkout.setAverageHeartrate(updatedWorkout.getAverageHeartrate());
                    existingWorkout.setMaxHeartrate(updatedWorkout.getMaxHeartrate());
                    existingWorkout.setElevationGain(updatedWorkout.getElevationGain());
                    existingWorkout.setStravaLink(updatedWorkout.getStravaLink());
                    existingWorkout.setAverageStride(updatedWorkout.getAverageStride());
                    
                    // 平均ペースの再計算とセット
                    calculateAndSetAveragePace(existingWorkout);
                    
                    return repository.save(existingWorkout);
                })
                .orElseThrow(() -> new IllegalArgumentException("指定されたワークアウト（ID: " + id + "）が見つかりません。"));
    }

    /**
     * ワークアウトを削除します。
     */
    public void deleteWorkout(Long id) {
        if (!repository.existsById(id)) {
            throw new IllegalArgumentException("指定されたワークアウト（ID: " + id + "）が見つかりません。");
        }
        repository.deleteById(id);
    }

    /**
     * 走行距離と走行時間から平均ペース（秒/km）を自動計算し、エンティティに設定します。
     */
    private void calculateAndSetAveragePace(RunningWorkout workout) {
        if (workout.getDistance() != null && workout.getDistance().compareTo(BigDecimal.ZERO) > 0 
                && workout.getDurationSeconds() != null && workout.getDurationSeconds() > 0) {
            
            // 平均ペース（秒/km） = 走行時間（秒） / 走行距離（km）
            BigDecimal duration = BigDecimal.valueOf(workout.getDurationSeconds());
            BigDecimal pace = duration.divide(workout.getDistance(), 0, RoundingMode.HALF_UP);
            workout.setAveragePaceSeconds(pace.intValue());
        }
    }
}
