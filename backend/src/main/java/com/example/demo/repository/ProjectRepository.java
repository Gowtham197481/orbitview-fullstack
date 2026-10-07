package com.example.demo.repository;

import com.example.demo.entity.Project;
import com.example.demo.entity.ProjectStatus;
import org.springframework.data.jpa.repository.JpaRepository;
// import org.springframework.stereotype.Repository;

import java.util.List;

// @Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {
    List<Project> findByDepartments_Id(Long departmentId);
    long countByStatus(ProjectStatus status);
}
