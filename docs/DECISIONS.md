# Architecture Decision Records (ADRs) — Nexus Supply Chain OS

This document records the architectural and engineering decisions made for the Nexus backend service (Product 18 • Supply Chain OS). Each record explains the context, decision, alternatives evaluated, trade-offs, and future considerations.

---

## ADR-001: Schema Evolution — `prisma migrate` vs. `prisma db push`

### Status
Accepted & Implemented (Commit `6b72b65`)

### Context
During early prototype phases, the PostgreSQL schema was synchronized using `prisma db push`. While convenient for rapid greenfield exploration, `db push` creates severe operational risks for an enterprise service:
1. It does not record migration history in source control (`_prisma_migrations`).
2. It cannot generate forward-compatible, reversible, or reviewable SQL scripts.
3. In production or shared environments, unintended schema drifts can result in silent data loss or column truncation without approval.

### Decision
Baseline the existing schema into version-controlled migrations starting with `0_init/migration.sql`:
* Generated using `prisma migrate diff --from-empty --to-schema-datamodel` with native UTF-8 encoding (no BOM).
* Baseline marked as applied on the authoritative database using `prisma migrate resolve --applied 0_init`.
* Verified with clean zero-drift diff checks against both live and scratch PostgreSQL databases.
* Standardized deployment workflow on `prisma migrate deploy` for CI/CD and production environments.

### Alternatives Considered
* **Continue using `prisma db push`:** Rejected. Unacceptable for multi-environment deployments, team collaboration, and auditability.
* **Manual raw SQL migration scripts without an ORM:** Rejected. Lacks Prisma datamodel validation, type safety, and automatic schema diffing.
* **Third-party migration tools (Liquibase, Flyway):** Rejected. Introduces unnecessary polyglot toolchain overhead when Prisma's migration engine natively supports PostgreSQL DDL.

### Trade-offs & Consequences
* **Positives:** Every database mutation is auditable, committed to git, reproducible, and verifiable across environments.
* **Future Considerations (Shadow Database):** `prisma migrate dev` creates a temporary "shadow database" to detect drift and validate migrations. Certain managed PostgreSQL providers (such as connection poolers or restricted IAM roles) restrict arbitrary `CREATE DATABASE` commands. When deploying to hosted cloud environments, an explicit `SHADOW_DATABASE_URL` or unpooled direct connection must be provisioned for development/staging, while production pipelines use `prisma migrate deploy` (which executes applied migrations directly without requiring a shadow database).

---

## ADR-002: System Reliability — Fail-Fast Error Architecture vs. Silent In-Memory Fallbacks

### Status
Accepted & Implemented (Commits `b9e7ad6`, `02a1de7`, `ad9b0db`)

### Context
Previously, `inventoryService.js` and `vendorService.js` maintained in-memory state arrays (`depots`, `skus`, `inventory`, `transfers`, `vendors`, `deliveries`) seeded from static mock fixtures. When Prisma database operations failed or when `DATABASE_URL` was missing:
1. Catch blocks swallowed database errors and silently served or modified the in-memory arrays.
2. In-memory arrays were mirrored inside database transactions, creating split-brain state and masking outages.
3. Health check endpoints returned static hardcoded `200 OK` regardless of actual database connectivity.
4. Route handlers returned arbitrary `500 Internal Server Error` with raw error messages that bypassed centralized error middleware.

This masked critical infrastructure failures, deceived monitoring systems, and risked data divergence.

### Decision
Adopt a strict **fail-fast, single-source-of-truth** architecture:
1. **Remove All In-Memory State & Mirroring:** Completely delete in-memory working arrays and transaction mirrors. All reads and mutations execute strictly against PostgreSQL.
2. **Fail-Fast Initialization:** `db.js` requires `DATABASE_URL` at module load and throws immediately if unconfigured.
3. **Database Readiness Probe (`/api/health`):**
   - Executes an active `SELECT 1` probe with a `Promise.race` timeout and timer cleanup.
   - Returns `200` with `{"status":"ok","database":"up"}` when healthy.
   - Returns `503` with `{"status":"unavailable","database":"down"}` when unreachable or timed out.
   - Emits `Cache-Control: no-store` to prevent caching of health state.
4. **Centralized Error Routing via `next(err)`:**
   - All route handlers in `inventoryRoutes`, `transferRoutes`, and `vendorRoutes` delegate error handling to Express's global error middleware via `next(error)`.
   - Infrastructure/connection failures (`PrismaClientInitializationError`, `PrismaClientRustPanicError`, error codes `P1000`, `P1001`, `P1002`, `P1008`, `P1017`) map to HTTP `503 Service Unavailable` with `{ "error": "Database service is temporarily unavailable", "code": "DATABASE_UNAVAILABLE" }`.
   - Domain errors (`400 Bad Request`, `404 Not Found`, `409 Conflict`) preserve their status codes and messages.
5. **Credential Leak Prevention:**
   - Server logs and error handlers sanitize database URIs via regex (`postgres(ql)://...` -> `[REDACTED_DATABASE_URL]`), preserving diagnostic error names and error codes without ever exposing passwords, usernames, or connection strings in logs or HTTP responses.

### Alternatives Considered
* **Circuit breaker with stale in-memory read fallback:** Rejected. In a multi-depot supply chain ledger, serving stale stock levels or accepting transfers against phantom inventory leads to real-world fulfillment deficits and financial loss.
* **Return HTTP 500 on all errors:** Rejected. Conflates internal logic bugs with temporary infrastructure unavailability; prevents upstream load balancers and clients from executing proper retry/backoff policies.

### Trade-offs & Consequences
* **Positives:** Guarantees absolute ledger integrity. Database outages are immediately visible to operational monitors, load balancers, and clients. Zero credential leakage.
* **Negatives:** When PostgreSQL is offline, requests fail with 503 rather than returning stale mock data. This is the correct, safe behavior for an enterprise supply chain management system.

---

## ADR-003: User Identity, Password Security & Backend Role-Based Access Control (RBAC)

### Status
Accepted & Implemented (Commits `62e1a44`, `4bc2216`, `dd3ff97`)

### Context
In the prototype implementation, user authentication and authorization were simulated purely on the frontend:
1. User profiles and mock roles were held in client-side React `localStorage`.
2. A single static demo credential (`DEMO_PASSWORD = "nexus2026"`) was evaluated in client memory.
3. No backend `User` entity or persistence layer existed in PostgreSQL.
4. All mutating backend endpoints (`POST /api/transfers`, `/dispatch`, `/receive`, `/cancel`, `POST /api/vendors`, `PATCH /api/vendors/:id`) were unauthenticated and unprotected. Any client could invoke state transitions or mutate vendor configurations without identity verification, role checks, or regional boundary enforcement.

### Decision
Implement production-grade, authoritative backend authentication and role-based access control backed by PostgreSQL:
1. **User Persistence (`server/prisma/migrations/1_add_user_auth/`):**
   - Added `User` model with `id`, unique `email`, `passwordHash`, `name`, `role`, and optional `depotId` foreign key to `Depot(id)` (`ON DELETE SET NULL`).
   - Tracked and deployed via Prisma migration `1_add_user_auth`.
2. **Native Cryptography & Zero-Dependency Token Architecture (`server/src/utils/crypto.js`):**
   - Utilized native `node:crypto.scrypt` with a cryptographically secure 16-byte random salt and 64-byte key derivation for password hashing.
   - Employed `timingSafeEqual` for constant-time hash comparison to eliminate timing side-channel attacks.
   - Implemented stateless HMAC-SHA256 signed bearer tokens carrying `sub`, `email`, `role`, `depotId`, and timestamped expiration (`exp`). Eliminates third-party supply-chain dependencies (`bcryptjs`, `jsonwebtoken`).
3. **Registration, Login & Profile Endpoints (`server/src/routes/authRoutes.js`):**
   - `POST /api/auth/register`: Public registration strictly defaults role to `VIEWER` and depot to `null`. Attempts by unauthenticated callers to assign privileged roles (`ADMIN`, `HEAD_OF_SUPPLY_CHAIN`, etc.) or depot scopes are rejected with `403 Forbidden`. Privileged roles can only be provisioned by authenticated administrators. Password inputs enforce bounded lengths (8 to 128 characters) to guard against CPU-exhaustion DoS attacks.
   - `POST /api/auth/login`: Authenticates against hashed credentials; issues signed bearer token; returns sanitized profile.
   - `GET /api/auth/me`: Resolves token against database user; returns active profile; returns `401 Unauthorized` for missing/invalid tokens.
4. **Backend Role & Scope Enforcement (`server/src/middleware/authMiddleware.js`, `inventoryService.js`):**
   - `authenticateUser`: Optional credential extractor attaching verified `req.user`.
   - `requireAuth`: Strict barrier returning `401 Unauthorized` if unauthenticated.
   - `requireRole(...roles)`: Enforces role permissions (e.g., `HEAD_OF_SUPPLY_CHAIN`, `DEPOT_MANAGER`, `PROCUREMENT_MANAGER`, `ADMIN`). Fails closed by default: any mutating request lacking a valid `Authorization` header is rejected with `401 Unauthorized`.
   - `requireDepotScope` & Database-Backed Service Guards: Enforces regional isolation across the entire transfer lifecycle:
     - Transfer creation (`POST /api/transfers`) verifies origin depot matches `req.user.depotId`.
     - Transfer dispatch (`POST /api/transfers/:id/dispatch`) verifies origin depot matches `req.user.depotId`.
     - Transfer receipt (`POST /api/transfers/:id/receive`) verifies destination depot matches `req.user.depotId`.
     - Transfer cancellation (`POST /api/transfers/:id/cancel`) verifies origin depot matches `req.user.depotId`.
     - Any depot manager lacking an assigned depot is blocked (`403 Forbidden`).
   - Purchase order commitments (`POST /api/vendors/deliveries`, `PATCH /api/vendors/deliveries/:id`) are strictly protected by role checks (`HEAD_OF_SUPPLY_CHAIN`, `PROCUREMENT_MANAGER`, `ADMIN`).
5. **Fail-Fast Error Integration:**
   - All authentication routes delegate to `next(err)`.
   - Database connection drops during authentication map to `503 DATABASE_UNAVAILABLE`, consistent with ADR-002.

### Alternatives Considered
* **Client-Only Mock Authentication (Status Quo):** Rejected. In an enterprise ERP/SCM system, client-side authorization is security theatre; the backend must be the authoritative policy enforcement point.
* **Third-Party Identity Providers (Auth0, Firebase Auth, Supabase):** Rejected for core domain services. Adds external operational dependencies, latency, and vendor lock-in for internal supply chain operations.
* **External npm Packages (`jsonwebtoken`, `bcryptjs`):** Rejected. Node.js `crypto` is natively compiled, battle-tested, high-performance, and eliminates supply chain risk.
* **Role-Only RBAC without Depot Scoping:** Rejected. In a multi-depot logistics network, depot managers must have least-privilege access restricted to their physical facilities to prevent cross-depot tampering.

### Trade-offs & Consequences
* **Positives:** Complete end-to-end security boundary. Zero unprotected state transitions. Immutable audit trail linking actions to authentic user identities. Regional isolation enforced at the HTTP middleware layer. Zero external npm dependencies.
* **Negatives:** API requests mutating transfers or vendors now require an `Authorization: Bearer <token>` header. Existing tests and client requests must authenticate before performing privileged mutations.
