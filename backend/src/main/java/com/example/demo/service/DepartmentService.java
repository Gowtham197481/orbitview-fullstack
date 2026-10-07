package com.example.demo.service;

import com.example.demo.entity.Department;
import com.example.demo.entity.Project;
import com.example.demo.entity.ProjectStatus;
import com.example.demo.entity.SystemUser;
import com.example.demo.exception.BusinessValidationException;
import com.example.demo.exception.EntityNotFoundException;
import com.example.demo.repository.DepartmentRepository;
import com.example.demo.repository.ProjectRepository;
import com.example.demo.repository.SystemUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DepartmentService {

    private final DepartmentRepository departmentRepository;
    private final ProjectRepository projectRepository;
    private final SystemUserRepository userRepository;

    @Transactional
    public Department createDepartment(Department department) {
        if (departmentRepository.findByCode(department.getCode()).isPresent()) {
            throw new BusinessValidationException(
                    "Department with code '" + department.getCode() + "' already exists"
            );
        }
        department.setRemainingBudget(department.getTotalAnnualBudget());
        department.setCreatedAt(LocalDateTime.now());
        return departmentRepository.save(department);
    }

    @Transactional
    public Department updateDepartment(Long id, Department updatedData) {
        Department existing = departmentRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Department not found with id: " + id));

        existing.setName(updatedData.getName());
        existing.setTotalAnnualBudget(updatedData.getTotalAnnualBudget());

        recalculateRemainingBudget(existing);
        return departmentRepository.save(existing);
    }

    @Transactional
    public void recalculateRemainingBudget(Department department) {
        List<Project> projects = projectRepository.findByDepartments_Id(department.getId());

        BigDecimal totalAllocated = projects.stream()
                .filter(p -> p.getStatus() != ProjectStatus.CANCELLED)
                .map(Project::getAllocatedBudget)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        department.setRemainingBudget(department.getTotalAnnualBudget().subtract(totalAllocated));
        departmentRepository.save(department);
    }

    @Transactional
    public void deleteDepartment(Long id) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Department not found with id: " + id));

        // Clear department reference from all employees
        List<SystemUser> employees = department.getEmployees();
        if (employees != null) {
            for (SystemUser user : employees) {
                user.setDepartment(null);
                userRepository.save(user);
            }
        }

        // Delete all associated projects safely
        List<Project> projects = projectRepository.findByDepartments_Id(id);
        for (Project project : projects) {
            project.getDepartments().remove(department);
            if (project.getDepartments().isEmpty()) {
                projectRepository.delete(project);
            } else {
                projectRepository.save(project);
            }
        }

        departmentRepository.delete(department);
    }

    public List<Department> getAllDepartments() {
        return departmentRepository.findAll();
    }

    public Department getDepartmentById(Long id) {
        return departmentRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Department not found with id: " + id));
    }

    @Transactional
    public Department addBudget(Long id, BigDecimal amount) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Department not found with id: " + id));

        department.setTotalAnnualBudget(department.getTotalAnnualBudget().add(amount));
        department.setRemainingBudget(department.getRemainingBudget().add(amount));
        return departmentRepository.save(department);
    }
}
