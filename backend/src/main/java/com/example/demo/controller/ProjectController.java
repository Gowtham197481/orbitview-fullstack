package com.example.demo.controller;

import com.example.demo.dto.ProjectCreationDto;
import com.example.demo.entity.Project;
import com.example.demo.exception.EntityNotFoundException;
import com.example.demo.repository.ProjectRepository;
import com.example.demo.scheduler.ProjectStatusScheduler;
import com.example.demo.service.ProjectManagementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectManagementService projectManagementService;
    private final ProjectRepository projectRepository;
    private final ProjectStatusScheduler projectStatusScheduler;

    @GetMapping
    public ResponseEntity<List<Project>> getAllProjects() {
        return ResponseEntity.ok(projectRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Project> getProjectById(@PathVariable Long id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Project not found with id: " + id));
        return ResponseEntity.ok(project);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('DEPARTMENT_HEAD', 'PROJECT_MANAGER')")
    public ResponseEntity<Project> createProject(@Valid @RequestBody ProjectCreationDto dto) {
        Project created = projectManagementService.initiateProject(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('DEPARTMENT_HEAD', 'PROJECT_MANAGER')")
    public ResponseEntity<Project> updateProject(@PathVariable Long id, @Valid @RequestBody ProjectCreationDto dto) {
        Project updated = projectManagementService.updateProject(id, dto);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('DEPARTMENT_HEAD', 'PROJECT_MANAGER')")
    public ResponseEntity<Void> deleteProject(@PathVariable Long id) {
        projectManagementService.deleteProject(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/check-statuses")
    public ResponseEntity<Void> checkStatuses() {
        projectStatusScheduler.checkAndUpdateExpiredProjects();
        return ResponseEntity.ok().build();
    }
}
