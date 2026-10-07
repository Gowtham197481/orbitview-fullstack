package com.example.demo.scheduler;

import com.example.demo.entity.Project;
import com.example.demo.entity.ProjectStatus;
import com.example.demo.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;

@Slf4j
@Component
@RequiredArgsConstructor
public class ProjectStatusScheduler {

    private final ProjectRepository projectRepository;

    private static final Set<ProjectStatus> TERMINAL_STATUSES = Set.of(
            ProjectStatus.COMPLETED,
            ProjectStatus.CANCELLED,
            ProjectStatus.EXPIRED
    );

    @Scheduled(cron = "0 * * * * *")
    @Transactional
    public void checkAndUpdateExpiredProjects() {
        log.info("Running project status check at {}", LocalDate.now());

        List<Project> projects = projectRepository.findAll();
        int updated = 0;

        for (Project project : projects) {
            if (!TERMINAL_STATUSES.contains(project.getStatus())
                    && project.getEndDate() != null
                    && project.getEndDate().isBefore(LocalDate.now())) {
                project.setStatus(ProjectStatus.EXPIRED);
                projectRepository.save(project);
                updated++;
                log.info("Project '{}' (id={}) marked as EXPIRED", project.getTitle(), project.getId());
            }
        }

        if (updated > 0) {
            log.info("Marked {} project(s) as EXPIRED", updated);
        }
    }

    @EventListener(ApplicationReadyEvent.class)
    @Scheduled(initialDelay = 10000, fixedDelay = Long.MAX_VALUE)
    @Transactional
    public void runOnStartup() {
        log.info("Running startup project status check...");
        checkAndUpdateExpiredProjects();
    }
}
