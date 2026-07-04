package com.example.runningdashboard.repository;

import com.example.runningdashboard.entity.RunningWorkout;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RunningWorkoutRepository extends JpaRepository<RunningWorkout, Long> {
    
    /**
     * ワークアウトを実施日の降順（新しい順）で全件取得します。
     * 
     * @return ワークアウトのリスト
     */
    List<RunningWorkout> findAllByOrderByWorkoutDateDesc();

    /**
     * 指定されたStravaアクティビティIDでワークアウトを検索します。
     * 
     * @param activityId StravaアクティビティID
     * @return ワークアウト（存在する場合）
     */
    Optional<RunningWorkout> findByActivityId(Long activityId);
}
