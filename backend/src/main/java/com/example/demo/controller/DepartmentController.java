package com.example.demo.controller;

import com.example.demo.entity.Department;
import com.example.demo.service.DepartmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/departments")
@RequiredArgsConstructor
public class DepartmentController {

    private final DepartmentService departmentService;

    @GetMapping
    public ResponseEntity<List<Department>> getAllDepartments() {
        return ResponseEntity.ok(departmentService.getAllDepartments());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Department> getDepartmentById(@PathVariable Long id) {
        return ResponseEntity.ok(departmentService.getDepartmentById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('STRATEGIC_DIRECTOR')")
    public ResponseEntity<Department> createDepartment(@Valid @RequestBody Department department) {
        Department created = departmentService.createDepartment(department);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('STRATEGIC_DIRECTOR')")
    public ResponseEntity<Department> updateDepartment(@PathVariable Long id, @Valid @RequestBody Department department) {
        Department updated = departmentService.updateDepartment(id, department);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('STRATEGIC_DIRECTOR')")
    public ResponseEntity<Void> deleteDepartment(@PathVariable Long id) {
        departmentService.deleteDepartment(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/budget")
    @PreAuthorize("hasRole('STRATEGIC_DIRECTOR')")
    public ResponseEntity<Department> addBudget(@PathVariable Long id, @RequestBody Map<String, BigDecimal> body) {
        BigDecimal amount = body.get("amount");
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            return ResponseEntity.badRequest().build();
        }
        Department updated = departmentService.addBudget(id, amount);
        return ResponseEntity.ok(updated);
    }
}
