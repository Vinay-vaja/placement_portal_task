# Mini Placement Portal

A centralized campus recruitment and placement management platform engineered for institutional Training and Placement Offices (TPO) and student recruitment operations. The system automates student profile verification, academic credential scoring, recruitment drive scheduling, automated eligibility auditing, application tracking, attendance monitoring, and placement analytics.

---

## Table of Contents

- [Overview](#overview)
- [Architecture and Tech Stack](#architecture-and-tech-stack)
- [Database Schema Architecture](#database-schema-architecture)
  - [Entity-Relationship Diagram](#entity-relationship-diagram)
  - [Database Models and Entities](#database-models-and-entities)
  - [Enumerations](#enumerations)
- [Overall Platform Workflow](#overall-platform-workflow)
- [Role-Based Access Control and Security Architecture](#role-based-access-control-and-security-architecture)
  - [RBAC Workflow Diagram](#rbac-workflow-diagram)
  - [Security Mechanisms](#security-mechanisms)
- [Key Features](#key-features)
  - [Student Module](#student-module)
  - [Central TPO Module](#central-tpo-module)
  - [Automated Eligibility and Business Rules](#automated-eligibility-and-business-rules)
- [API Reference Summary](#api-reference-summary)
- [Project Directory Structure](#project-directory-structure)
- [Installation and Setup](#installation-and-setup)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Environment Variables](#environment-variables)
- [License](#license)

---

## Overview

The Mini Placement Portal streamlines university campus placement operations through:

- Dual portals tailored for Students and Central TPO administrators.
- Automated academic validation for regular 10+2 and Diploma-to-Degree (D2D) candidates.
- Real-time eligibility auditing engine validating SPI, CPI, CGPA, branch cutoffs, backlog limits, and institutional rules such as the 2x CTC placement policy.
- Secure Cloudinary PDF resume uploads per drive application.
- Attendance monitoring with automated debarment workflows for unexcused absences.
- Visual placement analytics, CTC distribution metrics, and Excel/CSV data exports.

---

## Architecture and Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind CSS v4 |
| State and Cache | Zustand (Session and Auth State), TanStack React Query |
| Form and Validation | React Hook Form, Zod |
| Backend Runtime | Node.js (ES Modules), Express.js 5 |
| Database and ORM | PostgreSQL, Prisma ORM v5 |
| Authentication | JWT (HS256), bcryptjs, Google OAuth 2.0 (google-auth-library) |
| Cloud Storage | Cloudinary (PDF resumes and company logos) |
| Email Service | Brevo (Sendinblue) Transactional API |
| Artificial Intelligence | Groq AI SDK (Llama 3.3 for announcement formatting) |
| Reporting | ExcelJS (XLSX) and streamed CSV engine |

---

## Database Schema Architecture

The relational schema comprises 10 models and 9 database enumerations managed via Prisma ORM on PostgreSQL.

### Entity-Relationship Diagram

```mermaid
erDiagram
    users ||--o| students : "has"
    students ||--o{ semester_spis : "records"
    companies ||--o{ recruitment_drives : "publishes"
    students ||--o{ applications : "submits"
    recruitment_drives ||--o{ applications : "receives"
    recruitment_drives ||--o{ announcements : "contains"
    recruitment_drives ||--o{ email_logs : "tracks"

    users {
        string id PK
        string email UK
        string role
        string authProvider
    }
    students {
        string id PK
        string userId FK
        string fullName
        string branch
        string studentType
        float tenthPercentage
        float twelfthPercentage
        string verificationStatus
        boolean profileLocked
        boolean isPlaced
    }
    semester_spis {
        string id PK
        string studentId FK
        int semester
        float spi
    }
    companies {
        string id PK
        string name
    }
    recruitment_drives {
        string id PK
        string companyId FK
        string role
        float ctc
        string status
    }
    applications {
        string id PK
        string studentId FK
        string driveId FK
        string status
        string resumeUrl
        boolean isPresent
    }
    announcements {
        string id PK
        string driveId FK
        string title
    }
    email_logs {
        string id PK
        string toEmail
        string status
    }
    tpo_settings {
        string id PK
        string key UK
    }
    password_reset_otps {
        string id PK
        string email
        string otp
        boolean used
    }
```

### Database Models and Entities

- users: Authentication accounts, role assignment (STUDENT, CENTRAL_TPO), and identity providers.
- students: Student profiles, 10th subject marks, 12th marks, D2D data, lock flag, verification state, and placement status.
- semester_spis: Semester SPI entries (Semesters 1-8) used to compute CPI (overall average) and CGPA (Semesters 5-6 average).
- companies: Partner company profiles and logos.
- recruitment_drives: Job postings defining CTC, academic cutoffs, branch criteria, round schedules, and deadlines.
- applications: Drive applications linking Cloudinary PDF resumes, attendance flags, and selection outcomes.
- announcements: Campus-wide and drive-specific announcement notices.
- email_logs: Delivery audit trail for all transactional and broadcast emails.
- tpo_settings: Global portal configuration key-value storage.
- password_reset_otps: One-time passwords for secure password recovery.

### Enumerations

- UserRole: STUDENT, CENTRAL_TPO
- AuthProvider: LOCAL, GOOGLE
- StudentType: REGULAR, D2D
- Branch: CE, AIML, IT, EC, EE, CIVIL, CHEMICAL, MECHANICAL, RUBBER, PLASTIC, ENVIRONMENTAL, IC, ROBOTICS, AUTOMOBILE
- VerificationStatus: PENDING, VERIFIED, REJECTED
- DriveStatus: ACTIVE, CLOSED
- ApplicationStatus: APPLIED, SHORTLISTED, REJECTED, SELECTED
- AllowedStudentType: ALL, REGULAR, D2D
- EmailStatus: SENT, FAILED

---

## Overall Platform Workflow

The end-to-end operational lifecycle connects student registration, academic audit, drive scheduling, eligibility checks, interviews, and analytics.

```mermaid
flowchart TD
    subgraph Onboarding["Phase 1: Student Onboarding and Profile Lock"]
        A[Student Registers via Email or Google OAuth] --> B[Enter Personal & Academic Data]
        B --> C[Input 10th / 12th Subject Marks or D2D Details]
        C --> D[Enter Semester 1 to 8 SPIs]
        D --> E[Accept Declaration and Submit Profile]
        E --> F[Profile Locked Automatically]
    end

    subgraph Verification["Phase 2: Administrative Verification"]
        F --> G[TPO Reviews Academic Profile]
        G -->|Reject with Feedback| H[Profile Unlocked for Correction]
        H --> B
        G -->|Verify Profile| I[Status Updated to VERIFIED]
    end

    subgraph DriveManagement["Phase 3: Drive Creation & Publishing"]
        J[TPO Registers Company] --> K[Create Recruitment Drive]
        K --> L[Define Minimum CPI, CGPA, 10th, 12th, Branches, and CTC]
        L --> M[Drive Published & Notifications Dispatched]
    end

    subgraph ApplicationPhase["Phase 4: Eligibility Audit & Application"]
        I --> N[Student Explores Active Drives]
        M --> N
        N --> O{Eligibility Engine Check}
        O -->|Criteria Not Met| P[Application Blocked with Specific Reason]
        O -->|2x CTC Rule Violaton| P
        O -->|Eligible| Q[Upload Fresh PDF Resume to Cloudinary]
        Q --> R[Accept Mandatory Terms & Submit Application]
    end

    subgraph EvaluationPhase["Phase 5: Evaluation, Attendance & Offer"]
        R --> S[TPO Audits Applicant Roster]
        S --> T[Conduct Rounds & Mark Attendance]
        T -->|Unexcused Absence| U[Mark Absent & Debar Student from Placements]
        T -->|Present| V[Update Status: Shortlisted / Rejected / Selected]
        V -->|Selected| W[Mark Student as Placed with CTC Package]
        W --> X[Apply 2x CTC Constraint on Future Drives]
    end

    subgraph AnalyticsPhase["Phase 6: Reporting & Intelligence"]
        W --> Y[Update TPO Live Analytics Dashboard]
        Y --> Z[Generate Company Rankings, CTC Intelligence, and XLSX Exports]
    end
```

---

## Role-Based Access Control and Security Architecture

The platform enforces strict role separation between Students and Central Placement Officers (TPO) across both frontend navigation guards and backend middleware pipelines.

### RBAC Workflow Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Client as User / Browser
    participant Router as Next.js App Router (Client / Server)
    participant Guard as Frontend RBACGuard
    participant API as Express API Server
    participant AuthMW as Auth Middleware (JWT Verifier)
    participant RoleMW as RBAC Middleware (Role Check)
    participant Service as Business Service Layer
    participant DB as PostgreSQL (Prisma ORM)

    Client->>Router: Navigate to Route (e.g. /tpo/dashboard)
    Router->>Guard: Check Current User Role in Zustand Store
    alt Role Mismatch or Unauthenticated
        Guard-->>Client: Redirect to /login or /unauthorized
    else Role Authorized
        Guard->>Client: Render Protected View
        Client->>API: HTTP Request with Header Authorization: Bearer token
        API->>AuthMW: Execute authenticate()
        AuthMW->>AuthMW: Verify JWT Signature & Expiry
        alt Invalid / Expired Token
            AuthMW-->>Client: HTTP 401 Unauthorized
        else Valid Token
            AuthMW->>DB: Query User Record & Profile Status
            DB-->>AuthMW: User Record Found
            AuthMW->>RoleMW: Pass Request with req.user Context
            RoleMW->>RoleMW: Execute authorize("CENTRAL_TPO")
            alt Role Not in Allowed List
                RoleMW-->>Client: HTTP 403 Forbidden
            else Authorized
                RoleMW->>Service: Dispatch Request Handler
                Service->>DB: Execute Query / Mutation
                DB-->>Service: Query Results
                Service-->>API: Response Payload
                API-->>Client: HTTP 200 OK Response
            end
        end
    end
```

### Security Mechanisms

1. Token Authentication: Stateless JWT authentication utilizing secure HS256 signatures with configured expiration windows.
2. Password Security: Passwords hashed using bcryptjs with 10 salt rounds.
3. Third-Party Authentication: Direct backend Google ID token verification via google-auth-library to prevent client-side token spoofing.
4. Input Sanitation and Validation: Strict request payload validation using Zod schemas on every write endpoint.
5. Administrative Guarding: Middleware-level checks verifying user role membership prior to executing administrative controllers.
6. File Ingestion Restrictions: PDF file type checking, size enforcement (maximum 5MB), and secure transfer to Cloudinary.

---

## Key Features

### Student Module
- Authentication: Traditional email/password access and Google OAuth 2.0 integration.
- Academic Scoring Engine:
  - Form validation for 10th standard subject marks out of 100 each (Mathematics, Science, English, Social Science, Sanskrit, Gujarati) with auto-calculated aggregate percentage.
  - 12th standard subject marks for Regular candidates (English, Physics, Mathematics, Chemistry, Computer).
  - D2D candidate scoring including previous diploma CGPA, ACPC rank, and college history.
  - Per-semester SPI tracking (Semesters 1 through 8) with automated calculation of CPI (average across all entered semesters) and CGPA (average of Semesters 5 and 6).
- Profile Locking: Automatic profile locking upon submission to guarantee data integrity during verification cycles.
- Drive Portal: Searchable and filterable catalog of active drives displaying CTC, location, job descriptions, and eligibility feedback.
- Application Submission: Per-drive PDF resume upload with terms confirmation.
- Placement History: Status tracking across all applications (Applied, Shortlisted, Selected, Rejected).

### Central TPO Module
- Unified Dashboard: KPI metrics covering total enrolled students, verified profiles, active recruitment drives, total placements, and drive attendance rates.
- Compact Navigation: Minimal, high-density layout facilitating switching between Overview, Students, Companies, Drives, Applications, and Analytics views.
- Student Management: Multi-faceted searching and filtering by branch, student type, verification state, and placement status.
- Verification Console: Profile inspection interface to verify or reject student submissions with audit feedback.
- Disciplinary Control: Administrative ability to dismiss non-compliant students from placement operations and reinstate them when required.
- Drive Management: Form builder to publish drives with granular academic cutoffs, branch white-lists, student type rules, round venues, and deadlines.
- Attendance Management: Bulk and individual candidate attendance tracking for recruitment rounds.
- Communication Engine: Rich broadcast email interface powered by Brevo, featuring preset templates and Groq AI text refactoring (Llama 3.3).
- Data Export Center: Instant export of candidate rosters and drive selection lists to formatted Microsoft Excel (.xlsx) and CSV files.

### Automated Eligibility and Business Rules

The backend execution pipeline validates every application attempt against four layers of business logic:

1. Verification Prerequisite: The student profile must have verificationStatus === "VERIFIED" and profileLocked === true.
2. Academic Cutoff Audit:
   - Student 10th percentage >= Drive minTenthPercentage.
   - Student 12th percentage >= Drive minTwelfthPercentage (for regular students).
   - Student CPI >= Drive minCpi.
   - Student CGPA >= Drive minCgpa.
   - Student branch belongs to Drive allowedBranches (if configured).
   - Student type matches Drive allowedStudentType (REGULAR, D2D, or ALL).
3. 2x CTC Salary Rule: If a student is already placed (isPlaced === true), they are blocked from applying to any drive unless the new drive offer satisfies:
   $$\text{New Drive CTC} \ge 2 \times \text{Current Package CTC}$$
4. Single Role Per Company: Students are restricted to one active role per corporate partner unless explicitly waived by the TPO (tpoAllowMultiple === true).

---

## API Reference Summary

### Authentication Routes (/api/auth)
- POST /register: Register a new student account.
- POST /login: Authenticate credentials and issue JWT.
- POST /google: Authenticate or sign up via Google OAuth ID token.
- POST /forgot-password: Issue password reset OTP email.
- POST /reset-password: Reset password via verified OTP.
- GET /me: Retrieve authenticated user profile and roles.

### Student Routes (/api/students)
- GET /profile: Fetch personal student profile and academic metrics.
- PUT /profile: Update profile information (allowed before lock).
- POST /lock: Lock profile and trigger TPO verification queue.
- GET /spis: Fetch semester SPI entries.
- POST /spis: Add or update semester SPI record.
- GET /drives: Browse active drives with eligibility evaluations.
- POST /applications: Submit application to a drive with resume upload.
- GET /applications: List student application history.

### TPO Management Routes (/api/tpo)
- GET /dashboard/stats: Retrieve high-level placement KPIs and package distributions.
- GET /students: Search and filter student directory.
- PUT /students/:id/verify: Verify or reject student academic profile.
- PUT /students/:id/dismiss: Dismiss candidate from campus placements.
- PUT /students/:id/reinstate: Reinstate candidate into campus placements.
- POST /companies: Register a corporate recruitment partner.
- GET /companies: List registered corporate partners.
- POST /drives: Create and publish a recruitment drive.
- PUT /drives/:id: Update drive details and parameters.
- POST /drives/:id/attendance: Mark candidate attendance for drive rounds.
- PUT /applications/:id/status: Update candidate application status.
- POST /announcements/send: Dispatch broadcast email announcement.
- POST /announcements/refactor: Refactor raw text into structured HTML email using Groq AI.
- GET /export/students: Download filtered student registry as XLSX or CSV.
- GET /export/company-wise: Download company selection rosters as XLSX.

---

## Project Directory Structure

```text
mini_placement_portal/
├── placement_portal_task/
│   ├── backend/
│   │   ├── prisma/
│   │   │   └── schema.prisma         # Database models, relations, and enums
│   │   ├── src/
│   │   │   ├── config/               # Environment, database, Brevo, and Cloudinary setup
│   │   │   ├── controllers/          # HTTP request handlers
│   │   │   ├── middleware/           # Auth, RBAC, file upload, error handling
│   │   │   ├── routes/               # Express endpoint definitions
│   │   │   ├── services/             # Core business logic and eligibility checks
│   │   │   ├── utils/                # Helper utilities and token generators
│   │   │   ├── validators/           # Zod schema definitions
│   │   │   └── server.js             # Express application initialization
│   │   ├── package.json
│   │   └── .env.example
│   ├── frontend/
│   │   ├── public/                   # Static icons and assets
│   │   ├── src/
│   │   │   ├── app/                  # Next.js App Router structure
│   │   │   │   ├── login/            # Authentication view
│   │   │   │   ├── register/         # Student signup view
│   │   │   │   ├── student/          # Student portal pages (profile, drives, applications)
│   │   │   │   └── tpo/              # Central TPO portal (dashboard, drives, students, settings)
│   │   │   ├── components/           # Reusable UI cards, tables, modals, and charts
│   │   │   ├── config/               # Frontend constants and branch options
│   │   │   ├── hooks/                # React custom hooks (useAuth, etc.)
│   │   │   ├── providers/            # RBAC guards and application wrappers
│   │   │   ├── services/             # Axios API client integrations
│   │   │   └── types/                # TypeScript interface definitions
│   │   ├── package.json
│   │   └── next.config.ts
│   └── README.md
└── README.md
```

---

## Installation and Setup

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm (v9.0.0 or higher)
- PostgreSQL database instance
- Cloudinary account (for file and image storage)
- Brevo account (for email delivery)
- Groq Cloud API Key (optional, for AI announcement formatting)

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd placement_portal_task/backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
   Populate all required values in `.env` (refer to the Environment Variables section).

4. Run Prisma database migrations:
   ```bash
   npx prisma migrate dev --name init
   ```

5. Seed database with initial Central TPO credentials:
   ```bash
   node scripts/seed-tpo.js
   ```

6. Start the backend development server:
   ```bash
   npm run dev
   ```
   The backend server will run on `http://localhost:5000`.

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd placement_portal_task/frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure frontend environment variables:
   Create a `.env.local` file:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
   ```

4. Launch the Next.js development server:
   ```bash
   npm run dev
   ```
   The application interface will be available at `http://localhost:3000`.

---

## Environment Variables

### Backend (`.env`)

| Variable | Description | Example / Default |
|---|---|---|
| PORT | Server execution port | 5000 |
| DATABASE_URL | PostgreSQL connection string | postgresql://user:pass@localhost:5432/placement_db |
| JWT_SECRET | Private secret key for JWT signing | your-secure-jwt-key |
| JWT_EXPIRES_IN | Expiration duration for access tokens | 7d |
| CLOUDINARY_CLOUD_NAME | Cloudinary cloud identifier | your_cloud_name |
| CLOUDINARY_API_KEY | Cloudinary API access key | your_api_key |
| CLOUDINARY_API_SECRET | Cloudinary API access secret | your_api_secret |
| BREVO_API_KEY | Brevo API key for transactional emails | xkeysib-your-key |
| SENDER_EMAIL | Verified sender email for Brevo | tpo@institution.edu |
| SENDER_NAME | Sender identity display name | Central Placement Cell |
| GOOGLE_CLIENT_ID | Google OAuth 2.0 Web Client ID | your-client-id.apps.googleusercontent.com |
| GROQ_API_KEY | Groq AI API key for announcement refactoring | gsk_your-groq-key |
| FRONTEND_URL | Allowed CORS origin URL | http://localhost:3000 |

### Frontend (`.env.local`)

| Variable | Description | Example / Default |
|---|---|---|
| NEXT_PUBLIC_API_URL | Full HTTP URL to backend REST API | http://localhost:5000/api |
| NEXT_PUBLIC_GOOGLE_CLIENT_ID | Google OAuth 2.0 Web Client ID | your-client-id.apps.googleusercontent.com |

---

## License

This software is developed for institutional academic placement management. All rights reserved.
