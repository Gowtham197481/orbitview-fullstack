package com.example.demo.service;

import com.example.demo.dto.DashboardStatsDto;
import com.example.demo.dto.DepartmentSummaryDto;
import com.example.demo.entity.Department;
import com.example.demo.entity.MilestoneStatus;
import com.example.demo.entity.Project;
import com.example.demo.entity.ProjectStatus;
import com.example.demo.repository.DepartmentRepository;
import com.example.demo.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final ProjectRepository projectRepository;
    private final DepartmentRepository departmentRepository;

    public DashboardStatsDto getDashboardStats() {
        long totalProjects = projectRepository.count();
        long activeProjects = projectRepository.countByStatus(ProjectStatus.ACTIVE);
        long totalDepartments = departmentRepository.count();

        BigDecimal totalBudget = departmentRepository.findAll().stream()
                .map(Department::getTotalAnnualBudget)
                .filter(b -> b != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new DashboardStatsDto(totalProjects, activeProjects, totalDepartments, totalBudget);
    }

    public List<DepartmentSummaryDto> getGlobalSummary() {
        return departmentRepository.findAll().stream()
                .map(this::buildDepartmentSummary)
                .collect(Collectors.toList());
    }

    private DepartmentSummaryDto buildDepartmentSummary(Department department) {
        List<Project> projects = projectRepository.findByDepartments_Id(department.getId());

        BigDecimal totalAllocated = projects.stream()
                .map(Project::getAllocatedBudget)
                .filter(b -> b != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        double avgCompletion = projects.stream()
                .mapToDouble(p -> {
                    if (p.getMilestones() == null || p.getMilestones().isEmpty()) {
                        return 0.0;
                    }
                    long achieved = p.getMilestones().stream()
                            .filter(m -> m.getStatus() == MilestoneStatus.ACHIVED)
                            .count();
                    return (double) achieved / p.getMilestones().size() * 100.0;
                })
                .average()
                .orElse(0.0);

        return new DepartmentSummaryDto(
                department.getName(),
                projects.size(),
                totalAllocated,
                department.getRemainingBudget(),
                avgCompletion
        );
    }
}
