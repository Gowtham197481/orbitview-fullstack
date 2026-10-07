package com.example.demo.controller;

import com.example.demo.dto.DepartmentSummaryDto;
import com.example.demo.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/global-summary")
    @PreAuthorize("hasRole('STRATEGIC_DIRECTOR')")
    public ResponseEntity<List<DepartmentSummaryDto>> getGlobalSummary() {
        return ResponseEntity.ok(reportService.getGlobalSummary());
    }
}
