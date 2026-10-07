# OrbitView

A project & resource management app with a **Spring Boot** backend and a
**plain HTML / CSS / vanilla JavaScript** frontend (no frameworks, no build
step).

```
orbitview-fullstack/
├── backend/     Spring Boot API (unchanged — not touched by this rebuild)
└── frontend/    HTML/CSS/JS frontend (replaces the old React app)
```

---

## 1. Running the backend

Requirements: Java 17+, Maven, MySQL running locally.

```bash
cd backend
mvn spring-boot:run
```

This starts the API on **http://localhost:8080**.

Database connection is configured in
`backend/src/main/resources/application.properties`:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/orbit_view_db?createDatabaseIfNotExist=true
spring.datasource.username=root
spring.datasource.password=abcd
```

Update the username/password there to match your local MySQL setup if
needed. The `orbit_view_db` database is created automatically on first run;
tables are created/updated automatically via `spring.jpa.hibernate.ddl-auto=update`.

You'll need at least one row in the `system_users` table to log in — the
app has no self-service registration endpoint, so create a user directly
in MySQL (with a BCrypt-hashed password) or via whatever seed data your
team already uses.

---

## 2. Running the frontend

The frontend is static HTML/CSS/JS — **it is not a Node/npm project**,
there's nothing to install or build.

### Important: which port you serve it on matters

The backend's CORS configuration (`backend/.../config/CorsConfig.java`)
only allows requests from:

- `http://localhost:5173`
- `http://localhost:3000`

This project was left **completely unchanged** on request, so the frontend
must be served from one of those exact origins — opening `index.html`
directly by double-clicking it (a `file://` URL) will *not* work, and
serving it on a different port will be blocked by CORS.

Pick whichever of these is easiest for you:

**Option A — Python (already installed on most systems):**
```bash
cd frontend
python3 -m http.server 3000
```
Then open **http://localhost:3000**.

**Option B — Node's `serve` package:**
```bash
cd frontend
npx serve -l 5173
```
Then open **http://localhost:5173**.

**Option C — VS Code "Live Server" extension:**
Set its port to `3000` or `5173` in the extension settings before clicking
"Go Live".

---

## 3. API configuration

The frontend talks to the backend via `frontend/js/api.js`:

```js
const API_BASE_URL = "http://localhost:8080";
```

Change this one line if your backend runs somewhere else. Every other JS
file calls the shared `ApiClient` helper in that file, so this is the only
place the base URL needs to change.

The JWT returned by `POST /login` is stored in `localStorage` and sent as
`Authorization: Bearer <token>` on every subsequent request. A `401`
response automatically clears the session and redirects to the login page.

---

## 4. Pages

| Page | File | Notes |
|---|---|---|
| Login | `index.html` | Calls `POST /login` |
| Dashboard | `dashboard.html` | `GET /api/stats/dashboard`; `GET /api/reports/global-summary` for `STRATEGIC_DIRECTOR` only |
| Departments | `departments.html` | Full CRUD + "Add Budget" — create/edit/delete restricted to `STRATEGIC_DIRECTOR` (backend-enforced) |
| Projects | `projects.html` | Full CRUD — create/edit/delete restricted to `DEPARTMENT_HEAD` / `PROJECT_MANAGER` (backend-enforced) |
| Employees | `employees.html` | Read-only user list (no user-management endpoints exist on the backend) + "Assign to Project" for `STRATEGIC_DIRECTOR` / `DEPARTMENT_HEAD` |
| Tasks | `tasks.html` | Read-only list of project milestones (no milestone CRUD endpoint exists on the backend) |
| Profile | `profile.html` | Shows the logged-in user's info; Logout |

Role-restricted buttons/actions are hidden client-side based on the `role`
returned at login, but this is purely a UI convenience — the backend
enforces the real access control via `@PreAuthorize`, so calling an
endpoint you're not permitted to use will still be rejected with `403`.

---

## 5. Login credentials

On first startup (empty `system_users` table), `DataSeeder.java` inserts
starter data automatically — departments, real user rows, projects,
milestones, and resource assignments — so the app has data to show as
soon as the backend boots. No manual SQL needed.

| Username | Password | Role |
|---|---|---|
| `director` | `director123` | STRATEGIC_DIRECTOR |
| `depthead` | `depthead123` | DEPARTMENT_HEAD |
| `manager` | `manager123` | PROJECT_MANAGER |
| `contributor` | `contributor123` | RESOURCE_CONTRIBUTOR |
| `finance` | `finance123` | FINANCE_OFFICER |

Two extra employees (`jchen`, `rpatel`, both password `password123`) are
also seeded so the Employees / Assign-to-Project lists aren't bare.

The seeder only runs once — it checks `system_users` is empty first — so
it's safe to leave in place; it won't duplicate data on restarts.

---

## 6. What changed vs. the previous version

- The React/Vite frontend has been removed entirely and replaced with
  plain HTML/CSS/JS in `frontend/`.
- **Fixed a bug where Employees/Tasks (and anything else backed by the
  database) were always empty, for every role.** The backend previously
  authenticated logins against a hardcoded `InMemoryUserDetailsManager`
  (5 fake accounts) that had no matching rows in the `system_users`
  MySQL table. Meanwhile `GET /api/users`, the `employees` list nested
  under `GET /api/departments`, and milestones nested under
  `GET /api/projects` all read from that same MySQL table — which
  nothing ever wrote to. So no matter which role you logged in as, those
  pages had nothing to show, and login always returned `departmentId:
  null`.
  - `UserDetailsConfig.java` now loads real users from
    `SystemUserRepository` instead of the in-memory list (`SystemUser`
    already implements `UserDetails`, so this was a drop-in swap).
  - `AuthService.java` now returns the logged-in user's real
    `departmentId` instead of always `null`.
  - Added `DataSeeder.java`, a `CommandLineRunner` that seeds
    departments/users/projects/milestones/resource-assignments once, on
    first run against an empty database (see credentials table above).
