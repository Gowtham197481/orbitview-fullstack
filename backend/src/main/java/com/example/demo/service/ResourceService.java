package com.example.demo.service;

import com.example.demo.dto.ResourceAssignmentDto;
import com.example.demo.entity.Project;
import com.example.demo.entity.ResourceAssignment;
import com.example.demo.entity.SystemUser;
import com.example.demo.exception.EntityNotFoundException;
import com.example.demo.exception.ResourceConflictException;
import com.example.demo.repository.ProjectRepository;
import com.example.demo.repository.ResourceAssignmentRepository;
import com.example.demo.repository.SystemUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class ResourceService {

    private final ResourceAssignmentRepository resourceAssignmentRepository;
    private final SystemUserRepository userRepository;
    private final ProjectRepository projectRepository;

    @Transactional
    public ResourceAssignment assignResource(ResourceAssignmentDto dto) {
        SystemUser user = userRepository.findById(dto.getUserId())
                .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + dto.getUserId()));

        Project project = projectRepository.findById(dto.getProjectId())
                .orElseThrow(() -> new EntityNotFoundException("Project not found with id: " + dto.getProjectId()));

        BigDecimal currentTotal = resourceAssignmentRepository.sumAllocationByUserId(dto.getUserId());
        if (currentTotal == null) {
            currentTotal = BigDecimal.ZERO;
        }

        BigDecimal newTotal = currentTotal.add(dto.getAllocationPercentage());
        if (newTotal.compareTo(new BigDecimal("100")) > 0) {
            throw new ResourceConflictException(
                    "Assigning " + dto.getAllocationPercentage() + "% would exceed 100% total allocation for user "
                    + user.getUsername() + ". Current allocation: " + currentTotal + "%"
            );
        }

        ResourceAssignment assignment = new ResourceAssignment();
        assignment.setUser(user);
        assignment.setProject(project);
        assignment.setAllocationPercentage(dto.getAllocationPercentage());
        assignment.setRole(dto.getRole());

        return resourceAssignmentRepository.save(assignment);
    }
}
