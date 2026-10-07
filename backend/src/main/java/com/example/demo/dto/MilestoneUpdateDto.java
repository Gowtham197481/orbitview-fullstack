package com.example.demo.dto;

import com.example.demo.entity.MilestoneStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MilestoneUpdateDto {

    @NotNull(message = "Milestone ID is required")
    private Long id;

    @NotNull(message = "Milestone status is required")
    private MilestoneStatus status;
}
