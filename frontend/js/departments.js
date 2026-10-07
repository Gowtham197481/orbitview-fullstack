/* =========================================================
   OrbitView - departments.js
   CRUD for /api/departments (create/update/delete restricted
   to STRATEGIC_DIRECTOR, matching @PreAuthorize on the backend).
   Includes live search and budget overview mode support.
   ========================================================= */

let departmentsCache = [];
let isBudgetView = false;

document.addEventListener("DOMContentLoaded", async () => {
  const user = requireAuth();
  if (!user) return;

  renderAppShell("departments.html", "Departments");
  wireModalDismiss();

  const canManage = Session.hasRole("STRATEGIC_DIRECTOR");
  if (canManage) {
    const addBtn = document.getElementById("add-department-btn");
    if (addBtn) addBtn.classList.remove("hidden");
  }

  const addBtn = document.getElementById("add-department-btn");
  if (addBtn) addBtn.addEventListener("click", () => openCreateModal());

  const deptForm = document.getElementById("department-form");
  if (deptForm) deptForm.addEventListener("submit", handleDepartmentFormSubmit);

  const budgetForm = document.getElementById("budget-form");
  if (budgetForm) budgetForm.addEventListener("submit", handleBudgetFormSubmit);

  // Search input & clear button
  const searchInput = document.getElementById("department-search-input");
  const clearBtn = document.getElementById("clear-dept-filter-btn");
  if (searchInput) searchInput.addEventListener("input", filterAndRenderDepartments);
  if (clearBtn) clearBtn.addEventListener("click", () => {
    if (searchInput) searchInput.value = "";
    filterAndRenderDepartments();
  });

  // Check for budget view parameter
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("view") === "budget") {
    isBudgetView = true;
    const banner = document.getElementById("dept-budget-banner");
    if (banner) banner.classList.remove("hidden");

    const dismissBtn = document.getElementById("dismiss-budget-banner-btn");
    if (dismissBtn) {
      dismissBtn.addEventListener("click", () => {
        banner.classList.add("hidden");
        isBudgetView = false;
        renderDepartmentsTable(departmentsCache);
      });
    }
  }

  await loadDepartments();
});

async function loadDepartments() {
  const tbody = document.getElementById("departments-tbody");
  try {
    departmentsCache = await ApiClient.get("/api/departments");
    filterAndRenderDepartments();
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" class="empty-state">Failed to load departments: ${escapeHtml(err.message)}</td></tr>`;
  }
}

function filterAndRenderDepartments() {
  const searchInput = document.getElementById("department-search-input");
  const clearBtn = document.getElementById("clear-dept-filter-btn");
  const query = (searchInput ? searchInput.value : "").trim().toLowerCase();

  if (clearBtn) {
    if (query) {
      clearBtn.classList.remove("hidden");
    } else {
      clearBtn.classList.add("hidden");
    }
  }

  const filtered = departmentsCache.filter((dept) => {
    if (!query) return true;
    const nameMatch = (dept.name || "").toLowerCase().includes(query);
    const codeMatch = (dept.code || "").toLowerCase().includes(query);
    return nameMatch || codeMatch;
  });

  renderDepartmentsTable(filtered, Boolean(query));
}

function renderDepartmentsTable(list, isFiltered = false) {
  const tbody = document.getElementById("departments-tbody");
  const canManage = Session.hasRole("STRATEGIC_DIRECTOR");

  if (!list || list.length === 0) {
    if (isFiltered) {
      tbody.innerHTML = `<tr><td colspan="7" class="empty-state">No departments matching your search.</td></tr>`;
    } else {
      tbody.innerHTML = `<tr><td colspan="7" class="empty-state">No departments yet.</td></tr>`;
    }
    return;
  }

  tbody.innerHTML = list
    .map((dept) => {
      const employeeCount = dept.employees ? dept.employees.length : 0;
      const actions = canManage
        ? `
          <div class="table-actions">
            <button class="btn btn-secondary btn-sm" onclick="openBudgetModal(${dept.id})">Add Budget</button>
            <button class="btn btn-secondary btn-sm" onclick="openEditModal(${dept.id})">Edit</button>
            <button class="btn btn-danger btn-sm" onclick="handleDeleteDepartment(${dept.id})">Delete</button>
          </div>`
        : `<span class="text-muted">-</span>`;

      const budgetHighlightClass = isBudgetView ? "style='font-weight:700; color:var(--color-primary);'" : "";

      return `
        <tr>
          <td><strong>${escapeHtml(dept.name)}</strong></td>
          <td><code>${escapeHtml(dept.code || "-")}</code></td>
          <td ${budgetHighlightClass}>${formatCurrency(dept.totalAnnualBudget)}</td>
          <td ${budgetHighlightClass}>${formatCurrency(dept.remainingBudget)}</td>
          <td>${employeeCount}</td>
          <td>${formatDate(dept.createdAt)}</td>
          <td>${actions}</td>
        </tr>
      `;
    })
    .join("");
}

function openCreateModal() {
  document.getElementById("department-modal-title").textContent = "New Department";
  document.getElementById("department-id").value = "";
  document.getElementById("department-name").value = "";
  document.getElementById("department-code").value = "";
  document.getElementById("department-budget").value = "";
  clearDepartmentFormErrors();
  openModal("department-modal");
}

function openEditModal(id) {
  const dept = departmentsCache.find((d) => d.id === id);
  if (!dept) return;
  document.getElementById("department-modal-title").textContent = "Edit Department";
  document.getElementById("department-id").value = dept.id;
  document.getElementById("department-name").value = dept.name;
  document.getElementById("department-code").value = dept.code || "";
  document.getElementById("department-budget").value = dept.totalAnnualBudget;
  clearDepartmentFormErrors();
  openModal("department-modal");
}

function clearDepartmentFormErrors() {
  document.getElementById("department-name-error").textContent = "";
  document.getElementById("department-code-error").textContent = "";
  document.getElementById("department-budget-error").textContent = "";
  document.getElementById("department-form-alert").classList.remove("show");
}

async function handleDepartmentFormSubmit(event) {
  event.preventDefault();
  clearDepartmentFormErrors();

  const id = document.getElementById("department-id").value;
  const name = document.getElementById("department-name").value.trim();
  const code = document.getElementById("department-code").value.trim();
  const budget = document.getElementById("department-budget").value;

  let valid = true;
  if (!name) {
    document.getElementById("department-name-error").textContent = "Name is required";
    valid = false;
  }
  if (!budget || Number(budget) <= 0) {
    document.getElementById("department-budget-error").textContent = "Enter a positive budget amount";
    valid = false;
  }
  if (!valid) return;

  const payload = {
    name,
    code: code || null,
    totalAnnualBudget: Number(budget),
  };

  const submitBtn = document.getElementById("department-form-submit");
  submitBtn.disabled = true;
  try {
    if (id) {
      await ApiClient.put(`/api/departments/${id}`, payload);
      toast("Department updated", "success");
    } else {
      await ApiClient.post("/api/departments", payload);
      toast("Department created", "success");
    }
    closeModal("department-modal");
    await loadDepartments();
  } catch (err) {
    const alertBox = document.getElementById("department-form-alert");
    alertBox.textContent = err.message;
    alertBox.classList.add("show");
  } finally {
    submitBtn.disabled = false;
  }
}

async function handleDeleteDepartment(id) {
  const dept = departmentsCache.find((d) => d.id === id);
  const label = dept ? dept.name : `#${id}`;
  if (!confirm(`Delete department "${label}"? This will also remove its projects.`)) return;

  try {
    await ApiClient.del(`/api/departments/${id}`);
    toast("Department deleted", "success");
    await loadDepartments();
  } catch (err) {
    toast(err.message, "error");
  }
}

function openBudgetModal(id) {
  document.getElementById("budget-department-id").value = id;
  document.getElementById("budget-amount").value = "";
  document.getElementById("budget-amount-error").textContent = "";
  document.getElementById("budget-form-alert").classList.remove("show");
  openModal("budget-modal");
}

async function handleBudgetFormSubmit(event) {
  event.preventDefault();
  const id = document.getElementById("budget-department-id").value;
  const amount = document.getElementById("budget-amount").value;

  const errorEl = document.getElementById("budget-amount-error");
  if (!amount || Number(amount) <= 0) {
    errorEl.textContent = "Enter a positive amount";
    return;
  }
  errorEl.textContent = "";

  const submitBtn = document.getElementById("budget-form-submit");
  submitBtn.disabled = true;
  try {
    await ApiClient.post(`/api/departments/${id}/budget`, { amount: Number(amount) });
    toast("Budget added", "success");
    closeModal("budget-modal");
    await loadDepartments();
  } catch (err) {
    const alertBox = document.getElementById("budget-form-alert");
    alertBox.textContent = err.message;
    alertBox.classList.add("show");
  } finally {
    submitBtn.disabled = false;
  }
}
