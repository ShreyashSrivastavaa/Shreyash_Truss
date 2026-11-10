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
  Layers,
  Info,
  MapPin,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import {
  filterTransfers,
  calculateTransferOverview,
  calculateLaneMetrics,
  calculateDepotThroughput
} from '../utils/transferLaneAnalytics.js';

export default function TransferLaneAnalytics({ transfers = [], depots = [], skus = [], isLoading, isDetailed = false }) {
  const [isOpen, setIsOpen] = useState(false);
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
      <div className="bg-white border border-[#F3E3E8] rounded-2xl p-6 shadow-card space-y-4 animate-pulse">
        <div className="h-6 w-48 bg-[#FFF5F7] rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-[#FFF5F7] rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const showContent = isDetailed || isOpen;

  return (
    <section className="bg-white border border-[#F3E3E8] rounded-2xl p-6 shadow-card transition" aria-label="Advanced Transfer Lane Analytics">
      {/* 1. Header with Accordion Toggle */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${showContent ? 'border-b border-[#F3E3E8] pb-4 mb-5' : ''}`}>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[#FFF5F7] text-[#E11D48] shrink-0">
            <ArrowLeftRight className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-semibold tracking-tight text-[#1F1720]">
                Advanced Analytics: Lane Routing &amp; Freight Flow
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#FFF5F7] text-[#8A8190] border border-[#F3E3E8]">
                {transfers.length} Records
              </span>
            </div>
            <p className="text-xs text-[#8A8190] mt-0.5">
              Depot-to-depot routing lane volume, fulfillment metrics, and multi-facility throughput
            </p>
          </div>
        </div>

        {/* Toggle Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="self-start sm:self-center text-xs px-3.5 py-1.5 rounded-xl border border-[#F3E3E8] hover:bg-[#FFF5F7] text-[#4B4350] flex items-center gap-1.5 font-medium transition"
        >
          <span>{showContent ? 'Collapse' : 'Expand Analytics'}</span>
          {showContent ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {showContent && (
        <div className="space-y-6">
          {/* View Switcher Tabs */}
          <div className="flex items-center gap-1 bg-[#FFF5F7] p-1 rounded-xl border border-[#F3E3E8] text-xs self-start w-fit">
            <button
              type="button"
              onClick={() => setActiveTab('ALL')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                activeTab === 'ALL'
                  ? 'bg-white text-[#E11D48] shadow-sm'
                  : 'text-[#8A8190] hover:text-[#1F1720]'
              }`}
            >
              All Analytics
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('LANES')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                activeTab === 'LANES'
                  ? 'bg-white text-[#E11D48] shadow-sm'
                  : 'text-[#8A8190] hover:text-[#1F1720]'
              }`}
            >
              Routing Lanes ({laneMetrics.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('THROUGHPUT')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                activeTab === 'THROUGHPUT'
                  ? 'bg-white text-[#E11D48] shadow-sm'
                  : 'text-[#8A8190] hover:text-[#1F1720]'
              }`}
            >
              Depot Throughput ({depotThroughput.length})
            </button>
          </div>

          {/* 2. Interactive Filter Controls Bar */}
          <div className="bg-[#FFF5F7] border border-[#F3E3E8] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs text-[#8A8190] font-medium">
              <div className="flex items-center gap-1.5 text-[#1F1720]">
                <Filter className="w-3.5 h-3.5 text-[#E11D48]" />
                <span>Filter Transfer Flow:</span>
              </div>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="flex items-center gap-1 text-xs text-[#E11D48] hover:text-[#BE123C] font-medium transition"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Filters</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
              {/* Status Filter */}
              <div>
                <label className="text-[11px] font-medium text-[#8A8190] block mb-1">Transfer Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-9 w-full bg-white border border-[#F3E3E8] text-[#1F1720] rounded-xl px-2.5 py-1.5 focus:border-[#E11D48] focus:outline-none transition"
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
                <label className="text-[11px] font-medium text-[#8A8190] block mb-1">SKU</label>
                <select
                  value={skuFilter}
                  onChange={(e) => setSkuFilter(e.target.value)}
                  className="h-9 w-full bg-white border border-[#F3E3E8] text-[#1F1720] rounded-xl px-2.5 py-1.5 focus:border-[#E11D48] focus:outline-none transition"
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
                <label className="text-[11px] font-medium text-[#8A8190] block mb-1">Routing Lane</label>
                <select
                  value={laneFilter}
                  onChange={(e) => setLaneFilter(e.target.value)}
                  className="h-9 w-full bg-white border border-[#F3E3E8] text-[#1F1720] rounded-xl px-2.5 py-1.5 focus:border-[#E11D48] focus:outline-none transition"
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
                <label className="text-[11px] font-medium text-[#8A8190] block mb-1">Date Created</label>
                <select
                  value={datePreset}
                  onChange={(e) => setDatePreset(e.target.value)}
                  className="h-9 w-full bg-white border border-[#F3E3E8] text-[#1F1720] rounded-xl px-2.5 py-1.5 focus:border-[#E11D48] focus:outline-none transition"
                >
                  <option value="ALL">All Time</option>
                  <option value="TODAY">Today</option>
                  <option value="LAST_7_DAYS">Last 7 Days</option>
                  <option value="CUSTOM">Custom Date Range</option>
                </select>
              </div>
            </div>

            {/* Custom Date Pickers */}
            {datePreset === 'CUSTOM' && (
              <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-[#F3E3E8] text-xs">
                <div>
                  <label className="text-[11px] font-medium text-[#8A8190] block mb-1">Start Date</label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="h-9 w-full bg-white border border-[#F3E3E8] text-[#1F1720] rounded-xl px-2.5 py-1.5 focus:border-[#E11D48] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-[#8A8190] block mb-1">End Date</label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="h-9 w-full bg-white border border-[#F3E3E8] text-[#1F1720] rounded-xl px-2.5 py-1.5 focus:border-[#E11D48] focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 3. Top-Level Lane KPI Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Units Moved */}
            <div className="p-6 rounded-2xl bg-white border border-[#F3E3E8] shadow-card flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-[#8A8190]">
                  Total Volume Moved
                </span>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#FFF5F7] text-[#4B4350] border border-[#F3E3E8] tabular-nums">
                  {overview.activeLanesCount} Active Lanes
                </span>
              </div>
              <div className="my-1.5 flex items-baseline gap-1.5">
                <span className="text-2xl font-bold tracking-tight text-[#1F1720] tabular-nums">
                  {overview.totalUnits.toLocaleString()}
                </span>
                <span className="text-xs text-[#8A8190]">units</span>
              </div>
              <div className="text-xs text-[#8A8190] mt-2 pt-2.5 border-t border-[#F3E3E8] flex items-center justify-between">
                <span className="tabular-nums">
                  {overview.totalTransfers} total order{overview.totalTransfers === 1 ? '' : 's'}
                </span>
                <Layers className="w-3.5 h-3.5 text-[#E11D48]" />
              </div>
            </div>

            {/* Completed Deliveries */}
            <div className="p-6 rounded-2xl bg-white border border-[#F3E3E8] shadow-card flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-[#8A8190]">Completed Deliveries</span>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#E8F6EF] text-[#1F8A5B]">
                  Received
                </span>
              </div>
              <div className="my-1.5 flex items-baseline gap-1.5">
                <span className="text-2xl font-bold tracking-tight text-[#1F8A5B] tabular-nums">
                  {overview.completedUnits.toLocaleString()}
                </span>
                <span className="text-xs text-[#8A8190]">units</span>
              </div>
              <div className="text-xs text-[#8A8190] mt-2 pt-2.5 border-t border-[#F3E3E8] flex items-center justify-between">
                <span className="tabular-nums">{overview.completedTransfers} stocked at dock</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-[#1F8A5B]" />
              </div>
            </div>

            {/* In-Transit Freight */}
            <div className="p-6 rounded-2xl bg-white border border-[#F3E3E8] shadow-card flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-[#8A8190]">In-Transit Freight</span>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#FFE4EA] text-[#E11D48]">
                  On Road
                </span>
              </div>
              <div className="my-1.5 flex items-baseline gap-1.5">
                <span className="text-2xl font-bold tracking-tight text-[#E11D48] tabular-nums">
                  {overview.inTransitUnits.toLocaleString()}
                </span>
                <span className="text-xs text-[#8A8190]">units</span>
              </div>
              <div className="text-xs text-[#8A8190] mt-2 pt-2.5 border-t border-[#F3E3E8] flex items-center justify-between">
                <span className="tabular-nums">{overview.inTransitTransfers} moving between hubs</span>
                <Truck className="w-3.5 h-3.5 text-[#E11D48]" />
              </div>
            </div>

            {/* Staged & Cancelled */}
            <div className="p-6 rounded-2xl bg-white border border-[#F3E3E8] shadow-card flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-[#8A8190]">Pipeline State</span>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#FFF5F7] text-[#4B4350] border border-[#F3E3E8]">
                  Staged / Aborted
                </span>
              </div>
              <div className="my-1.5 flex items-baseline gap-2">
                <span className="text-xl font-bold text-[#B7791F] tabular-nums">
                  {overview.pendingUnits} <span className="text-xs text-[#8A8190]">pending</span>
                </span>
                <span className="text-[#8A8190]">·</span>
                <span className="text-sm font-medium text-[#8A8190] tabular-nums">
                  {overview.cancelledUnits} cancelled
                </span>
              </div>
              <div className="text-xs text-[#8A8190] mt-2 pt-2.5 border-t border-[#F3E3E8] flex items-center justify-between">
                <span className="tabular-nums">{overview.pendingTransfers} staged, {overview.cancelledTransfers} cancelled</span>
                <Clock className="w-3.5 h-3.5 text-[#B7791F]" />
              </div>
            </div>
          </div>

          {/* 4. Empty State Handling */}
          {transfers.length === 0 ? (
            <div className="py-10 text-center border border-dashed border-[#F3E3E8] rounded-2xl bg-[#FFF5F7] text-[#8A8190] space-y-1">
              <Info className="w-7 h-7 text-[#8A8190] mx-auto mb-2" />
              <p className="text-sm font-semibold text-[#1F1720]">No transfer history recorded yet</p>
              <p className="text-xs text-[#8A8190] max-w-md mx-auto">
                As lateral transfer orders are staged and dispatched, lane volume, throughput, and depot transfer balances will appear here.
              </p>
            </div>
          ) : filteredTransfers.length === 0 ? (
            <div className="py-8 text-center border border-dashed border-[#F3E3E8] rounded-2xl bg-[#FFF5F7] text-[#8A8190] space-y-2">
              <p className="text-xs font-medium text-[#1F1720]">No transfer records match the active filter criteria.</p>
              <button
                type="button"
                onClick={resetFilters}
                className="px-3.5 py-1.5 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-medium shadow-sm transition"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            /* 5. Main Analytics Content Grid */
            <div className={`grid grid-cols-1 ${activeTab === 'ALL' ? 'lg:grid-cols-2' : ''} gap-6`}>
              {/* PANEL 1: Depot-to-Depot Routing Lanes */}
              {(activeTab === 'ALL' || activeTab === 'LANES') && (
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between pb-1">
                    <div className="flex items-center gap-2">
                      <ArrowRight className="w-4 h-4 text-[#E11D48]" />
                      <h3 className="text-xs font-semibold text-[#1F1720]">
                        Routing Lanes &amp; Fulfillment Status
                      </h3>
                    </div>
                    <span className="text-xs text-[#8A8190] tabular-nums">
                      {laneMetrics.length} active lane{laneMetrics.length === 1 ? '' : 's'}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {laneMetrics.map(lane => (
                      <div
                        key={lane.laneId}
                        className="rounded-2xl bg-white border border-[#F3E3E8] p-4 space-y-3 shadow-card"
                      >
                        {/* Lane Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5 text-sm font-semibold text-[#1F1720]">
                              <span>{lane.fromDepotName}</span>
                              <ArrowRight className="w-3.5 h-3.5 text-[#E11D48] mx-1 shrink-0" />
                              <span>{lane.toDepotName}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-[#8A8190] mt-0.5">
                              <span>{lane.fromDepotCity || lane.fromDepotId}</span>
                              <span>→</span>
                              <span>{lane.toDepotCity || lane.toDepotId}</span>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-sm font-bold text-[#1F1720] tabular-nums block">
                              {lane.totalUnits} <span className="text-xs font-normal text-[#8A8190]">units</span>
                            </span>
                            <span className="text-xs text-[#8A8190] tabular-nums">
                              {lane.totalTransfers} order{lane.totalTransfers === 1 ? '' : 's'} ({lane.laneSharePercent}%)
                            </span>
                          </div>
                        </div>

                        {/* Proportional Volume Bar */}
                        <div className="w-full bg-[#F3E3E8] rounded-full h-1.5 overflow-hidden flex">
                          <div
                            className="h-1.5 bg-[#E11D48] rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, lane.laneSharePercent)}%` }}
                          />
                        </div>

                        {/* Status Breakdown Chips */}
                        <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                          {lane.completedUnits > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#E8F6EF] text-[#1F8A5B] font-medium tabular-nums">
                              <CheckCircle2 className="w-3 h-3 text-[#1F8A5B]" />
                              {lane.completedUnits} Delivered
                            </span>
                          )}
                          {lane.inTransitUnits > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FFE4EA] text-[#E11D48] font-medium tabular-nums">
                              <Truck className="w-3 h-3 text-[#E11D48]" />
                              {lane.inTransitUnits} In-Transit
                            </span>
                          )}
                          {lane.pendingUnits > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FDF4E3] text-[#B7791F] font-medium tabular-nums">
                              <Clock className="w-3 h-3 text-[#B7791F]" />
                              {lane.pendingUnits} Pending
                            </span>
                          )}
                          {lane.cancelledUnits > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FFF5F7] text-[#8A8190] border border-[#F3E3E8] font-medium tabular-nums">
                              <XCircle className="w-3 h-3 text-[#8A8190]" />
                              {lane.cancelledUnits} Cancelled
                            </span>
                          )}
                        </div>

                        {/* SKU Breakdown on this Lane */}
                        {lane.skuBreakdown.length > 0 && (
                          <div className="border-t border-[#F3E3E8] pt-2 space-y-1">
                            <span className="text-[10px] text-[#8A8190] font-medium block">SKU Movement:</span>
                            <div className="space-y-1">
                              {lane.skuBreakdown.map(sku => (
                                <div
                                  key={sku.skuId}
                                  className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-xl bg-[#FFF5F7] border border-[#F3E3E8]"
                                >
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-medium text-[#1F1720]">{sku.skuName}</span>
                                    <span className="text-[10px] text-[#8A8190]">({sku.skuId})</span>
                                  </div>
                                  <div className="text-right font-medium text-[#1F1720] tabular-nums">
                                    <span>{sku.totalUnits} {sku.unit}</span>
                                    {sku.inTransitUnits > 0 && (
                                      <span className="text-[#E11D48] text-[10px] ml-1.5">({sku.inTransitUnits} on road)</span>
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
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between pb-1">
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-[#1F8A5B]" />
                      <h3 className="text-xs font-semibold text-[#1F1720]">
                        Depot Transfer Inflow &amp; Outflow Throughput
                      </h3>
                    </div>
                    <span className="text-xs text-[#8A8190]">
                      Regional balance
                    </span>
                  </div>

                  <div className="space-y-3">
                    {depotThroughput.map(depot => {
                      let roleBadge = 'bg-[#FFF5F7] text-[#4B4350] border-[#F3E3E8]';
                      let roleLabel = 'Balanced Flow';

                      if (depot.role === 'NET_DONOR') {
                        roleBadge = 'bg-[#FDF4E3] text-[#B7791F] border-[#F3E3E8]';
                        roleLabel = `Net Donor (${Math.abs(depot.netFlow)} units outflow)`;
                      } else if (depot.role === 'NET_RECIPIENT') {
                        roleBadge = 'bg-[#E8F6EF] text-[#1F8A5B] border-[#F3E3E8]';
                        roleLabel = `Net Recipient (+${depot.netFlow} units inflow)`;
                      }

                      return (
                        <div
                          key={depot.depotId}
                          className="rounded-2xl bg-white border border-[#F3E3E8] p-4 space-y-3 shadow-card"
                        >
                          {/* Header */}
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-semibold text-[#1F1720]">{depot.depotName}</h4>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#FFF5F7] text-[#8A8190]">
                                  {depot.region}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 text-xs text-[#8A8190] mt-0.5">
                                <MapPin className="w-3 h-3 text-[#8A8190] shrink-0" />
                                <span>{depot.city}</span>
                              </div>
                            </div>

                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${roleBadge}`}>
                              {roleLabel}
                            </span>
                          </div>

                          {/* Stat Grid */}
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="bg-[#FFF5F7] rounded-xl p-3 border border-[#F3E3E8] space-y-1">
                              <div className="flex items-center justify-between text-[10px] text-[#8A8190]">
                                <span>Outbound Sent (Donor)</span>
                                <span className="tabular-nums">{depot.outboundTransfers} orders</span>
                              </div>
                              <div className="text-base font-bold text-[#B7791F] tabular-nums">
                                {depot.unitsSent} <span className="text-xs font-normal text-[#8A8190]">units</span>
                              </div>
                              <div className="text-[10px] text-[#8A8190] pt-1.5 border-t border-[#F3E3E8] tabular-nums">
                                Delivered: {depot.sentCompletedUnits} · In-Transit: {depot.sentInTransitUnits}
                              </div>
                            </div>

                            <div className="bg-[#FFF5F7] rounded-xl p-3 border border-[#F3E3E8] space-y-1">
                              <div className="flex items-center justify-between text-[10px] text-[#8A8190]">
                                <span>Inbound Received (Recipient)</span>
                                <span className="tabular-nums">{depot.inboundTransfers} orders</span>
                              </div>
                              <div className="text-base font-bold text-[#1F8A5B] tabular-nums">
                                {depot.unitsReceived} <span className="text-xs font-normal text-[#8A8190]">units</span>
                              </div>
                              <div className="text-[10px] text-[#8A8190] pt-1.5 border-t border-[#F3E3E8] tabular-nums">
                                Delivered: {depot.receivedCompletedUnits} · Incoming: {depot.receivedInTransitUnits}
                              </div>
                            </div>
                          </div>

                          {/* Net Physical Inventory Flow */}
                          <div className="pt-1">
                            <div className="flex items-center justify-between text-xs text-[#8A8190]">
                              <span>Net Rebalancing Flow</span>
                              <span className={`tabular-nums font-medium ${depot.netFlow > 0 ? 'text-[#1F8A5B]' : depot.netFlow < 0 ? 'text-[#B7791F]' : 'text-[#8A8190]'}`}>
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
        </div>
      )}
    </section>
  );
}
