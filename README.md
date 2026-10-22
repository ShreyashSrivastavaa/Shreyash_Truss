# Nexus — Supply Chain Operating System Prototype

## Overview
Nexus is a supply chain prototype inspired by Product 18 from the Truss Studios Capabilities & Systems Matrix 2026 ("Nexus: Self-Evolving Enterprise Supply Chain Management & Predictive Logistics"). 

The goal of this prototype is to implement an intelligent, verifiable software foundation demonstrating dynamic inventory protection and lateral multi-depot rebalancing without reliance on external paid AI APIs or physical telemetry hardware.

## Tech Stack
- **Frontend:** React 18, Vite, Tailwind CSS 3.4, Lucide Icons
- **Backend:** Node.js (v24 native test runner & ES modules), Express.js, CORS
- **Persistence:** In-memory domain repository seeded with realistic synthetic data; PostgreSQL & Prisma *(to be integrated)*
- **Validation:** Zod
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
│   └── daily-updates/
│       └── day-01.md
├── nexus_notes/
│   └── prompt-log.md
├── server/
│   ├── package.json
│   ├── src/
│   │   ├── app.js
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
│   └── test/
│       └── inventory.test.js
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
- `GET /api/health` — System uptime and status check
- `GET /api/inventory` — Enriched network inventory status across all depots and SKUs
- `GET /api/transfers/opportunities` — Algorithmic calculation of candidate lateral transfers to resolve deficits (using donor surplus above target and multi-donor deduplication)
- `GET /api/transfers` — Complete audit trail of executed transfers
- `POST /api/transfers` — Execute a validated lateral transfer with safety stock floor and recipient target stock capacity enforcement
- `POST /api/inventory/reset` — Reset inventory state back to synthetic baseline (re-seeds PostgreSQL)

## Current Status (Day 2 — Reliability & Persistence)
- [x] Workspace inspection and business logic audit
- [x] **Bug Fix 1:** Transfer recommendations strictly use donor surplus above target stock (preventing donor depletion below target)
- [x] **Bug Fix 2:** Transfers exceeding recipient remaining target-stock capacity are rejected with HTTP 400
- [x] **Bug Fix 3:** Multi-donor duplicate allocation of recipient shortage prevented via dynamic allocation tracking
- [x] **Bug Fix 4:** Catch-all 404 handler and error-handling middleware return consistent JSON errors (malformed requests & unknown routes)
- [x] **Bug Fix 5:** Opportunity input state in React keyed to unique opportunity IDs (`skuId-fromDepot-toDepot`) rather than array indices
- [x] **PostgreSQL & Prisma Persistence:**
  - Relational models for `Depot`, `Sku`, `InventoryLevel`, and `Transfer`
  - Foreign key constraints, unique constraints (`@@unique([depotId, skuId])`), and indexes
  - Seed script (`prisma/seed.js`) importing synthetic supply chain baseline data
  - Database transactions (`prisma.$transaction`) with `SELECT ... FOR UPDATE` row-level locking protecting transfers against concurrent race conditions
  - Environment variable isolation (`.env` ignored in Git, `.env.example` provided)
- [x] Full automated test suite (18/18 passing tests across domain, regression, and database integration)
- [x] Production build verified (`vite build`) and browser subagent end-to-end verification passing on live PostgreSQL storage
