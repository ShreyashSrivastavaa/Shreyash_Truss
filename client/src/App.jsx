import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import InventoryAnalytics from './components/InventoryAnalytics';
import TransferLaneAnalytics from './components/TransferLaneAnalytics';
import OpportunityList from './components/OpportunityList';
import InventoryGrid from './components/InventoryGrid';
import TransferLog from './components/TransferLog';
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
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function App() {
  const [activeModule, setActiveModule] = useState('INVENTORY'); // 'INVENTORY' | 'VENDORS'

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
      setErrorMessage(err.message || 'Failed to connect to the backend server. Make sure it is running on port 5000.');
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
        <p className="text-xs text-slate-400 mt-1">Connecting to multi-depot inventory balancing & vendor SLA service on port 5000</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      <Header
        health={health}
        isRefreshing={isRefreshing}
        onRefresh={() => loadDashboardData(true)}
        onReset={handleReset}
        isResetting={isResetting}
        activeModule={activeModule}
        onSelectModule={setActiveModule}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
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

        {/* DOMAIN MODULE 1: INVENTORY & BALANCING */}
        {activeModule === 'INVENTORY' && (
          <>
            {/* 1. Network Inventory Analytics & KPI Overview */}
            <InventoryAnalytics
              summary={inventoryData?.summary}
              depots={inventoryData?.depots}
              inventory={inventoryData?.inventory}
              skus={inventoryData?.skus}
              isLoading={isLoading}
            />

            {/* 2. Detected Transfer Opportunities (Action Section) */}
            <OpportunityList
              opportunities={opportunities}
              onExecuteTransfer={handleStageTransfer}
              isExecuting={isExecuting}
            />

            {/* 3. Depot Inventory Grid */}
            {inventoryData && (
              <InventoryGrid
                depots={inventoryData.depots}
                inventory={inventoryData.inventory}
              />
            )}

            {/* 4. Transfer Lane Analytics & Freight Flow */}
            <TransferLaneAnalytics
              transfers={transfers}
              depots={inventoryData?.depots}
              skus={inventoryData?.skus}
              isLoading={isLoading}
            />

            {/* 5. Active Shipments Pipeline & Audit Log */}
            <TransferLog
              transfers={transfers}
              onDispatch={handleDispatchTransfer}
              onReceive={handleReceiveTransfer}
              onCancel={handleCancelTransfer}
            />
          </>
        )}

        {/* DOMAIN MODULE 2: VENDOR SLA ENFORCEMENT */}
        {activeModule === 'VENDORS' && (
          <>
            {/* 1. Vendor Scorecards & Performance Overview */}
            <VendorScorecards
              vendors={vendors}
              overview={vendorOverview}
              selectedVendorId={selectedVendorId}
              onSelectVendor={setSelectedVendorId}
            />

            {/* 2. Inbound Delivery Monitoring & Audit Table */}
            <VendorDeliveryMonitor
              deliveries={vendorDeliveries}
              vendors={vendors}
              selectedVendorId={selectedVendorId}
              onSelectVendor={setSelectedVendorId}
            />
          </>
        )}
      </main>

      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500 font-medium">
        Nexus Supply Chain OS • Multi-Depot Balancing & Vendor SLA Enforcement • Truss Matrix
      </footer>
    </div>
  );
}
