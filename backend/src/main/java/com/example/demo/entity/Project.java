package com.example.demo.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name = "projects")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    private ProjectStatus status;

    @Column(name = "allocated_budget", precision = 19, scale = 2)
    private BigDecimal allocatedBudget;

    private LocalDate startDate;

    private LocalDate endDate;

    @ManyToMany
    @JoinTable(
            name = "project_departments",
            joinColumns = @JoinColumn(name = "project_id"),
            inverseJoinColumns = @JoinColumn(name = "department_id")
    )
    @JsonIgnoreProperties("projects")
    private List<Department> departments;

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Milestone> milestones;
}
