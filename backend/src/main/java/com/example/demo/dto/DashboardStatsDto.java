package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsDto {
    private long totalProjects;
    private long activeProjects;
    private long totalDepartments;
    private BigDecimal totalBudget;
}
