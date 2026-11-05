# Doctor Tracker API

## Description

Doctor Tracker API is the secure data and analytics service behind the Doctor Tracker administration portal. It exposes a versioned REST interface for authenticated doctor and patient management, optimized search and pagination, and dashboard reporting while keeping validation, authorization, query performance, and production-safe error handling inside one focused Express and MongoDB service.

## Setup Guide

### Prerequisites

- Node.js 24 LTS
- pnpm 10 or newer
- MongoDB 7 or MongoDB Atlas

### Local installation

```bash
git clone <backend-repository-url>
cd doctor-tracker-backend-assesment
pnpm install
cp .env.example .env
```

Edit `.env` with your local credentials, then seed and start the service:

```bash
pnpm seed
pnpm dev
```

The server listens on [http://localhost:5001](http://localhost:5001) by default. `pnpm seed` safely upserts the configured administrator and demonstration dataset; it does not delete unrelated database records.

## Demo Credentials

Reviewers can access the [live Doctor Tracker application](https://doctor-tracker-assessment-frontend.vercel.app/) with the following assessment account:

```text
Email: admin@doctortracker.local
Password: DoctorTracker!2026#Admin
```

> These credentials are intentionally public for project evaluation only. Rotate or remove this account after the assessment.

### Environment variables

The repository includes a sanitized [`.env.example`](./.env.example):

```dotenv
NODE_ENV=development
PORT=5001
MONGODB_URI=mongodb+srv://username:password@cluster.example.mongodb.net/
MONGODB_DB_NAME=doctor_tracking
FRONTEND_ORIGIN=http://localhost:3000
JWT_SECRET=replace-with-at-least-32-random-characters
ADMIN_EMAIL=admin@doctortracker.local
ADMIN_PASSWORD=replace-with-a-strong-password
COOKIE_SECURE=false
```

For a self-hosted MongoDB root user, include its authentication database in the URI, for example `?directConnection=true&authSource=admin`. Never commit `.env`, and rotate development credentials before production deployment.

### Available scripts

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Start the API with file watching |
| `pnpm seed` | Idempotently seed the administrator and demo data |
| `pnpm build` | Compile TypeScript to production JavaScript |
| `pnpm start` | Run the compiled API |
| `pnpm lint` | Run ESLint |
| `pnpm typecheck` | Validate TypeScript without emitting files |
| `pnpm test` | Run integration tests against in-memory MongoDB |

## System Architecture

```text
Browser
  │
  │ same-origin /api/* request
  ▼
Next.js frontend proxy
  │
  │ REST request + HTTP-only JWT cookie
  ▼
Express 5 middleware pipeline
  ├─ origin/CORS checks, Helmet, rate limiting, logging
  ├─ authentication and role authorization
  ├─ Zod request validation
  └─ REST controllers and centralized JSON errors
       │
       │ projected, indexed Mongoose queries
       ▼
MongoDB: doctor_tracking
  ├─ admins
  ├─ doctors
  └─ patients ── aggregation pipelines ──► dashboard summary
```

Next.js keeps browser traffic same-origin and forwards it to this standalone service. Express is the security boundary: protected endpoints require the signed session cookie before controllers can access data. Mongoose applies schemas and indexes, list endpoints use bounded pagination and parallel counts, and dashboard endpoints use MongoDB aggregations instead of transferring whole collections to Node.js.

## REST API

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/api/v1/auth/login` | Create an eight-hour administrator session |
| `POST` | `/api/v1/auth/logout` | Clear the current session |
| `GET` | `/api/v1/auth/me` | Return the authenticated administrator |
| `GET`, `POST` | `/api/v1/doctors` | List/filter or create doctors |
| `GET` | `/api/v1/doctors/:id` | Return one doctor |
| `POST` | `/api/v1/doctors/:id/patients` | Add a patient to a doctor |
| `GET` | `/api/v1/patients` | List, search, and filter patients |
| `PATCH`, `DELETE` | `/api/v1/patients/:id` | Update or permanently delete a patient |
| `GET` | `/api/v1/dashboard/summary` | Return aggregated dashboard analytics |

List routes accept `page`, `limit`, `search`, `from`, `to`, and resource-specific exact filters. Successful responses use `{ success, data, meta }`; failures use `{ success: false, error: { code, message, fields } }`.

## Technical Decisions

### 1. Referenced patient documents instead of embedded arrays

Each patient is an independent document containing an indexed doctor reference. This keeps doctor records bounded, avoids rewriting a large doctor document for every patient change, and allows the dedicated patient directory to search, filter, edit, and paginate records directly. Compound indexes cover frequent doctor/date and condition/date access patterns.

The trade-off is that doctor-focused responses occasionally need related patient data. Those reads are kept efficient through projections, capped page sizes, and targeted aggregation stages. This is more predictable at scale than loading an ever-growing embedded array or duplicating patient data across collections.

### 2. MongoDB aggregation for dashboard analytics

Dashboard totals, monthly registrations, condition distribution, patients per doctor, and recent activity are computed close to the data with aggregation pipelines. Performing these calculations in MongoDB reduces network transfer and avoids holding entire collections in Node.js memory. Date constraints are applied early, while grouping, sorting, lookup, and limiting stages return only visualization-ready results.

This makes the dashboard endpoint more specialized than a generic repository layer, but the explicit response shape is intentional: the frontend receives one coherent snapshot, avoids several request round trips, and does not need to reproduce business aggregation logic in the browser.

## Visual Evidence

The separate Next.js client consumes this API and adapts its workflows across desktop and mobile layouts.

### Login landing page

The secure login experience introduces the product with the updated Doctor Tracker identity and medical-care hero artwork.

![Doctor Tracker login landing page](./docs/screenshots/login-desktop.png)

### Authenticated dashboard

The authenticated dashboard displays the analytics and operational data supplied by this API.

![Doctor Tracker desktop dashboard](./docs/screenshots/dashboard-desktop.png)

## Deployment

Run `pnpm build` and deploy `dist/` as a Node.js service. Configure the production frontend origin, MongoDB connection, strong JWT secret, secure cookies, and administrator seed values through the hosting platform's secret manager.

- Live application: [Doctor Tracker](https://doctor-tracker-assessment-frontend.vercel.app/)
- Live API: [Doctor Tracker API](https://doctor-tracker-assessment-backend.onrender.com/)
- Backend repository: [doctor-tracker-assessment-backend](https://github.com/morsalin101/doctor-tracker-assessment-backend)
- Frontend repository: [doctor-tracker-assessment-frontend](https://github.com/morsalin101/doctor-tracker-assessment-frontend)
