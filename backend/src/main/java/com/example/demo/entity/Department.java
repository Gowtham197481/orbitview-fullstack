package com.example.demo.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "departments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Department {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String name;

    @Column(unique = true, length = 10)
    private String code;

    @Column(precision = 19, scale = 2)
    private BigDecimal totalAnnualBudget;

    @Column(precision = 19, scale = 2)
    private BigDecimal remainingBudget;

    private LocalDateTime createdAt;

    @ManyToMany(mappedBy = "departments")
    @JsonIgnore
    private List<Project> projects;

    @OneToMany(mappedBy = "department")
    private List<SystemUser> employees;
}
