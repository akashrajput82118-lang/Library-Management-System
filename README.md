# Library Management System — Full-Stack Project

Spring Boot + MySQL backend, React + Vite frontend. Ye project aapke existing
`jdbcDemo` workspace me hi extend kiya gaya hai. Database `LIBRARY_MANAGEMENT`
aur uske existing data ko preserve kiya gaya hai.

---

## 1. What is implemented

| Area | Status |
| --- | --- |
| Books CRUD + search + pagination | Done |
| Students CRUD + search + pagination | Done |
| Issue / return workflow with 14-day loan | Done |
| Copy-count protection with locks + transactions | Done |
| Server-side validation + clean JSON errors | Done |
| Admin login with BCrypt + JWT | Done |
| Protected APIs (everything except login/health) | Done |
| Dashboard statistics + recent activity | Done |
| Responsive React UI with loading/empty/error states | Done |
| Automated unit tests for issue/return rules | Done (4/4) |
| Postman collection | Included |
| README + run scripts | Included |

No fake book/student rows are used. Every table and dashboard number is loaded
from MySQL through the Spring Boot API.

---

## 2. Architecture

```
React (Vite, port 5173)
        │  Axios + Bearer JWT
        ▼
Spring Boot REST API (port 8080)
        │  Spring Data JPA / Hibernate
        ▼
MySQL 8 — LIBRARY_MANAGEMENT
   books, students, admins, issued_books, fines
```

The existing `ddl-auto=validate` setting is preserved, so Hibernate checks the
schema but never recreates or drops your tables.

---

## 3. Prerequisites

- Java 21 or newer (the project compiles with `--release 21`)
- MySQL 8 running on `localhost:3306`
- Node.js 18+ and npm
- IntelliJ IDEA (recommended) or Maven 3.9+
- The existing `LIBRARY_MANAGEMENT` database (already present)

> This machine has Java 25 and IntelliJ's bundled Maven, but `mvn` is not on
> PATH. The provided `run-backend.cmd` script finds IntelliJ's Maven
> automatically.

---

## 4. Project structure

```
jdbcDemo/
├── pom.xml
├── run-backend.cmd / run-backend.ps1
├── run-frontend.cmd / run-frontend.ps1
├── README.md
├── postman/
│   └── Library-Management-API.postman_collection.json
├── src/
│   ├── main/java/example/
│   │   ├── LibraryManagementApplication.java
│   │   ├── config/        SecurityConfig, AdminBootstrap
│   │   ├── controller/    Auth, Book, Student, IssuedBook, Dashboard, Health
│   │   ├── dto/           Request/response records
│   │   ├── entity/        Book, Student, Admin, IssuedBook
│   │   ├── exception/     ApiException, GlobalExceptionHandler
│   │   ├── repository/    Spring Data repositories
│   │   ├── security/      JwtService, JwtAuthenticationFilter, AdminDetailsService
│   │   └── service/       IssueService, IssueMapper
│   ├── main/java/files/   Old JDBC console app (kept, env-based DB config)
│   ├── main/resources/application.properties
│   └── test/java/example/service/IssueServiceTest.java
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── index.html
    ├── .env.example
    └── src/
        ├── api/client.js
        ├── components/
        ├── context/
        ├── pages/
        ├── utils/
        ├── App.jsx
        ├── main.jsx
        └── styles.css
```

---

## 5. Database

Existing tables used by the app:

- `books(book_id, title, author, category, total_copies, available_copies)`
- `students(student_id, name, email, phone, department)`
- `admins(admin_id, username, password_hash)`
- `issued_books(issue_id, book_id, student_id, issue_date, due_date, return_date, status)`
- `fines` (not managed by the UI yet; existing data is untouched)

Existing constraints are respected:

- `available_copies <= total_copies` and both counts `>= 0`
- `issued_books.status IN ('ISSUED','RETURNED')`
- `due_date >= issue_date`
- foreign keys from `issued_books` to `books` and `students`
- unique student email, unique admin username

The app never drops or recreates the database. Deleting a book/student that has
issue history is rejected with HTTP `409` instead of letting a foreign-key error
leak to the user.

---

## 6. Configuration — no secrets in source code

`src/main/resources/application.properties` reads environment variables:

| Variable | Default | Purpose |
| --- | --- | --- |
| `DB_URL` | `jdbc:mysql://localhost:3306/LIBRARY_MANAGEMENT?...` | JDBC URL |
| `DB_USERNAME` | `root` | MySQL user |
| `DB_PASSWORD` | *(empty)* | MySQL password — required |
| `JWT_SECRET` | *(empty)* | 32+ character signing secret. Empty = random per run |
| `JWT_EXPIRATION_MINUTES` | `480` | Token lifetime (8 hours) |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173` | Comma-separated frontend origins |
| `SERVER_PORT` | `8080` | Backend port |
| `JPA_SHOW_SQL` | `false` | Set `true` for SQL logs |
| `APP_ADMIN_USERNAME` | *(empty)* | Optional one-time admin create/reset |
| `APP_ADMIN_PASSWORD` | *(empty)* | Optional one-time admin create/reset (min 12 chars) |

Frontend environment variable (optional):

```
VITE_API_BASE_URL=http://localhost:8080/api
```

Copy `frontend/.env.example` to `frontend/.env` only if you need a different
backend URL. `.env` files are git-ignored.

### PowerShell example

```powershell
$env:DB_USERNAME = "root"
$env:DB_PASSWORD = "your-mysql-password"
$env:JWT_SECRET  = "replace-with-a-random-32-plus-character-secret"
```

Never commit real passwords or tokens.

---

## 7. Create or reset the first administrator

The existing `admins` table already has a row (`librarian`), but its plaintext
password is not stored anywhere (only a BCrypt hash). Use the one-time bootstrap
to set a password you know.

### Option A — PowerShell, before starting the backend

```powershell
$env:APP_ADMIN_USERNAME = "librarian"
$env:APP_ADMIN_PASSWORD = "MyStrongPassword123!"   # at least 12 characters

.\run-backend.cmd
```

On startup the backend logs:

```
Admin account 'librarian' was created or its password was reset successfully.
```

Then **remove** these variables (close the terminal or run):

```powershell
Remove-Item Env:APP_ADMIN_USERNAME
Remove-Item Env:APP_ADMIN_PASSWORD
```

Restart the backend and log in with `librarian` / `MyStrongPassword123!`.

### Option B — create a new admin

Use a different `APP_ADMIN_USERNAME` (for example `admin2`). The app inserts a
new row with the next `admin_id`. Same minimum 12-character rule applies.

### Option C — IntelliJ

Run > Edit Configurations > `LibraryManagementApplication` > Environment
variables:

```
DB_PASSWORD=your-mysql-password;JWT_SECRET=your-random-secret;APP_ADMIN_USERNAME=librarian;APP_ADMIN_PASSWORD=MyStrongPassword123!
```

Run once, then remove `APP_ADMIN_*` and run again.

Passwords are hashed with BCrypt cost 12. Plaintext passwords are never logged,
stored, or returned by any API.

---

## 8. Run the application

### 8.1 Backend (port 8080)

**Easiest (Windows):**

```powershell
cd C:\Users\hp\Desktop\jdbcDemo
.\run-backend.cmd
```

The script:

1. finds a JDK and IntelliJ's Maven if `mvn` is not on PATH,
2. prompts for the MySQL password (not stored),
3. generates a temporary JWT secret if `JWT_SECRET` is missing,
4. runs `spring-boot:run`.

**IntelliJ:** open the folder, wait for Maven import, run
`LibraryManagementApplication`.

**Manual PowerShell (if Maven is on PATH):**

```powershell
$env:DB_PASSWORD="your-mysql-password"
$env:JWT_SECRET="a-random-secret-with-at-least-32-characters"
mvn spring-boot:run
```

Health check:

```
GET http://localhost:8080/api/health
→ 200 {"status":"UP","timestamp":"..."}
```

### 8.2 Frontend (port 5173)

Open a **second** terminal:

```powershell
cd C:\Users\hp\Desktop\jdbcDemo
.\run-frontend.cmd
```

or manually:

```powershell
cd C:\Users\hp\Desktop\jdbcDemo\frontend
npm.cmd install
npm.cmd run dev
```

Open `http://localhost:5173` and sign in.

> `npm install` was already run once, so `node_modules` exists on this machine.

### 8.3 Production build of the frontend

```powershell
cd frontend
npm.cmd run build
```

Output goes to `frontend/dist/`. The backend does not serve these files; deploy
them separately (for example Nginx) and set `VITE_API_BASE_URL` at build time.

---

## 9. API reference

All `/api/**` endpoints except `POST /api/auth/login` and `GET /api/health`
require:

```
Authorization: Bearer <jwt-token>
```

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/api/health` | Public | Health check |
| POST | `/api/auth/login` | Public | Login, returns JWT |
| GET | `/api/auth/me` | Yes | Current admin |
| POST | `/api/auth/logout` | Yes | Confirms logout (client deletes token) |
| GET | `/api/books?q=` | Yes | List/search books |
| GET | `/api/books/search?q=` | Yes | Search title or author |
| GET | `/api/books/page?page=&size=&sortBy=&direction=&q=` | Yes | Paginated books |
| GET | `/api/books/{id}` | Yes | One book |
| POST | `/api/books` | Yes | Create book |
| PUT | `/api/books/{id}` | Yes | Update book |
| DELETE | `/api/books/{id}` | Yes | Delete book (blocked if issues exist) |
| GET | `/api/students?q=` | Yes | List/search students |
| GET | `/api/students/search?q=` | Yes | Search name or email |
| GET | `/api/students/page?...` | Yes | Paginated students |
| GET | `/api/students/{id}` | Yes | One student |
| POST | `/api/students` | Yes | Create student |
| PUT | `/api/students/{id}` | Yes | Update student |
| DELETE | `/api/students/{id}` | Yes | Delete student (blocked if issues exist) |
| GET | `/api/issues?status=&studentId=` | Yes | Issue history |
| GET | `/api/issues/{id}` | Yes | One issue |
| POST | `/api/issues` | Yes | Issue a book |
| PUT | `/api/issues/{id}/return` | Yes | Return a book |
| GET | `/api/dashboard/stats` | Yes | Dashboard counts |
| GET | `/api/dashboard/recent?limit=8` | Yes | Recent activity |

### Error format

```json
{
  "timestamp": "2026-10-26T18:00:00Z",
  "status": 400,
  "message": "Please correct the highlighted fields",
  "fieldErrors": {
    "email": "Enter a valid email address"
  }
}
```

Stack traces, SQL messages, and passwords are never returned to the client.

### Status codes used

- `200` success
- `201` created
- `204` deleted
- `400` validation / bad request / invalid copy counts
- `401` missing, invalid, or expired token; wrong login
- `403` authenticated but not allowed
- `404` record not found
- `409` duplicate ID/email, no copies available, duplicate return, delete
  blocked by issue records, database constraint conflict

---

## 10. Postman testing

Import:

```
postman/Library-Management-API.postman_collection.json
```

Set collection variable `baseUrl` to `http://localhost:8080` if needed.
Run **Auth → Login** first — its test script stores the JWT in the `token`
variable. All protected requests read `Bearer {{token}}`.

### 10.1 Login

```
POST http://localhost:8080/api/auth/login
Content-Type: application/json

{
  "username": "librarian",
  "password": "MyStrongPassword123!"
}
```

Expected `200`:

```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "tokenType": "Bearer",
  "username": "librarian",
  "expiresInSeconds": 28800
}
```

Wrong password → `401` with `"Invalid username or password"`.

### 10.2 Unauthorized check

```
GET http://localhost:8080/api/books
```

No `Authorization` header → `401`:

```json
{"status":401,"message":"Authentication required. Please log in."}
```

### 10.3 Create a book

```
POST http://localhost:8080/api/books
Authorization: Bearer <token>
Content-Type: application/json

{
  "bookId": 9001,
  "title": "Postman Test Book",
  "author": "API Tester",
  "category": "Testing",
  "totalCopies": 2,
  "availableCopies": 2
}
```

Expected `201` with the saved book. Duplicate ID → `409`.
`availableCopies > totalCopies` → `400`.

### 10.4 Update / delete a book

```
PUT http://localhost:8080/api/books/9001
Authorization: Bearer <token>
Content-Type: application/json

{
  "bookId": 9001,
  "title": "Postman Test Book Updated",
  "author": "API Tester",
  "category": "Testing",
  "totalCopies": 3,
  "availableCopies": 3
}
```

Expected `200`. Delete with no issue history → `204`. With issue history → `409`.

### 10.5 Create a student

```
POST http://localhost:8080/api/students
Authorization: Bearer <token>
Content-Type: application/json

{
  "studentId": 9001,
  "name": "Postman Student",
  "email": "postman.student@example.com",
  "phone": "9876543210",
  "department": "Testing"
}
```

Expected `201`. Same email with any letter case → `409`.
Invalid email → `400` with `fieldErrors.email`.

### 10.6 Issue a book

```
POST http://localhost:8080/api/issues
Authorization: Bearer <token>
Content-Type: application/json

{
  "bookId": 9001,
  "studentId": 9001
}
```

Expected `201`:

```json
{
  "issueId": 10,
  "bookId": 9001,
  "bookTitle": "Postman Test Book",
  "studentId": 9001,
  "studentName": "Postman Student",
  "issueDate": "2026-10-26",
  "dueDate": "2026-11-09",
  "returnDate": null,
  "status": "ISSUED",
  "overdue": false,
  "overdueDays": 0
}
```

The server calculates both dates (14-day loan). Available copies decrease by 1.
With zero available copies → `409`.

### 10.7 Return a book

```
PUT http://localhost:8080/api/issues/{{issueId}}/return
Authorization: Bearer <token>
```

Expected `200`, `status: "RETURNED"`, `returnDate` set, available copies +1.
Running the same request again → `409` `"This book has already been returned"`.

### 10.8 Dashboard

```
GET http://localhost:8080/api/dashboard/stats
GET http://localhost:8080/api/dashboard/recent?limit=8
Authorization: Bearer <token>
```

All numbers come from SQL queries, not constants.

---

## 11. Business rules and concurrency

- Issue is only allowed when `available_copies > 0`.
- Book and student must exist.
- Issue date = server today; due date = issue date + 14 days.
- Issuing: available − 1; returning: available + 1 (capped at total).
- Returning an already returned issue is rejected.
- `IssueService` uses `@Transactional` plus `SELECT ... FOR UPDATE`
  (`findByIdForUpdate`) on the book/issue row. Two librarians cannot take the
  last copy or return the same issue twice.
- Book updates lock the row before checking copy counts.
- The database's check constraints are the final safety net.
- Deleting a book/student with any issue history is blocked, preserving history.

---

## 12. Security notes

- Admin passwords: BCrypt cost 12. No plaintext anywhere.
- JWT: HS256, 8-hour expiry, signed with `JWT_SECRET`.
- If `JWT_SECRET` is not set, a random key is generated per backend start
  (secure, but existing tokens/logins become invalid after restart).
- Tokens are stored in `sessionStorage`, which is cleared when the tab closes.
  This limits exposure versus `localStorage`; for a high-security deployment,
  prefer an HttpOnly cookie + CSRF token design.
- CSRF is disabled for `/api/**` **because** authentication uses a Bearer header,
  not cookies. Browsers do not attach it automatically, so classic CSRF does not
  apply. If you switch to cookie sessions, re-enable CSRF.
- CORS allows only `http://localhost:5173` by default.
- All book/student/issue/dashboard endpoints require `ROLE_ADMIN`.
- Login and health are the only public endpoints.
- Logout is stateless: the browser deletes the token. There is no server-side
  revocation list in this beginner version.

---

## 13. Automated tests

```powershell
cd C:\Users\hp\Desktop\jdbcDemo
# In IntelliJ: right-click src/test → Run tests
# Or with Maven on PATH:
mvn test
```

`IssueServiceTest` covers:

1. issuing decreases available copies and sets issue/due dates;
2. zero available copies is rejected without saving;
3. returning increases available copies;
4. returning twice is rejected.

Verified result on this workspace:

```
Tests run: 4, Failures: 0, Errors: 0, Skipped: 0
```

Frontend production build:

```powershell
cd frontend
npm.cmd run build
```

Verified result: Vite build succeeded (106 modules).

---

## 14. End-to-end manual checklist

Start MySQL, backend, and frontend first.

| # | Test | Expected |
| --- | --- | --- |
| 1 | Open `http://localhost:5173` without token | Redirected to `/login` |
| 2 | Login with correct admin | Dashboard loads with live counts |
| 3 | Login with wrong password | Red error, stays on login |
| 4 | Open Books | Existing 4 books from MySQL |
| 5 | Add book, then search by title/author | New row appears; search filters |
| 6 | Edit book title/copies | Row updates; refresh keeps change |
| 7 | Try available > total | Inline validation, no request saved |
| 8 | Delete book with issue history | Error toast / 409, row remains |
| 9 | Add student, duplicate email | 409 message shown clearly |
| 10 | Search student by name/email | Correct filtered rows |
| 11 | Delete student with issue history | Blocked |
| 12 | Issue a book | Toast shows due date; available count −1 |
| 13 | Refresh Books / Dashboard | Counts still reflect MySQL |
| 14 | Return the same issue | Available count +1 |
| 15 | Return it again | 409 "already returned" |
| 16 | Issue a book with 0 available | 409 "No copies ... available" |
| 17 | Logout | Token cleared; protected pages redirect |
| 18 | Call `/api/books` without token | 401 JSON |
| 19 | Wait for token expiry (or set short expiry) | 401 and redirect to login |
| 20 | Check MySQL after errors | Counts unchanged and consistent |

### SQL consistency checks

```sql
USE LIBRARY_MANAGEMENT;

-- Active issues per book should match total - available
SELECT b.book_id, b.title, b.total_copies, b.available_copies,
       SUM(CASE WHEN i.status = 'ISSUED' THEN 1 ELSE 0 END) AS active_issues
FROM books b
LEFT JOIN issued_books i ON i.book_id = b.book_id
GROUP BY b.book_id, b.title, b.total_copies, b.available_copies;

-- Invalid copy balances (should return no rows)
SELECT * FROM books
WHERE available_copies < 0
   OR total_copies < 0
   OR available_copies > total_copies;

-- Duplicate returns / bad statuses (should return no rows)
SELECT * FROM issued_books
WHERE status NOT IN ('ISSUED', 'RETURNED')
   OR (status = 'RETURNED' AND return_date IS NULL);
```

---

## 15. Common errors and fixes

| Symptom | Fix |
| --- | --- |
| `Access denied for user 'root'@'localhost'` | Set `DB_PASSWORD` correctly; or run `run-backend.cmd` and enter it |
| `Port 8080 was already in use` | Stop the old Spring Boot/IntelliJ run, or set `SERVER_PORT=8081` and `VITE_API_BASE_URL=http://localhost:8081/api` |
| Backend starts but schema validation fails | The MySQL schema differs from the entities. Do not set `ddl-auto=update` on real data; compare columns/constraints first |
| Browser shows CORS error | Frontend origin must be in `CORS_ALLOWED_ORIGINS`; default is `http://localhost:5173`. Restart backend after changing it |
| Login works, then 401 after restart | `JWT_SECRET` was not set, so a new random key was generated. Set a permanent 32+ char secret |
| `npm.ps1 cannot be loaded` (execution policy) | Use `npm.cmd` or `run-frontend.cmd`, which bypasses the PowerShell script policy |
| `mvn` is not recognized | Use `run-backend.cmd`, or IntelliJ's Maven, or install Maven |
| `JAVA_HOME is not defined correctly` | `run-backend.cmd` auto-detects `C:\Program Files\Java\jdk-*`; otherwise set `JAVA_HOME` to a JDK 21+ folder |
| Cannot delete a book/student | It has issue history. Keep the history or clean related issue rows first |
| 401 on every protected request | Add `Authorization: Bearer <token>`; log in again after backend restart |

---

## 16. Changed and new files

### Modified existing files

- `pom.xml` — JWT dependencies, security test dependency
- `src/main/resources/application.properties` — env-based config, no password
- `src/main/java/example/entity/Book.java` — stricter validation
- `src/main/java/example/entity/Student.java` — stricter validation
- `src/main/java/example/entity/IssuedBook.java` — status constants, column mapping
- `src/main/java/example/repository/BookRepository.java` — search, locking, sums
- `src/main/java/example/repository/StudentRepository.java` — search, case-insensitive email
- `src/main/java/example/repository/IssuedBookRepository.java` — filters, counts, locks, recent
- `src/main/java/example/controller/BookController.java` — DTOs, validation, pagination, delete protection
- `src/main/java/example/controller/StudentController.java` — DTOs, validation, pagination, delete protection
- `src/main/java/example/controller/IssuedBookController.java` — DTO responses, filters, service calls
- `src/main/java/example/config/SecurityConfig.java` — JWT, CORS, role rules, JSON 401/403
- `src/main/java/files/DBConnection.java` — env-based credentials
- `.gitignore` — frontend/build/env entries

### New backend files

- `entity/Admin.java`
- `repository/AdminRepository.java`
- `dto/BookRequest.java`, `StudentRequest.java`, `IssueRequest.java`,
  `IssueResponse.java`, `LoginRequest.java`, `LoginResponse.java`,
  `DashboardStats.java`, `ApiError.java`, `MessageResponse.java`
- `exception/ApiException.java`, `GlobalExceptionHandler.java`
- `security/JwtService.java`, `JwtAuthenticationFilter.java`, `AdminDetailsService.java`
- `config/AdminBootstrap.java`
- `service/IssueService.java`, `IssueMapper.java`
- `controller/AuthController.java`, `DashboardController.java`, `HealthController.java`
- `src/test/java/example/service/IssueServiceTest.java`

### New frontend files

- `frontend/package.json`, `vite.config.js`, `index.html`, `.env.example`
- `frontend/src/main.jsx`, `App.jsx`, `styles.css`
- `frontend/src/api/client.js`
- `frontend/src/context/AuthContext.jsx`, `ToastContext.jsx`
- `frontend/src/components/AppLayout.jsx`, `ProtectedRoute.jsx`, `Modal.jsx`,
  `ConfirmDialog.jsx`, `EmptyState.jsx`, `Loading.jsx`, `Pagination.jsx`, `Icons.jsx`
- `frontend/src/pages/LoginPage.jsx`, `DashboardPage.jsx`, `BooksPage.jsx`,
  `StudentsPage.jsx`, `IssuesPage.jsx`
- `frontend/src/utils/format.js`

### New tooling/docs

- `run-backend.ps1`, `run-backend.cmd`
- `run-frontend.ps1`, `run-frontend.cmd`
- `postman/Library-Management-API.postman_collection.json`
- `README.md`

---

## 17. Clean start (from zero terminals)

1. Start MySQL 8.
2. Open PowerShell in `C:\Users\hp\Desktop\jdbcDemo`.
3. First-time admin reset (once):
   ```powershell
   $env:APP_ADMIN_USERNAME="librarian"
   $env:APP_ADMIN_PASSWORD="MyStrongPassword123!"
   ```
4. Start backend:
   ```powershell
   .\run-backend.cmd
   ```
   Enter MySQL password when prompted. Wait for `Started LibraryManagementApplication`.
5. Remove `APP_ADMIN_*` variables and restart backend normally:
   ```powershell
   Remove-Item Env:APP_ADMIN_USERNAME
   Remove-Item Env:APP_ADMIN_PASSWORD
   .\run-backend.cmd
   ```
6. Second terminal:
   ```powershell
   .\run-frontend.cmd
   ```
7. Open `http://localhost:5173`, log in, and test Books → Students → Issue/Return → Dashboard.

### Verified on this machine

- Backend compile + 4/4 unit tests passed.
- Live API workflow passed 21 checks: login, unauthorized 401, CRUD, duplicate
  email 409, invalid email 400, copy validation, issue, zero-copy 409, return,
  duplicate return 409, delete protection, dashboard stats.
- Frontend `npm run build` passed.
- Login, Dashboard, Books, Students, and Issue/Return pages were rendered in the
  browser with real MySQL data; no browser console errors.

Manual click-through items that remain for you: add/edit via the modal buttons,
and responsive check on your own desktop/mobile sizes (the UI uses breakpoints
at 900px and 640px).
