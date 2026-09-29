# Mini Placement Portal - Backend

A complete RESTful backend for a college Mini Placement Portal, built with Node.js, Express.js, Prisma ORM, and PostgreSQL.

---

## Project Overview

The Mini Placement Portal serves two roles:

- **STUDENT** - Register, submit academic profile, view companies/drives, check eligibility, apply to drives, track applications
- **CENTRAL_TPO** - Manage students, companies, recruitment drives, verify students, monitor and update applications

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js (ES Modules) |
| Framework | Express.js |
| ORM | Prisma v5 |
| Database | PostgreSQL |
| Auth | JWT (jsonwebtoken) |
| Passwords | bcrypt |
| Validation | Zod |
| Environment | dotenv |
| Cross-Origin | CORS |

---

## Prerequisites

- Node.js >= 18
- PostgreSQL (running locally or remote)
- npm

---

## PostgreSQL Setup

1. Install PostgreSQL from https://www.postgresql.org/download/
2. Start PostgreSQL service
3. Create the database:

```sql
CREATE DATABASE placement_portal;
```

4. Note your PostgreSQL username, password, host, and port.

---

## Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:password@localhost:5432/placement_portal` |
| `JWT_SECRET` | Secret key for JWT signing | `your-strong-secret-here` |
| `JWT_EXPIRES_IN` | JWT token expiry | `7d` |
| `CLIENT_URL` | Frontend URL for CORS | `http://localhost:3000` |
| `SEED_TPO_EMAIL` | TPO account email for seed | `tpo@college.edu` |
| `SEED_TPO_PASSWORD` | TPO account password for seed | `secure-password` |

**Example `.env`:**
```env
PORT=5000
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/placement_portal"
JWT_SECRET="super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="7d"
CLIENT_URL="http://localhost:3000"
SEED_TPO_EMAIL="tpo@college.edu"
SEED_TPO_PASSWORD="SecureTPO@123"
```

---

## Installation & Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
# Copy example env and fill in your PostgreSQL credentials
cp .env.example .env
```

### 3. Generate Prisma Client

```bash
npm run prisma:generate
```

### 4. Run Database Migration

```bash
npm run prisma:migrate
```

> This creates all tables in your PostgreSQL database.

### 5. Seed the Database (Creates TPO Account)

```bash
npm run prisma:seed
```

> Uses `SEED_TPO_EMAIL` and `SEED_TPO_PASSWORD` from `.env`. Idempotent - safe to run multiple times.

### 6. Start Development Server

```bash
npm run dev
```

Server starts at: **http://localhost:5000**

Health check: **http://localhost:5000/api/health**

---

## Project Structure

```
backend/
|-- src/
|   |-- config/
|   |   |-- env.js              # Environment config & validation
|   |   `-- prisma.js           # Singleton PrismaClient instance
|   |
|   |-- controllers/            # Thin layer: request -> service -> response
|   |   |-- auth.controller.js
|   |   |-- student.controller.js
|   |   |-- tpo.controller.js
|   |   |-- company.controller.js
|   |   |-- drive.controller.js
|   |   `-- application.controller.js
|   |
|   |-- services/               # Business logic layer
|   |   |-- auth.service.js
|   |   |-- student.service.js
|   |   |-- company.service.js
|   |   |-- drive.service.js
|   |   |-- eligibility.service.js
|   |   `-- application.service.js
|   |
|   |-- routes/                 # Route definitions with middleware
|   |   |-- auth.routes.js
|   |   |-- student.routes.js
|   |   |-- tpo.routes.js
|   |   |-- company.routes.js
|   |   |-- drive.routes.js
|   |   `-- application.routes.js
|   |
|   |-- middleware/
|   |   |-- auth.middleware.js   # JWT verification -> req.user
|   |   |-- role.middleware.js   # requireRole() factory
|   |   |-- error.middleware.js  # Global error handler
|   |   `-- notFound.middleware.js
|   |
|   |-- validators/              # Zod schemas as Express middleware
|   |   |-- validate.js          # validate() factory
|   |   |-- auth.validator.js
|   |   |-- student.validator.js
|   |   |-- company.validator.js
|   |   |-- drive.validator.js
|   |   `-- application.validator.js
|   |
|   |-- utils/
|   |   |-- jwt.js              # generateToken, verifyToken
|   |   |-- password.js         # hashPassword, comparePassword
|   |   `-- response.js         # sendSuccess, sendError
|   |
|   |-- app.js                  # Express app setup (no server start)
|   `-- server.js               # DB connect + server listen
|
|-- prisma/
|   |-- schema.prisma           # All models, enums, relations
|   `-- seed.js                 # TPO account seeder
|
|-- .env                        # Local environment (not in git)
|-- .env.example                # Environment template
|-- .gitignore
|-- package.json
`-- README.md
```

---

## API Endpoints

### System
| Method | URL | Auth | Description |
|--------|-----|------|-------------|
| GET | `/api/health` | None | Health check |

### Authentication
| Method | URL | Auth | Description |
|--------|-----|------|-------------|
| POST | `/api/auth/register` | None | Register student account |
| POST | `/api/auth/login` | None | Login (returns JWT) |

### Student (requires STUDENT role)
| Method | URL | Auth | Description |
|--------|-----|------|-------------|
| GET | `/api/students/me` | Student | Get own profile |
| POST | `/api/students/profile` | Student | Submit profile (locks it) |
| PUT | `/api/students/profile` | Student | Update profile (if not locked) |
| GET | `/api/students/applications` | Student | View own applications |

### TPO - Students (requires CENTRAL_TPO role)
| Method | URL | Auth | Description |
|--------|-----|------|-------------|
| GET | `/api/tpo/students` | TPO | Get all students |
| GET | `/api/tpo/students/:id` | TPO | Get specific student |
| PUT | `/api/tpo/students/:id` | TPO | Update any student (can update locked profiles) |
| PATCH | `/api/tpo/students/:id/verify` | TPO | Update verification status |

### Companies
| Method | URL | Auth | Description |
|--------|-----|------|-------------|
| GET | `/api/companies` | Any auth | List all companies |
| GET | `/api/companies/:id` | Any auth | Get company details |
| POST | `/api/companies` | TPO | Create company |
| PUT | `/api/companies/:id` | TPO | Update company |
| DELETE | `/api/companies/:id` | TPO | Delete company |

### Recruitment Drives
| Method | URL | Auth | Description |
|--------|-----|------|-------------|
| GET | `/api/drives` | Any auth | List all drives |
| GET | `/api/drives/:id` | Any auth | Get drive details |
| POST | `/api/drives` | TPO | Create drive |
| PUT | `/api/drives/:id` | TPO | Update drive |
| DELETE | `/api/drives/:id` | TPO | Delete drive |
| GET | `/api/drives/:driveId/eligible-students` | TPO | Get eligible students |

### Applications
| Method | URL | Auth | Description |
|--------|-----|------|-------------|
| POST | `/api/drives/:driveId/apply` | Student | Apply to a drive |
| GET | `/api/tpo/applications` | TPO | View all applications |
| PATCH | `/api/applications/:id/status` | TPO | Update application status |

---

## Roles

### STUDENT
- Can register and login
- Can view/submit their academic profile
- Profile **locks permanently** after submission
- Can view all companies and recruitment drives
- Can check eligibility and apply to drives
- Can view their own applications and status

### CENTRAL_TPO
- Created via seed script (not via registration API)
- Can view, update, verify any student profile (including locked profiles)
- Full CRUD on companies and recruitment drives
- Can define eligibility criteria per drive
- Can filter eligible students per drive
- Can view all applications with filters
- Can update application statuses (APPLIED -> SHORTLISTED -> REJECTED / SELECTED)

---

## Important Business Rules

| Rule | Description |
|------|-------------|
| **Profile Locking** | Student profile locks permanently after `POST /api/students/profile`. Backend enforces this. |
| **TPO Override** | TPO can update any student profile, even locked ones. |
| **Eligibility Authority** | Backend always recalculates eligibility on apply. Frontend eligibility display is informational only. |
| **D2D Students** | D2D students do NOT require 12th percentage. They use D2D CGPA instead. |
| **REGULAR Students** | REGULAR students require 12th percentage. |
| **10th = Percentage** | 10th standard uses `percentage`, never `percentile`. |
| **Duplicate Application** | DB-level unique constraint prevents applying to the same drive twice. |
| **Drive Status** | Only `ACTIVE` drives accept applications. `CLOSED` drives are read-only. |
| **Deadline Enforcement** | Application deadline is enforced by the backend. Expired drives reject applications. |
| **Role Authorization** | All role checks are enforced by backend middleware. Never trusts frontend. |

---

## Authentication Flow

1. **Register**: `POST /api/auth/register` -> Creates `User` + `Student` records
2. **Login**: `POST /api/auth/login` -> Returns `{ token, user }`
3. **Use Token**: Add to requests as `Authorization: Bearer <token>`
4. **JWT Payload**: `{ userId, role }` - role is `STUDENT` or `CENTRAL_TPO`

---

## Database Models

| Model | Description |
|-------|-------------|
| `User` | Auth credentials (email, passwordHash, role) |
| `Student` | Academic profile (marks, percentages, D2D info, profile lock status) |
| `Company` | Company info (name, imageUrl) |
| `RecruitmentDrive` | Drive details + eligibility criteria |
| `Application` | Student-Drive application with status tracking |

---

## Seed Commands

```bash
# Create the Central TPO account (reads from SEED_TPO_EMAIL and SEED_TPO_PASSWORD in .env)
npm run prisma:seed
```

The seed is **idempotent** - running it multiple times won't create duplicate accounts.

---

## All npm Scripts

```bash
npm run dev              # Start with --watch (auto-restart on file changes)
npm run start            # Start in production mode
npm run prisma:generate  # Generate Prisma Client
npm run prisma:migrate   # Run database migrations
npm run prisma:seed      # Seed the TPO account
npm run prisma:studio    # Open Prisma Studio GUI
```

---

## Testing Checklist

### Auth
- [ ] Student register
- [ ] Duplicate email rejected (409)
- [ ] Login with correct credentials
- [ ] Login with wrong password (401)
- [ ] Access protected route without token (401)
- [ ] Access protected route with invalid token (401)

### Roles
- [ ] Student cannot access TPO endpoints (403)
- [ ] TPO cannot access student-only endpoints (403)

### Profile
- [ ] Get own profile (student)
- [ ] Submit REGULAR profile (with 12th %)
- [ ] Submit D2D profile (with D2D CGPA, no 12th required)
- [ ] Profile locks after submission
- [ ] Locked student cannot edit profile (403)
- [ ] TPO can edit locked student profile

### Companies
- [ ] TPO creates company
- [ ] Student views company list
- [ ] Student cannot create company (403)

### Drives
- [ ] TPO creates drive with eligibility criteria
- [ ] Student views drive list
- [ ] Student cannot create drive (403)

### Eligibility & Applications
- [ ] Eligible student can apply
- [ ] Ineligible student gets rejection with reasons
- [ ] Duplicate application rejected (409)
- [ ] Application to closed drive rejected
- [ ] Application to expired drive rejected
- [ ] Student views own applications
- [ ] TPO views all applications
- [ ] TPO updates application status
- [ ] Student cannot update application status (403)
