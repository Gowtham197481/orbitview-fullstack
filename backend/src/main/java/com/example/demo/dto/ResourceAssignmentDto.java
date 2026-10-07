package com.example.demo.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ResourceAssignmentDto {

    @NotNull(message = "Project ID is required")
    private Long projectId;

    @NotNull(message = "User ID is required")
    private Long userId;

    @NotNull(message = "Allocation percentage is required")
    @DecimalMin(value = "0.01", message = "Allocation must be at least 0.01%")
    @DecimalMax(value = "100.0", message = "Allocation cannot exceed 100%")
    private BigDecimal allocationPercentage;

    @NotBlank(message = "Role is required")
    private String role;
}
