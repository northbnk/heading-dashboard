package com.example.runningdashboard.controller;

import com.example.runningdashboard.entity.RunningWorkout;
import com.example.runningdashboard.service.RunningWorkoutService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/workouts")
@CrossOrigin(origins = "*") // フロントエンドからのCORSリクエストを許可
public class RunningWorkoutController {

    private final RunningWorkoutService service;
    private final com.example.runningdashboard.service.DataSyncService syncService;

    @Autowired
    public RunningWorkoutController(RunningWorkoutService service, com.example.runningdashboard.service.DataSyncService syncService) {
        this.service = service;
        this.syncService = syncService;
    }

    /**
     * すべてのワークアウトを取得します。
     */
    @GetMapping
    public ResponseEntity<List<RunningWorkout>> getAllWorkouts() {
        List<RunningWorkout> workouts = service.getAllWorkouts();
        return ResponseEntity.ok(workouts);
    }

    /**
     * 指定されたIDのワークアウトを取得します。
     */
    @GetMapping("/{id}")
    public ResponseEntity<RunningWorkout> getWorkoutById(@PathVariable Long id) {
        return service.getWorkoutById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * 新規ワークアウトを登録します。
     */
    @PostMapping
    public ResponseEntity<RunningWorkout> createWorkout(@Valid @RequestBody RunningWorkout workout) {
        RunningWorkout savedWorkout = service.saveWorkout(workout);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedWorkout);
    }

    /**
     * ワークアウト情報を更新します。
     */
    @PutMapping("/{id}")
    public ResponseEntity<RunningWorkout> updateWorkout(
            @PathVariable Long id, 
            @Valid @RequestBody RunningWorkout updatedWorkout) {
        try {
            RunningWorkout workout = service.updateWorkout(id, updatedWorkout);
            return ResponseEntity.ok(workout);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * ワークアウトを削除します。
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteWorkout(@PathVariable Long id) {
        try {
            service.deleteWorkout(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Googleスプレッドシートからデータを手動で同期します。
     */
    @PostMapping("/sync")
    public ResponseEntity<java.util.Map<String, Object>> syncWorkouts() {
        int syncedCount = syncService.syncData();
        java.util.Map<String, Object> response = new java.util.HashMap<>();
        response.put("syncedCount", syncedCount);
        response.put("message", "スプレッドシートとの同期が完了しました。");
        return ResponseEntity.ok(response);
    }
}
