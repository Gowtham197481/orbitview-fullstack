package com.example.demo.config;

import com.example.demo.entity.*;
import com.example.demo.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Populates the database with starter data the first time the app runs
 * against an empty "system_users" table.
 *
 * Previously the app authenticated against 5 hardcoded in-memory accounts
 * that had no matching rows in MySQL, so every screen that reads from the
 * database (Employees, Tasks, Dashboard, Departments' employee lists, etc.)
 * was empty no matter who logged in. This seeder creates real rows for
 * those same 5 accounts - same usernames/passwords as before - plus a
 * handful of departments, projects, milestones and resource assignments
 * so the app has something to show out of the box.
 *
 * It's safe to re-run: it only seeds when system_users is empty.
 */
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final SystemUserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final ProjectRepository projectRepository;
    private final MilestoneRepository milestoneRepository;
    private final ResourceAssignmentRepository resourceAssignmentRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        if (userRepository.count() > 0) {
            return; // already seeded
        }

        // ---- Departments -------------------------------------------------
        Department engineering = newDepartment("Engineering", "ENG", "500000.00");
        Department marketing = newDepartment("Marketing", "MKT", "200000.00");
        Department finance = newDepartment("Finance", "FIN", "150000.00");
        departmentRepository.save(engineering);
        departmentRepository.save(marketing);
        departmentRepository.save(finance);

        // ---- Users (same credentials the app shipped with before) --------
        SystemUser director = newUser("director", "director@orbitview.io", "director123",
                UserRole.STRATEGIC_DIRECTOR, null);
        SystemUser depthead = newUser("depthead", "depthead@orbitview.io", "depthead123",
                UserRole.DEPARTMENT_HEAD, engineering);
        SystemUser manager = newUser("manager", "manager@orbitview.io", "manager123",
                UserRole.PROJECT_MANAGER, engineering);
        SystemUser contributor = newUser("contributor", "contributor@orbitview.io", "contributor123",
                UserRole.RESOURCE_CONTRIBUTOR, engineering);
        SystemUser financeOfficer = newUser("finance", "finance@orbitview.io", "finance123",
                UserRole.FINANCE_OFFICER, finance);

        // A couple of extra employees so the Employees/Assign lists aren't bare
        SystemUser designer = newUser("jchen", "jchen@orbitview.io", "password123",
                UserRole.RESOURCE_CONTRIBUTOR, marketing);
        SystemUser qaLead = newUser("rpatel", "rpatel@orbitview.io", "password123",
                UserRole.RESOURCE_CONTRIBUTOR, engineering);

        userRepository.save(director);
        userRepository.save(depthead);
        userRepository.save(manager);
        userRepository.save(contributor);
        userRepository.save(financeOfficer);
        userRepository.save(designer);
        userRepository.save(qaLead);

        // ---- Projects + Milestones ----------------------------------------
        Project apiRevamp = newProject("API Platform Revamp",
                "Rebuild the public API on the new gateway.",
                "120000.00", LocalDate.of(2026, 3, 1), LocalDate.of(2026, 9, 30),
                ProjectStatus.ACTIVE, engineering);
        Project mobileApp = newProject("Mobile App Launch",
                "Ship v1 of the customer-facing mobile app.",
                "95000.00", LocalDate.of(2026, 1, 15), LocalDate.of(2026, 6, 30),
                ProjectStatus.ACTIVE, engineering);
        Project brandRefresh = newProject("Brand Refresh Campaign",
                "Refresh brand identity and launch new marketing site.",
                "60000.00", LocalDate.of(2026, 5, 1), LocalDate.of(2026, 8, 15),
                ProjectStatus.PROPOSED, marketing);

        apiRevamp = projectRepository.save(apiRevamp);
        mobileApp = projectRepository.save(mobileApp);
        brandRefresh = projectRepository.save(brandRefresh);

        milestoneRepository.save(newMilestone("Design API schema", apiRevamp,
                LocalDate.of(2026, 3, 20), LocalDate.of(2026, 3, 18), MilestoneStatus.ACHIVED));
        milestoneRepository.save(newMilestone("Migrate auth service", apiRevamp,
                LocalDate.of(2026, 5, 15), null, MilestoneStatus.IN_PROGRESS));
        milestoneRepository.save(newMilestone("Deprecate legacy endpoints", apiRevamp,
                LocalDate.of(2026, 9, 1), null, MilestoneStatus.PENDING));

        milestoneRepository.save(newMilestone("Finish onboarding flow", mobileApp,
                LocalDate.of(2026, 2, 28), LocalDate.of(2026, 2, 25), MilestoneStatus.ACHIVED));
        milestoneRepository.save(newMilestone("App store submission", mobileApp,
                LocalDate.of(2026, 6, 1), null, MilestoneStatus.IN_PROGRESS));

        milestoneRepository.save(newMilestone("Finalize new logo", brandRefresh,
                LocalDate.of(2026, 5, 20), null, MilestoneStatus.PENDING));

        // ---- Resource assignments ------------------------------------------
        resourceAssignmentRepository.save(newAssignment(manager, apiRevamp, "Project Lead", "40.00"));
        resourceAssignmentRepository.save(newAssignment(contributor, apiRevamp, "Backend Engineer", "80.00"));
        resourceAssignmentRepository.save(newAssignment(qaLead, apiRevamp, "QA Engineer", "50.00"));
        resourceAssignmentRepository.save(newAssignment(manager, mobileApp, "Project Lead", "40.00"));
        resourceAssignmentRepository.save(newAssignment(designer, brandRefresh, "Designer", "60.00"));
    }

    private Department newDepartment(String name, String code, String budget) {
        Department department = new Department();
        department.setName(name);
        department.setCode(code);
        department.setTotalAnnualBudget(new BigDecimal(budget));
        department.setRemainingBudget(new BigDecimal(budget));
        department.setCreatedAt(LocalDateTime.now());
        return department;
    }

    private SystemUser newUser(String username, String email, String rawPassword, UserRole role, Department department) {
        SystemUser user = new SystemUser();
        user.setUsername(username);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(rawPassword));
        user.setRole(role);
        user.setDepartment(department);
        return user;
    }

    private Project newProject(String title, String description, String budget, LocalDate start, LocalDate end,
                                ProjectStatus status, Department department) {
        Project project = new Project();
        project.setTitle(title);
        project.setDescription(description);
        project.setAllocatedBudget(new BigDecimal(budget));
        project.setStartDate(start);
        project.setEndDate(end);
        project.setStatus(status);
        project.setDepartments(java.util.List.of(department));
        department.setRemainingBudget(department.getRemainingBudget().subtract(new BigDecimal(budget)));
        return project;
    }

    private Milestone newMilestone(String label, Project project, LocalDate dueDate, LocalDate completionDate,
                                    MilestoneStatus status) {
        Milestone milestone = new Milestone();
        milestone.setLabel(label);
        milestone.setProject(project);
        milestone.setDueDate(dueDate);
        milestone.setCompletionDate(completionDate);
        milestone.setStatus(status);
        return milestone;
    }

    private ResourceAssignment newAssignment(SystemUser user, Project project, String role, String allocation) {
        ResourceAssignment assignment = new ResourceAssignment();
        assignment.setUser(user);
        assignment.setProject(project);
        assignment.setRole(role);
        assignment.setAllocationPercentage(new BigDecimal(allocation));
        return assignment;
    }
}
