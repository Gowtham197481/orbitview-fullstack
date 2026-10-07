/* =========================================================
   OrbitView - api.js
   Central place for:
     - backend base URL
     - localStorage session (token / user) handling
     - a generic fetch wrapper used by every page's JS file
   All other JS files call ApiClient.request(...) instead of
   calling fetch() directly, so auth headers + error handling
   stay consistent everywhere.
   ========================================================= */

// Change this if your Spring Boot backend runs on a different host/port.
const API_BASE_URL = "http://localhost:8080";

// Keys used in localStorage to persist the logged-in session.
const STORAGE_TOKEN_KEY = "orbitview_token";
const STORAGE_USER_KEY = "orbitview_user";

const Session = {
  /**
   * Save the login response (token, username, role, departmentId) locally.
   */
  save(authResponse) {
    localStorage.setItem(STORAGE_TOKEN_KEY, authResponse.token);
    localStorage.setItem(
      STORAGE_USER_KEY,
      JSON.stringify({
        username: authResponse.username,
        role: authResponse.role,
        departmentId: authResponse.departmentId,
      })
    );
  },

  getToken() {
    return localStorage.getItem(STORAGE_TOKEN_KEY);
  },

  getUser() {
    const raw = localStorage.getItem(STORAGE_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  },

  isLoggedIn() {
    return !!this.getToken();
  },

  hasRole(...roles) {
    const user = this.getUser();
    return !!user && roles.includes(user.role);
  },

  clear() {
    localStorage.removeItem(STORAGE_TOKEN_KEY);
    localStorage.removeItem(STORAGE_USER_KEY);
  },
};

const ApiClient = {
  /**
   * Generic request helper.
   * @param {string} path - e.g. "/api/departments"
   * @param {object} options
   * @param {string} [options.method="GET"]
   * @param {object|null} [options.body=null] - will be JSON.stringify-ed
   * @param {boolean} [options.auth=true] - attach Authorization header
   * @returns {Promise<any>} parsed JSON response body (or null for 204s)
   */
  async request(path, { method = "GET", body = null, auth = true } = {}) {
    const headers = { "Content-Type": "application/json" };

    if (auth) {
      const token = Session.getToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }

    let response;
    try {
      response = await fetch(`${API_BASE_URL}${path}`, {
        method,
        headers,
        body: body !== null ? JSON.stringify(body) : undefined,
      });
    } catch (networkError) {
      throw new Error(
        "Could not reach the backend. Is the Spring Boot server running on " +
          API_BASE_URL +
          "?"
      );
    }

    // Session expired / invalid token -> force re-login.
    if (response.status === 401) {
      Session.clear();
      if (!window.location.pathname.endsWith("index.html") && window.location.pathname !== "/") {
        window.location.href = "index.html";
      }
      throw new Error("Your session has expired. Please log in again.");
    }

    // No content (e.g. DELETE, check-statuses) -> nothing to parse.
    if (response.status === 204) {
      return null;
    }

    const text = await response.text();
    let data = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        data = text;
      }
    }

    if (!response.ok) {
      const message =
        data && typeof data === "object" && data.error
          ? data.error
          : `Request failed (HTTP ${response.status})`;
      throw new Error(message);
    }

    return data;
  },

  get(path) {
    return this.request(path, { method: "GET" });
  },
  post(path, body) {
    return this.request(path, { method: "POST", body });
  },
  put(path, body) {
    return this.request(path, { method: "PUT", body });
  },
  del(path) {
    return this.request(path, { method: "DELETE" });
  },
};
