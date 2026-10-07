/* =========================================================
   OrbitView - projects.js
   CRUD for /api/projects (create/update/delete restricted to
   DEPARTMENT_HEAD / PROJECT_MANAGER, matching backend @PreAuthorize).
   Includes search and filtering by status and department,
   with query param support (e.g. projects.html?status=ACTIVE).
   ========================================================= */

let projectsCache = [];
let departmentsForSelect = [];

document.addEventListener("DOMContentLoaded", async () => {
  const user = requireAuth();
  if (!user) return;

  renderAppShell("projects.html", "Projects");
  wireModalDismiss();

  const canManage = Session.hasRole("DEPARTMENT_HEAD", "PROJECT_MANAGER");
  if (canManage) {
    const addBtn = document.getElementById("add-project-btn");
    if (addBtn) addBtn.classList.remove("hidden");
  }

  const addBtn = document.getElementById("add-project-btn");
  if (addBtn) addBtn.addEventListener("click", () => openCreateModal());

  const form = document.getElementById("project-form");
  if (form) form.addEventListener("submit", handleProjectFormSubmit);

  const refreshBtn = document.getElementById("refresh-statuses-btn");
  if (refreshBtn) refreshBtn.addEventListener("click", handleRefreshStatuses);

  // Setup search & filter listeners
  const searchInput = document.getElementById("project-search-input");
  const statusFilter = document.getElementById("project-status-filter");
  const deptFilter = document.getElementById("project-dept-filter");
  const clearFiltersBtn = document.getElementById("clear-filters-btn");
  const resetFilterBtn = document.getElementById("reset-filter-btn");

  if (searchInput) searchInput.addEventListener("input", filterAndRenderProjects);
  if (statusFilter) statusFilter.addEventListener("change", filterAndRenderProjects);
  if (deptFilter) deptFilter.addEventListener("change", filterAndRenderProjects);
  if (clearFiltersBtn) clearFiltersBtn.addEventListener("click", resetProjectFilters);
  if (resetFilterBtn) resetFilterBtn.addEventListener("click", resetProjectFilters);

  // Check URL query parameters (e.g. ?status=ACTIVE)
  const urlParams = new URLSearchParams(window.location.search);
  const statusParam = urlParams.get("status");
  if (statusParam && statusFilter) {
    statusFilter.value = statusParam.toUpperCase();
  }

  await Promise.all([loadDepartmentsForSelect(), loadProjects()]);
});

async function loadDepartmentsForSelect() {
  try {
    departmentsForSelect = await ApiClient.get("/api/departments");
    const modalSelect = document.getElementById("project-department");
    if (modalSelect) {
      modalSelect.innerHTML = departmentsForSelect
        .map((d) => `<option value="${d.id}">${escapeHtml(d.name)}</option>`)
        .join("");
    }

    const filterSelect = document.getElementById("project-dept-filter");
    if (filterSelect) {
      filterSelect.innerHTML =
        `<option value="">All Departments</option>` +
        departmentsForSelect
          .map((d) => `<option value="${d.id}">${escapeHtml(d.name)}</option>`)
          .join("");
    }
  } catch (err) {
    toast("Could not load departments for the project form", "error");
  }
}

async function loadProjects() {
  const tbody = document.getElementById("projects-tbody");
  try {
    projectsCache = await ApiClient.get("/api/projects");
    filterAndRenderProjects();
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" class="empty-state">Failed to load projects: ${escapeHtml(err.message)}</td></tr>`;
  }
}

function filterAndRenderProjects() {
  const searchInput = document.getElementById("project-search-input");
  const statusFilter = document.getElementById("project-status-filter");
  const deptFilter = document.getElementById("project-dept-filter");
  const clearBtn = document.getElementById("clear-filters-btn");
  const banner = document.getElementById("filter-banner");
  const bannerText = document.getElementById("filter-banner-text");

  const query = (searchInput ? searchInput.value : "").trim().toLowerCase();
  const selectedStatus = statusFilter ? statusFilter.value : "";
  const selectedDeptId = deptFilter ? deptFilter.value : "";

  const hasFilter = Boolean(query || selectedStatus || selectedDeptId);

  if (clearBtn) {
    if (hasFilter) {
      clearBtn.classList.remove("hidden");
    } else {
      clearBtn.classList.add("hidden");
    }
  }

  if (banner && bannerText) {
    if (selectedStatus) {
      const statusLabel = selectedStatus.replace(/_/g, " ");
      bannerText.textContent = `Filtered by status: "${statusLabel}"`;
      banner.classList.remove("hidden");
    } else {
      banner.classList.add("hidden");
    }
  }

  // Update browser URL query param without reload
  const url = new URL(window.location);
  if (selectedStatus) {
    url.searchParams.set("status", selectedStatus);
  } else {
    url.searchParams.delete("status");
  }
  window.history.replaceState({}, "", url.toString());

  const filtered = projectsCache.filter((project) => {
    // Status check
    if (selectedStatus && project.status !== selectedStatus) {
      return false;
    }

    // Department check
    if (selectedDeptId) {
      const matchDept = project.departments && project.departments.some((d) => String(d.id) === selectedDeptId);
      if (!matchDept) return false;
    }

    // Keyword check
    if (query) {
      const titleMatch = (project.title || "").toLowerCase().includes(query);
      const descMatch = (project.description || "").toLowerCase().includes(query);
      const deptMatch =
        project.departments &&
        project.departments.some((d) => (d.name || "").toLowerCase().includes(query));
      if (!titleMatch && !descMatch && !deptMatch) {
        return false;
      }
    }

    return true;
  });

  renderProjectsTable(filtered, hasFilter);
}

function resetProjectFilters() {
  const searchInput = document.getElementById("project-search-input");
  const statusFilter = document.getElementById("project-status-filter");
  const deptFilter = document.getElementById("project-dept-filter");
  const banner = document.getElementById("filter-banner");
  const clearBtn = document.getElementById("clear-filters-btn");

  if (searchInput) searchInput.value = "";
  if (statusFilter) statusFilter.value = "";
  if (deptFilter) deptFilter.value = "";
  if (banner) banner.classList.add("hidden");
  if (clearBtn) clearBtn.classList.add("hidden");

  const url = new URL(window.location);
  url.searchParams.delete("status");
  window.history.replaceState({}, "", url.pathname);

  renderProjectsTable(projectsCache, false);
}

function renderProjectsTable(list, hasFilter = false) {
  const tbody = document.getElementById("projects-tbody");
  const canManage = Session.hasRole("DEPARTMENT_HEAD", "PROJECT_MANAGER");

  if (!list || list.length === 0) {
    if (hasFilter) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="empty-state">
            No projects match the selected filter.
            <button class="btn btn-secondary btn-sm" style="margin-left:8px;" onclick="resetProjectFilters()">Show All Projects</button>
          </td>
        </tr>
      `;
    } else {
      tbody.innerHTML = `<tr><td colspan="7" class="empty-state">No projects yet.</td></tr>`;
    }
    return;
  }

  tbody.innerHTML = list
    .map((project) => {
      const deptNames =
        project.departments && project.departments.length
          ? project.departments.map((d) => escapeHtml(d.name)).join(", ")
          : "-";
      const actions = canManage
        ? `
          <div class="table-actions">
            <button class="btn btn-secondary btn-sm" onclick="openEditModal(${project.id})">Edit</button>
            <button class="btn btn-danger btn-sm" onclick="handleDeleteProject(${project.id})">Delete</button>
          </div>`
        : `<span class="text-muted">-</span>`;

      return `
        <tr>
          <td><strong>${escapeHtml(project.title)}</strong></td>
          <td><span class="badge ${statusBadgeClass(project.status)}">${escapeHtml((project.status || "").replace(/_/g, " "))}</span></td>
          <td>${deptNames}</td>
          <td>${formatCurrency(project.allocatedBudget)}</td>
          <td>${formatDate(project.startDate)}</td>
          <td>${formatDate(project.endDate)}</td>
          <td>${actions}</td>
        </tr>
      `;
    })
    .join("");
}

function openCreateModal() {
  document.getElementById("project-modal-title").textContent = "New Project";
  document.getElementById("project-id").value = "";
  document.getElementById("project-title").value = "";
  document.getElementById("project-description").value = "";
  document.getElementById("project-budget").value = "";
  document.getElementById("project-start").value = "";
  document.getElementById("project-end").value = "";
  document.getElementById("project-department").disabled = false;
  clearProjectFormErrors();
  openModal("project-modal");
}

function openEditModal(id) {
  const project = projectsCache.find((p) => p.id === id);
  if (!project) return;

  document.getElementById("project-modal-title").textContent = "Edit Project";
  document.getElementById("project-id").value = project.id;
  document.getElementById("project-title").value = project.title;
  document.getElementById("project-description").value = project.description || "";
  document.getElementById("project-budget").value = project.allocatedBudget;
  document.getElementById("project-start").value = project.startDate;
  document.getElementById("project-end").value = project.endDate;

  const select = document.getElementById("project-department");
  if (project.departments && project.departments.length) {
    select.value = project.departments[0].id;
  }
  // Backend does not support changing a project's department on update.
  select.disabled = true;

  clearProjectFormErrors();
  openModal("project-modal");
}

function clearProjectFormErrors() {
  ["title", "department", "budget", "start", "end"].forEach((f) => {
    const el = document.getElementById(`project-${f}-error`);
    if (el) el.textContent = "";
  });
  document.getElementById("project-form-alert").classList.remove("show");
}

async function handleProjectFormSubmit(event) {
  event.preventDefault();
  clearProjectFormErrors();

  const id = document.getElementById("project-id").value;
  const title = document.getElementById("project-title").value.trim();
  const description = document.getElementById("project-description").value.trim();
  const departmentId = document.getElementById("project-department").value;
  const budget = document.getElementById("project-budget").value;
  const startDate = document.getElementById("project-start").value;
  const endDate = document.getElementById("project-end").value;

  let valid = true;
  if (!title) {
    document.getElementById("project-title-error").textContent = "Title is required";
    valid = false;
  }
  if (!departmentId) {
    document.getElementById("project-department-error").textContent = "Select a department";
    valid = false;
  }
  if (!budget || Number(budget) <= 0) {
    document.getElementById("project-budget-error").textContent = "Enter a positive budget";
    valid = false;
  }
  if (!startDate) {
    document.getElementById("project-start-error").textContent = "Start date is required";
    valid = false;
  }
  if (!endDate) {
    document.getElementById("project-end-error").textContent = "End date is required";
    valid = false;
  }
  if (startDate && endDate && endDate <= startDate) {
    document.getElementById("project-end-error").textContent = "End date must be after start date";
    valid = false;
  }
  if (!valid) return;

  const payload = {
    title,
    description,
    allocatedBudget: Number(budget),
    startDate,
    endDate,
    departmentIds: [Number(departmentId)],
  };

  const submitBtn = document.getElementById("project-form-submit");
  submitBtn.disabled = true;
  try {
    if (id) {
      await ApiClient.put(`/api/projects/${id}`, payload);
      toast("Project updated", "success");
    } else {
      await ApiClient.post("/api/projects", payload);
      toast("Project created", "success");
    }
    closeModal("project-modal");
    await loadProjects();
  } catch (err) {
    const alertBox = document.getElementById("project-form-alert");
    alertBox.textContent = err.message;
    alertBox.classList.add("show");
  } finally {
    submitBtn.disabled = false;
  }
}

async function handleDeleteProject(id) {
  const project = projectsCache.find((p) => p.id === id);
  const label = project ? project.title : `#${id}`;
  if (!confirm(`Delete project "${label}"? Its allocated budget will be returned to the department.`)) return;

  try {
    await ApiClient.del(`/api/projects/${id}`);
    toast("Project deleted", "success");
    await loadProjects();
  } catch (err) {
    toast(err.message, "error");
  }
}

async function handleRefreshStatuses() {
  const btn = document.getElementById("refresh-statuses-btn");
  btn.disabled = true;
  try {
    await ApiClient.post("/api/projects/check-statuses", null);
    toast("Project statuses refreshed", "success");
    await loadProjects();
  } catch (err) {
    toast(err.message, "error");
  } finally {
    btn.disabled = false;
  }
}
