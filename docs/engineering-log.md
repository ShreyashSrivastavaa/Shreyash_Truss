# Engineering Decision Log

## Decision 001: Architectural Decoupling (Server and Client Structure)
- **Date:** 2026-10-21
- **Context:** The system requires a React frontend with Tailwind CSS and an Express backend with Prisma/PostgreSQL.
- **Alternatives Considered:**
  1. *Single root package.json with combined scripts:* High risk of dependency conflicts between frontend build tools (Vite/React) and backend Node modules.
  2. *Decoupled directories (`server/` and `client/`):* Clean isolation of backend dependencies and frontend assets, independent deployment readiness, and straightforward script management.
- **Decision:** Adopt decoupled `server/` and `client/` directories under the repository root.
- **Consequences:** Backend can be scaffolded and verified independently before introducing frontend scaffolding.

## Decision 002: Candidate MVP Direction Analysis
- **Date:** 2026-10-21
- **Context:** We have an ~8-10 hour development budget across 4-5 days with no paid third-party AI APIs. We must select a narrow, high-value problem statement from Nexus's capabilities to prototype.
- **Evaluation of Alternatives:**
  1. **Option 1: Reorder-Point Autonomous Procurement (Recommended)**
     - *Operational Value:* High. Directly addresses the core promise of Nexus ("Autonomous Procurement: purchase orders triggered at safety-stock thresholds").
     - *Feasibility:* Highest. Deterministic relational model (SKUs, inventory ledger, vendors, purchase orders). Easily completed within budget.
     - *Testability:* Highest. 100% deterministic with synthetic stock consumption scenarios.
     - *Synthetic Validation:* Can validate stock decrement, threshold breach detection, draft purchase order creation, and user approval in UI.
  2. **Option 2: Multi-Depot Inventory Balancing**
     - *Operational Value:* High. Demonstrates multi-node re-routing.
     - *Feasibility:* Moderate. Requires multi-location inventory models, transfer orders, in-transit state management, and atomic transactional balancing.
     - *Testability:* High. Transactional balance tests.
     - *Synthetic Validation:* Requires simulated multi-depot topologies and transit matrices. Slightly higher risk of UI scope creep within time budget.
  3. **Option 3: Vendor SLA Monitoring**
     - *Operational Value:* Moderate. Analytical dashboard for vendor performance scorecards.
     - *Feasibility:* High. Read-heavy calculations over historical logs.
     - *Testability:* High. Pure mathematical formulas (OTIF percentage, lead-time variance).
     - *Synthetic Validation:* Demonstrates scorecards and historical charts well, but lacks the dynamic trigger/event-driven operational feel of Nexus.
- **Decision:** Recommend **Option 1 (Reorder-Point Autonomous Procurement)** for MVP implementation. Requires user/intern confirmation before implementing domain models.

## Decision 003: Backend Foundation Runtime & Tooling
- **Date:** 2026-10-21
- **Context:** Initializing the Node.js backend service.
- **Decision:** Use ES Modules (`"type": "module"` in `package.json`) and Node.js native `--watch` flag (`node --watch src/index.js`) available in Node.js v24.
- **Consequences:** Eliminates external file-watcher dependencies like `nodemon`, reducing dependency footprint while providing modern import syntax.

## Decision 004: MVP Selection & Architecture — Multi-Depot Inventory Balancing (MVP 2A)
- **Date:** 2026-10-21
- **Context:** User confirmed selection of **Multi-Depot Inventory Balancing (MVP 2A)** for Day 1 implementation to establish immediate operational functionality beyond server boilerplate.
- **Problem Statement:**
  Regional supply networks experience local stockouts when unexpected demand surges occur at one depot while adjacent depots hold surplus stock. Without lateral rebalancing, the deficit depot suffers stockouts or incurs long lead times and high costs ordering manufacturer replenishment.
- **Operational Workflow:**
  1. *Network Inventory View:* Planner retrieves current inventory levels across depots (`depot-north`, `depot-south`, `depot-east`) for shared SKUs.
  2. *Status Calculation:* For each SKU at each depot, calculate supply health:
     - `DEFICIT`: `onHand < safetyStock` (at risk of stockout; high urgency)
     - `BALANCED`: `safetyStock <= onHand <= targetStock` (stable)
     - `SURPLUS`: `onHand > targetStock` (possesses transferable inventory)
  3. *Opportunity Detection:* System calculates candidate lateral transfers pairing surplus depots with deficit depots for the same SKU, computing the recommended transfer quantity (`min(deficitToTarget, donorAvailableSurplus)`).
  4. *Validated Transfer Execution:* Planner dispatches transfer (`skuId`, `fromDepotId`, `toDepotId`, `quantity`).
  5. *Business Rule & Safety Invariant:* The system enforces that source depot stock after transfer must remain at or above its own safety stock (`onHand - quantity >= safetyStock`). If breached, transfer is rejected with HTTP 400.
  6. *Atomic Execution & Audit Log:* Decrements source depot, increments recipient depot, and records an immutable transfer order.
- **Data Assumptions:**
  - 3 depots: Chicago (North Hub), Dallas (South DC), Philadelphia (East Gateway).
  - 2 SKUs: `SKU-MED-01` (Emergency Cold-Chain Sensor Pack, unit cost $145.00) and `SKU-IND-02` (Industrial Temperature Relay, unit cost $82.50).
  - Seed state: North is in deficit for MED-01 while South has surplus; South is in deficit for IND-02 while North has surplus; East is balanced.
- **Acceptance Criteria (Verified):**
  - [x] `GET /api/inventory` returns enriched depot-SKU records with `DEFICIT`, `BALANCED`, `SURPLUS` statuses and available surplus metrics.
  - [x] `GET /api/transfers/opportunities` accurately computes valid matches and recommended transfer amounts.
  - [x] `POST /api/transfers` validates schema via Zod and rejects same-depot transfers.
  - [x] `POST /api/transfers` rejects transfers that deplete donor depot below safety stock.
  - [x] Valid transfers update inventory atomically and log transfer history.

## Decision 005: Backend Architectural Review & Verification Audit
- **Date:** 2026-10-21
- **Context:** Focused technical review of the initial backend implementation prior to scaffolding the frontend dashboard.
- **Persistence Mechanism (Facts vs. Assumptions):**
  - *Storage Layer:* All state (`depots`, `skus`, `inventory`, `transfers`) is stored strictly in Node.js process heap memory (`let` variables initialized via deep copy from `mockData.js`).
  - *Server Restart Behavior:* State **does not** survive process restarts. Any process termination or code change in `--watch` mode resets all inventory numbers and clears transfer history back to baseline.
  - *Atomicity & Concurrency:* Updates are synchronous JavaScript mutations within Node's single-threaded event loop. They are **not** database transactions (no ACID guarantees, WAL, disk persistence, or multi-instance concurrency locks).
- **Edge-Case Evaluation:**
  - *Missing Records:* Requests referencing invalid or non-existent depot IDs or SKU IDs fail cleanly with HTTP 404.
  - *Excess Quantities:* Requests attempting to transfer more than `onHand - safetyStock` are rejected with HTTP 400, strictly preserving the source depot's buffer.
  - *Sequential / Repeated Requests:* Handled serially by the event loop. If two identical requests arrive, the first will deduct stock; the second will evaluate against the newly decremented stock and reject if safety stock would be breached. (No idempotency key exists yet, so duplicate clicks can execute twice if surplus permits).
  - *Opportunity Engine Thresholds:* Opportunity detection is triggered strictly when a depot is in `DEFICIT` (`onHand < safetyStock`). Once stock reaches safety stock (even if below `targetStock`), the status becomes `BALANCED` and drops off the active emergency transfer list.
- **Audit Outcomes & Additions:**
  - Expanded automated test suite from 5 to 8 tests in `server/test/inventory.test.js`, proving 404 behavior, sequential surplus depletion, and dynamic opportunity recalculation.
  - Added `POST /api/inventory/reset` endpoint to restore synthetic baseline without restarting the server, ensuring repeatable UI testing and demos.
  - Identified workspace DX friction: running `npm run dev` from repository root failed due to missing root `package.json`.

## Decision 006: Frontend Dashboard Architecture & Full-Stack Integration
- **Date:** 2026-10-21
- **Context:** Implementing the React + Tailwind CSS client to provide an interactive, real-time command dashboard for Multi-Depot Inventory Balancing (MVP 2A).
- **Architecture & Structure:**
  - *Tooling:* Vite + React 18 + Tailwind CSS 3.4 in decoupled `client/` folder.
  - *Network Proxy:* Configured Vite dev server proxy (`client/vite.config.js`) forwarding `/api` to Express backend on `:5000` to eliminate CORS friction and hardcoded URLs in local dev.
  - *Root Workspace Runner:* Added root `package.json` with convenience scripts (`npm run server`, `npm run client`, `npm test`) solving the `ENOENT D:\package.json` friction.
- **Components Built:**
  - `Header.jsx`: Service health status pill, refresh trigger, and "Reset Demo State" modal.
  - `SummaryCards.jsx`: 4 KPI metrics (Active Deficits, Available Surpluses, Balanced Stock, Connected Nodes).
  - `OpportunityList.jsx`: Actionable transfer cards with safety stock thresholds, custom quantity inputs, client-side guards, and one-click dispatch.
  - `InventoryGrid.jsx`: 3 depot cards with SKU stock meters, numerical thresholds (on-hand, safety, target), and dynamic status badges (`DEFICIT`, `BALANCED`, `SURPLUS`).
  - `TransferLog.jsx`: Real-time audit table of executed transfers.
  - `client/src/api/client.js`: Structured fetch wrapper handling typed API responses and structured error messages.
- **Verification & Testing Results:**
  - Automated production build passed: `vite build` generated production bundle in 4.46s with 0 errors.
  - Browser subagent completed end-to-end user workflow:
    1. Verified initial state (2 Deficits, 2 Surpluses, 2 Opportunities).
    2. Verified invalid input handling: Entering 180 units displayed warning `"Exceeds safe stock (150)"` and disabled button.
    3. Verified valid transfer dispatch: Dispatched 75 units of `SKU-MED-01` from Dallas to Chicago. Deficits dropped to 1, Chicago updated to 100 (BALANCED), opportunity cleared, and transfer log appended.
    4. Verified demo reset: Clicked "Reset Demo State", confirmed in modal, and verified state returned to initial baseline.

## Decision 007: Domain Invariant Hardening & Business Logic Correctness (Day 2)
- **Date:** 2026-10-22
- **Context:** An audit of Day 1 MVP implementation surfaced 5 correctness and resilience flaws in transfer matching, transfer validation, HTTP error consistency, and UI state tracking.
- **Flaws Identified & Remediations:**
  1. *Donor Depletion Below Target:* Recommendations previously used stock above safety stock (`onHand - safetyStock = 150`), recommending 95 units and leaving donor with 95 on hand (< targetStock 100). Fixed to use donor surplus strictly above target stock (`Math.max(0, onHand - targetStock)` = 90), preserving donor target buffers.
  2. *Recipient Target Stock Capacity Breach:* `executeTransfer` only checked donor safety stock and allowed transfers exceeding recipient target stock. Added invariant check: `if (dest.onHand + quantity > dest.targetStock)` rejecting with HTTP 400 and calculating maximum allowable transfer.
  3. *Multi-Donor Duplicate Allocation:* When multiple donors possessed surplus for a single deficit node, previous nested loop recommended transfers against the full shortage for each donor, collectively exceeding the recipient's deficit. Fixed by tracking and decrementing recipient remaining shortage and donor remaining surplus across opportunities.
  4. *Malformed JSON & Unknown Route HTML Responses:* Express default error handlers returned HTML `<pre>` tags. Added JSON 404 catch-all middleware and global Express error middleware intercepting `SyntaxError` (malformed JSON body) and unhandled server errors, ensuring consistent `{ error: "..." }` JSON responses.
  5. *UI Quantity State Keyed by Array Index:* `OpportunityList.jsx` previously stored custom quantities keyed by array `index` (`quantities[index]`). When transfers were dispatched or the list reordered, remaining rows inherited shifted input values. Fixed by keying state to unique composite opportunity keys (`${opp.skuId}-${opp.fromDepotId}-${opp.toDepotId}`).
- **Verification:**
  - Authored isolated regression suite in `server/test/regression.test.js` exposing all 5 bugs before applying fixes.
  - Minimal fixes implemented; verified regression suite and all existing domain tests passing.

## Decision 008: PostgreSQL & Prisma Persistence Layer with Concurrency Safety (Day 2)
- **Date:** 2026-10-22
- **Context:** The system required moving from in-memory state to persistent relational storage using PostgreSQL and Prisma while preserving the existing Express API and React frontend without disruption.
- **Relational Schema Design (`server/prisma/schema.prisma`):**
  - `Depot`: id, name, city, region, timestamps.
  - `Sku`: id, name, unit, unitCost, timestamps.
  - `InventoryLevel`: id (UUID), depotId (FK), skuId (FK), onHand, safetyStock, targetStock, unique constraint `@@unique([depotId, skuId])`.
  - `Transfer`: id (UUID/TRF), skuId (FK), fromDepotId (FK), toDepotId (FK), quantity, status, createdAt.
- **Concurrency & ACID Transaction Guarantees:**
  - `executeTransfer` executes within `prisma.$transaction(async (tx) => { ... })`.
  - To prevent concurrent double-spend race conditions, inventory rows are locked using raw row-level locks (`SELECT ... FOR UPDATE`).
  - Stock invariants (donor safety stock floor, recipient target capacity ceiling) are checked inside the locked transaction; invalid requests roll back cleanly without mutating database state.
- **Environment & Zero-Friction Fallback:**
  - Database URL configured via `server/.env` (`DATABASE_URL="postgresql://postgres@localhost:5432/nexus_inventory?schema=public"`).
  - Credentials excluded from Git via `.gitignore`; template documented in `server/.env.example`.
  - Service layer includes transparent in-memory fallback if `DATABASE_URL` is omitted, allowing zero-dependency local test runs.
- **Verification:**
  - Built comprehensive `server/test/persistence.test.js` verifying PostgreSQL connection, seeded records, transactional updates, row-level concurrency locking, and database reset.
  - Full suite of 18 tests passing (18/18) with `--test-concurrency=1`.
  - Full frontend production build verified (`vite build`).
  - End-to-end browser subagent verified live transfer dispatch, inventory reconciliation, and demo reset backed by active PostgreSQL instance.
