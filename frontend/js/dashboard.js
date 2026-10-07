/* =========================================================
   OrbitView - dashboard.js
   Dashboard logic: stats and role-based strategic summaries.
   ========================================================= */

document.addEventListener("DOMContentLoaded", async () => {
  const user = requireAuth();
  if (!user) return;

  renderAppShell("dashboard.html", "Dashboard");
  wireModalDismiss();

  await loadDashboardStats();

  if (Session.hasRole("STRATEGIC_DIRECTOR")) {
    const summarySection = document.getElementById("summary-section");
    if (summarySection) {
      summarySection.classList.remove("hidden");
      await loadGlobalSummary();
    }
  }
});

async function loadDashboardStats() {
  try {
    const stats = await ApiClient.get("/api/stats/dashboard");
    const totalProjectsEl = document.getElementById("stat-total-projects");
    const activeProjectsEl = document.getElementById("stat-active-projects");
    const totalDeptsEl = document.getElementById("stat-total-departments");
    const totalBudgetEl = document.getElementById("stat-total-budget");

    if (totalProjectsEl) totalProjectsEl.textContent = stats.totalProjects ?? 0;
    if (activeProjectsEl) activeProjectsEl.textContent = stats.activeProjects ?? 0;
    if (totalDeptsEl) totalDeptsEl.textContent = stats.totalDepartments ?? 0;
    if (totalBudgetEl) totalBudgetEl.textContent = formatCurrency(stats.totalBudget);
  } catch (err) {
    toast(err.message, "error");
  }
}

async function loadGlobalSummary() {
  const tbody = document.getElementById("summary-tbody");
  if (!tbody) return;

  try {
    const summary = await ApiClient.get("/api/reports/global-summary");

    if (!summary || summary.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="empty-state">No department data yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = summary
      .map((row) => {
        const pct = Math.max(0, Math.min(100, row.averageProjectCompletion || 0));
        return `
          <tr>
            <td><strong>${escapeHtml(row.departmentName)}</strong></td>
            <td>${row.projectCount}</td>
            <td>${formatCurrency(row.totalAllocatedBudget)}</td>
            <td>${formatCurrency(row.remainingBudget)}</td>
            <td>
              <div class="flex" style="align-items:center; gap:8px;">
                <div class="summary-progress" style="flex:1;">
                  <div class="summary-progress-bar" style="width:${pct}%"></div>
                </div>
                <span class="text-muted" style="font-size:12px; min-width:32px;">${pct.toFixed(0)}%</span>
              </div>
            </td>
          </tr>
        `;
      })
      .join("");
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty-state">Failed to load: ${escapeHtml(err.message)}</td></tr>`;
  }
}
