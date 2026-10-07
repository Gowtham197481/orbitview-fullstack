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
public class DepartmentSummaryDto {
    private String departmentName;
    private int projectCount;
    private BigDecimal totalAllocatedBudget;
    private BigDecimal remainingBudget;
    private double averageProjectCompletion;
}
