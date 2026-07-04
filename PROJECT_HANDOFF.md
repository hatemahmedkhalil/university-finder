# UniFind — Complete Developer Handoff Document
**Date:** June 23, 2026 | **Status:** Active Development

---

## 1. Project Overview

**UniFind** is a SaaS web platform that helps students (primarily Arabic-speaking) discover and apply to European universities. It covers the full journey: profile setup → AI recommendations → university/scholarship search → application tracking → language learning → instructor Q&A → support.

**Target Users:**
- Arabic-speaking students seeking higher education in Europe (Germany, Poland, Austria, Netherlands, France, Sweden, Italy, Spain)
- Platform language: English + Arabic (full RTL support)

**Core Business Logic:**
- Students build a profile (GPA, budget, language level, preferred countries)
- AI + rule-based engine scores all universities against the profile
- Students track favourites, applications, scholarships
- Instructors answer student questions in the platform
- Premium plan unlocks AI chat (30 msgs/day)

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | FastAPI (Python 3.x), Uvicorn |
| **ORM** | SQLAlchemy, Alembic migrations |
| **Database** | PostgreSQL 12+ |
| **Authentication** | JWT (access 15min + refresh 7d), bcrypt |
| **AI** | Groq API — Llama 3.3-70b model |
| **Email** | SMTP via Gmail |
| **File Storage** | Local disk (`uploads/instructors/`) |
| **Frontend** | React 19, Vite, Tailwind CSS v4, React Router v7 |
| **i18n** | i18next + react-i18next (EN + AR, full RTL) |
| **HTTP Client** | Axios (with JWT interceptors) |
| **Toast Notifications** | react-hot-toast |
| **Admin Panel** | React Admin v5 + Material-UI v6 |
| **State Management** | React Context (AuthContext, ThemeContext) + localStorage |
| **Rate Limiting** | slowapi (per-endpoint) |
| **Testing** | pytest |

---

## 3. Project Structure

```
university_finder/
├── .env                              # All secrets (see Section 14)
├── requirements.txt                  # Python dependencies
├── alembic.ini                       # Migration config
├── alembic/versions/                 # 15+ migration files
├── app/                              # FastAPI backend
│   ├── main.py                       # App init, all routers, static serving, middleware
│   ├── config.py                     # Pydantic Settings (reads .env)
│   ├── database.py                   # SQLAlchemy engine + session
│   ├── dependencies.py               # get_db(), get_current_user(), require_admin()
│   ├── core/security.py              # JWT create/decode, bcrypt hash/verify
│   ├── models/                       # 16 ORM models (see Section 6)
│   ├── schemas/                      # Pydantic request/response schemas
│   ├── routers/                      # 17 API route modules (see Section 7)
│   └── services/
│       ├── recommendation.py         # Rule-based scoring engine
│       ├── email.py                  # Send email via SMTP
│       └── notify.py                 # Create notification + announcement records
├── student-app/                      # React 19 student frontend
│   ├── src/
│   │   ├── App.jsx                   # Router, layout, all 28 routes
│   │   ├── api/axios.js              # Axios instance with auth interceptors
│   │   ├── context/AuthContext.jsx   # User state, login/logout, onboarding flags
│   │   ├── context/ThemeContext.jsx  # Dark/light theme
│   │   ├── i18n/index.js             # i18next init (EN default, AR supported)
│   │   ├── i18n/locales/en.json      # English translation strings
│   │   ├── i18n/locales/ar.json      # Arabic translation strings (RTL)
│   │   ├── components/               # Shared UI components
│   │   │   ├── DashboardLayout.jsx   # Outer shell: navbar + sidebar + content
│   │   │   ├── Navbar.jsx            # Top navigation bar
│   │   │   ├── Sidebar.jsx           # Left/right sidebar nav
│   │   │   ├── Topbar.jsx            # Secondary top bar
│   │   │   ├── ProtectedRoute.jsx    # Auth guard wrapper
│   │   │   ├── Onboarding.jsx        # First-time setup flow
│   │   │   ├── ProfileWizard.jsx     # Student profile creation wizard
│   │   │   ├── LanguagePicker.jsx    # Initial EN/AR language selection
│   │   │   └── Skeleton.jsx          # Loading skeleton component
│   │   └── pages/                    # 28 page components (see Section 5)
│   ├── package.json
│   └── vite.config.js
├── admin/                            # React Admin panel (admin + instructor roles)
│   ├── src/
│   │   ├── App.jsx                   # React Admin resources
│   │   ├── authProvider.js           # React Admin auth
│   │   ├── dataProvider.js           # REST data bridge
│   │   ├── Dashboard.jsx             # Admin stats dashboard
│   │   ├── InstructorDashboard.jsx   # Instructor inbox view
│   │   └── resources/                # CRUD: Universities, Scholarships, Users, Instructors,
│   │                                 #  Announcements, Applications, InstructorMessages,
│   │                                 #  Learning, Support
│   └── package.json
├── uploads/instructors/              # Instructor photo files
├── tests/                            # pytest test suite
└── server.log / server_err.log       # Runtime logs
```

---

## 4. Environment & Configuration

**File:** `university_finder/.env`

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/university_finder
SECRET_KEY=<64-char hex string>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
ALLOWED_ORIGINS=["http://localhost:3000","http://localhost:5173","http://localhost:5174"]
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<gmail address>
SMTP_PASSWORD=<gmail app-specific password>
FRONTEND_URL=http://localhost:8000
GROQ_API_KEY=<required — Groq console>
OPENAI_API_KEY=<optional>
GEMINI_API_KEY=<optional>
```

**Required for features to work:**
- `DATABASE_URL` — always required
- `SECRET_KEY` — always required (JWT signing)
- `GROQ_API_KEY` — required for AI Chat + AI Recommendations + University Comparison
- `SMTP_*` — required for email verification + password reset

---

## 5. User Flows & Pages

### Public Pages
| Route | File | Description |
|---|---|---|
| `/` | `Landing.jsx` | Marketing landing page |
| `/login` | `Login.jsx` | Email + password login |
| `/register` | `Register.jsx` | Registration form |
| `/forgot-password` | `ForgotPassword.jsx` | Request reset email |
| `/reset-password` | `ResetPassword.jsx` | Set new password via token |
| `/verify-email` | `VerifyEmail.jsx` | Email verification handler |
| `/universities` | `Universities.jsx` | Public university browse |
| `/scholarships` | `Scholarships.jsx` | Public scholarship browse |
| `/pricing` | `Pricing.jsx` | Plan comparison page |

### Protected Pages (require login)
| Route | File | Description |
|---|---|---|
| `/dashboard` | `Dashboard.jsx` | User home after login |
| `/profile` | `Profile.jsx` | View/edit student profile |
| `/recommendations` | `Recommendations.jsx` | Rule-based + AI recommendations |
| `/university/:id` | `UniversityDetail.jsx` | University detail + apply |
| `/favourites` | `Favourites.jsx` | Saved universities |
| `/applications` | `ApplicationTracker.jsx` | Application status tracker |
| `/scholarships` | `Scholarships.jsx` | Scholarship listing |
| `/ai-chat` | `AiChat.jsx` | AI university advisor chat |
| `/learning` | `LearningCenter.jsx` | Language learning hub |
| `/learning/placement/:lang` | `PlacementTestPage.jsx` | Placement test per language |
| `/learning/course/:id` | `CoursePage.jsx` | Course viewer with lessons |
| `/instructors` | `Instructors.jsx` | Browse instructors + ask questions |
| `/instructors/:id` | `InstructorProfile.jsx` | Instructor profile + chat |
| `/my-questions` | `MyQuestions.jsx` | All questions asked by student |
| `/announcements` | `Announcements.jsx` | Platform announcements |
| `/notifications` | `Notifications.jsx` | Personal notification feed |
| `/support` | `Support.jsx` | Support ticket system |
| `/settings` | `Settings.jsx` | Account settings |
| `/instructor-panel` | `InstructorPanel.jsx` | Instructor reply inbox |

### Key User Flows

**Registration:**
1. Fill form at `/register` → POST `/auth/register`
2. Email sent with verification link
3. User clicks link → `is_verified = true`
4. Redirect to login

**First Login:**
1. POST `/auth/login` → access + refresh tokens stored in localStorage
2. If `has_completed_onboarding = false` → `Onboarding.jsx` modal shown
3. Onboarding captures: GPA, budget, preferred countries, degree level, field
4. POST `/auth/onboarding/complete` → sets flag

**Profile Setup:**
- `ProfileWizard.jsx` component if profile incomplete
- Saves to `StudentProfile` via POST/PATCH `/profiles/me`

**Getting Recommendations:**
- `/recommendations` page fetches profile → POST `/recommendations`
- Shows ranked list with match scores and reasons
- Can request AI recommendations (POST `/ai-recommendations`)
- Can compare 2-4 universities (POST `/ai-recommendations/compare`)

**Application Tracking:**
- From university detail → click Apply → POST `/applications`
- Status: interested → applied → waiting → accepted/rejected
- View all at `/applications`

---

## 6. Database Documentation

### `users`
| Column | Type | Notes |
|---|---|---|
| id | int PK | |
| email | string unique | indexed |
| hashed_password | string | bcrypt |
| is_active | bool | default true |
| role | enum | "student" \| "admin" |
| plan | enum | "free" \| "premium" |
| is_verified | bool | email verification |
| has_completed_onboarding | bool | controls wizard display |
| verification_token | string | null after verified |
| reset_token | string | password reset |
| reset_token_expires | datetime | 1 hour validity |
| created_at | datetime | |

### `student_profiles`
| Column | Type | Notes |
|---|---|---|
| id | int PK | |
| user_id | int FK unique | → users |
| nationality | string | |
| degree_level | enum | bachelor \| master \| phd |
| gpa | float | 0.0–4.0 |
| budget_eur | int | annual tuition budget |
| english_level | enum | a1–c2 \| native |
| language | string | target study language |
| preferred_countries | text | comma-separated or JSON |
| field_of_study | string nullable | |
| phone_number | string nullable | |
| placement_results | JSON | `{english: {level: "B2", score: 85}}` |

### `universities`
| Column | Type | Notes |
|---|---|---|
| id | int PK | |
| name | string indexed | |
| country | string indexed | |
| city | string | |
| website, description | text | |
| ranking | int nullable | world ranking |
| tuition_fee_eur | int | annual tuition |
| acceptance_rate | float | % |
| is_public | bool | |
| english_programs_available | bool | |
| programs | text | list of programs |
| admission_requirements | text | |
| required_documents | text | |
| application_deadline | string | |
| language_requirements | text | |
| study_duration | string | |
| accommodation_info | text | |
| application_fee_eur | int | |
| living_cost_eur | int | monthly estimate |
| min_gpa | float | |
| logo_url | string | |
| contact_email, contact_phone | string | |

### `scholarships`
| Column | Type | Notes |
|---|---|---|
| id | int PK | |
| university_id | int FK nullable | → universities |
| name | string indexed | |
| provider | string | organization |
| scholarship_type | enum | full \| partial \| merit \| need_based \| government |
| amount_eur | int | |
| description | text | |
| eligibility | text | |
| deadline | string | |
| link | string | external apply URL |

### `favourites`
| Column | Type | Notes |
|---|---|---|
| id | int PK | |
| user_id | int FK | → users |
| university_id | int FK | → universities |
| created_at | datetime | |
Unique: (user_id, university_id)

### `applications`
| Column | Type | Notes |
|---|---|---|
| id | int PK | |
| user_id | int FK indexed | → users |
| university_id | int FK | → universities |
| status | enum | interested \| applied \| waiting \| accepted \| rejected |
| notes | text | student notes |
| created_at, updated_at | datetime | |
Unique: (user_id, university_id)

### `instructors`
| Column | Type | Notes |
|---|---|---|
| id | int PK | |
| user_id | int FK unique nullable | → users (for login access) |
| name | string | |
| title | string | "Dr.", "Prof.", etc. |
| language | string | english \| german \| polish |
| specialty | string | e.g. "Business English" |
| organization | string | e.g. "British Council" |
| bio | text | |
| photo_url | string | relative path under /uploads |
| email | string | |
| years_experience | int | |
| is_published | bool | visible to students |
| created_at | datetime | |

### `instructor_posts`
| Column | Type | Notes |
|---|---|---|
| id | int PK | |
| instructor_id | int FK | → instructors |
| content | text | |
| created_at | datetime | |

### `instructor_messages`
| Column | Type | Notes |
|---|---|---|
| id | int PK | |
| instructor_id | int FK indexed | → instructors |
| user_id | int FK indexed | → users |
| question | text | student's question |
| reply | text nullable | instructor's reply |
| replied_at | datetime nullable | |
| created_at | datetime | |

### `support_tickets`
| Column | Type | Notes |
|---|---|---|
| id | int PK | |
| user_id | int FK indexed | → users |
| subject | string | |
| message | text | initial message |
| status | enum | open \| waiting_admin \| waiting_student \| in_progress \| resolved \| closed |
| admin_reply | text nullable | legacy field |
| replied_at | datetime nullable | legacy field |
| created_at, updated_at | datetime | |

### `ticket_messages`
| Column | Type | Notes |
|---|---|---|
| id | int PK | |
| ticket_id | int FK indexed | → support_tickets |
| sender_role | enum | student \| admin |
| message | text | |
| created_at | datetime | |

### `announcements`
| Column | Type | Notes |
|---|---|---|
| id | int PK | |
| title | string | |
| body | text | |
| type | enum | info \| success \| warning |
| is_published | bool | |
| target_user_id | int FK nullable | if set, private to that user |
| created_at | datetime | |
Read tracking via separate `announcement_reads` junction table (announcement_id, user_id).

### `notifications`
| Column | Type | Notes |
|---|---|---|
| id | int PK | |
| user_id | int FK indexed | → users |
| title | string | |
| message | text | |
| type | enum | support_reply \| application_update \| scholarship_update \| system |
| reference_id | int nullable | ID of related record |
| reference_type | string nullable | "ticket" \| "application" etc. |
| is_read | bool | default false |
| created_at | datetime | |

### `placement_tests`
| Column | Type | Notes |
|---|---|---|
| id | int PK | |
| title | string | |
| language | string | english \| german \| polish |
| description | text | |
| is_published | bool | |
| created_at | datetime | |

### `placement_test_questions`
| Column | Type | Notes |
|---|---|---|
| id | int PK | |
| test_id | int FK | → placement_tests (cascade delete) |
| question_text | text | |
| options_json | JSON | array of 4 options |
| correct_answer | string | |
| level | string | A1–C2 |
| order_index | int | display order |

### `courses`
| Column | Type | Notes |
|---|---|---|
| id | int PK | |
| title | string | |
| language | string | |
| level | string | A1–C2 |
| description | text | |
| thumbnail_url | string | |
| is_published | bool | |
| created_at | datetime | |

### `lessons`
| Column | Type | Notes |
|---|---|---|
| id | int PK | |
| course_id | int FK | → courses |
| title | string | |
| description | text | |
| content_type | enum | video \| pdf \| text \| quiz |
| content_url | string | |
| content_text | text | |
| duration_minutes | int | |
| order_index | int | |
| is_published | bool | |

### `subscription_plans`
| Column | Type | Notes |
|---|---|---|
| id | int PK | |
| name | string unique | |
| price | float nullable | null = free |
| description | text | |
| features | text | JSON array |
| is_active | bool | |
| is_featured | bool | highlighted on pricing page |
| created_at, updated_at | datetime | |

### `ai_chat_messages`
| Column | Type | Notes |
|---|---|---|
| id | int PK | |
| user_id | int FK indexed | → users |
| role | enum | user \| assistant |
| content | text | |
| created_at | datetime | |

### `user_languages`
| Column | Type | Notes |
|---|---|---|
| id | int PK | |
| user_id | int FK indexed | → users |
| language | string | english \| german \| polish |
| level | string | A1–C2 \| native |
| created_at | datetime | |

---

## 7. API Endpoints

All routes prefixed by `http://localhost:8000`. Auth-required routes need `Authorization: Bearer <access_token>` header.

### Auth (`/auth`)
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | No | Register (rate: 10/min) |
| POST | `/auth/login` | No | Login (rate: 10/min) |
| GET | `/auth/verify-email?token=` | No | Verify email token |
| POST | `/auth/forgot-password` | No | Request reset email (rate: 5/min) |
| POST | `/auth/reset-password` | No | Reset with token |
| GET | `/auth/me` | Yes | Current user info |
| POST | `/auth/resend-verification` | No | Resend verification (rate: 3/min) |
| POST | `/auth/onboarding/complete` | Yes | Mark onboarding done |
| POST | `/auth/onboarding/reset` | Yes | Reset onboarding flag |
| POST | `/auth/refresh` | No | Refresh access token (send refresh in body) |

### Profiles (`/profiles`)
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/profiles` | Yes | Create student profile |
| GET | `/profiles/me` | Yes | Get my profile |
| PATCH | `/profiles/me` | Yes | Update profile |
| DELETE | `/profiles/me` | Yes | Delete profile |

### Universities (`/universities`)
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/universities` | No | `?search=&country=&english_only=&language=&skip=&limit=` |
| GET | `/universities/{id}` | No | Full detail |
| POST | `/universities` | Admin | Create |
| PATCH | `/universities/{id}` | Admin | Update |
| DELETE | `/universities/{id}` | Admin | Delete |

### Scholarships (`/scholarships`)
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/scholarships` | No | `?university_id=&scholarship_type=&skip=&limit=` |
| GET | `/scholarships/{id}` | No | Detail |
| POST | `/scholarships` | Admin | Create |
| PATCH | `/scholarships/{id}` | Admin | Update |
| DELETE | `/scholarships/{id}` | Admin | Delete |

### Recommendations
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/recommendations` | Yes | Rule-based recommendations |
| POST | `/ai-recommendations` | Yes | AI (Groq) recommendations |
| POST | `/ai-recommendations/compare` | Yes | Compare 2–4 universities |

### Favourites (`/favourites`)
| Method | Path | Auth | |
|---|---|---|---|
| GET | `/favourites` | Yes | My saved universities |
| POST | `/favourites/{university_id}` | Yes | Save |
| DELETE | `/favourites/{university_id}` | Yes | Unsave |

### Instructors
| Method | Path | Auth | |
|---|---|---|---|
| GET | `/instructors` | No | `?language=` |
| GET | `/instructors/{id}` | No | Profile |
| POST | `/instructors` | Admin | Create |
| PATCH | `/instructors/{id}` | Admin | Update |
| POST | `/instructors/{id}/upload-photo` | Admin | Upload photo |
| DELETE | `/instructors/{id}` | Admin | Delete |
| GET | `/instructor-posts` | No | All posts (latest 50) |
| GET | `/instructor-posts/instructor/{id}` | No | Instructor's posts |
| POST | `/instructor-posts` | Instructor | Create post |
| DELETE | `/instructor-posts/{id}` | Instructor/Admin | Delete post |
| POST | `/instructor-messages/instructors/{id}` | Yes | Ask question |
| GET | `/instructor-messages/instructors/{id}` | Yes | My msgs with instructor |
| GET | `/instructor-messages/my` | Yes | All my questions |
| GET | `/instructor-messages/inbox` | Instructor | Questions to answer |
| POST | `/instructor-messages/inbox/{id}/reply` | Instructor | Reply |
| GET | `/instructor-messages/profile` | Instructor | My instructor profile |
| GET | `/instructor-messages` | Admin | All messages |
| POST | `/instructor-messages/{id}/reply` | Admin | Admin reply |
| DELETE | `/instructor-messages/{id}` | Admin | Delete |

### Applications (`/applications`)
| Method | Path | Auth | |
|---|---|---|---|
| GET | `/applications` | Yes | My applications |
| POST | `/applications` | Yes | Create `{university_id, status, notes}` |
| PATCH | `/applications/{id}` | Yes | Update status/notes |
| DELETE | `/applications/{id}` | Yes | Delete |
| GET | `/applications/university/{id}` | Yes | My app for specific university |
| GET | `/applications/admin/all` | Admin | All applications |

### Support (`/support`)
| Method | Path | Auth | |
|---|---|---|---|
| POST | `/support` | Yes | Create ticket `{subject, message}` |
| POST | `/support/{id}/message` | Yes | Student follow-up message |
| GET | `/support/my` | Yes | My tickets |
| GET | `/support` | Admin | All tickets |
| GET | `/support/stats` | Admin | Statistics |
| GET | `/support/{id}` | Admin | Single ticket |
| POST | `/support/{id}/reply` | Admin | Admin reply |
| PATCH | `/support/{id}/status` | Admin | Change status |
| DELETE | `/support/{id}` | Admin | Delete |

### AI Chat (`/ai-chat`)
| Method | Path | Auth | |
|---|---|---|---|
| GET | `/ai-chat/me` | Yes | My plan info |
| GET | `/ai-chat/history` | Yes | Last 100 messages |
| POST | `/ai-chat/message` | Yes | Send `{message}` — 30/day limit |
| DELETE | `/ai-chat/history` | Yes | Clear history |
| PATCH | `/ai-chat/admin/users/{id}/plan` | Admin | Set user plan |

### Announcements + Notifications
| Method | Path | Auth | |
|---|---|---|---|
| GET | `/announcements` | Yes | My visible announcements |
| GET | `/announcements/unread-count` | Yes | Unread count |
| POST | `/announcements/{id}/read` | Yes | Mark read |
| POST | `/announcements/read-all` | Yes | Mark all read |
| POST | `/announcements` | Admin | Create |
| PATCH | `/announcements/{id}` | Admin | Update |
| DELETE | `/announcements/{id}` | Admin | Delete |
| GET | `/notifications` | Yes | Latest 50 |
| GET | `/notifications/unread-count` | Yes | Count |
| POST | `/notifications/{id}/read` | Yes | Mark read |
| POST | `/notifications/read-all` | Yes | Mark all |

### Learning (`/learning`)
| Method | Path | Auth | |
|---|---|---|---|
| GET | `/learning/placement-tests` | No | List published tests |
| GET | `/learning/placement-tests/{id}` | No | Test + questions |
| POST | `/learning/placement-tests` | Admin | Create |
| POST | `/learning/placement-tests/{id}/questions` | Admin | Add question |
| DELETE | `/learning/placement-tests/questions/{id}` | Admin | Delete question |
| GET | `/learning/courses` | No | List published courses |
| GET | `/learning/courses/{id}` | No | Course + lessons |
| POST | `/learning/courses` | Admin | Create |
| POST | `/learning/courses/{id}/lessons` | Admin | Add lesson |
| DELETE | `/learning/courses/lessons/{id}` | Admin | Delete lesson |

### Other
| Method | Path | Auth | |
|---|---|---|---|
| GET | `/user-languages` | Yes | My language list |
| POST | `/user-languages` | Yes | Add language `{language, level}` |
| PATCH | `/user-languages/{id}` | Yes | Update level |
| DELETE | `/user-languages/{id}` | Yes | Remove |
| GET | `/subscription-plans` | No | Active plans |
| GET | `/users` | Admin | All users `?search=&skip=&limit=` |
| GET | `/admin/stats` | Admin | Platform stats |
| GET | `/admin/students` | Admin | All students + profiles |
| GET | `/health` | No | Health check |

---

## 8. Recommendation Engine

**File:** `app/services/recommendation.py`

### Algorithm (Rule-Based Scoring)
Each university is scored 0–100 based on 4 weighted criteria:

| Criterion | Weight | Logic |
|---|---|---|
| Country match | 30% | Full score if university.country in student.preferred_countries |
| Budget fit | 30% | Full if tuition ≤ budget; partial if ≤ 1.5× budget; zero if > 2× budget |
| English fit | 20% | Full if university has English programs and student knows English; partial otherwise |
| GPA fit | 20% | Full if student.gpa ≥ university.min_gpa; partial if within 0.5 below; zero otherwise |

**Hard cutoff:** Universities costing > 2× the student's annual budget are excluded entirely.

**Output:** Sorted list (highest score first) with:
- `score` (0–100)
- `match_reasons` (list of strings explaining why)
- Full university object

### AI Recommendations (Groq)
**File:** `app/routers/ai_recommendations.py`
- Sends student profile + all universities to Groq (Llama 3.3-70b)
- System prompt includes profile data, all universities, scholarships, language info
- Returns top 3 university recommendations with natural language reasoning
- Compare mode: sends 2–4 universities and asks for side-by-side analysis

---

## 9. Authentication & Authorization

### Token Flow
```
Login → { access_token (15min), refresh_token (7d) }
          ↓ stored in localStorage
Every request → Authorization: Bearer <access_token>
401 received → auto POST /auth/refresh → new access_token
Refresh expired → clear tokens, redirect /login
```

### Roles
- `student` — default role, all student features
- `admin` — access to all admin routes + admin panel

### Protected Routes (Frontend)
`<ProtectedRoute>` wrapper redirects to `/login` if no token.

### Admin Check (Backend)
`require_admin()` dependency raises 403 if `user.role != "admin"`.

### Instructor Access
Instructors have `user.role = "student"` but also have a linked `Instructor` record. They access instructor features by having an `instructor_messages/profile` entry. Admin panel shows them a limited view via `InstructorDashboard.jsx`.

---

## 10. Localization (i18n) — EN / AR

### Implementation
- **Library:** i18next + react-i18next
- **Files:** `student-app/src/i18n/locales/en.json` and `ar.json`
- **RTL:** `document.documentElement.dir = "rtl"` when `i18n.language === "ar"`
- **Pattern:** Every component that renders text must have `const { t } = useTranslation()` — cannot be hoisted to module level or passed as prop

### Locale Key Namespaces
```
common.*          — loading, save, cancel, filter, etc.
nav.*             — navigation menu items
auth.*            — login, register, forgot password forms
onboarding.*      — onboarding wizard strings
profile.*         — profile page
dashboard.*       — dashboard page
universities.*    — universities page
scholarships.*    — scholarships page
recommendations.* — recommendations page
instructors.*     — instructors list + profile + panel + messages
learning.*        — learning center
support.*         — support tickets (includes status labels, form, tabs)
aichat.*          — AI chat page
announcements.*   — announcements page
notifications.*   — notifications page
favourites.*      — favourites page
applications.*    — application tracker
settings.*        — settings page
pricing.*         — pricing page
landing.*         — landing page (hero, features, stats, steps, cta, footer)
university.*      — university detail page
```

### Completed Localization (as of June 23, 2026)
All major pages have been fully localized:
- ✅ Landing, Login, Register, ForgotPassword, ResetPassword
- ✅ Dashboard, Profile, Onboarding
- ✅ Universities, UniversityDetail
- ✅ Scholarships, Favourites, ApplicationTracker
- ✅ Recommendations
- ✅ Instructors, InstructorProfile, InstructorPanel, MyQuestions
- ✅ LearningCenter
- ✅ Support
- ✅ AiChat, Announcements, Notifications
- ✅ Settings, Pricing

### Known Remaining Hardcoded Strings (Minor)
These pages still have a few English-only strings that weren't fully translated:
- `CoursePage.jsx` — "Course Levels", "Each Course Will Include"
- `PlacementTestPage.jsx` — "Test Levels", "How the Placement Test Will Work"
- `Pricing.jsx` — some section headings
- `ApplicationTracker.jsx` — hero heading "Application Tracker"
- `Universities.jsx` — country/language dropdown option labels (e.g. "All Countries", "Germany" inside `<option>` tags — these are LANG_FILTERS and COUNTRY options defined as static arrays)
- `Instructors.jsx` ChatModal — "Retry" button still hardcoded (~line 110)

### Special Arabic Conventions
- Back arrows use `←` not `→`: e.g. `"backToInstructors": "← العودة إلى المدربين"`
- Dynamic strings use i18next interpolation: `"askQuestion": "اسأل {{name}} سؤالاً"`
- Static data arrays (LANG_FILTERS, COMING_SOON, etc.) must be moved inside components to use `t()` — cannot be at module level

---

## 11. Design System & UI

### Color Palette
- **Primary:** Indigo 600–700 (`#4f46e5` → `#4338ca`)
- **Secondary:** Violet 600–700
- **Accent:** Purple 600–800
- **Gradient backgrounds:** `from-indigo-700 via-violet-700 to-purple-800`
- **Success:** Emerald 500–600
- **Warning:** Amber 500
- **Error:** Red 500

### Typography
- **Headings:** `font-extrabold`, sizes `text-4xl` to `text-7xl`
- **Body:** `text-sm` to `text-lg`, `text-gray-500` to `text-gray-900`
- **Labels/tags:** `text-xs`, `uppercase`, `tracking-widest`

### Component Patterns
- **Cards:** `bg-white rounded-2xl border border-gray-100 shadow-sm`
- **Gradient cards:** Colored accent bar at top (`h-1.5 bg-gradient-to-r`)
- **Buttons primary:** `bg-indigo-600 text-white rounded-xl px-4 py-2`
- **Badges/pills:** `rounded-full text-xs px-2.5 py-1`
- **Inputs:** `border border-gray-200 rounded-xl px-4 py-2.5`
- **Skeletons:** `animate-pulse bg-gray-100 rounded`
- **Hero sections:** Full-width gradient with decorative blurred blobs

### Layout
- **Sidebar:** Collapsible, shows icons only when collapsed
- **Topbar:** Language switcher, notifications bell, user menu
- **Content area:** `max-w-6xl mx-auto px-6` container
- **Responsive:** Mobile-first, grid adjusts from 1 → 2 → 3 columns

### Animations
- Hover lift: `hover:-translate-y-1 hover:shadow-lg transition-all`
- `card-lift` CSS class for card hover effects
- `stagger` CSS class for staggered grid animations
- Arrow icons: `group-hover:translate-x-1 transition-transform`

---

## 12. Support Ticket System

### Flow
1. Student submits ticket (subject + message) → POST `/support`
2. `ticket_messages` record created with `sender_role = "student"`
3. Ticket status: `open` → `waiting_admin`
4. Admin sees ticket in admin panel → Support Tickets
5. Admin replies → POST `/support/{id}/reply`
6. `ticket_messages` record created with `sender_role = "admin"`
7. Notification created for student (type: `support_reply`)
8. Announcement created for student (private, type: `success`)
9. Ticket status: `waiting_student`
10. Student can follow-up → POST `/support/{id}/message`
11. Status → `waiting_admin` again
12. Admin can change status to `resolved` or `closed`

### Statuses
`open` → `waiting_admin` → `waiting_student` → `in_progress` → `resolved` → `closed`

---

## 13. Notification System

### Current Implementation
- Notifications created server-side via `app/services/notify.py`
- Trigger: Admin replies to support ticket
- Stored in `notifications` table
- Frontend polls on page load (no WebSocket yet)
- Unread count badge on notification bell in topbar

### Notification Types
- `support_reply` — admin replied to ticket
- `application_update` — application status changed
- `scholarship_update` — scholarship deadline approaching
- `system` — generic platform messages

### Limitations
- **No real-time push** — user must refresh page to see new notifications
- No email notifications for replies (only for account actions)
- Announcements system is parallel but separate from notifications

---

## 14. Subscription System

### Plans
- **Free:** Registration, university search, scholarships, limited AI features
- **Premium:** Unlocks AI Chat (30 messages/day)

### Implementation
- `User.plan` field: `"free"` or `"premium"`
- `SubscriptionPlan` table stores plan definitions + features list
- AI chat checks `user.plan` before allowing messages
- No payment integration yet — admin manually sets plans via `/ai-chat/admin/users/{id}/plan`

### Pricing Page
- `Pricing.jsx` fetches `/subscription-plans` for dynamic plan data
- Displays feature comparison table
- No payment flow implemented — "coming soon" state

---

## 15. Setup & Development

### Backend
```bash
cd university_finder
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt
# Create .env with DATABASE_URL, SECRET_KEY, GROQ_API_KEY, SMTP_*
alembic upgrade head           # Run all migrations
uvicorn app.main:app --reload  # Start at http://localhost:8000
```

### Student Frontend
```bash
cd student-app
npm install
npm run dev     # http://localhost:5173
npm run build   # Output to student-app/dist (served by FastAPI)
```

### Admin Panel
```bash
cd admin
npm install
npm run dev     # http://localhost:5174
npm run build   # Output to admin/dist (served by FastAPI at /admin)
```

### API Docs
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### Test Suite
```bash
cd university_finder
pytest
```

---

## 16. Known Issues & Technical Debt

### Bugs
1. **Instructors.jsx ChatModal** — "Retry" button (~line 110) is still hardcoded in English, not using `t("common.retry")`
2. **Universities.jsx language filter** — LANG_FILTERS array is defined at module level, so labels ("All Languages", "English", "German", "Polish") cannot be translated without moving inside component
3. **Universities.jsx country dropdown** — `<option>` country names hardcoded in English (line 126–131)
4. **CoursePage.jsx / PlacementTestPage.jsx** — Section headings still hardcoded in English

### Technical Debt
1. **Support tickets** — `admin_reply` and `replied_at` columns on `support_tickets` table are legacy (before multi-message threads were added). Should be cleaned up but kept for backward compat.
2. **AI Chat rate limit** — Comment in `ai_chat.py` notes plan check is "commented out" — verify all premium restrictions are enforced
3. **Instructor auth** — Instructors use `role = "student"` but need an `Instructor` record linked. No dedicated instructor role. Access control is checked by presence of instructor record, not role enum.
4. **Learning Center content** — Placement tests and courses are admin-created. Currently no student progress tracking (no completion state per lesson/test).
5. **File uploads** — Stored locally in `uploads/`. For production, should move to S3 or similar cloud storage.
6. **No WebSocket** — Notifications require page reload to appear. Support ticket updates not real-time.

### Missing i18n
- `CoursePage.jsx`: "Course Levels", "Each Course Will Include" still English
- `PlacementTestPage.jsx`: "Test Levels", "How the Placement Test Will Work" still English
- `Pricing.jsx`: Several section headings not translated
- `ApplicationTracker.jsx`: "Application Tracker" hero heading
- Filter option labels in dropdowns (static arrays)

---

## 17. Future Roadmap (Discussed)

### High Priority UX
1. **Notification bell with real-time badge** — topbar bell showing unread count, updates without page reload
2. **Profile completeness bar** — "Your profile is 40% complete" progress indicator on dashboard
3. **Onboarding wizard improvements** — better step guidance for new users
4. **Personalized dashboard** — After login: top recommendations, saved count, pending tickets, deadlines at a glance

### Medium Priority Features
4. **Document checklist** — Per-university required document checklist students can tick off (connects to ApplicationTracker)
5. **Deadline calendar** — Timeline view of scholarship + application deadlines
6. **Cost of living calculator** — Monthly budget estimate by city
7. **University map view** — Plot search results on interactive map (Leaflet.js)
8. **Program-level search** — Search by specific degree program, not just institution

### Bigger Features
9. **Alumni reviews** — Students rate/review universities they attended
10. **Peer connect** — Match applicants with current students at target university
11. **Mobile PWA** — Service worker + manifest for installable mobile experience
12. **Dark mode** — Tailwind `dark:` classes throughout
13. **Payment integration** — Stripe for Premium subscription purchases
14. **Real-time notifications** — WebSocket for live support replies and announcements
15. **Google/GitHub OAuth** — Social login
16. **Export to PDF** — Recommendations or profile export
17. **Email digest** — Weekly email with scholarship deadlines, new universities

---

## 18. Immediate Next Steps (Prioritized)

### 1. Fix remaining i18n gaps (Quick wins — 1–2 hours)
- Move `LANG_FILTERS` inside `Universities` component, wrap labels in `t()`
- Fix country `<option>` labels in Universities.jsx
- Fix "Retry" button in `Instructors.jsx` ChatModal (~line 110)
- Translate remaining headings in `CoursePage.jsx`, `PlacementTestPage.jsx`, `Pricing.jsx`

### 2. Notification bell with unread badge (High UX impact — 3–4 hours)
- Add bell icon to `Topbar.jsx` or `Navbar.jsx`
- Fetch `/notifications/unread-count` on load + poll every 30s
- Show badge count
- Dropdown panel showing recent notifications
- Click → mark read + navigate to relevant page

### 3. Profile completeness bar (Low effort, high engagement — 2 hours)
- Calculate % complete in `Dashboard.jsx` based on profile fields
- Render progress bar with "Add X to improve your recommendations" CTA

### 4. Document checklist per university (Medium — 4–6 hours)
- Add `document_checklist` JSON field to `applications` table (migration needed)
- Show checklist in `UniversityDetail.jsx` and `ApplicationTracker.jsx`
- Backend: PATCH endpoint to update checklist state
- Frontend: Checkbox list UI in application card

### 5. Personalized dashboard redesign (Medium — 4–6 hours)
- Show top 3 recommendations widget
- Show saved universities count + recent
- Show open support tickets
- Show upcoming scholarship deadlines
- Replace current generic dashboard content

---

## 19. Access Credentials Pattern

> ⚠️ Never commit real credentials. Use `.env` file only.

Default development:
- **Admin login:** Set via seed script or direct DB insert (`role = "admin"`)
- **Database:** `postgresql://postgres:<password>@localhost:5432/university_finder`
- **API docs:** `http://localhost:8000/docs` (no auth required to view)

---

*Document generated June 23, 2026. Covers all work through end of localization audit session.*
