package com.example.runningdashboard;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class RunningDashboardApplication {

    public static void main(String[] args) {
        SpringApplication.run(RunningDashboardApplication.class, args);
    }
}
