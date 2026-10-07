package com.example.demo.controller;

import com.example.demo.dto.ResourceAssignmentDto;
import com.example.demo.entity.ResourceAssignment;
import com.example.demo.service.ResourceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/resources")
@RequiredArgsConstructor
public class ResourceController {

    private final ResourceService resourceService;

    @PostMapping("/assign")
    @PreAuthorize("hasAnyRole('STRATEGIC_DIRECTOR', 'DEPARTMENT_HEAD')")
    public ResponseEntity<ResourceAssignment> assignResource(@Valid @RequestBody ResourceAssignmentDto dto) {
        ResourceAssignment assignment = resourceService.assignResource(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(assignment);
    }
}
