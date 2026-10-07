package com.example.demo.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProjectCreationDto {

    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    @NotNull(message = "Allocated budget is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Allocated budget must be positive")
    private BigDecimal allocatedBudget;

    @NotNull(message = "Start date is required")
    private LocalDate startDate;

    @NotNull(message = "End date is required")
    private LocalDate endDate;

    @NotNull(message = "Department IDs are required")
    private List<Long> departmentIds;
}
