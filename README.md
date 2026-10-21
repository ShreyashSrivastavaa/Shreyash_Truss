# Nexus — Supply Chain Operating System Prototype

## Overview
Nexus is a supply chain prototype inspired by Product 18 from the Truss Studios Capabilities & Systems Matrix 2026 ("Nexus: Self-Evolving Enterprise Supply Chain Management & Predictive Logistics"). 

The goal of this prototype is to implement an intelligent, verifiable software foundation demonstrating dynamic inventory protection and autonomous procurement without reliance on external paid AI APIs or physical telemetry hardware.

## Tech Stack
- **Frontend:** React, Tailwind CSS *(to be initialized)*
- **Backend:** Node.js (v24 native test runner & ES modules), Express.js
- **Persistence:** In-memory domain repository seeded with realistic synthetic data; PostgreSQL & Prisma *(to be integrated)*
- **Validation:** Zod
- **Testing:** Native Node.js test runner (`node --test`), cURL / Postman automated endpoint validation

## Project Structure
```text
Shreyash_Truss/
├── .gitignore
├── README.md
├── docs/
│   ├── engineering-log.md
│   ├── llm-interaction-log.md
│   └── daily-updates/
│       └── day-01.md
├── nexus_notes/
│   └── prompt-log.md
└── server/
    ├── package.json
    ├── src/
    │   ├── app.js
    │   ├── index.js
    │   ├── data/
    │   │   └── mockData.js
    │   ├── routes/
    │   │   ├── inventoryRoutes.js
    │   │   └── transferRoutes.js
    │   ├── schemas/
    │   │   └── transferSchema.js
    │   └── services/
    │       └── inventoryService.js
    └── test/
        └── inventory.test.js
```

## Getting Started

### Prerequisites
- Node.js (v24.x recommended)
- npm (v11.x recommended)

### Running the Backend Service
1. Navigate to the `server/` directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the server:
   ```bash
   npm start
   ```
   *(For development with auto-reload: `npm run dev`)*
4. Run automated unit and domain tests:
   ```bash
   npm test
   ```

### Available Endpoints
- `GET /api/health` — System uptime and status check
- `GET /api/inventory` — Enriched network inventory status across all depots and SKUs
- `GET /api/transfers/opportunities` — Algorithmic calculation of candidate lateral transfers to resolve deficits
- `GET /api/transfers` — Complete audit trail of executed transfers
- `POST /api/transfers` — Execute a validated lateral transfer with safety stock invariant enforcement

## Current Status (Day 1)
- [x] Workspace inspection and Git repository audit
- [x] Supply chain domain analysis and candidate MVP trade-off evaluation
- [x] Confirmed working MVP: **Multi-Depot Inventory Balancing (MVP 2A)**
- [x] Root repository configuration and `.gitignore`
- [x] Backend Express service scaffolding with CORS and JSON parsing
- [x] Verified `GET /api/health` endpoint returning structured JSON (HTTP 200 OK)
- [x] Multi-depot data modeling and seed store (3 regional depots, 2 critical SKUs)
- [x] Zod validation schemas for lateral transfer requests
- [x] Real-time inventory balance calculations (`DEFICIT`, `BALANCED`, `SURPLUS`)
- [x] Transfer opportunity matching engine and atomic transfer execution
- [x] Automated test suite passing 5/5 assertions via `node --test`
- [x] Live HTTP endpoint verification (curl & PowerShell) with verified invariant rejections
- [ ] Frontend React + Tailwind CSS client dashboard
- [ ] PostgreSQL / Prisma persistence integration
