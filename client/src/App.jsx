import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import SummaryCards from './components/SummaryCards';
import InventoryGrid from './components/InventoryGrid';
import OpportunityList from './components/OpportunityList';
import TransferLog from './components/TransferLog';
import TransferLaneAnalytics from './components/TransferLaneAnalytics';
import VendorScorecards from './components/VendorScorecards';
import VendorDeliveryMonitor from './components/VendorDeliveryMonitor';
import {
  fetchHealth,
  fetchInventory,
  fetchOpportunities,
  fetchTransferHistory,
  createTransfer,
  dispatchTransfer,
  receiveTransfer,
  cancelTransfer,
  resetInventory,
  fetchVendors,
  fetchVendorDeliveries,
  resetVendors
} from './api/client';
import { AlertCircle, RefreshCw, Compass } from 'lucide-react';

export default function App() {
  const [activeModule, setActiveModule] = useState('INVENTORY'); // 'INVENTORY' | 'VENDORS'
  const [isDetailed, setIsDetailed] = useState(false); // Simple vs Detailed view

  // Inventory & Network state
  const [health, setHealth] = useState(null);
  const [inventoryData, setInventoryData] = useState(null);
  const [opportunities, setOpportunities] = useState([]);
  const [transfers, setTransfers] = useState([]);

  // Vendor SLA state
  const [vendors, setVendors] = useState([]);
  const [vendorDeliveries, setVendorDeliveries] = useState([]);
  const [vendorOverview, setVendorOverview] = useState({});
  const [selectedVendorId, setSelectedVendorId] = useState('');

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Load all data from backend
  const loadDashboardData = useCallback(async (showRefreshingState = false) => {
    if (showRefreshingState) setIsRefreshing(true);
    setErrorMessage(null);

    try {
      const [healthRes, invRes, oppsRes, trfRes, vendorsRes, deliveriesRes] = await Promise.all([
        fetchHealth().catch(err => ({ status: 'error', error: err.message })),
        fetchInventory().catch(err => {
          console.error('Inventory fetch failed:', err);
          return null;
        }),
        fetchOpportunities().catch(err => {
          console.error('Opportunities fetch failed:', err);
          return { count: 0, opportunities: [] };
        }),
        fetchTransferHistory().catch(err => {
          console.error('Transfer history fetch failed:', err);
          return { count: 0, total: 0, transfers: [] };
        }),
        fetchVendors().catch(err => {
          console.error('Vendors fetch failed:', err);
          return { overview: {}, vendors: [] };
        }),
        fetchVendorDeliveries().catch(err => {
          console.error('Deliveries fetch failed:', err);
          return { count: 0, total: 0, deliveries: [] };
        })
      ]);

      setHealth(healthRes);
      if (invRes) setInventoryData(invRes);
      setOpportunities(oppsRes?.opportunities || []);
      setTransfers(trfRes?.transfers || []);

      setVendors(vendorsRes?.vendors || []);
      setVendorOverview(vendorsRes?.overview || {});
      setVendorDeliveries(deliveriesRes?.deliveries || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setErrorMessage(err.message || 'Failed to connect to the backend server. Make sure it is running.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Handle staging a transfer order (PENDING)
  const handleStageTransfer = async (transferPayload) => {
    setIsExecuting(true);
    try {
      await createTransfer(transferPayload);
      await loadDashboardData();
    } finally {
      setIsExecuting(false);
    }
  };

  // Handle dispatching freight (PENDING -> IN_TRANSIT)
  const handleDispatchTransfer = async (transferId) => {
    await dispatchTransfer(transferId);
    await loadDashboardData();
  };

  // Handle receiving freight (IN_TRANSIT -> RECEIVED)
  const handleReceiveTransfer = async (transferId) => {
    await receiveTransfer(transferId);
    await loadDashboardData();
  };

  // Handle cancelling transfer order (PENDING -> CANCELLED)
  const handleCancelTransfer = async (transferId) => {
    await cancelTransfer(transferId);
    await loadDashboardData();
  };

  // Handle demo reset
  const handleReset = async () => {
    setIsResetting(true);
    try {
      if (activeModule === 'VENDORS') {
        await resetVendors();
      } else {
        await resetInventory();
      }
      await loadDashboardData();
    } catch (err) {
      setErrorMessage(`Reset failed: ${err.message}`);
    } finally {
      setIsResetting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mb-3" />
        <h2 className="text-base font-semibold text-slate-200">Initializing Nexus Supply Chain Operating System...</h2>
        <p className="text-xs text-slate-400 mt-1">Connecting to multi-depot inventory balancing & vendor SLA service</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation Bar with Simple/Detailed mode and Demo Guide */}
      <Header
        health={health}
        isRefreshing={isRefreshing}
        onRefresh={() => loadDashboardData(true)}
        onReset={handleReset}
        isResetting={isResetting}
        activeModule={activeModule}
        onSelectModule={setActiveModule}
        isDetailed={isDetailed}
        onToggleDetailed={() => setIsDetailed(!isDetailed)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Error notification banner if API failed */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => loadDashboardData(true)}
              className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-semibold transition"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* DOMAIN MODULE 1: INVENTORY & BALANCING (Strict Required Order)            */}
        {/* 1a. KPI Strip (4 cards)                                                  */}
        {/* 1b. Depot Health (Unified 3x2 grid)                                      */}
        {/* 1c. Recommended Transfers (Visual Hero)                                  */}
        {/* 1d. Shipments (Active & History in one tabbed view)                      */}
        {/* 1e. Advanced Analytics (Collapsed accordion at bottom)                    */}
        {/* ========================================================================= */}
        {activeModule === 'INVENTORY' && (
          <>
            {/* 1a. 4-Card KPI Strip */}
            <SummaryCards
              summary={inventoryData?.summary}
              inventory={inventoryData?.inventory}
              isDetailed={isDetailed}
            />

            {/* 1b. Depot Health Matrix (Unified 3 Depots x 2 SKUs) */}
            {inventoryData && (
              <InventoryGrid
                depots={inventoryData.depots}
                inventory={inventoryData.inventory}
                isDetailed={isDetailed}
              />
            )}

            {/* 1c. Recommended Transfers (Visual Hero Action Section) */}
            <OpportunityList
              opportunities={opportunities}
              onExecuteTransfer={handleStageTransfer}
              isExecuting={isExecuting}
              isDetailed={isDetailed}
            />

            {/* 1d. Shipments Section (Merged Active Pipeline & Audit History) */}
            <TransferLog
              transfers={transfers}
              onDispatch={handleDispatchTransfer}
              onReceive={handleReceiveTransfer}
              onCancel={handleCancelTransfer}
              isDetailed={isDetailed}
            />

            {/* 1e. Advanced Analytics Accordion (Collapsed by default) */}
            <TransferLaneAnalytics
              transfers={transfers}
              depots={inventoryData?.depots}
              skus={inventoryData?.skus}
              isLoading={isLoading}
              isDetailed={isDetailed}
            />
          </>
        )}

        {/* ========================================================================= */}
        {/* DOMAIN MODULE 2: VENDOR SLA ENFORCEMENT                                  */}
        {/* ========================================================================= */}
        {activeModule === 'VENDORS' && (
          <>
            {/* 1. Vendor Scorecards & Performance Overview */}
            <VendorScorecards
              vendors={vendors}
              overview={vendorOverview}
              selectedVendorId={selectedVendorId}
              onSelectVendor={setSelectedVendorId}
              isDetailed={isDetailed}
            />

            {/* 2. Inbound Delivery Monitoring & Audit Table */}
            <VendorDeliveryMonitor
              deliveries={vendorDeliveries}
              vendors={vendors}
              selectedVendorId={selectedVendorId}
              onSelectVendor={setSelectedVendorId}
              isDetailed={isDetailed}
            />
          </>
        )}

        {/* ========================================================================= */}
        {/* ROADMAP STRIP (Honest labeling: Upcoming Truss Product 18 Capabilities)  */}
        {/* ========================================================================= */}
        <section className="pt-4 border-t border-slate-900/80" aria-label="Product Roadmap">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-950/50 border border-slate-900 text-slate-500">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                Roadmap
              </span>
              <span className="text-xs text-slate-400 font-medium">Coming Next in Nexus Product 18:</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-400">
              <span className="px-2.5 py-1 rounded-md bg-slate-900/80 border border-slate-800">
                Predictive Demand Forecasting
              </span>
              <span className="px-2.5 py-1 rounded-md bg-slate-900/80 border border-slate-800">
                Cold-Chain Live Telemetry
              </span>
              <span className="px-2.5 py-1 rounded-md bg-slate-900/80 border border-slate-800">
                Dynamic Fleet Routing
              </span>
              <span className="px-2.5 py-1 rounded-md bg-slate-900/80 border border-slate-800">
                Autonomous Procurement
              </span>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-900 py-5 text-center text-xs text-slate-500 font-medium">
        Nexus • Self-Evolving Enterprise Supply Chain Management & Predictive Logistics • Truss Studios Product 18
      </footer>
    </div>
  );
}
