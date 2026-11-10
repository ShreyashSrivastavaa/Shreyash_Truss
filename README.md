# Nexus — Product 18 • Supply Chain OS (India Localization & Multi-Role Edition)
> Developed for **Truss Studios • Capabilities & Systems Matrix 2026**  
> *"Predict. Rebalance. Procure."*

---

## 🚀 Overview

**Nexus** is an enterprise-grade multi-depot inventory balancing and vendor SLA monitoring operating system localized for **India**. It features dynamic lateral rebalancing across Indian transport corridors, 18% GST procurement compliance, live E-Way Bill & Lorry Receipt (LR) tracking, role-scoped security views, and a cross-role multi-agent workflow state machine.

---

## 🔑 Demo Access & Credentials Table

All demo accounts share the common password: **`Nexus@2026`**  
The login page features a **One-Click Demo Access panel** allowing instant authentication, as well as a top-bar **"Switch demo role"** dropdown to switch between personas on the fly without re-logging in.

| # | Persona & Name | Role | Email | Assigned Facility / Vendor | Scope & Key Capabilities |
|---|----------------|------|-------|----------------------------|--------------------------|
| 1 | **Rajesh Mehta** | `EXECUTIVE` (CEO) | `ceo@nexus-demo.com` | All-India Network | Read-only executive summary, network inventory valuation (₹30.5 L), ₹17.18 L rebalancing savings, SLA risk radar, AI briefing. |
| 2 | **Priya Nair** | `SCM_HEAD` | `scm@nexus-demo.com` | All-India Network | Full network command, lateral transfer staging, cost-benefit ROI analysis, What-If demand surge simulator (+20% South). |
| 3 | **Rohit Chauhan** | `DEPOT_MANAGER` | `north@nexus-demo.com` | North Logistics Hub (Gurugram, NCR) | Gurugram facility scope, outbound transfer approvals for 150-unit relay surplus, dock intake. |
| 4 | **Meera Krishnan** | `DEPOT_MANAGER` | `south@nexus-demo.com` | South Distribution Center (Chennai) | Chennai facility scope, 60-unit relay deficit resolution, sensor pack outbound staging sign-off, dock intake. |
| 5 | **Amit Banerjee** | `DEPOT_MANAGER` | `east@nexus-demo.com` | East Gateway Depot (Kolkata Port) | Kolkata port hub scope, buffer stock monitoring, port consignment receipts. |
| 6 | **Sunita Rao** | `PROCUREMENT_MANAGER` | `procurement@nexus-demo.com` | Vendor Portfolio | Vendor SLA enforcement, contract breach notice issuance, automated PO queue with 18% GST calculation, penalty audits. |
| 7 | **Karan Singh** | `FLEET_MANAGER` | `fleet@nexus-demo.com` | Logistics & Transporters | Inter-depot freight management, Indian vehicle assignment (e.g. `HR-55-XY-3021`), E-Way bill generation, Golden Quadrilateral highway dispatch. |
| 8 | **Vikram Shah** | `VENDOR_PORTAL` | `apex@nexus-demo.com` | Apex Thermal Technologies (Pune) | External partner portal: 100% compliant OTIF scorecard, PO tracking in INR, dispatch confirmation. |
| 9 | **Arjun Malhotra** | `VENDOR_PORTAL` | `nordic@nexus-demo.com` | Nordic Cold-Chain Systems (Mumbai) | External partner portal: SLA breach review, Nhava Sheva port customs delay dispute submission. |
| 10 | **Truss Admin** | `ADMIN` | `admin@nexus-demo.com` | System Admin | System administration, live audit ledger (IST timestamps), role permission matrix, one-click demo hard reset. |

---

## 🇮🇳 India Localization Matrix

| Domain | Standard Applied | Example in Nexus UI |
|---|---|---|
| **Currency** | Indian Rupee (₹) via `Intl.NumberFormat("en-IN")` | `₹1,47,000`, `₹30,51,000` |
| **Compact Financials** | Lakhs (`L`) and Crores (`Cr`) — no $, K, M, or B | `₹30.5 L` total inventory, `₹1.2 Cr` |
| **Pricing Seed** | Industrial Relay: ₹2,450/unit; Sensor Pack: ₹8,900/box | Total stock valuation = **₹30,51,000** (₹30.5 L) |
| **Date & Time** | `DD MMM YYYY` with 24h/12h `IST` (`Asia/Kolkata`) | `10 Nov 2026, 14:30 IST` |
| **Depots** | Gurugram (North), Chennai (South), Kolkata (East) | Complete with state GSTINs & local addresses |
| **Taxation** | Base Amount + 18% GST (CGST + SGST) + Total | Displayed on purchase orders & delivery manifests |
| **Logistics Terms** | E-Way Bill Number, Lorry Receipt (LR) Number | `EWB-061048291044`, `LR-DEL-CHN-8821` |
| **Vehicle Formats** | State registration plates (`DL`, `HR`, `TN`, `WB`, `MH`, `GJ`) | `HR-55-XY-3021`, `TN-09-EF-9988` |
| **Carriers** | Fictional Indian express logistics transporters | `VRL Bharat Freightways`, `GatiShakti Express Logistics` |

---

## 🔄 The 5-Step Cross-Role Workflow Demo

Experience the full autonomous supply chain handshake in action:

1. **Stage 1 (Supply Chain Head — Priya Nair):**
   - Navigate to **Inventory Balancing**.
   - Review Chennai's -60 unit deficit for Industrial Relays and Gurugram's +70 unit surplus.
   - Click **"Stage Transfer"** for 60 units (Transfer Value: ₹1,47,000, Freight: ₹18,500, Disruption Avoided: ₹2,94,000).
   - Order enters `APPROVAL_PENDING` with units locked under atomic dock reservation.
2. **Stage 2 (Gurugram Depot Manager — Rohit Chauhan):**
   - Switch role to **Rohit Chauhan** via top-bar dropdown.
   - Notice the amber **"Action Required: Outgoing Transfer Approval"** banner.
   - Click **"Approve Outgoing Transfer"** to authorize physical stock release. Order moves to `PENDING`.
3. **Stage 3 (Logistics / Fleet Manager — Karan Singh):**
   - Switch role to **Karan Singh**.
   - Notice shipment in the **"Ready for Highway"** queue.
   - Click **"Assign Vehicle & Dispatch"**. Review pre-filled vehicle `HR-55-XY-3021`, transporter `VRL Bharat Freightways`, and E-Way Bill.
   - Click **"Confirm Dispatch"**. Consignment transitions to `IN_TRANSIT` along NH 44 (ETA: 3-4 days).
4. **Stage 4 (Chennai Depot Manager — Meera Krishnan):**
   - Switch role to **Meera Krishnan**.
   - Inbound freight radar shows approaching cargo.
   - Click **"Confirm Receipt & Dock Intake"**.
   - **Result:** Chennai On-Hand increases from 20 to 80 units. Status flips from **Red Deficit** to **Healthy Green Balanced**!
5. **Stage 5 (Executive CEO — Rajesh Mehta):**
   - Switch role to **Rajesh Mehta**.
   - Review executive KPIs: rebalancing savings recorded in INR, network inventory health restored, and audit ledger permanently logged.

---

## 🏗 Architecture & File Structure

```text
client/src/
├── lib/
│   ├── auth/
│   │   ├── AuthContext.jsx      # Session state, localStorage persistence, login/logout
│   │   └── demoUsers.js        # 10 provisioned demo personas & credentials
│   ├── permissions/
│   │   └── index.js            # Centralized permissions matrix (tabs, actions, scopes)
│   ├── store/
│   │   └── useAppStore.jsx     # Shared global state, multi-step workflow machine, audit log
│   └── format/
│       ├── formatINR.js        # Indian numbering system (Lakhs, Crores, ₹)
│       └── formatDate.js       # Indian Standard Time (IST), DD MMM YYYY
├── data/
│   └── seedData.js             # Indian depots, SKUs, vendors, freight constants, carriers
├── components/
│   ├── roles/
│   │   ├── ExecutiveDashboard.jsx    # Executive CEO overview, capital valuation, risks
│   │   ├── DepotManagerView.jsx      # Scoped depot health, approvals & dock intake
│   │   ├── ProcurementDashboard.jsx  # Vendor SLA notices, automated PO queue (18% GST)
│   │   ├── FleetManagerDashboard.jsx # Highway freight flow, vehicle assignment
│   │   ├── VendorPortalView.jsx      # Isolated external partner scorecard & disputes
│   │   └── AdminDashboard.jsx        # Audit log ledger, permissions matrix, hard reset
│   ├── Header.jsx              # Mode toggle, role switcher, notification bell, sync
│   ├── SummaryCards.jsx        # 5 KPI cards including "Inventory Value" in INR
│   ├── InventoryGrid.jsx       # 3 Indian depots x 2 SKUs stock matrix
│   ├── OpportunityList.jsx     # Transfer hero with INR metrics & ROI analysis
│   ├── TransferLog.jsx         # Active & History shipments with E-way & LR numbers
│   ├── IndiaRouteMap.jsx       # SVG radar map of Indian expressway corridors
│   ├── WhatIfSimulator.jsx     # SCM Head demand surge simulator (+20% South)
│   ├── Preloader.jsx           # 2.5s branded splash with rotating status messages
│   └── LoginPage.jsx           # Split brand layout with one-click persona cards
├── App.jsx                     # Top-level shell & security route guard
```

---

## 🛠 Local Development & Build

```bash
# 1. Install root dependencies
npm install

# 2. Start frontend in development mode
npm --prefix client run dev

# 3. Build for production (Vercel ready)
npm --prefix client run build
```

The application is completely standalone and deployable to **Vercel** with zero external backend dependencies; client state is fully persisted and synchronized via the reactive store and `localStorage`.

---

© 2026 Truss Studios • Product 18 "Nexus" Supply Chain Operating System.
