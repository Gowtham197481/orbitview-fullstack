

const NAV_ITEMS = [
  { href: "dashboard.html", label: "Dashboard", icon: "&#9632;" },
  { href: "departments.html", label: "Departments", icon: "&#9776;" },
  { href: "projects.html", label: "Projects", icon: "&#128193;" },
  { href: "employees.html", label: "Employees", icon: "&#128100;" },
  { href: "tasks.html", label: "Tasks", icon: "&#10003;" },
  { href: "profile.html", label: "Profile", icon: "&#9881;" },
];

/**
 * Call at the top of every protected page. Redirects to login if there is
 * no active session, and returns the current user object otherwise.
 */
function requireAuth() {
  if (!Session.isLoggedIn()) {
    window.location.href = "index.html";
    return null;
  }
  return Session.getUser();
}

/**
 * Builds the sidebar + topbar shell HTML around whatever markup already
 * lives inside <main id="page-content">...</main> on the page, and wires up
 * logout / mobile menu toggling. Expects the page to contain:
 *   <div id="app-shell">
 *     <div id="page-content">...page-specific markup...</div>
 *   </div>
 */
function renderAppShell(activeHref, pageTitle) {
  const user = Session.getUser();
  const shell = document.getElementById("app-shell");
  if (!shell) return;

  const navLinksHtml = NAV_ITEMS.map((item) => {
    const isActive = item.href === activeHref ? "active" : "";
    return `<a href="${item.href}" class="${isActive}"><span class="nav-icon">${item.icon}</span>${item.label}</a>`;
  }).join("");

  const initials = user && user.username ? user.username.slice(0, 2).toUpperCase() : "?";

  const pageContentEl = document.getElementById("page-content");
  const pageContentHtml = pageContentEl ? pageContentEl.outerHTML : "";

  shell.innerHTML = `
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-brand">
        <span class="logo-dot"></span>
        <span>OrbitView</span>
      </div>
      <nav class="sidebar-nav">${navLinksHtml}</nav>
      <div class="sidebar-footer">Signed in as<br><strong>${escapeHtml(user ? user.role : "")}</strong></div>
    </aside>
    <div class="sidebar-overlay" id="sidebar-overlay"></div>
    <div class="main">
      <header class="topbar">
        <div class="flex gap-12" style="align-items:center;">
          <button class="menu-toggle" id="menu-toggle" aria-label="Toggle menu">&#9776;</button>
          <div class="topbar-title">${escapeHtml(pageTitle)}</div>
        </div>
        <div class="topbar-user">
          <div class="user-meta">
            <div class="user-name">${escapeHtml(user ? user.username : "")}</div>
            <div class="user-role">${escapeHtml(user ? user.role.replace(/_/g, " ") : "")}</div>
          </div>
          <div class="avatar-circle">${escapeHtml(initials)}</div>
          <button class="btn btn-secondary btn-sm" id="logout-btn">Logout</button>
        </div>
      </header>
      <div class="page-content">${pageContentHtml}</div>
    </div>
  `;

  document.getElementById("logout-btn").addEventListener("click", logout);

  const menuToggle = document.getElementById("menu-toggle");
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebar-overlay");
  if (menuToggle) {
    menuToggle.addEventListener("click", () => {
      sidebar.classList.toggle("open");
      overlay.classList.toggle("show");
    });
  }
  if (overlay) {
    overlay.addEventListener("click", () => {
      sidebar.classList.remove("open");
      overlay.classList.remove("show");
    });
  }
}

function logout() {
  Session.clear();
  window.location.href = "index.html";
}

/**
 * Small toast notification in the top-right corner.
 * @param {string} message
 * @param {"success"|"error"|"info"} type
 */
function toast(message, type = "info") {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    document.body.appendChild(container);
  }
  const el = document.createElement("div");
  el.className = `toast toast-${type}`;
  el.textContent = message;
  container.appendChild(el);
  setTimeout(() => {
    el.remove();
  }, 4000);
}

function formatCurrency(value) {
  const num = Number(value || 0);
  const formatted = num.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `₹${formatted}`;
}

function formatDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function statusBadgeClass(status) {
  const map = {
    ACTIVE: "badge-success",
    PROPOSED: "badge-info",
    ON_HOLD: "badge-warning",
    COMPLETED: "badge-success",
    CANCELLED: "badge-danger",
    EXPIRED: "badge-danger",
    PENDING: "badge-neutral",
    IN_PROGRESS: "badge-info",
    ACHIVED: "badge-success",
    OVERDUE: "badge-danger",
  };
  return map[status] || "badge-neutral";
}

/**
 * Simple modal open/close helpers. Expects a <div class="modal-overlay" id="...">
 * wrapper already in the page markup.
 */
function openModal(modalId) {
  document.getElementById(modalId).classList.add("show");
}
function closeModal(modalId) {
  document.getElementById(modalId).classList.remove("show");
}

/**
 * Wires up any element with [data-close-modal="modalId"] and clicking the
 * overlay background itself to close that modal.
 */
function wireModalDismiss() {
  document.querySelectorAll("[data-close-modal]").forEach((el) => {
    el.addEventListener("click", () => closeModal(el.getAttribute("data-close-modal")));
  });
  document.querySelectorAll(".modal-overlay").forEach((overlay) => {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) overlay.classList.remove("show");
    });
  });
}
