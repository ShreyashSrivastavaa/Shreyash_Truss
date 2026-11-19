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
