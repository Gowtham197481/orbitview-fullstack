/* =========================================================
   OrbitView - auth.js
   Logic for the login page (index.html) only.
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  // If already logged in, skip straight to the dashboard.
  if (Session.isLoggedIn()) {
    window.location.href = "dashboard.html";
    return;
  }

  const form = document.getElementById("login-form");
  const alertBox = document.getElementById("login-alert");
  const submitBtn = document.getElementById("login-submit");
  const submitLabel = document.getElementById("login-submit-label");
  const submitSpinner = document.getElementById("login-submit-spinner");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    hideAlert();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    if (!validateLoginForm(username, password)) {
      return;
    }

    setLoading(true);
    try {
      const authResponse = await ApiClient.request("/login", {
        method: "POST",
        body: { username, password },
        auth: false,
      });
      Session.save(authResponse);
      window.location.href = "dashboard.html";
    } catch (err) {
      showAlert(err.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  });

  function validateLoginForm(username, password) {
    const usernameError = document.getElementById("username-error");
    const passwordError = document.getElementById("password-error");
    let valid = true;

    if (!username) {
      usernameError.textContent = "Username is required";
      valid = false;
    } else {
      usernameError.textContent = "";
    }

    if (!password) {
      passwordError.textContent = "Password is required";
      valid = false;
    } else {
      passwordError.textContent = "";
    }

    return valid;
  }

  function showAlert(message) {
    alertBox.textContent = message;
    alertBox.classList.add("show");
  }

  function hideAlert() {
    alertBox.textContent = "";
    alertBox.classList.remove("show");
  }

  function setLoading(isLoading) {
    submitBtn.disabled = isLoading;
    submitLabel.textContent = isLoading ? "Signing in..." : "Sign In";
    submitSpinner.classList.toggle("hidden", !isLoading);
  }
});
