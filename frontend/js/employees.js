/* =========================================================
   OrbitView - employees.js
   Employee directory and project assignment.
   Includes live search by username, email, role, or department.
   ========================================================= */

let usersCache = [];
let departmentByUsername = {};
let projectsForSelect = [];

document.addEventListener("DOMContentLoaded", async () => {
  const user = requireAuth();
  if (!user) return;

  renderAppShell("employees.html", "Employees");
  wireModalDismiss();

  const form = document.getElementById("assign-form");
  if (form) form.addEventListener("submit", handleAssignFormSubmit);

  const searchInput = document.getElementById("employee-search-input");
  const clearBtn = document.getElementById("clear-employee-search-btn");

  if (searchInput) searchInput.addEventListener("input", filterAndRenderEmployees);
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      if (searchInput) searchInput.value = "";
      filterAndRenderEmployees();
    });
  }

  await Promise.all([loadEmployees(), loadProjectsForSelect()]);
});

async function loadEmployees() {
  const tbody = document.getElementById("employees-tbody");
  try {
    const [users, departments] = await Promise.all([
      ApiClient.get("/api/users"),
      ApiClient.get("/api/departments"),
    ]);

    usersCache = users;
    departmentByUsername = {};
    departments.forEach((dept) => {
      (dept.employees || []).forEach((emp) => {
        departmentByUsername[emp.username] = dept.name;
      });
    });

    filterAndRenderEmployees();
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty-state">Failed to load employees: ${escapeHtml(err.message)}</td></tr>`;
  }
}

function filterAndRenderEmployees() {
  const searchInput = document.getElementById("employee-search-input");
  const clearBtn = document.getElementById("clear-employee-search-btn");
  const query = (searchInput ? searchInput.value : "").trim().toLowerCase();

  if (clearBtn) {
    if (query) {
      clearBtn.classList.remove("hidden");
    } else {
      clearBtn.classList.add("hidden");
    }
  }

  const filtered = usersCache.filter((u) => {
    if (!query) return true;
    const nameMatch = (u.username || "").toLowerCase().includes(query);
    const emailMatch = (u.email || "").toLowerCase().includes(query);
    const roleMatch = (u.role || "").toLowerCase().includes(query);
    const deptMatch = (departmentByUsername[u.username] || "").toLowerCase().includes(query);
    return nameMatch || emailMatch || roleMatch || deptMatch;
  });

  renderEmployeesTable(filtered, Boolean(query));
}

function renderEmployeesTable(list, isFiltered = false) {
  const tbody = document.getElementById("employees-tbody");
  const canAssign = Session.hasRole("STRATEGIC_DIRECTOR", "DEPARTMENT_HEAD");

  if (!list || list.length === 0) {
    if (isFiltered) {
      tbody.innerHTML = `<tr><td colspan="5" class="empty-state">No employees matching your search.</td></tr>`;
    } else {
      tbody.innerHTML = `<tr><td colspan="5" class="empty-state">No employees found.</td></tr>`;
    }
    return;
  }

  tbody.innerHTML = list
    .map((u) => {
      const dept = departmentByUsername[u.username] || "Unassigned";
      const actions = canAssign
        ? `<button class="btn btn-secondary btn-sm" onclick="openAssignModal(${u.id}, '${escapeHtml(u.username).replace(/'/g, "\\'")}')">Assign to Project</button>`
        : `<span class="text-muted">-</span>`;

      return `
        <tr>
          <td><strong>${escapeHtml(u.username)}</strong></td>
          <td>${escapeHtml(u.email)}</td>
          <td><span class="badge badge-neutral">${escapeHtml((u.role || "").replace(/_/g, " "))}</span></td>
          <td>${escapeHtml(dept)}</td>
          <td>${actions}</td>
        </tr>
      `;
    })
    .join("");
}

async function loadProjectsForSelect() {
  try {
    projectsForSelect = await ApiClient.get("/api/projects");
    const select = document.getElementById("assign-project");
    if (select) {
      select.innerHTML = projectsForSelect
        .map((p) => `<option value="${p.id}">${escapeHtml(p.title)}</option>`)
        .join("");
    }
  } catch (err) {
    toast("Could not load projects for assignment", "error");
  }
}

function openAssignModal(userId, username) {
  document.getElementById("assign-user-id").value = userId;
  document.getElementById("assign-user-label").value = username;
  document.getElementById("assign-role").value = "";
  document.getElementById("assign-allocation").value = "";
  clearAssignFormErrors();
  openModal("assign-modal");
}

function clearAssignFormErrors() {
  document.getElementById("assign-project-error").textContent = "";
  document.getElementById("assign-role-error").textContent = "";
  document.getElementById("assign-allocation-error").textContent = "";
  document.getElementById("assign-form-alert").classList.remove("show");
}

async function handleAssignFormSubmit(event) {
  event.preventDefault();
  clearAssignFormErrors();

  const userId = document.getElementById("assign-user-id").value;
  const projectId = document.getElementById("assign-project").value;
  const role = document.getElementById("assign-role").value.trim();
  const allocation = document.getElementById("assign-allocation").value;

  let valid = true;
  if (!projectId) {
    document.getElementById("assign-project-error").textContent = "Select a project";
    valid = false;
  }
  if (!role) {
    document.getElementById("assign-role-error").textContent = "Role is required";
    valid = false;
  }
  if (!allocation || Number(allocation) <= 0 || Number(allocation) > 100) {
    document.getElementById("assign-allocation-error").textContent = "Enter a value between 0.01 and 100";
    valid = false;
  }
  if (!valid) return;

  const payload = {
    userId: Number(userId),
    projectId: Number(projectId),
    role,
    allocationPercentage: Number(allocation),
  };

  const submitBtn = document.getElementById("assign-form-submit");
  submitBtn.disabled = true;
  try {
    await ApiClient.post("/api/resources/assign", payload);
    toast("Employee assigned to project", "success");
    closeModal("assign-modal");
  } catch (err) {
    const alertBox = document.getElementById("assign-form-alert");
    alertBox.textContent = err.message;
    alertBox.classList.add("show");
  } finally {
    submitBtn.disabled = false;
  }
}
