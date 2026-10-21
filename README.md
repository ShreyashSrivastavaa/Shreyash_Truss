# Nexus — Supply Chain Operating System Prototype

## Overview
Nexus is a supply chain prototype inspired by Product 18 from the Truss Studios Capabilities & Systems Matrix 2026 ("Nexus: Self-Evolving Enterprise Supply Chain Management & Predictive Logistics"). 

The goal of this prototype is to implement an intelligent, verifiable software foundation demonstrating dynamic inventory protection and autonomous procurement without reliance on external paid AI APIs or physical telemetry hardware.

## Tech Stack
- **Frontend:** React, Tailwind CSS *(to be initialized)*
- **Backend:** Node.js, Express.js
- **Persistence:** PostgreSQL, Prisma *(to be initialized upon MVP confirmation)*
- **Validation:** Zod
- **Testing:** Postman / cURL automated endpoint validation

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
    └── src/
        └── index.js
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
   *(For development with auto-reload, run `npm run dev`)*
4. Verify server health:
   ```bash
   curl http://localhost:5000/api/health
   ```

## Current Status (Day 1)
- [x] Workspace inspection and Git repository audit
- [x] Supply chain domain analysis and candidate MVP trade-off evaluation
- [x] Root repository configuration and `.gitignore`
- [x] Backend Express service scaffolding with CORS and JSON parsing
- [x] Verified `GET /api/health` endpoint returning structured JSON (HTTP 200 OK)
- [ ] MVP selection confirmation (Reorder-Point Autonomous Procurement recommended)
- [ ] Database schema modeling (PostgreSQL + Prisma)
- [ ] Frontend React client initialization
