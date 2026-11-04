# Doctor Tracker API

The Doctor Tracker API is a secure Express and MongoDB service for managing doctors, their patients, and dashboard analytics. It exposes a versioned REST interface consumed by the separate Next.js administrator portal.

## Setup

1. Install Node.js 24 and pnpm.
2. Copy `.env.example` to `.env` and provide the MongoDB URI, JWT secret, and admin credentials.
3. Install dependencies with `pnpm install`.
4. Seed the administrator and optional demonstration records with `pnpm seed`.
5. Start the API with `pnpm dev`; it listens on `http://localhost:5001` by default.

Never commit `.env`. Rotate any credential before production use.

## Scripts

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Start the API with file watching |
| `pnpm seed` | Idempotently seed the admin and demo dataset |
| `pnpm test` | Run integration tests against in-memory MongoDB |
| `pnpm typecheck` | Validate TypeScript |
| `pnpm build` | Compile production JavaScript |

## Architecture

```text
Browser -> Next.js /api rewrite -> Express middleware -> REST controllers
                                                   -> Mongoose -> MongoDB
```

The browser receives an HTTP-only session cookie. Express remains the authorization boundary: all doctor, patient, and dashboard endpoints validate that session before accessing MongoDB.

## REST API

- `POST /api/v1/auth/login`, `POST /api/v1/auth/logout`, `GET /api/v1/auth/me`
- `GET|POST /api/v1/doctors`, `GET /api/v1/doctors/:id`
- `POST /api/v1/doctors/:id/patients`
- `GET /api/v1/patients`, `PATCH|DELETE /api/v1/patients/:id`
- `GET /api/v1/dashboard/summary`

List routes support `page`, `limit`, `search`, `from`, `to`, and resource-specific filters. Responses consistently use `{ success, data, meta }`; failures use `{ success: false, error }`.

## Technical decisions

### Referenced patients instead of embedded arrays

Patients are separate documents referencing a doctor. This avoids unbounded doctor documents, permits patient-level pagination and updates, and makes global condition/date filtering efficient. Compound indexes support the common doctor/date and condition/date access patterns.

### Database aggregation for analytics

Dashboard series are computed in MongoDB rather than by loading every patient into Node.js. `$group`, `$lookup`, and limited projections reduce memory use and network transfer while keeping the dashboard response purpose-built.
