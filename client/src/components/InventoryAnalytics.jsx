import React, { useState } from 'react';
import {
  BarChart3,
  Warehouse,
  Package,
  Layers,
  MapPin,
  Truck,
  Lock,
  Scale,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Info
} from 'lucide-react';
import SummaryCards from './SummaryCards';
import {
  calculateNetworkTotals,
  calculateDepotAnalytics,
  calculateSkuDistribution
} from '../utils/inventoryAnalytics.js';

export default function InventoryAnalytics({ summary, depots, inventory, skus, isLoading }) {
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'DEPOTS' | 'SKUS'
  const [selectedSkuFilter, setSelectedSkuFilter] = useState('ALL');

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-slate-900/60 border border-slate-800" />
          ))}
        </div>
        <div className="h-64 rounded-xl bg-slate-900/60 border border-slate-800" />
      </div>
    );
  }

  const totals = calculateNetworkTotals(summary, inventory);
  const depotAnalytics = calculateDepotAnalytics(depots, inventory);
  const skuDistribution = calculateSkuDistribution(skus, inventory);

  const filteredSkuDistribution = selectedSkuFilter === 'ALL'
    ? skuDistribution
    : skuDistribution.filter(s => s.skuId === selectedSkuFilter);

  // Color palette for depot distribution segments
  const depotColorPalette = [
    { bg: 'bg-indigo-500', text: 'text-indigo-300', dot: 'bg-indigo-400', border: 'border-indigo-500/30' },
    { bg: 'bg-emerald-500', text: 'text-emerald-300', dot: 'bg-emerald-400', border: 'border-emerald-500/30' },
    { bg: 'bg-sky-500', text: 'text-sky-300', dot: 'bg-sky-400', border: 'border-sky-500/30' },
    { bg: 'bg-amber-500', text: 'text-amber-300', dot: 'bg-amber-400', border: 'border-amber-500/30' },
    { bg: 'bg-rose-500', text: 'text-rose-300', dot: 'bg-rose-400', border: 'border-rose-500/30' }
  ];

  const getDepotColor = (index) => depotColorPalette[index % depotColorPalette.length];

  return (
    <section className="space-y-4 sm:space-y-5" aria-label="Inventory Analytics Section">
      {/* 1. Authoritative Network KPI Overview Cards */}
      <SummaryCards summary={summary} inventory={inventory} />

      {/* 2. Interactive Analytics Deep-Dive Container */}
      <div className="bg-slate-900/75 border border-slate-800/80 rounded-xl p-4 sm:p-5 shadow-xs backdrop-blur-xs">
        {/* Header with Title and View Switcher Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-slate-800/80 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shrink-0">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-semibold tracking-normal text-slate-100">
                  Inventory Analytics & Stock Balancing
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700/60">
                  Authoritative Baseline
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Depot target stock variance and multi-facility SKU distribution without double-counting
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 bg-slate-950/90 p-1 rounded-lg border border-slate-800 text-xs self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setActiveTab('ALL')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                activeTab === 'ALL'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              All Analytics
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('DEPOTS')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                activeTab === 'DEPOTS'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              Depot Variance ({depotAnalytics.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('SKUS')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                activeTab === 'SKUS'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              SKU Distribution ({skuDistribution.length})
            </button>
          </div>
        </div>

        {/* Empty State Guard */}
        {(!depots || depots.length === 0) && (!skus || skus.length === 0) && (
          <div className="py-12 text-center text-slate-400">
            <Info className="w-8 h-8 text-slate-500 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-300">No inventory analytics data available</p>
            <p className="text-xs text-slate-500 mt-1">Connect the service or seed initial inventory records.</p>
          </div>
        )}

        {/* Analytics Views Grid */}
        <div className={`grid grid-cols-1 ${activeTab === 'ALL' ? 'lg:grid-cols-2' : ''} gap-5`}>
          {/* SECTION A: Depot-Wise Surplus & Deficit Analysis */}
          {(activeTab === 'ALL' || activeTab === 'DEPOTS') && (
            <div className="space-y-3.5">
              <div className="flex items-center justify-between pb-1">
                <div className="flex items-center gap-2">
                  <Warehouse className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-xs font-semibold text-slate-200">
                    Depot Target Variance & Stock Position
                  </h3>
                </div>
                <span className="text-[11px] text-slate-400">
                  Target threshold protection active
                </span>
              </div>

              <div className="space-y-3">
                {depotAnalytics.map((depot) => {
                  let statusBadge = 'bg-slate-800 text-slate-300 border-slate-700/60';
                  let statusLabel = 'Balanced Buffer';

                  if (depot.status === 'MIXED') {
                    statusBadge = 'bg-amber-500/10 text-amber-300 border-amber-500/25';
                    statusLabel = `Action Required (${depot.deficitsCount} Deficit, ${depot.surplusesCount} Surplus)`;
                  } else if (depot.status === 'DEFICIT') {
                    statusBadge = 'bg-rose-500/10 text-rose-300 border-rose-500/25';
                    statusLabel = `Active Deficit (${depot.deficitsCount} Critical)`;
                  } else if (depot.status === 'SURPLUS') {
                    statusBadge = 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25';
                    statusLabel = `Transferable Surplus (${depot.surplusesCount} SKUs)`;
                  }

                  const hasSurplus = depot.surplusAboveTarget > 0;
                  const hasDeficit = depot.deficitToTarget > 0;

                  return (
                    <div
                      key={depot.depotId}
                      className="rounded-xl bg-slate-950/50 border border-slate-800/80 p-4 space-y-3 hover:border-slate-700/80 transition-colors"
                    >
                      {/* Depot Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-semibold text-white">{depot.depotName}</h4>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                              {depot.region}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                            <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                            <span>{depot.city}</span>
                          </div>
                        </div>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${statusBadge}`}>
                          {statusLabel}
                        </span>
                      </div>

                      {/* Key Operational Numbers Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs py-2 px-2.5 rounded-lg bg-slate-900/60 border border-slate-800/60">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-medium">On-Hand / Target</span>
                          <span className="font-bold text-white text-sm tabular-nums">
                            {depot.onHand} <span className="text-[11px] font-normal text-slate-400">/ {depot.targetStock}</span>
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-400 block font-medium">Surplus vs Target</span>
                          <span className={`font-bold text-sm tabular-nums ${hasSurplus ? 'text-emerald-400' : 'text-slate-400'}`}>
                            {hasSurplus ? `+${depot.surplusAboveTarget}` : '0'} units
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-400 block font-medium">Deficit to Target</span>
                          <span className={`font-bold text-sm tabular-nums ${hasDeficit ? 'text-rose-400' : 'text-slate-400'}`}>
                            {hasDeficit ? `-${depot.deficitToTarget}` : '0'} units
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-400 block font-medium">Pipeline Freight</span>
                          <div className="text-[11px] font-medium text-slate-300 flex items-center gap-1.5 mt-0.5 tabular-nums">
                            {depot.inTransit > 0 ? (
                              <span className="text-sky-400 font-semibold">+{depot.inTransit} Trf</span>
                            ) : (
                              <span className="text-slate-500">0 transit</span>
                            )}
                            {depot.reserved > 0 && (
                              <span className="text-amber-400 font-semibold">-{depot.reserved} Res</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Visual Target Stock Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">
                            Target Threshold Fulfillment:{' '}
                            <strong className="text-slate-200 tabular-nums">{depot.percentOfTarget}%</strong>
                          </span>
                          <span className="text-slate-400 text-[10px] tabular-nums">
                            {depot.targetVariance >= 0
                              ? `+${depot.targetVariance} net buffer`
                              : `${depot.targetVariance} below target buffer`}
                          </span>
                        </div>

                        <div className="w-full bg-slate-800/90 rounded-full h-1.5 overflow-hidden flex">
                          <div
                            className={`h-1.5 rounded-full transition-all duration-500 ${
                              depot.onHand < depot.safetyStock
                                ? 'bg-rose-500'
                                : depot.onHand > depot.targetStock
                                ? 'bg-emerald-500'
                                : 'bg-indigo-500'
                            }`}
                            style={{ width: `${Math.min(100, depot.percentOfTarget)}%` }}
                            title={`${depot.percentOfTarget}% of target`}
                          />
                        </div>
                      </div>

                      {/* SKU breakdown chips for this depot */}
                      <div className="border-t border-slate-900 pt-2 flex flex-wrap gap-1.5">
                        {depot.items.map((item) => {
                          let chipColor = 'bg-slate-850 text-slate-300 border-slate-700/60';
                          if (item.status === 'DEFICIT') chipColor = 'bg-rose-500/10 text-rose-300 border-rose-500/25';
                          if (item.status === 'SURPLUS') chipColor = 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25';

                          return (
                            <span
                              key={item.skuId}
                              className={`text-[10px] font-medium px-2 py-0.5 rounded-md border ${chipColor}`}
                            >
                              {item.skuName}: <strong className="tabular-nums font-semibold">{item.onHand}</strong>/{item.targetStock} ({item.status})
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SECTION B: SKU-Wise Inventory Distribution Analysis */}
          {(activeTab === 'ALL' || activeTab === 'SKUS') && (
            <div className="space-y-3.5">
              <div className="flex items-center justify-between pb-1">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-semibold text-slate-200">
                    SKU-Wise Network Distribution & Valuation
                  </h3>
                </div>

                {activeTab === 'SKUS' && skuDistribution.length > 1 && (
                  <select
                    value={selectedSkuFilter}
                    onChange={(e) => setSelectedSkuFilter(e.target.value)}
                    className="bg-slate-900 border border-slate-700/60 text-slate-200 text-xs rounded-lg px-2.5 py-1 focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="ALL">All SKUs ({skuDistribution.length})</option>
                    {skuDistribution.map((s) => (
                      <option key={s.skuId} value={s.skuId}>
                        {s.skuName}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="space-y-3">
                {filteredSkuDistribution.map((sku) => {
                  return (
                    <div
                      key={sku.skuId}
                      className="rounded-xl bg-slate-950/50 border border-slate-800/80 p-4 space-y-3 hover:border-slate-700/80 transition-colors"
                    >
                      {/* SKU Header & Valuation */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-semibold text-white">{sku.skuName}</h4>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                              {sku.skuId}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Network Total: <strong className="text-slate-200 tabular-nums">{sku.totalOnHand} {sku.unit}</strong> on-hand
                            {sku.totalInTransit > 0 && (
                              <span className="text-sky-400 ml-1.5 font-medium tabular-nums">
                                (+{sku.totalInTransit} in-transit)
                              </span>
                            )}
                            {sku.totalReserved > 0 && (
                              <span className="text-amber-400 ml-1.5 font-medium tabular-nums">
                                (-{sku.totalReserved} reserved)
                              </span>
                            )}
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-xs font-bold text-emerald-400 tabular-nums block">
                            ${sku.totalValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                          <span className="text-[10px] text-slate-400 tabular-nums">
                            ${sku.unitCost.toFixed(2)} / {sku.unit}
                          </span>
                        </div>
                      </div>

                      {/* Multi-Depot Proportional Distribution Bar */}
                      <div>
                        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
                          <span>Regional Depot Stock Allocation</span>
                          <span className="text-[10px] text-slate-400 tabular-nums">
                            Target Sum: {sku.totalTargetStock} {sku.unit}
                          </span>
                        </div>

                        {/* Segmented Stacked Bar */}
                        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden flex gap-0.5">
                          {sku.depotBreakdown.map((depot, idx) => {
                            if (depot.onHand <= 0) return null;
                            const palette = getDepotColor(idx);
                            return (
                              <div
                                key={depot.depotId}
                                className={`h-2 ${palette.bg} transition-all duration-500 hover:opacity-90`}
                                style={{ width: `${depot.sharePercent}%` }}
                                title={`${depot.depotName}: ${depot.onHand} ${sku.unit} (${depot.sharePercent}%)`}
                              />
                            );
                          })}
                        </div>

                        {/* Interactive Legend / Share Chips */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-2 text-[11px]">
                          {sku.depotBreakdown.map((depot, idx) => {
                            const palette = getDepotColor(idx);
                            return (
                              <div key={depot.depotId} className="flex items-center gap-1.5">
                                <span className={`w-2 h-2 rounded-full ${palette.dot}`} />
                                <span className="text-slate-300 font-medium">{depot.depotName}:</span>
                                <span className="font-bold text-white tabular-nums">
                                  {depot.onHand} {sku.unit}
                                </span>
                                <span className="text-slate-400 text-[10px] tabular-nums">
                                  ({depot.sharePercent}%)
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Facility Position Status Rows */}
                      <div className="border-t border-slate-900 pt-2 space-y-1">
                        {sku.depotBreakdown.map((item) => {
                          let statusClass = 'text-slate-400';
                          let statusText = 'Balanced Buffer';
                          let varianceText = '';

                          if (item.status === 'DEFICIT') {
                            statusClass = 'text-rose-400 font-medium';
                            statusText = 'Deficit Below Safety';
                            varianceText = `Shortfall: -${item.deficitToTarget} to target (${item.deficitToSafety} to safety)`;
                          } else if (item.status === 'SURPLUS') {
                            statusClass = 'text-emerald-400 font-medium';
                            statusText = 'Surplus Above Target';
                            varianceText = `Transferable: +${item.surplusAboveTarget} units`;
                          } else {
                            varianceText = `Within safe target buffer (${item.targetStock} target)`;
                          }

                          return (
                            <div
                              key={item.depotId}
                              className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg bg-slate-900/40 border border-slate-800/40"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-slate-300 font-medium">{item.depotName}</span>
                                <span className={`text-[10px] ${statusClass}`}>• {statusText}</span>
                              </div>
                              <div className="flex items-center gap-3 text-[11px]">
                                <span className="text-slate-400 hidden sm:inline">{varianceText}</span>
                                <span className="font-bold text-white tabular-nums">
                                  {item.onHand} <span className="text-slate-400 text-[10px] font-normal">on-hand</span>
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
