package com.example.demo.service;

import com.example.demo.dto.ProjectCreationDto;
import com.example.demo.entity.Department;
import com.example.demo.entity.Milestone;
import com.example.demo.entity.Project;
import com.example.demo.entity.ProjectStatus;
import com.example.demo.entity.ResourceAssignment;
import com.example.demo.exception.BusinessValidationException;
import com.example.demo.exception.EntityNotFoundException;
import com.example.demo.repository.DepartmentRepository;
import com.example.demo.repository.MilestoneRepository;
import com.example.demo.repository.ProjectRepository;
import com.example.demo.repository.ResourceAssignmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProjectManagementService {

    private final ProjectRepository projectRepository;
    private final DepartmentRepository departmentRepository;
    private final ResourceAssignmentRepository resourceAssignmentRepository;
    private final MilestoneRepository milestoneRepository;

    @Transactional
    public Project initiateProject(ProjectCreationDto dto) {
        if (!dto.getEndDate().isAfter(dto.getStartDate())) {
            throw new BusinessValidationException("End date must be after start date");
        }

        if (dto.getDepartmentIds() == null || dto.getDepartmentIds().size() != 1) {
            throw new BusinessValidationException("Exactly one department ID must be provided");
        }

        Long departmentId = dto.getDepartmentIds().get(0);
        Department department = departmentRepository.findById(departmentId)
                .orElseThrow(() -> new EntityNotFoundException("Department not found with id: " + departmentId));

        if (department.getRemainingBudget().compareTo(dto.getAllocatedBudget()) < 0) {
            throw new BusinessValidationException(
                    "Department does not have sufficient remaining budget. Available: "
                    + department.getRemainingBudget() + ", Requested: " + dto.getAllocatedBudget()
            );
        }

        department.setRemainingBudget(department.getRemainingBudget().subtract(dto.getAllocatedBudget()));
        departmentRepository.save(department);

        Project project = new Project();
        project.setTitle(dto.getTitle());
        project.setDescription(dto.getDescription());
        project.setAllocatedBudget(dto.getAllocatedBudget());
        project.setStartDate(dto.getStartDate());
        project.setEndDate(dto.getEndDate());
        project.setStatus(ProjectStatus.PROPOSED);
        project.setDepartments(List.of(department));

        return projectRepository.save(project);
    }

    @Transactional
    public Project updateProject(Long id, ProjectCreationDto dto) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Project not found with id: " + id));

        if (!dto.getEndDate().isAfter(dto.getStartDate())) {
            throw new BusinessValidationException("End date must be after start date");
        }

        project.setTitle(dto.getTitle());
        project.setDescription(dto.getDescription());
        project.setAllocatedBudget(dto.getAllocatedBudget());
        project.setStartDate(dto.getStartDate());
        project.setEndDate(dto.getEndDate());

        return projectRepository.save(project);
    }

    @Transactional
    public void deleteProject(Long id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Project not found with id: " + id));

        // 1. Delete all resource assignments referencing this project
        List<ResourceAssignment> assignments = resourceAssignmentRepository.findByProjectId(id);
        if (assignments != null && !assignments.isEmpty()) {
            resourceAssignmentRepository.deleteAll(assignments);
        }

        // 2. Delete all milestones referencing this project
        List<Milestone> milestones = milestoneRepository.findByProjectId(id);
        if (milestones != null && !milestones.isEmpty()) {
            milestoneRepository.deleteAll(milestones);
        }

        // 3. Return allocated budget to lead department
        if (project.getDepartments() != null && !project.getDepartments().isEmpty()) {
            Department leadDepartment = project.getDepartments().get(0);
            if (project.getAllocatedBudget() != null && leadDepartment.getRemainingBudget() != null) {
                leadDepartment.setRemainingBudget(
                        leadDepartment.getRemainingBudget().add(project.getAllocatedBudget())
                );
                departmentRepository.save(leadDepartment);
            }
            project.getDepartments().clear();
            projectRepository.saveAndFlush(project);
        }

        // 4. Delete the project
        projectRepository.delete(project);
    }
}
