import React, { useState, useMemo } from 'react';
import {
  ArrowRight,
  ArrowLeftRight,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  Filter,
  RotateCcw,
  Calendar,
  Layers,
  Info,
  MapPin
} from 'lucide-react';
import {
  filterTransfers,
  calculateTransferOverview,
  calculateLaneMetrics,
  calculateDepotThroughput
} from '../utils/transferLaneAnalytics.js';

export default function TransferLaneAnalytics({ transfers = [], depots = [], skus = [], isLoading }) {
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'LANES' | 'THROUGHPUT'
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [skuFilter, setSkuFilter] = useState('ALL');
  const [laneFilter, setLaneFilter] = useState('ALL');
  const [datePreset, setDatePreset] = useState('ALL'); // 'ALL' | 'TODAY' | 'LAST_7_DAYS'
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Compute date range from preset
  const dateRange = useMemo(() => {
    if (datePreset === 'TODAY') {
      const today = new Date().toISOString().split('T')[0];
      return { startDate: today, endDate: today };
    }
    if (datePreset === 'LAST_7_DAYS') {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 7);
      return {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0]
      };
    }
    if (datePreset === 'CUSTOM') {
      return {
        startDate: customStartDate || null,
        endDate: customEndDate || null
      };
    }
    return { startDate: null, endDate: null };
  }, [datePreset, customStartDate, customEndDate]);

  // Apply deterministic filters
  const filteredTransfers = useMemo(() => {
    return filterTransfers(transfers, {
      status: statusFilter,
      skuId: skuFilter,
      laneId: laneFilter,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate
    });
  }, [transfers, statusFilter, skuFilter, laneFilter, dateRange]);

  // Aggregated analytics based on filtered data
  const overview = useMemo(() => calculateTransferOverview(filteredTransfers), [filteredTransfers]);
  const laneMetrics = useMemo(() => calculateLaneMetrics(filteredTransfers, depots, skus), [filteredTransfers, depots, skus]);
  const depotThroughput = useMemo(() => calculateDepotThroughput(filteredTransfers, depots), [filteredTransfers, depots]);

  // Available unique lanes in unfiltered transfers for filter dropdown
  const availableLanes = useMemo(() => {
    const set = new Set();
    const depotMap = new Map(depots.map(d => [d.id, d.name]));
    for (const t of transfers) {
      if (t.fromDepotId && t.toDepotId) {
        set.add(`${t.fromDepotId}->${t.toDepotId}`);
      }
    }
    return Array.from(set).map(laneKey => {
      const [from, to] = laneKey.split('->');
      return {
        laneKey,
        label: `${depotMap.get(from) || from} → ${depotMap.get(to) || to}`
      };
    });
  }, [transfers, depots]);

  const hasActiveFilters = statusFilter !== 'ALL' || skuFilter !== 'ALL' || laneFilter !== 'ALL' || datePreset !== 'ALL';

  const resetFilters = () => {
    setStatusFilter('ALL');
    setSkuFilter('ALL');
    setLaneFilter('ALL');
    setDatePreset('ALL');
    setCustomStartDate('');
    setCustomEndDate('');
  };

  if (isLoading) {
    return (
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4 animate-pulse">
        <div className="h-6 w-48 bg-slate-800 rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-slate-800/60 rounded-lg" />
          ))}
        </div>
        <div className="h-48 bg-slate-800/40 rounded-lg" />
      </div>
    );
  }

  return (
    <section className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg backdrop-blur-xs space-y-5" aria-label="Transfer Lane Analytics Section">
      {/* 1. Header & View Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
            <ArrowLeftRight className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-100 flex items-center gap-2">
              Transfer Lane Analytics & Freight Flow
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-normal normal-case">
                {transfers.length} Total Records
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Depot-to-depot routing lane volume, fulfillment metrics, and multi-facility throughput
            </p>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-lg border border-slate-800 text-xs self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
              activeTab === 'ALL'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            All Analytics
          </button>
          <button
            onClick={() => setActiveTab('LANES')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
              activeTab === 'LANES'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            Routing Lanes ({laneMetrics.length})
          </button>
          <button
            onClick={() => setActiveTab('THROUGHPUT')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
              activeTab === 'THROUGHPUT'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            Depot Throughput ({depotThroughput.length})
          </button>
        </div>
      </div>

      {/* 2. Interactive Filter Controls Bar */}
      <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3 space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Filter className="w-3.5 h-3.5 text-indigo-400" />
            <span>Filter Transfer Flow:</span>
          </div>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 transition"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
          {/* Status Filter */}
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Transfer Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded px-2.5 py-1.5 outline-hidden focus:border-indigo-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="RECEIVED">Completed (RECEIVED)</option>
              <option value="IN_TRANSIT">In-Transit Freight</option>
              <option value="PENDING">Pending Order</option>
              <option value="CANCELLED">Cancelled Order</option>
            </select>
          </div>

          {/* SKU Filter */}
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">SKU</label>
            <select
              value={skuFilter}
              onChange={(e) => setSkuFilter(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded px-2.5 py-1.5 outline-hidden focus:border-indigo-500"
            >
              <option value="ALL">All SKUs ({skus.length})</option>
              {skus.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.id})
                </option>
              ))}
            </select>
          </div>

          {/* Lane Filter */}
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Routing Lane</label>
            <select
              value={laneFilter}
              onChange={(e) => setLaneFilter(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded px-2.5 py-1.5 outline-hidden focus:border-indigo-500"
            >
              <option value="ALL">All Routing Lanes</option>
              {availableLanes.map(l => (
                <option key={l.laneKey} value={l.laneKey}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>

          {/* Date Preset */}
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Date Created</label>
            <select
              value={datePreset}
              onChange={(e) => setDatePreset(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded px-2.5 py-1.5 outline-hidden focus:border-indigo-500"
            >
              <option value="ALL">All Time</option>
              <option value="TODAY">Today</option>
              <option value="LAST_7_DAYS">Last 7 Days</option>
              <option value="CUSTOM">Custom Date Range</option>
            </select>
          </div>
        </div>

        {/* Custom Date Pickers (if CUSTOM selected) */}
        {datePreset === 'CUSTOM' && (
          <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-900 text-xs">
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Start Date</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded px-2.5 py-1 outline-hidden focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">End Date</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded px-2.5 py-1 outline-hidden focus:border-indigo-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* 3. Top-Level Lane KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Units Moved */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400" title="Active and completed transfer volume (excludes cancelled orders)">
              Total Volume Moved
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {overview.activeLanesCount} Active Lanes
            </span>
          </div>
          <div className="my-1">
            <span className="text-2xl font-extrabold text-white">
              {overview.totalUnits.toLocaleString()} <span className="text-xs font-normal text-slate-400">units</span>
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between">
            <span>
              {overview.totalTransfers} total order{overview.totalTransfers === 1 ? '' : 's'}
              {overview.cancelledTransfers > 0 && ` (${overview.cancelledTransfers} cancelled)`}
            </span>
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
          </div>
        </div>

        {/* Completed Deliveries */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-emerald-500/30 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Completed Deliveries</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Received
            </span>
          </div>
          <div className="my-1">
            <span className="text-2xl font-extrabold text-emerald-400">
              {overview.completedUnits.toLocaleString()} <span className="text-xs font-normal text-slate-400">units</span>
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between">
            <span>{overview.completedTransfers} shipments stocked at dock</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
        </div>

        {/* In-Transit Freight */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-sky-500/30 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">In-Transit Freight</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
              On Road
            </span>
          </div>
          <div className="my-1">
            <span className="text-2xl font-extrabold text-sky-400">
              {overview.inTransitUnits.toLocaleString()} <span className="text-xs font-normal text-slate-400">units</span>
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between">
            <span>{overview.inTransitTransfers} moving between regional hubs</span>
            <Truck className="w-3.5 h-3.5 text-sky-400" />
          </div>
        </div>

        {/* Staged & Cancelled */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Staged & Cancelled</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Pipeline State
            </span>
          </div>
          <div className="my-1 flex items-baseline gap-2">
            <span className="text-xl font-extrabold text-amber-400">
              {overview.pendingUnits} <span className="text-xs font-normal text-slate-400">pending</span>
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-sm font-semibold text-slate-400">
              {overview.cancelledUnits} <span className="text-xs font-normal text-slate-500">cancelled</span>
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between">
            <span>{overview.pendingTransfers} staged, {overview.cancelledTransfers} cancelled</span>
            <Clock className="w-3.5 h-3.5 text-amber-400" />
          </div>
        </div>
      </div>

      {/* 4. Empty State Handling */}
      {transfers.length === 0 ? (
        <div className="py-10 text-center border border-dashed border-slate-800 rounded-lg text-slate-400 space-y-1">
          <Info className="w-7 h-7 text-slate-500 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-300">No transfer history recorded yet</p>
          <p className="text-xs text-slate-500">
            As lateral transfer orders are staged and dispatched, lane volume, throughput, and depot transfer balances will appear here.
          </p>
        </div>
      ) : filteredTransfers.length === 0 ? (
        <div className="py-8 text-center border border-dashed border-slate-800 rounded-lg text-slate-400 space-y-2">
          <p className="text-xs font-medium text-slate-300">No transfer records match the active filter criteria.</p>
          <button
            onClick={resetFilters}
            className="px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        /* 5. Main Analytics Content Grid */
        <div className={`grid grid-cols-1 ${activeTab === 'ALL' ? 'lg:grid-cols-2' : ''} gap-6`}>
          {/* PANEL 1: Depot-to-Depot Routing Lanes */}
          {(activeTab === 'ALL' || activeTab === 'LANES') && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Routing Lanes & Fulfillment Status
                  </h3>
                </div>
                <span className="text-[11px] text-slate-400">
                  {laneMetrics.length} active lane{laneMetrics.length === 1 ? '' : 's'}
                </span>
              </div>

              <div className="space-y-3">
                {laneMetrics.map(lane => (
                  <div
                    key={lane.laneId}
                    className="rounded-lg bg-slate-950/60 border border-slate-800/80 p-4 space-y-3 hover:border-slate-700/80 transition-colors"
                  >
                    {/* Lane Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5 text-sm font-bold text-white">
                          <span>{lane.fromDepotName}</span>
                          <ArrowRight className="w-4 h-4 text-indigo-400 mx-1 shrink-0" />
                          <span>{lane.toDepotName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono mt-0.5">
                          <span>{lane.fromDepotCity || lane.fromDepotId}</span>
                          <span>→</span>
                          <span>{lane.toDepotCity || lane.toDepotId}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-sm font-extrabold text-white block">
                          {lane.totalUnits} <span className="text-xs font-normal text-slate-400">units</span>
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {lane.totalTransfers} transfer order{lane.totalTransfers === 1 ? '' : 's'} ({lane.laneSharePercent}%)
                        </span>
                      </div>
                    </div>

                    {/* Proportional Volume Bar */}
                    <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden flex">
                      <div
                        className="h-1.5 bg-indigo-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, lane.laneSharePercent)}%` }}
                        title={`${lane.laneSharePercent}% of total network transfer volume`}
                      />
                    </div>

                    {/* Lifecycle Status Breakdown Chips */}
                    <div className="flex flex-wrap items-center gap-2 text-[10px]">
                      {lane.completedUnits > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-medium">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          {lane.completedUnits} Delivered ({lane.completedTransfers})
                        </span>
                      )}
                      {lane.inTransitUnits > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20 font-medium">
                          <Truck className="w-3 h-3 text-sky-400" />
                          {lane.inTransitUnits} In-Transit ({lane.inTransitTransfers})
                        </span>
                      )}
                      {lane.pendingUnits > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium">
                          <Clock className="w-3 h-3 text-amber-400" />
                          {lane.pendingUnits} Pending ({lane.pendingTransfers})
                        </span>
                      )}
                      {lane.cancelledUnits > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 font-medium">
                          <XCircle className="w-3 h-3 text-slate-500" />
                          {lane.cancelledUnits} Cancelled ({lane.cancelledTransfers})
                        </span>
                      )}
                    </div>

                    {/* SKU Breakdown on this Lane */}
                    {lane.skuBreakdown.length > 0 && (
                      <div className="border-t border-slate-900 pt-2 space-y-1">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider block">SKU Movement Breakdown:</span>
                        <div className="space-y-1">
                          {lane.skuBreakdown.map(sku => (
                            <div
                              key={sku.skuId}
                              className="flex items-center justify-between text-[11px] py-1 px-2 rounded bg-slate-900/40 border border-slate-800/40"
                            >
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-slate-300">{sku.skuName}</span>
                                <span className="font-mono text-[9px] text-slate-500">({sku.skuId})</span>
                              </div>
                              <div className="text-right font-medium text-slate-200">
                                <span>{sku.totalUnits} {sku.unit}</span>
                                {sku.inTransitUnits > 0 && (
                                  <span className="text-sky-400 text-[10px] ml-1.5">({sku.inTransitUnits} on road)</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PANEL 2: Depot Throughput & Rebalancing Role */}
          {(activeTab === 'ALL' || activeTab === 'THROUGHPUT') && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Depot Transfer Inflow & Outflow Throughput
                  </h3>
                </div>
                <span className="text-[11px] text-slate-400">
                  Regional transfer balance
                </span>
              </div>

              <div className="space-y-3">
                {depotThroughput.map(depot => {
                  let roleBadge = 'bg-slate-800 text-slate-300 border-slate-700';
                  let roleLabel = 'Balanced Flow';

                  if (depot.role === 'NET_DONOR') {
                    roleBadge = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
                    roleLabel = `Net Donor (${Math.abs(depot.netFlow)} units outflow)`;
                  } else if (depot.role === 'NET_RECIPIENT') {
                    roleBadge = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
                    roleLabel = `Net Recipient (+${depot.netFlow} units inflow)`;
                  }

                  return (
                    <div
                      key={depot.depotId}
                      className="rounded-lg bg-slate-950/60 border border-slate-800/80 p-4 space-y-3 hover:border-slate-700/80 transition-colors"
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-white">{depot.depotName}</h4>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                              {depot.region}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                            <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                            <span>{depot.city}</span>
                          </div>
                        </div>

                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${roleBadge}`}>
                          {roleLabel}
                        </span>
                      </div>

                      {/* Stat Grid (Outbound vs Inbound) */}
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        {/* Outbound Box */}
                        <div className="bg-slate-900/60 rounded p-2.5 border border-slate-800/60 space-y-1">
                          <div className="flex items-center justify-between text-[10px] text-slate-400">
                            <span>Outbound Sent (Donor)</span>
                            <span className="font-mono text-slate-500">{depot.outboundTransfers} orders</span>
                          </div>
                          <div className="text-base font-extrabold text-amber-400">
                            {depot.unitsSent} <span className="text-xs font-normal text-slate-400">units</span>
                          </div>
                          <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
                            Delivered: {depot.sentCompletedUnits} • In-Transit: {depot.sentInTransitUnits} • Pending: {depot.sentPendingUnits}
                          </div>
                        </div>

                        {/* Inbound Box */}
                        <div className="bg-slate-900/60 rounded p-2.5 border border-slate-800/60 space-y-1">
                          <div className="flex items-center justify-between text-[10px] text-slate-400">
                            <span>Inbound Received (Recipient)</span>
                            <span className="font-mono text-slate-500">{depot.inboundTransfers} orders</span>
                          </div>
                          <div className="text-base font-extrabold text-emerald-400">
                            {depot.unitsReceived} <span className="text-xs font-normal text-slate-400">units</span>
                          </div>
                          <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
                            Delivered: {depot.receivedCompletedUnits} • Incoming: {depot.receivedInTransitUnits} • Pending: {depot.receivedPendingUnits}
                          </div>
                        </div>
                      </div>

                      {/* Net Physical Inventory Flow Indicator */}
                      <div className="pt-1">
                        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                          <span>Net Rebalancing Flow</span>
                          <span className={depot.netFlow > 0 ? 'text-emerald-400 font-bold' : depot.netFlow < 0 ? 'text-amber-400 font-bold' : 'text-slate-400'}>
                            {depot.netFlow > 0 ? `+${depot.netFlow} units received` : depot.netFlow < 0 ? `${depot.netFlow} units dispatched` : '0 units net flow'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
