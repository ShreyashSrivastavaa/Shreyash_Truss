import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import SummaryCards from './components/SummaryCards';
import InventoryGrid from './components/InventoryGrid';
import OpportunityList from './components/OpportunityList';
import TransferLog from './components/TransferLog';
import TransferLaneAnalytics from './components/TransferLaneAnalytics';
import VendorScorecards from './components/VendorScorecards';
import VendorDeliveryMonitor from './components/VendorDeliveryMonitor';
import Preloader from './components/Preloader';
import LoginPage from './components/LoginPage';
import WhatIfSimulator from './components/WhatIfSimulator';

// Role Dashboards
import ExecutiveDashboard from './components/roles/ExecutiveDashboard';
import DepotManagerView from './components/roles/DepotManagerView';
import ProcurementDashboard from './components/roles/ProcurementDashboard';
import FleetManagerDashboard from './components/roles/FleetManagerDashboard';
import VendorPortalView from './components/roles/VendorPortalView';
import AdminDashboard from './components/roles/AdminDashboard';

// Auth, Store and Theme
import { AuthProvider, useAuth } from './lib/auth/AuthContext';
import { AppStoreProvider, useAppStore } from './lib/store/useAppStore';
import { ThemeProvider, useTheme } from './lib/theme/ThemeContext';
import { getPermissionsForUser, isTabAllowed, ROLES } from './lib/permissions';
import { calculateNetworkTotals } from './utils/inventoryAnalytics';

import {
  AlertCircle,
  RefreshCw,
  Lock,
  ArrowRight,
  ShieldAlert,
  Sparkles
} from 'lucide-react';

function NexusAppInner() {
  const { currentUser, isAuthenticated, switchRole } = useAuth();
  const store = useAppStore();

  const [hasLoadedPreloader, setHasLoadedPreloader] = useState(() => {
    return sessionStorage.getItem('nexus_preloaded') === 'true';
  });

  const permissions = getPermissionsForUser(currentUser);

  // Active module tab
  const [activeModule, setActiveModule] = useState(() => {
    return permissions.defaultTab || 'INVENTORY';
  });

  // Simple vs Detailed mode
  const [isDetailed, setIsDetailed] = useState(() => {
    return permissions.defaultMode === 'detailed';
  });

  // UI state
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [selectedVendorId, setSelectedVendorId] = useState('');

  // Synchronize active tab and detail mode when current user/role changes
  useEffect(() => {
    if (currentUser) {
      const perms = getPermissionsForUser(currentUser);
      setActiveModule(perms.defaultTab);
      setIsDetailed(perms.defaultMode === 'detailed');
      setSelectedVendorId(currentUser.vendorId || '');
    }
  }, [currentUser?.id, currentUser?.role]);

  // Handle preloader complete
  const handlePreloaderComplete = () => {
    sessionStorage.setItem('nexus_preloaded', 'true');
    setHasLoadedPreloader(true);
  };

  // Live Refresh handler
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(r => setTimeout(r, 550));
    setIsRefreshing(false);
  };

  // Demo Reset handler
  const handleReset = async () => {
    setIsResetting(true);
    store.resetDemo();
    await new Promise(r => setTimeout(r, 400));
    setIsResetting(false);
  };

  // Preloader view
  if (!hasLoadedPreloader) {
    return <Preloader onComplete={handlePreloaderComplete} />;
  }

  // Not logged in -> Show Login Page
  if (!isAuthenticated || !currentUser) {
    return (
      <LoginPage
        onLoginSuccess={() => {
          // session started
        }}
      />
    );
  }

  // Calculate live network totals
  const networkTotals = calculateNetworkTotals({}, store.inventory);

  // Tab clearance check
  const isClearanceGranted = isTabAllowed(currentUser, activeModule);

  // Depot manager scope
  const isDepotManager = currentUser.role === ROLES.DEPOT_MANAGER;
  const userDepot = isDepotManager
    ? store.depots.find(d => d.id === currentUser.depotId)
    : null;

  // Filtered depots and inventory for display
  const displayDepots = isDepotManager && userDepot
    ? [userDepot]
    : store.depots;

  const displayInventory = isDepotManager && currentUser.depotId
    ? store.inventory.filter(i => i.depotId === currentUser.depotId)
    : store.inventory;

  // Filtered transfers for display
  const displayTransfers = isDepotManager && currentUser.depotId
    ? store.transfers.filter(
        t => t.fromDepotId === currentUser.depotId || t.toDepotId === currentUser.depotId
      )
    : store.transfers;

  return (
    <div className="min-h-screen bg-[#FFFBFC] text-[#4B4350] flex flex-col selection:bg-[#FFE4EA] selection:text-[#E11D48]">
      {/* Top Navigation Bar */}
      <Header
        health={{ status: 'ok', region: 'India (IST)' }}
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
        onReset={handleReset}
        isResetting={isResetting}
        activeModule={activeModule}
        onSelectModule={setActiveModule}
        isDetailed={isDetailed}
        onToggleDetailed={() => setIsDetailed(!isDetailed)}
        notifications={store.notifications}
        onMarkAllRead={store.markNotificationsAsRead}
      />

      <main className="flex-1 max-w-[1200px] w-full mx-auto px-4 sm:px-8 py-8 space-y-10">
        {/* Error notification banner if any */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-[#FDECEA] border border-[#F3E3E8] text-[#B42318] text-sm flex items-center justify-between shadow-card">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#B42318]" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#FDECEA] text-[#B42318] border border-[#F3E3E8] font-medium transition text-xs"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* ACCESS RESTRICTED SCREEN (Role Security Guard) */}
        {!isClearanceGranted ? (
          <div className="p-10 rounded-2xl bg-white border border-[#F3E3E8] shadow-card text-center max-w-xl mx-auto space-y-4 my-12">
            <div className="w-12 h-12 rounded-full bg-[#FDECEA] text-[#B42318] flex items-center justify-center mx-auto border border-[#F3E3E8]">
              <Lock className="w-5 h-5" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-semibold text-[#1F1720]">Access Restricted</h3>
              <p className="text-sm text-[#4B4350]">
                Your current persona <strong className="text-[#1F1720] font-semibold">{currentUser.name}</strong> ({currentUser.role}) does not have clearance to access the <strong>{activeModule}</strong> domain.
              </p>
            </div>
            <p className="text-xs text-[#8A8190]">
              Switch to an authorized role using the avatar menu in the top right corner.
            </p>
            <button
              type="button"
              onClick={() => setActiveModule(permissions.defaultTab)}
              className="px-4 py-2 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-medium transition shadow-sm"
            >
              Return to Your Role Workspace
            </button>
          </div>
        ) : (
          <>
            {/* ================================================================= */}
            {/* DOMAIN MODULE: EXECUTIVE SUMMARY (Rajesh Mehta / CEO)             */}
            {/* ================================================================= */}
            {activeModule === 'EXECUTIVE' && (
              <ExecutiveDashboard
                inventoryTotals={networkTotals}
                vendorOverview={store.vendorOverview}
                transfers={store.transfers}
                onNavigateToTab={setActiveModule}
              />
            )}

            {/* ================================================================= */}
            {/* DOMAIN MODULE 1: INVENTORY & BALANCING                            */}
            {/* ================================================================= */}
            {activeModule === 'INVENTORY' && (
              <>
                {/* Depot Manager Facility View (When logged in as Depot Manager) */}
                {isDepotManager && userDepot && (
                  <DepotManagerView
                    user={currentUser}
                    depot={userDepot}
                    inventory={store.inventory}
                    transfers={store.transfers}
                    onApproveTransfer={(id) => store.approveTransfer(id, currentUser)}
                    onReceiveTransfer={(id) => store.receiveTransfer(id, currentUser)}
                    onCancelTransfer={(id) => store.cancelTransfer(id, currentUser)}
                    isDetailed={isDetailed}
                  />
                )}

                {/* SCM Head What-If Simulator Sandbox */}
                {currentUser.role === ROLES.SCM_HEAD && (
                  <WhatIfSimulator
                    whatIfFactor={store.whatIfFactor}
                    onSetWhatIfFactor={store.setWhatIfFactor}
                  />
                )}

                {/* 1a. 5-Card KPI Strip (Includes Inventory Value in INR) */}
                <SummaryCards
                  summary={null}
                  inventory={store.inventory}
                  isDetailed={isDetailed}
                />

                {/* 1b. Depot Health Matrix (Unified 3 Depots x 2 SKUs) */}
                <InventoryGrid
                  depots={displayDepots}
                  inventory={displayInventory}
                  isDetailed={isDetailed}
                />

                {/* 1c. Recommended Transfers (Visual Hero Action Section) */}
                {/* Executive has read-only access (no staging button); SCM Head can stage */}
                <OpportunityList
                  opportunities={store.opportunities}
                  onExecuteTransfer={(payload) =>
                    store.stageTransfer({ ...payload, user: currentUser })
                  }
                  isExecuting={isExecuting}
                  isDetailed={isDetailed}
                  canStageTransfer={permissions.canStageTransfer}
                />

                {/* 1d. Shipments Section (Merged Active Pipeline & Audit History) */}
                <TransferLog
                  transfers={displayTransfers}
                  onApprove={(id) => store.approveTransfer(id, currentUser)}
                  onDispatch={(id) => store.dispatchTransfer(id, {}, currentUser)}
                  onReceive={(id) => store.receiveTransfer(id, currentUser)}
                  onCancel={(id) => store.cancelTransfer(id, currentUser)}
                  canApprove={permissions.canApproveTransfer}
                  canDispatch={permissions.canDispatchTransfer}
                  canReceive={permissions.canReceiveTransfer}
                  userDepotId={currentUser.depotId}
                  isDetailed={isDetailed}
                />

                {/* 1e. Advanced Analytics Accordion (Collapsed by default) */}
                <TransferLaneAnalytics
                  transfers={displayTransfers}
                  depots={store.depots}
                  skus={store.skus}
                  isLoading={false}
                  isDetailed={isDetailed}
                />
              </>
            )}

            {/* ================================================================= */}
            {/* DOMAIN MODULE 2: VENDOR SLA ENFORCEMENT                           */}
            {/* ================================================================= */}
            {activeModule === 'VENDORS' && (
              <>
                {/* Procurement Specific Action Center */}
                {currentUser.role === ROLES.PROCUREMENT_MANAGER && (
                  <ProcurementDashboard
                    vendors={store.vendors}
                    vendorDeliveries={store.vendorDeliveries}
                    poQueue={store.poQueue}
                    onRaiseBreachNotice={(vendorId, reason) =>
                      store.raiseSlaNotice(vendorId, reason, currentUser)
                    }
                    isDetailed={isDetailed}
                  />
                )}

                {/* 1. Vendor Scorecards & Performance Overview */}
                <VendorScorecards
                  vendors={store.vendors}
                  overview={store.vendorOverview}
                  selectedVendorId={selectedVendorId}
                  onSelectVendor={setSelectedVendorId}
                  onRaiseBreachNotice={(vendor) =>
                    store.raiseSlaNotice(vendor.id, 'SLA Breach Notice', currentUser)
                  }
                  isDetailed={isDetailed}
                />

                {/* 2. Inbound Delivery Monitoring & Audit Table */}
                <VendorDeliveryMonitor
                  deliveries={store.vendorDeliveries}
                  vendors={store.vendors}
                  selectedVendorId={selectedVendorId}
                  onSelectVendor={setSelectedVendorId}
                  isDetailed={isDetailed}
                />
              </>
            )}

            {/* ================================================================= */}
            {/* DOMAIN MODULE: FLEET & SHIPMENTS (Karan Singh)                    */}
            {/* ================================================================= */}
            {activeModule === 'FLEET' && (
              <FleetManagerDashboard
                user={currentUser}
                transfers={store.transfers}
                onDispatchTransfer={(id, meta) =>
                  store.dispatchTransfer(id, meta, currentUser)
                }
                onCancelTransfer={(id) =>
                  store.cancelTransfer(id, currentUser)
                }
                isDetailed={isDetailed}
              />
            )}

            {/* ================================================================= */}
            {/* DOMAIN MODULE: PO QUEUE (Procurement Manager)                     */}
            {/* ================================================================= */}
            {activeModule === 'PO_QUEUE' && (
              <ProcurementDashboard
                vendors={store.vendors}
                vendorDeliveries={store.vendorDeliveries}
                poQueue={store.poQueue}
                onRaiseBreachNotice={(vendorId, reason) =>
                  store.raiseSlaNotice(vendorId, reason, currentUser)
                }
                isDetailed={isDetailed}
              />
            )}

            {/* ================================================================= */}
            {/* DOMAIN MODULE: VENDOR PORTAL (Apex Thermal / Nordic Systems)      */}
            {/* ================================================================= */}
            {activeModule === 'VENDOR_PORTAL' && (
              <VendorPortalView
                user={currentUser}
                vendor={store.vendors.find(v => v.id === currentUser.vendorId)}
                deliveries={store.vendorDeliveries}
                onConfirmDispatch={(id, note) =>
                  store.vendorConfirmDispatch(id, note, currentUser)
                }
                onDisputeFlag={(id, note) =>
                  store.vendorDisputeFlag(id, note, currentUser)
                }
              />
            )}

            {/* ================================================================= */}
            {/* DOMAIN MODULE: ADMIN CONSOLE (Truss Admin)                        */}
            {/* ================================================================= */}
            {activeModule === 'ADMIN' && (
              <AdminDashboard
                auditLog={store.auditLog}
                onResetDemo={handleReset}
              />
            )}
          </>
        )}

        {/* ROADMAP STRIP */}
        <section className="pt-6 border-t border-[#F3E3E8]" aria-label="Product Roadmap">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 rounded-2xl bg-white border border-[#F3E3E8] shadow-card text-[#8A8190]">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#FFE4EA] text-[#E11D48]">
                Roadmap
              </span>
              <span className="text-xs text-[#4B4350] font-medium">Coming Next in Nexus:</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap text-xs text-[#4B4350]">
              <span className="px-2.5 py-1 rounded-lg bg-[#FFF5F7] border border-[#F3E3E8]">
                Predictive Demand Forecasting
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-[#FFF5F7] border border-[#F3E3E8]">
                Cold-Chain Live Telemetry (NH 44)
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-[#FFF5F7] border border-[#F3E3E8]">
                Dynamic Fleet Routing
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-[#FFF5F7] border border-[#F3E3E8]">
                Autonomous GST-Invoice Procurement
              </span>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#F3E3E8] py-5 text-center text-xs text-[#8A8190] bg-white">
        Nexus · Supply Chain OS · India · <span className="text-[#8A8190]">Demo data</span>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppStoreProvider>
          <NexusAppInner />
        </AppStoreProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
