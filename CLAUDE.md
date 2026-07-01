# UniFind — Claude Context File

> Read this file at the start of every session. It contains the full project context, completed work, and what's next.

## Project

UniFind is a SaaS web platform helping Arabic-speaking students discover and apply to European universities. Full student journey: profile → AI recommendations → university/scholarship search → application tracking → language learning → instructor Q&A → support tickets.

**Root path:** `C:\Users\user\hatem\university_finder\`

---

## Stack

| Layer | Tech |
|-------|------|
| Backend | FastAPI + SQLAlchemy + PostgreSQL + Alembic |
| Auth | JWT (access 15 min + refresh 7 days) + bcrypt + token versioning |
| AI | Groq API — Llama 3.3-70b |
| Student frontend | React 19 + Vite + Tailwind CSS v4 + React Router v7 |
| Admin panel | React Admin v5 + Material-UI v6 |
| i18n | i18next + react-i18next (EN + AR, full RTL) |
| State | React Context (AuthContext, ThemeContext) + localStorage |

---

## Directory Structure

```
university_finder/
├── app/                        # FastAPI backend
│   ├── main.py                 # App entry, SPA middleware, static mounts
│   ├── config.py               # Settings (SECRET_KEY, DEBUG, DB_URL, etc.)
│   ├── dependencies.py         # get_current_user, require_admin
│   ├── core/
│   │   ├── limiter.py          # Shared slowapi Limiter instance
│   │   └── security.py         # JWT encode/decode (includes token version)
│   ├── models/                 # SQLAlchemy models
│   │   ├── user.py             # User (token_version, verification_token_expires)
│   │   ├── instructor.py
│   │   ├── ielts.py            # IeltsTest, IeltsSection, IeltsQuestion
│   │   └── ...
│   ├── routers/                # One file per feature
│   │   ├── auth.py             # register, login, logout, verify-email, reset-password, refresh
│   │   ├── ielts.py            # IELTS simulator CRUD
│   │   └── ...
│   └── schemas/
├── student-app/                # React student frontend
│   ├── src/
│   │   ├── App.jsx             # All routes defined here
│   │   ├── pages/              # 28+ pages
│   │   ├── components/
│   │   ├── api/axios.js        # Axios instance (baseURL="", auto token refresh)
│   │   ├── context/            # AuthContext, ThemeContext
│   │   └── i18n/
│   │       ├── index.js
│   │       └── locales/        # en.json, ar.json
│   └── dist/                   # Built files served by FastAPI at /
├── admin/                      # React Admin panel
│   ├── src/
│   │   ├── App.jsx             # Resources defined here
│   │   ├── dataProvider.js     # API calls (uses PATCH for updates)
│   │   ├── authProvider.js
│   │   ├── Dashboard.jsx
│   │   ├── InstructorDashboard.jsx  # Instructor view with IELTS panel
│   │   └── resources/          # Universities, Scholarships, Users, Learning, Ielts, etc.
│   └── dist/                   # Built files served by FastAPI at /admin
├── alembic/                    # DB migrations
│   └── versions/               # Latest head: r9m1n3o5p7q9 (IELTS tables)
└── uploads/
    └── instructors/            # Public instructor photos (served at /uploads/instructors)
```

---

## How the App is Served

FastAPI at port 8000 serves everything:
- `/admin` → `admin/dist/` (React Admin)
- `/uploads/instructors` → public static files
- `/ielts`, `/auth`, `/universities`, etc. → API routers
- Everything else → `student-app/dist/index.html` (SPA)

**After any frontend change you MUST rebuild:**
```bash
cd student-app && npm run build
cd admin && npm run build
```

Then restart the FastAPI server.

---

## Authentication & Security

- JWT access token (15 min) + refresh token (7 days)
- `token_version` on User model — incremented on logout and password reset to invalidate all sessions
- `decode_token` returns `(user_id, token_version)` — validated in `get_current_user`
- Email verification required — token expires in 24h
- Rate limiting via slowapi (shared `app/core/limiter.py`)
- Documents served via authenticated download endpoint (not public StaticFiles)
- Swagger UI only enabled when `DEBUG=true`

---

## User Roles

| Role | Description |
|------|-------------|
| `admin` | Full access to admin panel and all APIs |
| `student` | Default role — access to student app |
| `instructor` | Stored as `role="student"` + linked `Instructor` record; accesses InstructorDashboard |

English instructors (`instructor.language == "english"`) can also manage IELTS content.

---

## IELTS Simulator (completed)

**Models:** `IeltsTest` → `IeltsSection` → `IeltsQuestion` (in `app/models/ielts.py`)

**Backend endpoints** (`/ielts` prefix):
- `GET /ielts` — list published tests (students)
- `GET /ielts/{id}` — test detail (students)
- `GET /ielts/manage` — list ALL tests (admin/English instructor)
- `GET /ielts/manage/{id}` — test detail
- `POST /ielts/manage` — create test
- `PATCH /ielts/manage/{id}` — update test
- `DELETE /ielts/manage/{id}` — delete test
- `GET /ielts/manage/sections` — list all sections
- `GET /ielts/manage/sections/{id}` — get section
- `POST /ielts/manage/sections` — create section (body: `{test_id, name, ...}`)
- `PATCH /ielts/manage/sections/{id}` — update section
- `DELETE /ielts/manage/sections/{id}` — delete section
- `GET /ielts/manage/questions` — list all questions
- `GET /ielts/manage/questions/{id}` — get question
- `POST /ielts/manage/questions` — create question (body: `{section_id, question_text, ...}`)
- `PATCH /ielts/manage/questions/{id}` — update question
- `DELETE /ielts/manage/questions/{id}` — delete question

**Student app:** `/learning/ielts` and `/learning/ielts/:id` routes in `App.jsx`
**Admin panel:** Resources `ielts/manage`, `ielts/manage/sections`, `ielts/manage/questions` in `admin/src/App.jsx`
**Instructor panel:** `InstructorDashboard.jsx` has IELTS tab (only for English instructors)

---

## Security Review (completed — June 2026)

All issues fixed:
- [x] Path traversal in file serving (`serve_admin`, `serve_student`, document downloads)
- [x] Documents removed from public StaticFiles — now auth-required download endpoint
- [x] JWT token versioning (logout/password-reset revokes all sessions)
- [x] Email verification token expiry (24h)
- [x] Rate limiting on auth, AI chat, AI recommendations, support tickets
- [x] Input validation with Pydantic `Field` constraints on all user inputs
- [x] Password min 8 chars enforced in schema
- [x] File upload type whitelist (applications + instructor photos)
- [x] Photo size limit (5MB) for instructors
- [x] Shared limiter instance (single exception handler covers all routers)
- [x] Swagger UI hidden in production (`DEBUG=false`)
- [x] `/health` endpoint sanitized (no internal paths exposed)
- [x] AI error messages sanitized (no internal details leaked)

---

## i18n (EN + AR)

- Language stored in `localStorage` key `lang`
- Files: `student-app/src/i18n/locales/en.json` and `ar.json`
- RTL: `document.dir` set automatically; use `isRTL = i18n.language === "ar"` for layout conditionals
- Static arrays that need translation must be defined INSIDE components (not at module level)

**Remaining hardcoded strings (not yet translated):**
- `CoursePage.jsx` — "Course Levels", "Each Course Will Include"
- `PlacementTestPage.jsx` — "Test Levels", "How the Placement Test Will Work"
- `Universities.jsx` — `LANG_FILTERS` array, country `<option>` labels
- `Instructors.jsx` ChatModal — "Retry" button (~line 110)

---

## Known Bugs

1. `Instructors.jsx` ChatModal "Retry" button hardcoded English (~line 110)
2. `Universities.jsx` `LANG_FILTERS` — module-level array, labels not translatable
3. `Universities.jsx` country `<option>` tags — hardcoded English names (~lines 126–131)
4. `CoursePage.jsx` / `PlacementTestPage.jsx` — section headings still hardcoded English

---

## Technical Debt

- `support_tickets` table has legacy `admin_reply` + `replied_at` columns (pre-thread era)
- No student progress tracking for lessons/placement tests
- File uploads local-only — should move to S3 for production
- No WebSocket — notifications require page reload
- No payment integration — admin sets subscription plans manually

---

## Alembic Migration Chain

```
(base) → 2bf247d09d53 → q8l0m2n4o6p8 (token_version + verification_expiry) → r9m1n3o5p7q9 (IELTS tables)
```

To apply migrations: `alembic upgrade head`

---

## Suggested Next Steps

1. **Fix remaining i18n gaps** — LANG_FILTERS, country options, Retry button, CoursePage/PlacementTestPage headings
2. **Notification bell with unread badge** — poll `/notifications/unread-count` every 30s, dropdown panel, mark read
3. **Profile completeness bar** — % complete shown in Dashboard, progress bar + CTA
4. **IELTS test-taking UI** — full interactive exam experience at `/learning/ielts/:id`
5. **Document checklist per university** — new migration, checklist UI in UniversityDetail + ApplicationTracker
6. **Personalized dashboard redesign** — top recommendations widget, saved count, open tickets, deadlines
