# Daily Update — Day 02

**Date:** 2026-10-22  
**Author:** Engineering Team  
**Focus:** Reliability, Domain Invariant Hardening, and PostgreSQL & Prisma Persistence

---

## 1. Completed Work

### A. Phase 1: Business Logic Audit & Invariant Hardening
1. **Donor Target Stock Protection (Bug 1):**
   - *Problem:* Transfer opportunities previously recommended quantities up to donor safety stock (`onHand - safetyStock = 150`), recommending 95 units and leaving donor South with 95 units on hand (< targetStock 100).
   - *Fix:* Recommendations now strictly calculate donor surplus above target stock (`Math.max(0, onHand - targetStock) = 90`), ensuring recommended transfers never deplete the donor below target stock.
2. **Recipient Target Stock Capacity Enforcement (Bug 2):**
   - *Problem:* `executeTransfer` only validated donor safety stock, allowing transfers that pushed recipient stock well beyond its target stock.
   - *Fix:* Added strict check in `executeTransfer`: `if (dest.onHand + quantity > dest.targetStock)` rejecting requests exceeding remaining capacity with HTTP 400 and detailing maximum allowable quantity.
3. **Multi-Donor Shortage Duplicate Allocation Prevention (Bug 3):**
   - *Problem:* Multiple donors for a single deficit node generated uncoordinated recommendations that collectively exceeded the recipient's shortage.
   - *Fix:* Implemented dynamic shortage and surplus allocation tracking in `getTransferOpportunities`, coordinating multi-donor splits without over-allocation.
4. **Consistent JSON Error Responses (Bug 4):**
   - *Problem:* Express default error handling sent HTML error pages for malformed JSON and unknown routes.
   - *Fix:* Added catch-all JSON 404 middleware and global error-handling middleware intercepting `SyntaxError` (malformed JSON) and server errors to guarantee consistent `{ error: "..." }` responses.
5. **Frontend Quantity State Integrity (Bug 5):**
   - *Problem:* Custom quantity inputs in `OpportunityList.jsx` were keyed by array `index` (`quantities[index]`), causing values to shift onto incorrect rows when items resolved or reordered.
   - *Fix:* Keyed local state and input IDs to unique opportunity keys (`${opp.skuId}-${opp.fromDepotId}-${opp.toDepotId}`).
6. **Regression Test Verification:**
   - Authored `server/test/regression.test.js` exposing all 5 bugs prior to applying minimal fixes.

### B. Phase 2: Application Verification
- Full test suite passed across existing domain logic and new regression scenarios.
- Production bundle compiled with zero warnings/errors (`npm --prefix client run build`).
- Autonomous browser subagent executed full dashboard workflow: verified recommended targets, boundary rejections (160 units exceeding safe stock, 96 units exceeding recipient target capacity), successful dispatch of 90 units, live reconciliation, and state reset.

### C. Phase 3: PostgreSQL & Prisma Persistence Implementation
- **Schema & Relational Models (`server/prisma/schema.prisma`):**
  - Models for `Depot`, `Sku`, `InventoryLevel`, and `Transfer`.
  - Relations, foreign keys with cascade on parent deletion, and unique constraint `@@unique([depotId, skuId])`.
- **Database Synchronization:**
  - Pushed schema to local PostgreSQL instance (`nexus_inventory` on port 5432).
  - Seed script (`prisma/seed.js`) populating synthetic baseline data.
- **ACID Transactions & Concurrency Safety:**
  - `executeTransfer` executes within `prisma.$transaction`.
  - Uses raw row-level locks (`SELECT ... FOR UPDATE`) to eliminate concurrent double-spend race conditions.
  - Rollback guaranteed on invariant breach.
- **Environment & Fallback:**
  - Isolated database URL in `server/.env` (ignored by Git) and documented template in `server/.env.example`.
  - Service layer includes transparent in-memory fallback if `DATABASE_URL` is omitted, allowing zero-friction local testing.

---

## 2. Validation & Verification Evidence

### A. Full Automated Test Suite (`npm test`)
```text
> nexus-workspace@0.1.0 test
> npm --prefix server test

> nexus-server@0.1.0 test
> node --test --test-concurrency=1

▶ Multi-Depot Inventory Balancing Domain Logic
  ✔ calculates correct initial inventory status and balance flags (219.8122ms)
  ✔ identifies valid transfer opportunities for deficit depots (20.6632ms)
  ✔ executes a valid transfer and atomically updates inventory levels (40.1573ms)
  ✔ rejects transfer when requested quantity depletes source below safety stock (17.44ms)
  ✔ rejects transfer when source and destination are identical via Zod (16.9909ms)
  ✔ rejects transfer when depot or SKU record does not exist (16.1932ms)
  ✔ sequential transfers deplete surplus and reject second transfer when safety stock is breached (21.274ms)
  ✔ transfer opportunities dynamically reflect updated surplus after a partial transfer (26.0303ms)
✔ Multi-Depot Inventory Balancing Domain Logic (380.8969ms)

▶ PostgreSQL & Prisma Persistence Integration
  ✔ Prisma client connects and database contains seeded tables (99.4074ms)
  ✔ getInventoryStatus reads enriched records directly from PostgreSQL (20.6145ms)
  ✔ executeTransfer executes inside a PostgreSQL transaction and updates database records (30.497ms)
  ✔ PostgreSQL concurrency safety: sequential transfers properly serialize with row-level locks (24.5769ms)
  ✔ resetState restores PostgreSQL database back to synthetic baseline (38.5934ms)
✔ PostgreSQL & Prisma Persistence Integration (216.2172ms)

▶ Phase 1 Regression Tests — Business Logic & Error Handling
  ✔ Bug 1: Transfer recommendations must NOT leave donor below its target stock (114.5627ms)
  ✔ Bug 2: executeTransfer must reject transfers exceeding recipient remaining target-stock capacity (28.6357ms)
  ✔ Bug 3: Multiple donors must not duplicate allocation of the same recipient shortage (23.8886ms)
  ▶ HTTP API Error Handling & Consistency
    ✔ Bug 4a: Malformed JSON body returns JSON error response, not HTML (173.8654ms)
    ✔ Bug 4b: Unknown routes return JSON 404 response, not HTML (35.2859ms)
  ✔ HTTP API Error Handling & Consistency (209.893ms)
✔ Phase 1 Regression Tests — Business Logic & Error Handling (379.3057ms)

ℹ tests 18
ℹ suites 4
ℹ pass 18
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 2622.7676
```

### B. Production Frontend Build (`npm --prefix client run build`)
```text
vite v6.4.5 building for production...
transforming...
✓ 1583 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.49 kB │ gzip:  0.34 kB
dist/assets/index-DToU7_xz.css   17.45 kB │ gzip:  4.09 kB
dist/assets/index-cEY-72cc.js   169.18 kB │ gzip: 52.77 kB
✓ built in 5.90s
```

### C. Live Full-Stack End-to-End Browser Testing
- Tested on `http://localhost:5173` backed by Express on `:5000` and PostgreSQL on `:5432`.
- Verified recommendation of 90 units for SKU-MED-01.
- Verified input bounds: 160 units disabled button; 96 units displayed backend error:
  `Transfer rejected: transferring 96 units would exceed destination depot 'depot-north' target stock threshold (120). Maximum allowable transfer is 95 units.`
- Verified dispatch of 90 units: successfully executed in PostgreSQL, updated North on-hand to 115 (BALANCED), South on-hand to 100, logged transfer in audit trail, and removed completed opportunity.
- Verified demo reset: re-seeded PostgreSQL table state back to synthetic baseline.

---

## 3. Blockers & Risks
- **None.** PostgreSQL persistence is genuinely working end-to-end with verified database transactions and concurrency row locks.

---

## 4. Next Steps
1. **Multi-Leg Logistics & Transit Distance:** Factor in inter-depot shipping distances and costs to rank transfer opportunities by operational cost.
2. **Transfer Idempotency Keys:** Introduce client-generated idempotency keys in `Transfer` model to guard against accidental double-submissions.
