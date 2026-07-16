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

All known hardcoded strings have been translated. Both EN and AR locales are complete.

---

## Test Simulators (completed — July 2026)

**Models:** `ExamPassage`, `ExamQuestion`, `SimulatorAttempt`, `SimulatorSectionResult` (in `app/models/simulator.py`)

**Backend endpoints** (`/simulators` prefix):
- `GET /simulators/exams` — list TOEFL and Cambridge metadata
- `GET /simulators/exams/{exam_type}/content` — full exam content (passages + questions)
- `POST /simulators/attempts` — start attempt
- `GET /simulators/attempts` — list user's attempts
- `GET /simulators/attempts/{id}` — attempt with section results and score report
- `POST /simulators/attempts/{id}/sections/{section}` — submit section (MCQ auto-scored, writing/speaking Groq AI scored)
- `POST /simulators/attempts/{id}/complete` — finish exam, calculate final score, generate Groq AI report
- `POST /simulators/admin/seed` — seed original TOEFL + Cambridge content (idempotent, run once)
- `GET/POST/PATCH/DELETE /simulators/admin/passages` — passage CRUD (admin)
- `GET/POST/PATCH/DELETE /simulators/admin/questions` — question CRUD (admin)

**Student app:** `/simulators` hub, `/simulators/exam/:examType` exam session, `/simulators/results/:attemptId` score report
**IELTS** still accessible at `/simulators/ielts` and original `/learning/ielts` routes
**Admin panel:** Exam Passages and Exam Questions resources
**Migration:** `c2d3e4f5a6b7` — adds 4 new tables

**Seed the content** (first deploy after this migration):
```
POST /simulators/admin/seed
```
Run once with admin token. Adds 50+ original questions for TOEFL + Cambridge.

---

## Known Bugs

None currently tracked.

---

## Technical Debt

- `support_tickets` table has legacy `admin_reply` + `replied_at` columns (pre-thread era)
- No student progress tracking for lessons/placement tests
- File uploads local-only — should move to S3 for production
- No WebSocket — notifications require page reload
- No payment integration — admin sets subscription plans manually

---

## University Data (completed — July 2026)

All 58 universities have real, verified data from official sources:

### Document Checklists (`university_document_items` table — 637 rows)
Script: `scripts/update_documents_real.py`
- Per-university real requirements (not templates)
- **Egypt removed from APS list** — was never on official list. Real APS countries: China, India, Vietnam (Mongolia at some unis)
- uni-assist vs. direct portal corrected per university
- NAWA SYRENA requirement for Poland (mandatory from 1 July 2025, 30–60 day process)
- Medical university entrance exam requirements (WUM Competency Test, MUG biology/chemistry)
- TU Darmstadt: must submit BOTH online + printed paper documents
- TUHH: English proof compulsory for ALL applicants, non-EU deadline Dec–Feb

### Tuition Fees by Degree Level (`university_programs` table — 130 rows)
Script: `scripts/update_tuition_by_level.py`
- German public free unis: €0 for all degrees
- BW unis: €3,000/yr bachelor & master, PhD free
- TUM: bachelor avg €5,000/yr, master avg €9,000/yr, PhD free
- German private: real per-program fees (Frankfurt School, ESMT, WHU, Constructor)
- Polish unis: real fees by field and degree level from official admissions pages

---

## Alembic Migration Chain

```
(base) → 2bf247d09d53 → q8l0m2n4o6p8 (token_version + verification_expiry) → r9m1n3o5p7q9 (IELTS tables) → f739d93e8523 (university_programs) → b2c3d4e5f6a7 (university_document_items) → z1a2b3c4d5e6 (login lockout) → a1b2c3d4e5f6 (audio_url on ielts_sections) → c2d3e4f5a6b7 (simulator tables)
```

To apply migrations: `alembic upgrade head`

---

## Suggested Next Steps

1. **Notification bell with unread badge** — poll `/notifications/unread-count` every 30s, dropdown panel, mark read
2. **Profile completeness bar** — % complete shown in Dashboard, progress bar + CTA
3. **IELTS test-taking UI** — full interactive exam experience at `/learning/ielts/:id`
4. **Delete test user** — testclaude@test.com created during testing sessions
