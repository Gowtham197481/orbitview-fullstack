

document.addEventListener("DOMContentLoaded", async () => {
  const user = requireAuth();
  if (!user) return;

  renderAppShell("profile.html", "Profile");

  document.getElementById("profile-username").textContent = user.username;
  document.getElementById("profile-role").textContent = (user.role || "").replace(/_/g, " ");
  document.getElementById("profile-role-input").value = (user.role || "").replace(/_/g, " ");
  document.getElementById("profile-avatar").textContent = user.username.slice(0, 2).toUpperCase();
  document.getElementById("profile-logout-btn").addEventListener("click", logout);

  await loadExtraProfileInfo(user);
});

async function loadExtraProfileInfo(sessionUser) {
  try {
    const [users, departments] = await Promise.all([
      ApiClient.get("/api/users"),
      ApiClient.get("/api/departments"),
    ]);

    const matchedUser = users.find((u) => u.username === sessionUser.username);
    document.getElementById("profile-email").value = matchedUser ? matchedUser.email : "-";

    let departmentName = "Unassigned";
    departments.forEach((dept) => {
      if ((dept.employees || []).some((emp) => emp.username === sessionUser.username)) {
        departmentName = dept.name;
      }
    });
    document.getElementById("profile-department").value = departmentName;
  } catch (err) {
    toast("Could not load full profile details", "error");
  }
}
