/* =========================================================
   OrbitView - tasks.js
   Milestones are nested inside each Project returned by
   GET /api/projects (Project.milestones).
   Includes live search, project filtering, status filtering,
   and URL parameter support.
   ========================================================= */

let allProjectsCache = [];
let allTasksFlat = [];

document.addEventListener("DOMContentLoaded", async () => {
  const user = requireAuth();
  if (!user) return;

  renderAppShell("tasks.html", "Tasks");

  const searchInput = document.getElementById("task-search-input");
  const projectFilter = document.getElementById("project-filter");
  const statusFilter = document.getElementById("task-status-filter");
  const clearBtn = document.getElementById("clear-task-filters-btn");

  if (searchInput) searchInput.addEventListener("input", renderTasksTable);
  if (projectFilter) projectFilter.addEventListener("change", renderTasksTable);
  if (statusFilter) statusFilter.addEventListener("change", renderTasksTable);
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      if (searchInput) searchInput.value = "";
      if (projectFilter) projectFilter.value = "";
      if (statusFilter) statusFilter.value = "";
      renderTasksTable();
    });
  }

  await loadTasks();
});

async function loadTasks() {
  const tbody = document.getElementById("tasks-tbody");
  try {
    allProjectsCache = await ApiClient.get("/api/projects");

    allTasksFlat = [];
    allProjectsCache.forEach((project) => {
      (project.milestones || []).forEach((m) => {
        allTasksFlat.push({ ...m, projectTitle: project.title, projectId: project.id });
      });
    });

    const filterSelect = document.getElementById("project-filter");
    if (filterSelect) {
      filterSelect.innerHTML =
        `<option value="">All Projects</option>` +
        allProjectsCache.map((p) => `<option value="${p.id}">${escapeHtml(p.title)}</option>`).join("");
    }

    // Check URL params (e.g. tasks.html?projectId=1 or tasks.html?status=ACHIVED)
    const urlParams = new URLSearchParams(window.location.search);
    const projectIdParam = urlParams.get("projectId");
    const statusParam = urlParams.get("status");

    if (projectIdParam && filterSelect) {
      filterSelect.value = projectIdParam;
    }
    const statusSelect = document.getElementById("task-status-filter");
    if (statusParam && statusSelect) {
      statusSelect.value = statusParam.toUpperCase();
    }

    renderTasksTable();
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty-state">Failed to load tasks: ${escapeHtml(err.message)}</td></tr>`;
  }
}

function renderTasksTable() {
  const tbody = document.getElementById("tasks-tbody");
  const searchInput = document.getElementById("task-search-input");
  const projectSelect = document.getElementById("project-filter");
  const statusSelect = document.getElementById("task-status-filter");
  const clearBtn = document.getElementById("clear-task-filters-btn");

  const query = (searchInput ? searchInput.value : "").trim().toLowerCase();
  const filterProjectId = projectSelect ? projectSelect.value : "";
  const filterStatus = statusSelect ? statusSelect.value : "";

  const hasFilter = Boolean(query || filterProjectId || filterStatus);
  if (clearBtn) {
    if (hasFilter) {
      clearBtn.classList.remove("hidden");
    } else {
      clearBtn.classList.add("hidden");
    }
  }

  const visibleTasks = allTasksFlat.filter((t) => {
    if (filterProjectId && String(t.projectId) !== filterProjectId) {
      return false;
    }
    if (filterStatus && t.status !== filterStatus) {
      return false;
    }
    if (query) {
      const labelMatch = (t.label || "").toLowerCase().includes(query);
      const projMatch = (t.projectTitle || "").toLowerCase().includes(query);
      if (!labelMatch && !projMatch) return false;
    }
    return true;
  });

  if (visibleTasks.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty-state">No milestones found matching criteria.</td></tr>`;
    return;
  }

  tbody.innerHTML = visibleTasks
    .map(
      (t) => `
        <tr>
          <td><strong>${escapeHtml(t.label)}</strong></td>
          <td><a href="projects.html" title="View project">${escapeHtml(t.projectTitle)}</a></td>
          <td><span class="badge ${statusBadgeClass(t.status)}">${escapeHtml((t.status || "").replace(/_/g, " "))}</span></td>
          <td>${formatDate(t.dueDate)}</td>
          <td>${formatDate(t.completionDate)}</td>
        </tr>
      `
    )
    .join("");
}
