package com.example.demo.repository;

import com.example.demo.entity.ResourceAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
// import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

// @Repository
public interface ResourceAssignmentRepository extends JpaRepository<ResourceAssignment, Long> {
    List<ResourceAssignment> findByProjectId(Long projectId);
    List<ResourceAssignment> findByUserId(Long userId);

    @Query("SELECT SUM(r.allocationPercentage) FROM ResourceAssignment r WHERE r.user.id = :userId")
    BigDecimal sumAllocationByUserId(@Param("userId") Long userId);
}
