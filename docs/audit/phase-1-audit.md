# Phase 1 Audit Report: Nexus-Inspired Multi-Depot Inventory Balancing Prototype

**Repository:** `D:\Shreyash_Truss`
**Remote:** `https://github.com/ShreyashSrivastavaa/Shreyash_Truss` (branch: `main`)
**Auditor:** Senior Full-Stack Engineer & Supply Chain Domain-Aware Reviewer
**Date:** 2026-10-26
**Scope:** Phase 1 Only (Inspect, Baseline, QA, Report) — Non-Destructive / Read-Only
**Database Evaluated:** Local PostgreSQL `nexus_inventory` on `localhost:5432` via Prisma ORM

---

## A. Verified Baseline & Command Output

### 1. Git Repository State
- **Branch:** `main` (clean working tree, identical to `origin/main`).
- **Commit:** `9c13004613f852103d217a76ddc6ea26fdcad7f3` (`feat(inventory): implement transfer lifecycle and stock accounting`).
- **Verification Commands:**
  ```powershell
  git status; git branch --show-current; git log --oneline -15; git remote -v
  ```
  - Output: `nothing to commit, working tree clean`, `main`, origin URL points to `https://github.com/ShreyashSrivastavaa/Shreyash_Truss.git`.
  - `git rev-parse HEAD` = `9c13004613f852103d217a76ddc6ea26fdcad7f3`.
  - `git rev-parse origin/main` = `9c13004613f852103d217a76ddc6ea26fdcad7f3`.

### 2. Dependency Audit & Installation Hygiene
- **Command:** `npm audit; npm --prefix server audit; npm --prefix client audit`
- **Exit Code:** `1` (vulnerabilities identified; no auto-fix run)
- **Findings:**
  - **Root:** 0 vulnerabilities.
  - **Server:** 4 high-severity vulnerabilities (`body-parser < 1.20.9` DoS advisory GHSA-27r3-jxmh-p828 via `express 4.21.2`; `deepmerge-ts < 8.0.0` stack exhaustion advisory GHSA-ggr8-5vv4-36mx via `@prisma/config` / `prisma 6.19.3`).
  - **Client:** 3 moderate-severity vulnerabilities (`postcss-selector-parser < 7.1.6` CPU exhaustion advisory GHSA-rj75-hqrm-r3gf via `tailwindcss 3.4.17`).

### 3. Automated Test Suite Baseline
- **Command:** `npm --prefix server test` (`node --test --test-concurrency=1`)
- **Exit Code:** `0`
- **Output:**
  ```text
  ▶ Multi-Depot Inventory Balancing Domain Logic (8 tests passed)
  ▶ Transfer Lifecycle & Inventory Accounting (Day 3) (6 tests passed)
  ▶ PostgreSQL & Prisma Persistence Integration (5 tests passed)
  ▶ Phase 1 Regression Tests — Business Logic & Error Handling (10 tests passed)

  ℹ tests 29
  ℹ suites 6
  ℹ pass 29
  ℹ fail 0
  ℹ cancelled 0
  ℹ skipped 0
  ℹ todo 0
  ℹ duration_ms 3905.5976
  ```
- **Comparison to Claims:** The reported `29/29` test count is **confirmed accurate**.
- **Execution Mode:** Ran against active PostgreSQL database (`localhost:5432/nexus_inventory`).
- **Critical Mode Finding:** In-memory mode is currently unreachable during standard test runs because Node v24 automatically injects `server/.env` and `server/src/db.js` calls `dotenv.config()`. Additionally, when tests are run concurrently without `--test-concurrency=1`, database seed truncations in parallel workers create race conditions (`Unique constraint failed on id`).

### 4. Frontend Production Build Baseline
- **Command:** `npm --prefix client run build` (`vite build`)
- **Exit Code:** `0`
- **Duration:** 8.66 seconds
- **Output:**
  ```text
  vite v6.4.5 building for production...
  transforming...
  ✓ 1583 modules transformed.
  rendering chunks...
  computing gzip size...
  dist/index.html                   0.49 kB │ gzip:  0.34 kB
  dist/assets/index-jZAGrSOJ.css   18.76 kB │ gzip:  4.29 kB
  dist/assets/index-3poIdfmx.js   178.83 kB │ gzip: 54.37 kB
  ✓ built in 8.66s
  ```
- **Comparison to Claims:** The reported "build succeeded" is **confirmed accurate**.

### 5. Git Diff & Formatting Checks
- **Command:** `git diff --check`
- **Exit Code:** `0` (Zero whitespace violations, zero merge conflicts, zero stray trailing spaces).
- **Tracked Secrets Inspection:** `git ls-files` and regex scan confirmed no `.env` files or database credentials with passwords are tracked in Git. Only placeholder templates (`server/.env.example`) are versioned.

---

## B. Architecture Summary

```
                       ┌──────────────────────────────────────────────┐
                       │           React 18 + Tailwind SPA            │
                       │ (Vite Proxy forwards /api to localhost:5000)  │
                       └──────────────────────┬───────────────────────┘
                                              │ HTTP / JSON
                                              ▼
                       ┌──────────────────────────────────────────────┐
                       │          Express 4.x REST API Router         │
                       │  /api/health | /api/inventory | /api/transfers│
                       └──────────────────────┬───────────────────────┘
                                              │
                                              ▼
                       ┌──────────────────────────────────────────────┐
                       │             inventoryService.js              │
                       │   (State Machine: PENDING/TRANSIT/RECEIVED)  │
                       └──────────────┬───────────────────────────────┘
                                      │
                 ┌────────────────────┴────────────────────┐
                 │ if (prisma)                             │ fallback (no DB)
                 ▼                                         ▼
┌─────────────────────────────────┐       ┌─────────────────────────────────┐
│     PostgreSQL + Prisma ORM     │       │     In-Memory Array Store       │
│  - prisma.$transaction blocks   │       │  - Process heap objects         │
│  - SELECT ... FOR UPDATE locks  │       │  - Single-threaded event loop   │
│  - ACID persistence             │       │  - Lost on process restart      │
└─────────────────────────────────┘       └─────────────────────────────────┘
```

1. **Frontend (`client/`):** A React 18 single-page application built with Vite and Tailwind CSS. State is managed via React hooks in `App.jsx`, fetching `/api/health`, `/api/inventory`, `/api/transfers/opportunities`, and `/api/transfers`. Component hierarchy:
   - `Header`: Service health pill, refresh trigger, reset confirmation modal.
   - `SummaryCards`: Aggregate KPIs including Active Deficits, Surpluses, In-Transit Freight, Balanced positions, and Monitored positions.
   - `OpportunityList`: Actionable rebalancing cards showing donor surplus, recipient shortage, input limits, and a "Stage Transfer Order" button.
   - `InventoryGrid`: 3 regional depots with meters for On-Hand, Net Available, Safety Stock, Target Stock, and dynamic status badges (`DEFICIT`, `BALANCED`, `SURPLUS`).
   - `TransferLog`: Split into an **Active Shipments Pipeline** (displaying `PENDING` and `IN_TRANSIT` with Dispatch, Receive, and Cancel action buttons) and a **Completed Transfer History & Audit Trail** (read-only table of `RECEIVED` and `CANCELLED` shipments).
2. **Backend API (`server/`):** Express 4 application. Exposes clean REST endpoints with custom JSON 404 and global JSON error-handling middleware. Validates transfer creation payloads via Zod.
3. **Domain Service & Storage Modes (`inventoryService.js`):** Implements business validation and custody accounting.
   - **PostgreSQL Mode:** All multi-row state mutations execute inside `prisma.$transaction`. Rows are locked using raw `SELECT ... FOR UPDATE` queries before validation.
   - **In-Memory Mode:** Pure JavaScript object mutations in memory (`inventory`, `transfers`). Bypasses SQL transactions.
   - **Mode Divergence:** In-memory mode does not provide ACID durability, cannot handle multi-process clustering, and does not serialize concurrent requests with database locks. Furthermore, with `server/.env` present, the application defaults permanently to PostgreSQL.

---

## C. Findings Table

| ID | Severity | Status | Evidence (File:Lines / Command) | Impact | Proposed Fix | Effort | Risk of Fix |
| :--- | :---: | :---: | :--- | :--- | :--- | :---: | :---: |
| **SEC-01** | **P0 Correctness** | Confirmed | `server/src/routes/inventoryRoutes.js:41-48` | `POST /api/inventory/reset` is completely unauthenticated and has no environment guard. In any deployed environment, any caller can wipe all active transfers and re-seed inventory without credentials. | Restrict endpoint to `NODE_ENV !== 'production'` and require an administrative header or token. | S | Low |
| **CONC-01**| **P1 Demo-readiness**| Suspected | `server/src/services/inventoryService.js:284-290`, `480-486` | Raw query `WHERE ("depotId" = A AND ...) OR ("depotId" = B AND ...) FOR UPDATE` lacks an explicit `ORDER BY`. Two concurrent transfers between Depot A and Depot B in opposite directions could lock rows in non-deterministic order, creating a deadlock risk in PostgreSQL under high load. | Add deterministic ordering to lock acquisition: `ORDER BY "depotId" ASC, "skuId" ASC`. | S | Low |
| **VAL-01** | **P1 Demo-readiness**| Confirmed | `server/src/routes/transferRoutes.js:70-73, 91-94, 112-115` | Action routes (`/:id/dispatch`, `/:id/receive`, `/:id/cancel`) validate `id` using ad-hoc `typeof !== 'string'` checks rather than standard Zod schema parsing used in `POST /api/transfers`. | Define `transferIdParamSchema` in `transferSchema.js` and validate via `safeParse(req.params)`. | S | Low |
| **SEC-02** | **P2 Product quality**| Confirmed | `server/src/app.js:9-10` | `app.use(cors())` enables open CORS (`*`), allowing arbitrary web origins to trigger transfers or resets. `express.json()` lacks a payload size limit (`limit: '100kb'`). | Bind CORS to configured allowed origins (e.g. `http://localhost:5173`) and add body parser size limit. | S | Low |
| **DEP-01** | **P2 Product quality**| Confirmed | `npm audit` command output | 4 high-severity vulnerabilities in backend (`body-parser`, `deepmerge-ts` / `prisma`) and 3 moderate in client (`postcss-selector-parser`). | Update dependencies via `npm audit fix` after verifying compatibility with Prisma 6 and Tailwind 3. | M | Medium |
| **SCH-01** | **P2 Product quality**| Confirmed | Directory check: `Test-Path server/prisma/migrations` = `False` | No Prisma migration history exists; schema was synchronized exclusively via `prisma db push`. Missing relational check constraints (e.g., `CHECK (on_hand >= 0)`). | Generate formal baseline migration via `prisma migrate dev` and add database-level non-negative check constraints. | M | Medium |
| **MOD-01** | **P3 Future** | Confirmed | `server/src/db.js:1-15`, `server/prisma/seed.js:7` | In-memory fallback mode is shadowed whenever `server/.env` is present because Node v24 auto-injects `.env` and `seed.js` instantiates `PrismaClient` unconditionally at module load. | Refactor `db.js` and `seed.js` to lazy-load Prisma only when `DATABASE_URL` is explicitly non-empty. | S | Low |
| **UI-01**  | **P3 Future** | Confirmed | `client/src/components/OpportunityList.jsx:148-157` | Input field for transfer quantity allows clearing to empty string `""` which briefly renders `NaN` if parsed naively, though client button guard prevents submission. | Clamp empty input to placeholder and prevent negative numbers on `onChange`. | S | Low |

---

## D. Invariant Coverage Matrix

| Invariant / Business Rule | Status | Evidence in Code | Verification in Tests / Live Run |
| :--- | :---: | :--- | :--- |
| **1. Donor Target-Stock Protection** (`onHand - reserved - Q >= targetStock`) | **Verified by code & test** | `inventoryService.js:306-314`, `399-406` | `inventory.test.js:90-104`, `regression.test.js:16-31`, `httpLifecycle.test.js:221-235` |
| **2. Recipient Target-Stock Capacity** (`dest.onHand + inTransit + pendingInbound + Q <= targetStock`) | **Verified by code & test** | `inventoryService.js:316-336`, `408-422` | `regression.test.js:33-51`, `lifecycle.test.js:198-228` |
| **3. PENDING Creation Accounting** (`reserved += Q`, `onHand` unchanged) | **Verified by code & test** | `inventoryService.js:339-342`, `424` | `inventory.test.js:50-64`, `lifecycle.test.js:19-44`, live browser test |
| **4. Dispatch Accounting** (`onHand -= Q`, `reserved -= Q`, `dest.inTransit += Q`) | **Verified by code & test** | `inventoryService.js:497-510`, `561-564` | `inventory.test.js:65-71`, `lifecycle.test.js:45-58`, live browser test |
| **5. Receive Accounting** (`dest.inTransit -= Q`, `dest.onHand += Q`) | **Verified by code & test** | `inventoryService.js:619-625`, `670-672` | `inventory.test.js:72-77`, `lifecycle.test.js:59-70`, live browser test |
| **6. Cancellation from PENDING Only** (`reserved -= Q`, physical stock unchanged) | **Verified by code & test** | `inventoryService.js:706-716`, `732-736` | `lifecycle.test.js:72-94`, `httpLifecycle.test.js:101-134` |
| **7. In-Transit Cancellation Prohibited** (HTTP 400 rejection) | **Verified by code & test** | `inventoryService.js:706-710`, `769-773` | `lifecycle.test.js:95-115`, `httpLifecycle.test.js:161-166` |
| **8. State Transition Exclusivity** (No duplicate dispatch/receive, HTTP 409) | **Verified by code & test** | `inventoryService.js:474-478`, `599-603` | `lifecycle.test.js:117-154`, `httpLifecycle.test.js:151-176` |
| **9. Network Physical Stock Conservation** ($\Delta(\sum \text{onHand} + \sum \text{inTransit}) \equiv 0$) | **Verified by code & test** | Maintained across `inventoryService.js` mutations | `lifecycle.test.js:19-70` asserts constant 285 units across PENDING, DISPATCH, RECEIVE; verified live in browser QA (495 units total). |
| **10. Non-Negative Inventory Quantities** (`onHand`, `reserved`, `inTransit` $\ge 0$) | **Verified by code & test** | `Math.max(0, ...)` used on all decrements (`inventoryService.js:501, 622, 735`) | Asserted throughout `lifecycle.test.js` and `persistence.test.js` |
| **11. Recommendation Pipeline Deduplication** (Pending + in-transit deduct from deficit) | **Verified by code & test** | `inventoryService.js:172-194`, `211-218` | `lifecycle.test.js:156-196` |
| **12. Multi-Donor Shortage Allocation** (Split allocation without duplication) | **Verified by code & test** | `inventoryService.js:203-258` | `regression.test.js:53-112` |
| **13. Concurrent Over-Reservation Protection** (PostgreSQL locks serialize concurrent transfers) | **Verified by test** | `inventoryService.js:283-290` (`SELECT ... FOR UPDATE`) | Verified via scratch concurrency script (`fulfilled: 1, rejected: 1`) |

---

## E. Documentation Drift List

1. **`README.md` Status vs. Reality:**
   - **Drift:** README states *"PostgreSQL & Prisma (to be integrated)"* in Tech Stack, yet PostgreSQL and Prisma are fully integrated, tested, and active.
   - **Drift:** README lists `18/18` passing tests under Day 2 status. Active suite contains `29/29` passing tests across 6 test files.
   - **Drift:** README endpoints table omits `POST /api/transfers/:id/dispatch`, `POST /api/transfers/:id/receive`, and `POST /api/transfers/:id/cancel`.
   - **Drift:** README describes `POST /api/transfers` as having a *"safety stock floor"*, whereas code enforces **target-stock** protection (`onHand - reserved - Q >= targetStock`).
   - **Drift:** README Project Structure lists only `inventory.test.js`, omitting `persistence.test.js`, `regression.test.js`, `lifecycle.test.js`, and `httpLifecycle.test.js`.
2. **`docs/engineering-log.md`:**
   - **Drift:** Ends at Decision 008 (Day 2). Completely omits Day 3 architectural decisions regarding the 4-stage transfer lifecycle state machine (`PENDING` $\rightarrow$ `IN_TRANSIT` $\rightarrow$ `RECEIVED` / `CANCELLED`), reserved/in-transit custody dimensions, and API routing additions.
3. **`docs/daily-updates/`:**
   - **Drift:** Contains `day-01.md` and `day-02.md`; missing `day-03.md`.
4. **`nexus_notes/prompt-log.md` & `docs/llm-interaction-log.md`:**
   - **Drift:** Interaction logs stop at Day 2 (Interaction 004); Day 3 prompt/response interactions are unrecorded.

---

## F. Interactive Browser & Workflow QA Results

### 1. Execution Summary
Autonomous browser testing was executed on `http://localhost:5173` backed by live Express backend on `:5000` and PostgreSQL database on `:5432`. Session was recorded to WebP video artifact (`nexus_e2e_qa_1793017299768.webp`) and 16 intermediate state screenshots.

### 2. Scenario-by-Scenario Observations

1. **Initial Dashboard Load:**
   - Header rendered `"Nexus MVP 2A"` with green `"Backend Online (12s)"` ping badge, Refresh button, and `"Reset Demo State"` button.
   - Summary Cards rendered: **Active Deficits: 2** (Urgent), **Available Surpluses: 2** (Transferable), **In-Transit Freight: 0 units** (Pipeline), **Balanced Stock: 2** (Stable), **Monitored Network: 3 Depots / 2 SKUs** (6 positions).
   - Rebalancing Opportunities rendered 2 actionable cards (`SKU-MED-01` Dallas to Chicago, rec 90; `SKU-IND-02` Chicago to Dallas, rec 60).
   - Inventory Matrix rendered 3 depot cards with correct on-hand, safety, and target thresholds.
   - Active Shipments Pipeline rendered empty state placeholder. Completed History rendered empty state placeholder.
   - Total network physical units: $285 + 210 = 495$ units.

2. **Invalid Input Handling on Opportunity Card:**
   - Targeted first card (`SKU-MED-01`, Dallas to Chicago, max safe surplus: 90).
   - Entered `150` into quantity input: Border highlighted red, alert text `"Exceeds safe stock (90)"` rendered, and `"Stage Transfer Order"` button was immediately disabled (`disabled: true`, `cursor-not-allowed`).
   - Cleared input / entered `0`: Action button remained disabled.
   - Entered `50`: Button became active and enabled.

3. **Staging Transfer Order (`PENDING`):**
   - Clicked `"Stage Transfer Order"` with 50 units.
   - Green banner rendered: `"Staged transfer order (PENDING) for 50 units of Emergency Cold-Chain Sensor Pack to North Logistics Hub. Ready for dispatch."`
   - Inventory Matrix: South Distribution Center (`SKU-MED-01`) immediately rendered `-50 Reserved` badge; Available stock updated from 90 to 40.
   - Active Shipments Pipeline: Added row `TRF-1793017354089-2280`, SKU `SKU-MED-01`, Route `depot-south -> depot-north`, Qty `50 units`, Status yellow badge `PENDING`, Actions: `Dispatch` and `Cancel`.
   - Network Physical Conservation: $495 \text{ onHand} + 0 \text{ inTransit} = 495$ units (strictly conserved).

4. **Dispatching Freight (`IN_TRANSIT`):**
   - Clicked `"Dispatch"` on `TRF-1793017354089-2280`.
   - Status badge transitioned to sky blue `"IN TRANSIT"`.
   - Summary Card: **In-Transit Freight updated to 50 units**.
   - Inventory Grid: South onHand decremented from 190 to 140; reserved cleared from -50 to 0. North Logistics Hub rendered `+50 In-Transit` badge.
   - Pipeline action button dynamically changed from `Dispatch` / `Cancel` to single green `Receive at Dock` button.
   - Network Physical Conservation: $445 \text{ onHand} + 50 \text{ inTransit} = 495$ units (strictly conserved).

5. **Receiving Freight (`RECEIVED`):**
   - Clicked `"Receive at Dock"`.
   - Row moved out of Active Shipments Pipeline into **Completed Transfer History & Audit Trail** with green badge `RECEIVED`.
   - Summary Card: **In-Transit Freight dropped back to 0 units**.
   - Summary Card: **Active Deficits dropped from 2 to 1**; **Balanced Stock increased from 2 to 3**.
   - Inventory Grid: North Chicago onHand increased from 25 to 75; status transitioned from `DEFICIT` to `BALANCED`.
   - Network Physical Conservation: $495 \text{ onHand} + 0 \text{ inTransit} = 495$ units (strictly conserved).

6. **Create and Cancel Transfer:**
   - Staged remaining transfer (`SKU-IND-02`, 50 units from North to South).
   - Appeared in Active Shipments as `PENDING`.
   - Clicked `Cancel`: Transfer transitioned to `CANCELLED` and moved to Completed History table. Source reserved stock in Inventory Grid released to 0 without physical movement.

7. **Reset Demo State:**
   - Clicked `"Reset Demo State"` in Header. Confirmation modal appeared. Clicked `"Confirm Reset"`.
   - Backend successfully executed `POST /api/inventory/reset`.
   - Dashboard restored initial state: 2 Deficits, 2 Surpluses, 0 In-Transit, pipeline empty, history cleared.

8. **Responsive Layout Verification:**
   - Evaluated viewports at 1280px (Desktop), 768px (Tablet), and 375px (Mobile).
   - Summary cards break cleanly from 5 columns $\rightarrow$ 2 columns $\rightarrow$ 1 column.
   - Inventory grid breaks from 3 columns $\rightarrow$ 1 column on mobile.
   - Pipeline tables support horizontal touch scrolling (`overflow-x-auto`) on narrow viewports without clipping or layout breakage.

---

## G. Recommended Phase 2 Scope

The following minimal, high-impact fixes are recommended for Phase 2:

1. **Security & Guarding (P0):**
   - Protect `POST /api/inventory/reset` with environment guard (`if (process.env.NODE_ENV === 'production') return res.status(403)...`).
2. **Deterministic Concurrency Ordering (P1):**
   - Append `ORDER BY "depotId" ASC, "skuId" ASC` to raw row-locking queries in `inventoryService.js` to eliminate PostgreSQL deadlock risk during bidirectional concurrent transfers.
3. **Route Validation Consistency (P1):**
   - Introduce `transferIdParamSchema` with Zod in `transferRoutes.js` for `:id/dispatch`, `:id/receive`, `:id/cancel`.
4. **Documentation Alignment (P2):**
   - Update `README.md` to reflect Day 3 state (29/29 tests, dispatch/receive/cancel routes, target-stock wording, Prisma integration status).
   - Document Day 3 architecture in `docs/engineering-log.md` (Decision 009) and create `docs/daily-updates/day-03.md`.

*Trade-offs considered:* Major dependency upgrades (`npm audit fix --force` for Prisma 7 / Tailwind 4) were evaluated and are **deferred** to avoid breaking changes in an active prototype.

---

## H. Open Questions for Engineering Leadership

1. **Authentication / Environment Guarding for Reset:** Should `POST /api/inventory/reset` be disabled in production environments via `NODE_ENV`, or should it require an administrative API key header?
2. **In-Memory Storage Mode Future:** Should the in-memory fallback in `inventoryService.js` be maintained and tested via explicit mock injection, or should PostgreSQL be declared the sole supported runtime?
3. **Prisma Migrations:** Should we transition from `prisma db push` to formal `prisma migrate dev` migrations in Phase 2?

---

## I. Statement of What Was NOT Done / NOT Verified

- No application source code, configuration, schemas, or dependencies were altered in this Phase 1 audit.
- Multi-instance distributed cluster testing (e.g. multiple Node.js processes sharing one PostgreSQL instance across different machines) was not tested.
- Automated load testing under thousands of concurrent HTTP clients was not conducted; concurrency safety was validated via transactional unit tests and a 2-client serialized race reproduction script.
- Client dependency vulnerabilities (`npm audit fix --force`) were not resolved to prevent breaking changes to Tailwind CSS.
