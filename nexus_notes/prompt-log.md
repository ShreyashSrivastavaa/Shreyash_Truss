## Prompt 001: Domain framing and MVP scoping
- **Date:** 2026-10-21
- **Tool/model used:** Gemini 3.8 Flash (High) in Google Antigravity
- **Purpose:** Provide domain framing on core supply chain concepts, propose three tightly bounded problem statements with candidate MVPs within an 8-10 hour development constraint, and formulate scoping questions without writing code or making unsupported assumptions.
- **Prompt:**
```text
ROLE
You are a senior engineer mentoring an intern on a supply-chain software
prototype. Be precise, and clearly separate facts from assumptions.

CONTEXT
I am building a small prototype inspired by "Nexus" (Product 18) from the
Truss Studios Capabilities & Systems Matrix 2026. I have no access to Nexus's
internal code, production data, or customers. Any data in the prototype will
be synthetic or manually entered.

Source text (verbatim from the document):
"Nexus: Self-Evolving Enterprise Supply Chain Management & Predictive
Logistics. Modern supply chains fail when demand spikes or logistics
disruptions are identified too late. Nexus is an intelligent supply chain
operating system that dynamically re-routes inventory, predicts stockouts,
and optimizes procurement in real time.
Capabilities: Predictive Demand Forecasting; Multi-Depot Balancing; Vendor
SLA Enforcement; Cold Chain Telemetry; Dynamic Fleet Routing; Autonomous
Procurement (purchase orders triggered at safety-stock thresholds).
Marketing claims: 'Published AI patent'; 'reduces warehouse holding costs by
22% while eliminating stockouts.'"

The patent and the 22% claim are unverified marketing statements. Do not treat
them as facts or try to reproduce them.

CONSTRAINTS
- Stack: React, Tailwind CSS, Node.js, Express, PostgreSQL, Prisma, Zod.
- No external AI API keys, paid services, or third-party integrations.
- Time budget: roughly 4-5 working days, about 2 hours per day.
- The CEO's expectations for the prototype are not specified. Do not invent them.

TASK
1. Give a concise primer on the supply-chain concepts needed to understand
   the capabilities above (inventory, lead time, safety stock, reorder point,
   multi-depot networks, vendor SLAs). Use one small example each.
2. Propose 3 narrowly scoped problem statements from the capability list that
   can be prototyped without real data or hardware. For each, state: the user
   role, the decision they make, the data required, and what can and cannot be
   validated with synthetic data.
3. For each problem, outline 2 possible MVPs with trade-offs
   (complexity, testability, demo value, risk).
4. Recommend nothing yet. List the open questions I must answer before
   choosing a scope.

OUTPUT RULES
- Label every claim as "established industry practice" or "assumption".
- Do not write any code.
- Do not describe features of Nexus beyond what the source text states.

Don’t create files in the repo yet. Keep this in your nexus-notes folder for now, in a file called prompt-log.md, using this structure:

markdown
## Prompt 001: Domain framing and MVP scoping
- **Date:**
- **Tool/model used:**
- **Purpose:**
- **Prompt:** (paste exactly as sent)
- **Response:** (paste, or summarize and link the full text)
- **My evaluation:** what was useful, wrong, or too confident
- **Decision / next action:**
- **Verification:** what I checked myself
```
- **Response:**

### Senior Engineering Mentor Notes: Domain Framing & Prototype Scoping

Welcome to the team. Before writing a line of code or setting up a database schema, we must decouple marketing narrative from engineering reality [Established industry practice]. 

Regarding the source text for Nexus: the claims of a "published AI patent" and "reduces warehouse holding costs by 22% while eliminating stockouts" are unverified commercial marketing statements [Established industry practice]. In enterprise logistics, completely eliminating stockouts while cutting holding costs requires near-perfect demand predictability and zero lead-time variance, which is impossible in physical supply networks [Established industry practice]. We will treat the capabilities strictly as functional software domains, not as validated outcomes [Assumption].

Furthermore, your time budget is approximately 8 to 10 total engineering hours (4 to 5 days at 2 hours per day) using React, Tailwind CSS, Node.js, Express, PostgreSQL, Prisma, and Zod, with zero paid APIs [Assumption]. In that timeframe, attempting to build a multi-agent system or predictive ML system from scratch is a failure mode [Established industry practice]. Instead, you should aim to build a clean, reliable, deterministic core workflow that models real data structures correctly [Established industry practice].

---

### 1. Concise Primer on Supply-Chain Concepts

#### A. Inventory
- **Concept:** The aggregate stock of physical goods (raw materials, work-in-progress, or finished items) held across network locations to fulfill customer orders or sustain production [Established industry practice].
- **Example:** A regional distribution depot holding 400 boxed units of SKU-101 (e.g., standard industrial relays) across its warehouse racking [Established industry practice].

#### B. Lead Time
- **Concept:** The total elapsed duration from the exact moment a replenishment purchase order or transfer request is initiated until the goods are received, inspected, and ready for dispatch in the warehouse [Established industry practice].
- **Example:** If you order replacement stock from an electronic parts vendor on Monday morning and the shipment arrives and passes intake inspection on Friday afternoon, the operational lead time is 5 business days [Established industry practice].

#### C. Safety Stock
- **Concept:** A calculated cushion of buffer inventory held above expected consumption to insulate the operation against two uncertainties: random spikes in customer demand and unexpected supplier shipping delays [Established industry practice].
- **Example:** A depot sells an average of 10 units of an item per day. To protect against a 3-day supplier delay or a sudden customer order surge, the depot holds an extra 30 units designated strictly as safety stock [Established industry practice].

#### D. Reorder Point (ROP)
- **Concept:** A pre-established inventory threshold that dictates when a new purchase order must be issued. In classical inventory theory, it is calculated as the expected demand during the supplier lead time plus the safety stock (Reorder Point = [Average Daily Demand × Lead Time in Days] + Safety Stock) [Established industry practice].
- **Example:** If daily consumption is 10 units, supplier lead time is 4 days, and safety stock is 20 units, the reorder point is (10 × 4) + 20 = 60 units. As soon as on-hand plus on-order stock drops to 60, replenishment is triggered [Established industry practice].

#### E. Multi-Depot Networks
- **Concept:** A distributed logistics topology consisting of multiple physical nodes (regional warehouses, urban fulfillment centers, hubs) that stock inventory closer to customer demand centers and can execute lateral stock transfers between nodes to balance availability [Established industry practice].
- **Example:** A distributor operates Depot West in Nevada and Depot Midwest in Illinois. When Depot West faces an immediate stockout on a critical item while Depot Midwest has a 90-day surplus, the network coordinates a lateral transfer from Illinois to Nevada rather than waiting weeks for a factory reorder [Established industry practice].

#### F. Vendor SLAs (Service Level Agreements)
- **Concept:** Formal contractual commitments defining measurable supplier performance thresholds, most commonly measured by On-Time In-Full (OTIF) fulfillment rates, lead time adherence, and order accuracy percentages [Established industry practice].
- **Example:** A vendor contract specifies an OTIF delivery rate of 95% with a guaranteed 3-day lead time. If the vendor delivers only 80 out of 100 orders on time over a rolling 30-day window, they breach their SLA, triggering automated penalties, supplier scorecard downgrades, or safety stock recalculations [Established industry practice].

---

### 2. Three Narrowly Scoped Problem Statements

From the Nexus capability list ("Predictive Demand Forecasting; Multi-Depot Balancing; Vendor SLA Enforcement; Cold Chain Telemetry; Dynamic Fleet Routing; Autonomous Procurement"), we exclude Cold Chain Telemetry (requires IoT sensor hardware or telemetry stream simulators) and Dynamic Fleet Routing (requires GIS map engines, routing graph solvers, or third-party mapping APIs) [Established industry practice]. 

The three capabilities best suited for pure-software prototyping with synthetic data within an 8-10 hour budget are:

---

#### Problem Statement 1: Autonomous Procurement via Safety-Stock Reorder Thresholds
- **User Role:** Procurement Specialist / Inventory Controller [Established industry practice].
- **The Decision:** Deciding whether to approve, modify, or release automated draft Purchase Orders (POs) generated by the system when warehouse stock drops below calculated reorder points, and selecting the optimal supplier based on lead time and price [Established industry practice].
- **Data Required:** 
  - SKU catalog (SKU ID, title, unit purchase cost, minimum order quantity) [Established industry practice].
  - Inventory ledger per SKU (current on-hand quantity, reserved quantity, on-order quantity, safety stock threshold, reorder point) [Established industry practice].
  - Supplier registry (Vendor ID, approved SKUs, contract unit price, contracted lead time in days) [Established industry practice].
  - Purchase Order table (PO ID, Vendor ID, SKU ID, ordered quantity, unit cost, status: Draft / Approved / Dispatched / Received) [Established industry practice].
- **What Can Be Validated with Synthetic Data:**
  - The correctness of the deterministic reorder evaluation logic (e.g., verifying that a stock decrement event crossing the reorder threshold immediately triggers a valid draft PO) [Established industry practice].
  - Prevention of duplicate PO generation when an existing order is already pending [Established industry practice].
  - Relational integrity and state-machine transitions (Draft to Approved to Received) using Prisma and PostgreSQL [Established industry practice].
  - Zod validation for procurement order limits and business constraints [Established industry practice].
- **What Cannot Be Validated with Synthetic Data:**
  - Real supplier fulfillment reliability, unexpected stockouts at the vendor factory, or price changes [Established industry practice].
  - Human user trust in automated purchase suggestions without manual scrutiny [Established industry practice].
  - Actual reduction in warehouse holding costs or financial ROI [Established industry practice].

---

#### Problem Statement 2: Multi-Depot Inventory Balancing & Lateral Transfer Coordination
- **User Role:** Regional Logistics / Supply Chain Network Planner [Established industry practice].
- **The Decision:** Deciding whether to initiate and authorize lateral inventory transfers from surplus depots to deficit depots to resolve projected local stockouts before placing external purchase orders [Established industry practice].
- **Data Required:**
  - Depot registry (Depot ID, name, geographical region, storage capacity) [Established industry practice].
  - Depot-SKU inventory table (Depot ID, SKU ID, on-hand inventory, local daily demand rate, safety stock threshold) [Established industry practice].
  - Transit cost & duration matrix (Origin Depot ID, Destination Depot ID, transit time in days, fixed and per-unit transfer cost) [Established industry practice].
  - Transfer Order ledger (Transfer ID, Origin Depot, Destination Depot, SKU ID, quantity, transit status: Pending / In-Transit / Completed) [Established industry practice].
- **What Can Be Validated with Synthetic Data:**
  - Algorithmic detection of network imbalances (identifying depots where stock is below safety threshold while partner depots maintain surplus) [Established industry practice].
  - Transactional inventory reconciliation using PostgreSQL transactions (guaranteeing that departing stock decrements the source depot, enters an in-transit state, and increments the destination depot without loss) [Established industry practice].
  - User interface usability for multi-facility visibility and one-click transfer dispatching [Assumption].
- **What Cannot Be Validated with Synthetic Data:**
  - Physical warehouse loading dock throughput constraints and labor capacity [Established industry practice].
  - Real-world carrier availability, freight pricing fluctuations, and actual road transit delays [Established industry practice].
  - Organizational friction between independent warehouse managers reluctant to surrender local inventory [Established industry practice].

---

#### Problem Statement 3: Vendor SLA Enforcement & Fulfillment Tracking
- **User Role:** Supplier Relations Manager / Supply Chain Quality Auditor [Established industry practice].
- **The Decision:** Deciding whether to place new orders with a specific vendor, enforce financial delay penalties, or increase protective safety stock buffers based on empirical vendor compliance metrics [Established industry practice].
- **Data Required:**
  - Vendor Master (Vendor ID, business name, contracted SLA terms: agreed lead time in days, target OTIF percentage) [Established industry practice].
  - Purchase Orders table (PO ID, Vendor ID, order date, promised delivery date, line-item quantities) [Established industry practice].
  - Receiving Logs (Receipt ID, PO ID, actual arrival timestamp, received quantity, damaged/rejected quantity) [Established industry practice].
  - Vendor Metric Scorecard (Vendor ID, calculated OTIF percentage, average lead time variance, active breach flags) [Established industry practice].
- **What Can Be Validated with Synthetic Data:**
  - Accuracy of aggregate metrics calculations (calculating On-Time In-Full percentages, average lead-time variance, and defect rates over hundreds of simulated order events) [Established industry practice].
  - Automated alerting and visual threshold tagging (e.g., highlighting vendors falling below 90% OTIF compliance) [Established industry practice].
  - Data schema robustness for historical logging and audit trails [Established industry practice].
- **What Cannot Be Validated with Synthetic Data:**
  - Supplier dispute handling (e.g., carrier claims delivery was attempted on time but warehouse dock was closed) [Established industry practice].
  - Supplier behavioral responses to contractual penalties or negative scorecards [Established industry practice].
  - Unforeseen macroeconomic disruptions (e.g., border delays, raw material shortages) causing systemic cross-vendor delays [Established industry practice].

---

### 3. Candidate MVPs and Trade-off Analysis

For each problem statement, here are two concrete MVP options designed to fit within the 8 to 10 hour constraint:

---

#### Problem 1: Autonomous Procurement

##### MVP Option 1A: Threshold-Triggered Draft PO Generator with Manual Approval Queue
- **Description:** A system that evaluates current on-hand inventory against a static reorder point. When a simulated stock deduction drops inventory below the reorder point, the backend automatically generates a `Draft PO` assigned to the primary vendor for the predefined reorder quantity. The UI provides a procurement queue where the user can inspect, adjust quantity, and click "Approve" or "Reject".
- **Complexity:** Low. Involves standard Prisma CRUD operations, a straightforward comparison condition, and a single status update transition [Assumption]. Feasible in 5 to 6 hours [Assumption].
- **Testability:** Very High. Unit and integration tests can easily verify that reducing stock below threshold produces exactly one draft PO in PostgreSQL [Established industry practice].
- **Demo Value:** Medium. Clearly demonstrates the end-to-end operational loop from consumption to draft order creation, though the logic is basic threshold checking [Assumption].
- **Risk:** Low. Very little risk of algorithmic stalls or unfinished UI components [Assumption].

##### MVP Option 1B: Dynamic Multi-Vendor Scoring & Direct Autonomous PO Dispatch
- **Description:** When inventory breaches the reorder threshold, the system queries multiple candidate vendors offering the SKU, scores each vendor using a weighted formula (comparing quoted price vs. historical lead time), autonomously selects the winning vendor, and immediately sets the PO to `Dispatched` without human intervention, logging the decision rationale.
- **Complexity:** High. Requires multi-vendor data structures, scoring logic, tie-breaking heuristics, and automated status transitions [Assumption]. Likely requires 10 to 12 hours, exceeding the available budget [Assumption].
- **Testability:** Medium. Testing multi-variable vendor scoring algorithms requires extensive synthetic test matrices with varying edge cases [Established industry practice].
- **Demo Value:** High. Showcases autonomous procurement decision-making rather than simple static notifications [Assumption].
- **Risk:** High. Substantial risk of spending excessive time tweaking scoring formulas or debugging relational queries at the expense of a functional, polished frontend [Assumption].

---

#### Problem 2: Multi-Depot Balancing

##### MVP Option 2A: Pairwise Inventory Imbalance Viewer with Manual Transfer Dispatch
- **Description:** A dashboard displaying inventory levels across 3 predefined regional depots for a shared set of SKUs, color-coding depots in surplus (green) and deficit (red). The user can select a deficit depot, choose an available surplus depot from a suggested dropdown, enter transfer quantity, and click "Dispatch Transfer". A Prisma transaction safely decrements the origin depot and creates an in-transit order.
- **Complexity:** Medium. Requires multi-depot data models and atomic database transactions to ensure consistency during inventory transfers [Established industry practice]. Estimated build time: 7 to 8 hours [Assumption].
- **Testability:** High. Integration tests can deterministically verify transactional consistency: source inventory decreases, destination inventory reflects pending transit, and total system quantity is conserved [Established industry practice].
- **Demo Value:** High. Visually intuitive; moving inventory between physical locations directly mirrors real enterprise logistics software [Assumption].
- **Risk:** Medium. Concurrency bugs or unhandled edge cases (e.g., transferring more than on-hand surplus) require strict validation guards [Established industry practice].

##### MVP Option 2B: Automated Network-Wide Greedy Rebalancing Engine
- **Description:** A scheduled background job that computes global surpluses and deficits across all depots, runs a greedy optimization algorithm against a transit cost matrix, and automatically generates the complete set of cost-minimized transfer orders across the entire network.
- **Complexity:** Very High. Designing, implementing, and debugging network balancing heuristics in pure TypeScript within an Express backend will consume excessive engineering time [Assumption]. Estimated 12 to 15 hours [Assumption].
- **Testability:** Low to Medium. Verifying algorithmic edge cases (e.g., cyclic transfer loops, tie-breakers, partial shipments) requires complex scenario generation [Established industry practice].
- **Demo Value:** Very High. Closely aligns with the "intelligent dynamic re-routing" marketing claim [Assumption].
- **Risk:** Very High. High probability of failing to deliver a working end-to-end prototype within 8-10 hours due to algorithmic complexity [Assumption].

---

#### Problem 3: Vendor SLA Enforcement

##### MVP Option 3A: Historical Vendor OTIF Scorecard & Compliance Monitor
- **Description:** A vendor analytics dashboard that aggregates synthetic purchase orders and receiving logs to display key supplier performance metrics: On-Time In-Full (OTIF) percentage, average delivery delay (in days), and defect rates. Displays color-coded compliance status badges (e.g., Green: >95%, Yellow: 90-94%, Red: <90%) and breach logs based on contractual SLA thresholds.
- **Complexity:** Low to Medium. Consists primarily of analytical SQL/Prisma aggregation queries and clean data visualization tables in React [Established industry practice]. Estimated build time: 5 to 7 hours [Assumption].
- **Testability:** Very High. Calculations are purely mathematical and deterministic; unit tests can directly validate formula accuracy against mock receipt arrays [Established industry practice].
- **Demo Value:** High. Clean tables, metric summary cards, and clear status badges deliver high visual polish and immediate clarity to reviewers [Assumption].
- **Risk:** Low. Read-heavy architecture with minimal transactional state complexity [Assumption].

##### MVP Option 3B: Predictive Order-Delay Alerting & Adaptive Safety Stock Adjuster
- **Description:** In addition to historical scorecards, the system tracks active, in-flight purchase orders. If a vendor's historical variance indicates a high statistical probability of an upcoming delay on an open order, the system raises an early warning flag and automatically recalculates and increases the SKU's safety stock threshold in the inventory database.
- **Complexity:** High. Requires statistical probability calculations, a dual workflow (historical analytics plus active order monitoring), and an automated feedback loop that modifies core inventory parameters [Assumption]. Estimated build time: 9 to 11 hours [Assumption].
- **Testability:** Medium. Testing the trigger thresholds of a predictive feedback loop requires complex, multi-stage time-series test fixtures [Established industry practice].
- **Demo Value:** Very High. Directly addresses the "predicts stockouts" claim in the Nexus source text [Assumption].
- **Risk:** High. Tying predictive flags to automated database parameter adjustments introduces significant potential for logic bugs and edge-case errors under tight deadlines [Assumption].

---

### 4. Open Questions Before Scope Selection

As an engineer, you should not pick a direction until you have resolved these fundamental scope ambiguities [Established industry practice]. I explicitly make no recommendation at this stage [Established industry practice]. 

Before choosing a path, answer the following questions:

1. **Evaluation Criteria & Stakeholder Intent**
   - What will the evaluators or CEO value most in this prototype: a complete, polished user workflow (interactive UI and reliable state changes), mathematical/algorithmic depth, or relational database schema rigor? [Assumption].
   - Is the prototype intended as an interactive operational tool (e.g., dispatching orders and moving inventory) or an analytical executive overview (e.g., vendor performance dashboards and alerts)? [Assumption].

2. **Technical Depth vs. Surface Area**
   - Within the rigid 8-10 hour limit, do you want to build one vertical slice completely end-to-end (Postgres schema, Prisma migrations, Express REST API with Zod validation, and React/Tailwind UI with full error handling), or a broader prototype with shallow implementations across multiple capabilities? [Assumption].

3. **Domain & Data Storytelling**
   - What physical commodity will your synthetic dataset represent (e.g., electronic components, medical supplies, automotive spare parts, consumer packaged goods)? Defining this determines realistic lead times, order sizes, and cost figures [Assumption].
   - What specific failure scenario do you want to demonstrate during the live walkthrough (e.g., a critical stockout triggered by customer demand, a chronic vendor delivery failure, or an inter-depot inventory starvation)? [Assumption].

---
- **My evaluation:** [To be completed by intern: Review the primer, evaluate which problem statement aligns best with personal technical strengths in React/Node/Postgres, and note any areas where the mentor's time estimates seem overly conservative or aggressive.]
- **Decision / next action:** [To be completed by intern: Answer the open questions above, clarify stakeholder demo goals, and select one specific MVP option to proceed to data modeling and architecture.]
- **Verification:** [To be completed by intern: Verify standard inventory formulas (ROP, Safety Stock, OTIF) against standard industrial operations reference texts; verify that Prisma and PostgreSQL can run locally without external cloud dependencies.]
