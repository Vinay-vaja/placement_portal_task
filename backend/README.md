# Mini Placement Portal - Backend

A complete, production-grade RESTful API backend for a college Mini Placement Portal, built with Node.js (ES Modules), Express.js, Prisma ORM, and PostgreSQL.

---

## 🚀 Key Features

### 👨‍🎓 Student Features
- **Dual Authentication**:
  - Email & Password registration & login
  - Google OAuth 2.0 Sign-In (`POST /api/auth/google`) with automatic profile completion detection
- **Multi-Step Profile Completion**:
  - Branch selection (`CE`, `AIML`, `IT`, `EC`, `EE`, `CIVIL`, `CHEMICAL`, `MECHANICAL`, `RUBBER`, `PLASTIC`, `ENVIRONMENTAL`, `IC`)
  - **10th Standard Marks**: Subject-wise (Maths, Science, English, Social Science, Computer/P.T., Sanskrit, Gujarati) with auto-calculated percentage
  - **12th Standard Marks** (Regular students): English, Physics, Maths, Chemistry, Computer with auto-calculated percentage
  - **D2D (Diploma to Degree)**: CGPA and ACPC Rank
  - Mandatory Declaration checkbox ("I verify all information is correct...")
  - Profile automatically **locks** upon completion
- **SPI / CPI / CGPA Academic Engine**:
  - Semester SPI CRUD (`semesters 1 to 8`)
  - Auto-computed **CPI**: Average of all entered semester SPIs
  - Auto-computed **CGPA**: Average of Semester 5 + Semester 6 SPI
  - Enforces mandatory semester requirements set by Central TPO
- **Drive Exploration & Applications**:
  - Browse verified companies and active drives
  - Real-time eligibility checking with precise rejection reasons
  - Application submission with:
    - Fresh PDF resume upload per application (Cloudinary)
    - Mandatory terms acceptance
    - One-role-per-company constraint enforcement (unless waived by TPO)
    - **2x Salary Rule**: If student already placed, new drive CTC must be >= 2x current package
  - Application history and status tracking with pagination

---

### 🏛️ Central TPO (Training & Placement Officer) Features
- **Student Profile Verification & Management**:
  - View all student profiles with rich pagination, search, and multi-faceted filtering
  - Verify / reject student academic profiles
  - Edit student profile even after profile lock
  - **Disciplinary Actions**: Dismiss student from placement or reinstate them
- **Company & Drive Management**:
  - Create companies with logo upload (Cloudinary)
  - Create drives with comprehensive criteria:
    - Minimum 10th %, 12th %, CPI, CGPA
    - Allowed branches list
    - Allowed student types (`ALL`, `REGULAR`, `D2D`)
    - Max active backlogs limit
    - CTC / CTC range (Min-Max LPA)
    - Max selections per student & TPO override flag
    - Structured round details (dates, timing, venue)
  - Close or update drives
- **Attendance & Disciplinary Automation**:
  - Single and bulk attendance marking for interview/test rounds
  - Automatically dismiss absent students from placement
- **TPO Dashboard & Analytics**:
  - Student stats (verified, pending, placed, dismissed, branch-wise, type-wise)
  - Drive & company metrics
  - Application funnel (applied, shortlisted, selected, rejected)
  - CTC statistics: Highest, lowest, average, median packages; company-wise and branch-wise breakdown
- **Automated Email Communications (Brevo Integration)**:
  - Automated status updates on application status changes
  - Drive announcement emails to filtered/eligible students
  - Broadcast announcements with custom body and targeting
  - Comprehensive email audit logs
- **Data Exporting**:
  - Export filtered students list to **CSV** or **Excel (.xlsx)** via `exceljs`
  - Export drive applicant lists with contact, marks, and resume links
- **Placement Settings**:
  - Configure mandatory semesters required for drive eligibility

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js (ES Modules) |
| Framework | Express.js 5 |
| ORM | Prisma v5 (PostgreSQL) |
| Authentication | JWT (`jsonwebtoken`), bcrypt, Google OAuth (`google-auth-library`) |
| Validation | Zod |
| File Storage | Cloudinary (Images + Resumes in PDF format) |
| Email Service | Brevo (formerly Sendinblue) SDK |
| Spreadsheet Export | ExcelJS & CSV streaming |
| File Uploads | Multer |

---

## ⚙️ Environment Variables

Create `.env` file in the backend root by copying `.env.example`:

```env
# Server
PORT=5000
DATABASE_URL="postgresql://postgres:password@localhost:5432/placement_portal"
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"
CLIENT_URL="http://localhost:3000"

# Initial Seed Credentials
SEED_TPO_EMAIL="tpo@example.com"
SEED_TPO_PASSWORD="SecureTPOPassword@123"

# Cloudinary
CLOUDINARY_CLOUD_NAME="your_cloudinary_cloud_name"
CLOUDINARY_API_KEY="your_cloudinary_api_key"
CLOUDINARY_API_SECRET="your_cloudinary_api_secret"

# Google OAuth
GOOGLE_CLIENT_ID="your_google_client_id.apps.googleusercontent.com"

# Brevo (Sendinblue)
BREVO_API_KEY="your_brevo_api_key"
BREVO_SENDER_EMAIL="placements@yourcollege.edu"
BREVO_SENDER_NAME="Placement Cell"
```

---

## 📋 API Reference

### 🔐 Authentication (`/api/auth`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register student with email & password |
| POST | `/api/auth/login` | Public | Login with email & password |
| POST | `/api/auth/google` | Public | Google OAuth login / registration (`idToken`) |

---

### 🎓 Students (`/api/students`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/students/profile` | Student | Get current student's profile & SPIs |
| POST | `/api/students/complete-profile` | Student | Complete profile with marks, branch & lock profile |
| POST | `/api/students/profile` | Student | Legacy profile submit endpoint |
| POST | `/api/students/spi` | Student | Add or update semester SPI |
| GET | `/api/students/spi` | Student | Get all semester SPIs with calculated CPI & CGPA |
| PUT | `/api/students/spi/:semester` | Student | Update a specific semester SPI |
| GET | `/api/students/applications` | Student | View own applications (paginated) |

---

### 🏢 Companies (`/api/companies`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/companies` | Authenticated | List all companies (search, pagination) |
| GET | `/api/companies/:id` | Authenticated | Get company details with active drives |
| POST | `/api/companies` | TPO Only | Create company (with optional logo upload) |
| PUT | `/api/companies/:id` | TPO Only | Update company details/logo |

---

### 📢 Recruitment Drives (`/api/drives`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/drives` | Authenticated | List drives (filtered by branch, ctc, pagination) |
| GET | `/api/drives/:id` | Authenticated | Get drive details |
| POST | `/api/drives` | TPO Only | Create new recruitment drive with criteria |
| PUT | `/api/drives/:id` | TPO Only | Update recruitment drive |
| PATCH | `/api/drives/:id/status` | TPO Only | Toggle drive status (`ACTIVE` / `CLOSED`) |
| GET | `/api/drives/:id/eligibility` | Student | Check student eligibility for this drive |
| GET | `/api/drives/:id/eligible-students` | TPO Only | Get all eligible students for drive |
| POST | `/api/drives/:id/apply` | Student | Apply to drive (requires PDF resume upload & terms acceptance) |

---

### 📝 Applications (`/api/applications`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| PATCH | `/api/applications/:id/status` | TPO Only | Update status (`SHORTLISTED`, `SELECTED`, `REJECTED`) |

---

### 🏛️ TPO Portal Management (`/api/tpo`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/tpo/dashboard` | TPO Only | Complete placement dashboard analytics & CTC metrics |
| GET | `/api/tpo/students` | TPO Only | Filter & search students (by branch, marks, placed, dismissed) |
| GET | `/api/tpo/students/:id` | TPO Only | Get full student academic record |
| PATCH | `/api/tpo/students/:id/verify` | TPO Only | Verify or reject student profile |
| PUT | `/api/tpo/students/:id` | TPO Only | Admin update of student record |
| PATCH | `/api/tpo/students/:id/dismiss` | TPO Only | Dismiss student from placement drives |
| PATCH | `/api/tpo/students/:id/reinstate` | TPO Only | Reinstate dismissed student |
| GET | `/api/tpo/applications` | TPO Only | List all applications across drives with filters |
| PATCH | `/api/tpo/applications/:id/attendance` | TPO Only | Mark student attendance (`isPresent: true/false`) |
| POST | `/api/tpo/drives/:driveId/mark-attendance`| TPO Only | Bulk mark attendance for round |
| POST | `/api/tpo/drives/:driveId/notify` | TPO Only | Broadcast email notification to drive applicants |
| POST | `/api/tpo/announcements/send` | TPO Only | Send announcement email to targeted students |
| GET | `/api/tpo/emails` | TPO Only | View sent email audit logs (paginated) |
| GET | `/api/tpo/students/export` | TPO Only | Export filtered students (`?format=csv` or `?format=xlsx`) |
| GET | `/api/tpo/drives/:driveId/export` | TPO Only | Export drive applicants (`?format=csv` or `?format=xlsx`) |
| GET | `/api/tpo/settings` | TPO Only | Get portal configuration (mandatory semesters, etc.) |
| PATCH | `/api/tpo/settings/required-semesters` | TPO Only | Update mandatory semesters required |

---

## 📦 Setup & Running

```bash
# 1. Install dependencies
npm install

# 2. Setup database
npx prisma generate
npx prisma migrate dev --name init_overhaul

# 3. Seed initial TPO account & settings
npm run prisma:seed

# 4. Start development server
npm run dev
```

---

## 🛡️ Business Rules Implemented
1. **Profile Lock**: Students cannot alter academic credentials once submitted unless unlocked/edited by Central TPO.
2. **One-Role-Per-Company**: Students cannot apply to multiple drives of the same company unless `tpoAllowMultiple` is enabled.
3. **2x Salary Rule**: Already placed students can only apply to drives offering $\ge 2 \times$ their current CTC.
4. **Attendance Enforcement**: Failing to appear for a drive interview/round causes automated placement dismissal.
5. **Dynamic CPI/CGPA**: Real-time evaluation of CPI (all sem SPIs) and CGPA (sem 5 & 6) enforced against drive minimum criteria.
