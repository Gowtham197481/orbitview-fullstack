package com.example.demo.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "resource_assignments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ResourceAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id")
    private SystemUser user;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "project_id")
    private Project project;

    @Column(precision = 5, scale = 2)
    private BigDecimal allocationPercentage;

    private String role;
}
