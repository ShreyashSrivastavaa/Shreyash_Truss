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
3. **Run backend automated domain tests:**
   ```bash
   npm test
   ```

### Available Backend Endpoints
- `GET /api/health` — System uptime and status check
- `GET /api/inventory` — Enriched network inventory status across all depots and SKUs
- `GET /api/transfers/opportunities` — Algorithmic calculation of candidate lateral transfers to resolve deficits
- `GET /api/transfers` — Complete audit trail of executed transfers
- `POST /api/transfers` — Execute a validated lateral transfer with safety stock invariant enforcement
- `POST /api/inventory/reset` — Reset inventory state back to synthetic baseline

## Current Status (Day 1)
- [x] Workspace inspection and Git repository audit
- [x] Supply chain domain analysis and candidate MVP trade-off evaluation
- [x] Confirmed working MVP: **Multi-Depot Inventory Balancing (MVP 2A)**
- [x] Root repository configuration, `.gitignore`, and workspace scripts
- [x] Backend Express service scaffolding with CORS and JSON parsing
- [x] Multi-depot data modeling and seed store (3 regional depots, 2 critical SKUs)
- [x] Zod validation schemas for lateral transfer requests
- [x] Real-time inventory balance calculations (`DEFICIT`, `BALANCED`, `SURPLUS`)
- [x] Transfer opportunity matching engine and atomic transfer execution
- [x] Automated test suite passing 8/8 assertions via `node --test`
- [x] Full React + Tailwind CSS client dashboard in `client/`
- [x] End-to-end browser verification of transfer execution, live reconciliation, and demo reset
- [ ] PostgreSQL / Prisma persistence integration
