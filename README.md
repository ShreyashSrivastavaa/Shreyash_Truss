# Nexus — Supply Chain Operating System Prototype

## Overview
Nexus is a supply chain prototype inspired by Product 18 from the Truss Studios Capabilities & Systems Matrix 2026 ("Nexus: Self-Evolving Enterprise Supply Chain Management & Predictive Logistics"). 

The goal of this prototype is to implement an intelligent, verifiable software foundation demonstrating dynamic inventory protection and lateral multi-depot rebalancing without reliance on external paid AI APIs or physical telemetry hardware.

## Tech Stack
- **Frontend:** React 18, Vite, Tailwind CSS 3.4, Lucide Icons
- **Backend:** Node.js (v24 native test runner & ES modules), Express.js, CORS
- **Persistence:** PostgreSQL with Prisma ORM (ACID transactions & raw `SELECT ... FOR UPDATE` row-level locks); transparent in-memory domain repository fallback when `DATABASE_URL` is omitted
- **Validation:** Zod schemas for request bodies and route parameters
- **Testing:** Node.js native test runner (`node --test`), autonomous browser subagent end-to-end testing

## Project Structure
```text
Shreyash_Truss/
├── .gitignore
├── package.json           <-- Root workspace runner
├── README.md
├── docs/
│   ├── engineering-log.md
│   ├── llm-interaction-log.md
│   ├── audit/
│   │   └── phase-1-audit.md
│   └── daily-updates/
│       ├── day-01.md
│       ├── day-02.md
│       └── day-03.md
├── nexus_notes/
│   └── prompt-log.md
├── server/
│   ├── package.json
│   ├── src/
│   │   ├── app.js
│   │   ├── db.js
│   │   ├── index.js
│   │   ├── data/
│   │   │   └── mockData.js
│   │   ├── routes/
│   │   │   ├── inventoryRoutes.js
│   │   │   └── transferRoutes.js
│   │   ├── schemas/
│   │   │   └── transferSchema.js
│   │   └── services/
│   │       └── inventoryService.js
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.js
│   └── test/
│       ├── inventory.test.js
│       ├── persistence.test.js
│       ├── regression.test.js
│       ├── lifecycle.test.js
│       └── httpLifecycle.test.js
└── client/
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── index.html
    └── src/
        ├── api/
        │   └── client.js
        ├── components/
        │   ├── Header.jsx
        │   ├── SummaryCards.jsx
        │   ├── OpportunityList.jsx
        │   ├── InventoryGrid.jsx
        │   └── TransferLog.jsx
        ├── App.jsx
        ├── main.jsx
        └── index.css
```

## Getting Started

### Prerequisites
- Node.js (v24.x recommended)
- npm (v11.x recommended)

### Database Setup (PostgreSQL with Prisma)
The prototype features persistent relational storage using PostgreSQL and Prisma ORM:
1. **Configure Environment Variables:**
   Copy the example environment template in `server/`:
   ```bash
   cp server/.env.example server/.env
   ```
   Set your connection string in `server/.env`:
   ```env
   DATABASE_URL="postgresql://postgres:password@localhost:5432/nexus_inventory?schema=public"
   PORT=5000
   ```
2. **Synchronize Schema to PostgreSQL:**
   ```bash
   npm --prefix server run db:push
   ```
3. **Seed Baseline Synthetic Data:**
   ```bash
   npm --prefix server run db:seed
   ```
4. **Fallback Mode:**
   If `DATABASE_URL` is omitted, the backend cleanly defaults to in-memory domain storage for rapid zero-dependency local testing.

### Quick Start (From Repository Root)
1. **Start the Express backend:**
   ```bash
   npm run server
   ```
   *(Runs on `http://localhost:5000` with native file watching)*
2. **Start the React frontend (in another terminal):**
   ```bash
   npm run client
   ```
   *(Runs on `http://localhost:5173` with Vite proxy forwarding `/api` to `:5000`)*
3. **Run automated domain & regression test suites:**
   ```bash
   npm test
   ```

### Available Backend Endpoints
- `GET /api/health` — System uptime, health check, and environment metadata
- `GET /api/inventory` — Enriched network inventory status across all depots and SKUs with summary aggregate KPIs
- `GET /api/transfers/opportunities` — Algorithmic calculation of candidate lateral transfers using donor surplus above target stock, inbound pipeline deduplication, and multi-donor shortage tracking
- `GET /api/transfers` — Complete audit trail of active and completed transfers
- `POST /api/transfers` — Stage a transfer order in `PENDING` status with atomic source reservation, donor target-stock protection, and recipient target capacity validation
- `POST /api/transfers/:id/dispatch` — Dispatch a `PENDING` transfer to `IN_TRANSIT` (decrements source on-hand and reserved, increments destination in-transit)
- `POST /api/transfers/:id/receive` — Receive an `IN_TRANSIT` transfer into `RECEIVED` (decrements destination in-transit, increments destination on-hand)
- `POST /api/transfers/:id/cancel` — Cancel a `PENDING` transfer and release reserved source inventory (prohibited once in-transit)
- `POST /api/inventory/reset` — Reset inventory state back to synthetic baseline (re-seeds PostgreSQL; blocked in production with HTTP 403)

### Inventory Threshold Definitions
- **Safety Stock (`safetyStock`):** The minimum operational buffer. When `onHand < safetyStock`, the SKU position is flagged in `DEFICIT` with high rebalancing urgency.
- **Target Stock (`targetStock`):** The optimal inventory holding level. When `onHand > targetStock`, excess units constitute `SURPLUS`.
- **Target-Stock Protection Invariant:** Donor transfers are strictly capped at surplus above target stock (`onHand - reserved - Q >= targetStock`). A donor is never depleted below its target holding level to satisfy a recipient shortage.
- **Recipient Target Capacity Invariant:** Recipient intake is strictly limited by remaining capacity to target stock (`onHand + inTransit + pendingInbound + Q <= targetStock`).

## Current Status (Day 3 — Transfer Lifecycle, Concurrency & Security)
- [x] **Transfer Lifecycle State Machine:**
  - Implemented 4-stage transfer order state machine (`PENDING` $\rightarrow$ `IN_TRANSIT` $\rightarrow$ `RECEIVED` / `CANCELLED`).
  - Added dedicated custody accounting fields (`reserved`, `inTransit`) on inventory levels.
  - Enforced network physical stock conservation invariant: $\Delta(\sum \text{onHand} + \sum \text{inTransit}) \equiv 0$.
- [x] **Deterministic Concurrency & ACID Safety:**
  - Database mutations serialized with raw `SELECT ... FOR UPDATE ORDER BY "depotId" ASC, "skuId" ASC` to prevent deadlocks and race conditions during concurrent bidirectional transfers.
- [x] **API Route Hardening & Validation:**
  - Reusable Zod schemas for payload validation and route parameter validation (`transferIdParamSchema`).
  - Production security guard on `POST /api/inventory/reset` (blocked with HTTP 403 when `NODE_ENV === 'production'`).
  - Consistent JSON error contracts for 400, 403, 404, and 409 responses.
- [x] **Interactive Dashboard UI:**
  - Added Active Shipments Pipeline with Dispatch, Receive, and Cancel action triggers.
  - Split completed history into read-only audit log.
  - In-Transit Freight KPI metric card and real-time net available stock calculations.
- [x] **Comprehensive Test Coverage:**
  - Full automated suite of **33/33 passing tests** across 6 test suites (`inventory.test.js`, `persistence.test.js`, `regression.test.js`, `lifecycle.test.js`, `httpLifecycle.test.js`).
- [x] **Production Build & Browser Verification:**
  - Verified Vite production build (`npm run build`).
  - Automated browser subagent verified live end-to-end lifecycle, error states, responsive viewports, and reset flow.
