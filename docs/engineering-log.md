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
