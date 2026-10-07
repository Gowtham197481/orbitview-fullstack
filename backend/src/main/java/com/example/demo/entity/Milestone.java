package com.example.demo.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "milestones")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Milestone {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String label;

    private LocalDate dueDate;

    private LocalDate completionDate;

    @Enumerated(EnumType.STRING)
    private MilestoneStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id")
    @JsonIgnore
    private Project project;
}
