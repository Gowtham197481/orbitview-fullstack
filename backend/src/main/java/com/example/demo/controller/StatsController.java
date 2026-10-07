package com.example.demo.controller;
import com.example.demo.dto.DashboardStatsDto;
import com.example.demo.entity.SystemUser;
import com.example.demo.repository.SystemUserRepository;
import com.example.demo.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class StatsController {

    private final ReportService reportService;
    private final SystemUserRepository userRepository;

    @GetMapping("/stats/dashboard")
    public ResponseEntity<DashboardStatsDto> getDashboardStats() {
        return ResponseEntity.ok(reportService.getDashboardStats());
    }

    @GetMapping("/users")
    public ResponseEntity<List<SystemUser>> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }
}
