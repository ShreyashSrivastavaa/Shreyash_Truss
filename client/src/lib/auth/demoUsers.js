/**
 * Demo Users Configuration for Nexus Supply Chain OS
 * Password for all demo accounts: Nexus@2026
 */

export const DEMO_PASSWORD = 'Nexus@2026';

export const DEMO_USERS = [
  {
    id: 'user-ceo',
    name: 'Rajesh Mehta',
    title: 'Chief Executive Officer',
    role: 'EXECUTIVE',
    email: 'ceo@nexus-demo.com',
    avatar: 'RM',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    description: 'Executive overview, inventory valuation (₹30.5 L), risk audit, and AI briefings.',
    defaultMode: 'simple',
    allowedTabs: ['EXECUTIVE', 'INVENTORY', 'VENDORS']
  },
  {
    id: 'user-scm',
    name: 'Priya Nair',
    title: 'Head of Global Supply Chain',
    role: 'SCM_HEAD',
    email: 'scm@nexus-demo.com',
    avatar: 'PN',
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    description: 'Full network control, transfer staging, what-if simulations, and vendor management.',
    defaultMode: 'detailed',
    allowedTabs: ['INVENTORY', 'VENDORS', 'SIMULATOR']
  },
  {
    id: 'user-depot-north',
    name: 'Rohit Chauhan',
    title: 'Depot Manager — Gurugram',
    role: 'DEPOT_MANAGER',
    depotId: 'depot-north',
    depotName: 'North Logistics Hub (Gurugram, NCR)',
    email: 'north@nexus-demo.com',
    avatar: 'RC',
    badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
    description: 'Authorizes outgoing surplus transfers and receives inbound shipments at Gurugram.',
    defaultMode: 'simple',
    allowedTabs: ['INVENTORY']
  },
  {
    id: 'user-depot-south',
    name: 'Meera Krishnan',
    title: 'Depot Manager — Chennai',
    role: 'DEPOT_MANAGER',
    depotId: 'depot-south',
    depotName: 'South Distribution Center (Chennai)',
    email: 'south@nexus-demo.com',
    avatar: 'MK',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    description: 'Resolves Relay deficit, authorizes Sensor transfers, and dock intakes at Chennai.',
    defaultMode: 'simple',
    allowedTabs: ['INVENTORY']
  },
  {
    id: 'user-depot-east',
    name: 'Amit Banerjee',
    title: 'Depot Manager — Kolkata',
    role: 'DEPOT_MANAGER',
    depotId: 'depot-east',
    depotName: 'East Gateway Depot (Kolkata Port)',
    email: 'east@nexus-demo.com',
    avatar: 'AB',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    description: 'Monitors balanced buffer stock and port dock receipts at Netaji Subhash Dock.',
    defaultMode: 'simple',
    allowedTabs: ['INVENTORY']
  },
  {
    id: 'user-procurement',
    name: 'Sunita Rao',
    title: 'Procurement & Vendor Manager',
    role: 'PROCUREMENT_MANAGER',
    email: 'procurement@nexus-demo.com',
    avatar: 'SR',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    description: 'Enforces vendor SLAs, generates automated POs with 18% GST, and audits penalties.',
    defaultMode: 'detailed',
    allowedTabs: ['VENDORS', 'PO_QUEUE', 'INVENTORY']
  },
  {
    id: 'user-fleet',
    name: 'Karan Singh',
    title: 'Logistics & Fleet Operations Head',
    role: 'FLEET_MANAGER',
    email: 'fleet@nexus-demo.com',
    avatar: 'KS',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    description: 'Assigns transport vehicles, generates E-Way bills & LRs, and tracks highway freight.',
    defaultMode: 'detailed',
    allowedTabs: ['FLEET', 'INVENTORY']
  },
  {
    id: 'user-vendor-apex',
    name: 'Vikram Shah',
    title: 'Vendor Partner — Apex Thermal',
    role: 'VENDOR_PORTAL',
    vendorId: 'VND-APEX-01',
    vendorName: 'Apex Thermal Technologies (Pune)',
    email: 'apex@nexus-demo.com',
    avatar: 'VS',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    description: 'Vendor portal: views 100% compliant OTIF scorecard, PO intake, and dispatches.',
    defaultMode: 'simple',
    allowedTabs: ['VENDOR_PORTAL']
  },
  {
    id: 'user-vendor-nordic',
    name: 'Arjun Malhotra',
    title: 'Vendor Partner — Nordic Systems',
    role: 'VENDOR_PORTAL',
    vendorId: 'VND-NORDIC-02',
    vendorName: 'Nordic Cold-Chain Systems (Mumbai)',
    email: 'nordic@nexus-demo.com',
    avatar: 'AM',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    description: 'Vendor portal: views SLA breach notice, late delivery dispute, and PO tracking.',
    defaultMode: 'simple',
    allowedTabs: ['VENDOR_PORTAL']
  },
  {
    id: 'user-admin',
    name: 'Truss Admin',
    title: 'System Administrator',
    role: 'ADMIN',
    email: 'admin@nexus-demo.com',
    avatar: 'TA',
    badgeColor: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
    description: 'System matrix, audit log inspection, security privileges, and demo reset.',
    defaultMode: 'detailed',
    allowedTabs: ['ADMIN', 'INVENTORY', 'VENDORS']
  }
];

export function findUserByEmail(email) {
  if (!email) return null;
  const clean = email.trim().toLowerCase();
  return DEMO_USERS.find(u => u.email.toLowerCase() === clean) || null;
}

export function findUserById(id) {
  return DEMO_USERS.find(u => u.id === id) || null;
}

