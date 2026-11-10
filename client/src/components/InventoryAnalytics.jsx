import React, { useState } from 'react';
import {
  BarChart3,
  Warehouse,
  Package,
  MapPin,
  Info
} from 'lucide-react';
import SummaryCards from './SummaryCards';
import { formatINR } from '../lib/format/formatINR';
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-[#FFF5F7] border border-[#F3E3E8]" />
          ))}
        </div>
        <div className="h-64 rounded-2xl bg-[#FFF5F7] border border-[#F3E3E8]" />
      </div>
    );
  }

  const totals = calculateNetworkTotals(summary, inventory);
  const depotAnalytics = calculateDepotAnalytics(depots, inventory);
  const skuDistribution = calculateSkuDistribution(skus, inventory);

  const filteredSkuDistribution = selectedSkuFilter === 'ALL'
    ? skuDistribution
    : skuDistribution.filter(s => s.skuId === selectedSkuFilter);

  // Harmonious palette for depot distribution segments
  const depotColorPalette = [
    { bg: 'bg-[#E11D48]', text: 'text-[#E11D48]', dot: 'bg-[#E11D48]' },
    { bg: 'bg-[#1F8A5B]', text: 'text-[#1F8A5B]', dot: 'bg-[#1F8A5B]' },
    { bg: 'bg-[#B7791F]', text: 'text-[#B7791F]', dot: 'bg-[#B7791F]' },
    { bg: 'bg-[#5B5BD6]', text: 'text-[#5B5BD6]', dot: 'bg-[#5B5BD6]' }
  ];

  const getDepotColor = (index) => depotColorPalette[index % depotColorPalette.length];

  return (
    <section className="space-y-6" aria-label="Inventory Analytics Section">
      {/* 1. Authoritative Network KPI Overview Cards */}
      <SummaryCards summary={summary} inventory={inventory} />

      {/* 2. Interactive Analytics Deep-Dive Container */}
      <div className="bg-white border border-[#F3E3E8] rounded-2xl p-6 shadow-card">
        {/* Header with Title and View Switcher Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-[#F3E3E8] pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#FFF5F7] text-[#E11D48] shrink-0">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-semibold tracking-normal text-[#1F1720]">
                  Inventory Analytics &amp; Stock Balancing
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FFF5F7] text-[#8A8190] border border-[#F3E3E8]">
                  Authoritative Baseline
                </span>
              </div>
              <p className="text-xs text-[#8A8190] mt-0.5">
                Depot target stock variance and multi-facility SKU distribution without double-counting
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 bg-[#FFF5F7] p-1 rounded-xl border border-[#F3E3E8] text-xs self-start sm:self-auto">
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
              onClick={() => setActiveTab('DEPOTS')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                activeTab === 'DEPOTS'
                  ? 'bg-white text-[#E11D48] shadow-sm'
                  : 'text-[#8A8190] hover:text-[#1F1720]'
              }`}
            >
              Depot Variance ({depotAnalytics.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('SKUS')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                activeTab === 'SKUS'
                  ? 'bg-white text-[#E11D48] shadow-sm'
                  : 'text-[#8A8190] hover:text-[#1F1720]'
              }`}
            >
              SKU Distribution ({skuDistribution.length})
            </button>
          </div>
        </div>

        {/* Empty State Guard */}
        {(!depots || depots.length === 0) && (!skus || skus.length === 0) && (
          <div className="py-12 text-center text-[#8A8190]">
            <Info className="w-8 h-8 text-[#8A8190] mx-auto mb-2" />
            <p className="text-sm font-semibold text-[#1F1720]">No inventory analytics data available</p>
            <p className="text-xs text-[#8A8190] mt-1">Connect the service or seed initial inventory records.</p>
          </div>
        )}

        {/* Analytics Views Grid */}
        <div className={`grid grid-cols-1 ${activeTab === 'ALL' ? 'lg:grid-cols-2' : ''} gap-6`}>
          {/* SECTION A: Depot-Wise Surplus & Deficit Analysis */}
          {(activeTab === 'ALL' || activeTab === 'DEPOTS') && (
            <div className="space-y-3.5">
              <div className="flex items-center justify-between pb-1">
                <div className="flex items-center gap-2">
                  <Warehouse className="w-4 h-4 text-[#E11D48]" />
                  <h3 className="text-xs font-semibold text-[#1F1720]">
                    Depot Target Variance &amp; Stock Position
                  </h3>
                </div>
                <span className="text-xs text-[#8A8190]">
                  Target threshold protection active
                </span>
              </div>

              <div className="space-y-3">
                {depotAnalytics.map((depot) => {
                  let statusBadge = 'bg-[#FFF5F7] text-[#4B4350] border-[#F3E3E8]';
                  let statusLabel = 'Balanced Buffer';

                  if (depot.status === 'MIXED') {
                    statusBadge = 'bg-[#FDF4E3] text-[#B7791F] border-[#F3E3E8]';
                    statusLabel = `Action Required (${depot.deficitsCount} Deficit, ${depot.surplusesCount} Surplus)`;
                  } else if (depot.status === 'DEFICIT') {
                    statusBadge = 'bg-[#FDECEA] text-[#B42318] border-[#F3E3E8]';
                    statusLabel = `Active Deficit (${depot.deficitsCount} Critical)`;
                  } else if (depot.status === 'SURPLUS') {
                    statusBadge = 'bg-[#E8F6EF] text-[#1F8A5B] border-[#F3E3E8]';
                    statusLabel = `Transferable Surplus (${depot.surplusesCount} SKUs)`;
                  }

                  const hasSurplus = depot.surplusAboveTarget > 0;
                  const hasDeficit = depot.deficitToTarget > 0;

                  return (
                    <div
                      key={depot.depotId}
                      className="rounded-2xl bg-white border border-[#F3E3E8] p-4 space-y-3 shadow-card"
                    >
                      {/* Depot Header */}
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
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${statusBadge}`}>
                          {statusLabel}
                        </span>
                      </div>

                      {/* Key Operational Numbers Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs py-2 px-2.5 rounded-xl bg-[#FFF5F7] border border-[#F3E3E8]">
                        <div>
                          <span className="text-[10px] text-[#8A8190] block font-medium">On-Hand / Target</span>
                          <span className="font-semibold text-[#1F1720] text-sm tabular-nums">
                            {depot.onHand} <span className="text-xs font-normal text-[#8A8190]">/ {depot.targetStock}</span>
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] text-[#8A8190] block font-medium">Surplus vs Target</span>
                          <span className={`font-semibold text-sm tabular-nums ${hasSurplus ? 'text-[#1F8A5B]' : 'text-[#8A8190]'}`}>
                            {hasSurplus ? `+${depot.surplusAboveTarget}` : '0'} units
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] text-[#8A8190] block font-medium">Deficit to Target</span>
                          <span className={`font-semibold text-sm tabular-nums ${hasDeficit ? 'text-[#B42318]' : 'text-[#8A8190]'}`}>
                            {hasDeficit ? `-${depot.deficitToTarget}` : '0'} units
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] text-[#8A8190] block font-medium">Pipeline Freight</span>
                          <div className="text-xs font-medium text-[#4B4350] flex items-center gap-1.5 mt-0.5 tabular-nums">
                            {depot.inTransit > 0 ? (
                              <span className="text-[#E11D48] font-semibold">+{depot.inTransit} Trf</span>
                            ) : (
                              <span className="text-[#8A8190]">0 transit</span>
                            )}
                            {depot.reserved > 0 && (
                              <span className="text-[#B7791F] font-semibold">-{depot.reserved} Res</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[#8A8190]">
                            Target Fulfillment:{' '}
                            <strong className="text-[#1F1720] font-medium tabular-nums">{depot.percentOfTarget}%</strong>
                          </span>
                          <span className="text-[#8A8190] text-[10px] tabular-nums">
                            {depot.targetVariance >= 0
                              ? `+${depot.targetVariance} net buffer`
                              : `${depot.targetVariance} below target`}
                          </span>
                        </div>

                        <div className="w-full bg-[#F3E3E8] rounded-full h-1.5 overflow-hidden flex">
                          <div
                            className={`h-1.5 rounded-full transition-all duration-500 ${
                              depot.onHand < depot.safetyStock
                                ? 'bg-[#B42318]'
                                : depot.onHand > depot.targetStock
                                ? 'bg-[#1F8A5B]'
                                : 'bg-[#E11D48]'
                            }`}
                            style={{ width: `${Math.min(100, depot.percentOfTarget)}%` }}
                          />
                        </div>
                      </div>

                      {/* SKU breakdown chips for this depot */}
                      <div className="border-t border-[#F3E3E8] pt-2 flex flex-wrap gap-1.5">
                        {depot.items.map((item) => {
                          let chipColor = 'bg-[#FFF5F7] text-[#4B4350] border-[#F3E3E8]';
                          if (item.status === 'DEFICIT') chipColor = 'bg-[#FDECEA] text-[#B42318] border-[#F3E3E8]';
                          if (item.status === 'SURPLUS') chipColor = 'bg-[#E8F6EF] text-[#1F8A5B] border-[#F3E3E8]';

                          return (
                            <span
                              key={item.skuId}
                              className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${chipColor}`}
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
                  <Package className="w-4 h-4 text-[#1F8A5B]" />
                  <h3 className="text-xs font-semibold text-[#1F1720]">
                    SKU-Wise Network Distribution &amp; Valuation
                  </h3>
                </div>

                {activeTab === 'SKUS' && skuDistribution.length > 1 && (
                  <select
                    value={selectedSkuFilter}
                    onChange={(e) => setSelectedSkuFilter(e.target.value)}
                    className="bg-white border border-[#F3E3E8] text-[#1F1720] text-xs rounded-xl px-2.5 py-1 focus:border-[#E11D48] focus:outline-none"
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
                      className="rounded-2xl bg-white border border-[#F3E3E8] p-4 space-y-3 shadow-card"
                    >
                      {/* SKU Header & Valuation */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-semibold text-[#1F1720]">{sku.skuName}</h4>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#FFF5F7] text-[#8A8190]">
                              {sku.skuId}
                            </span>
                          </div>
                          <p className="text-xs text-[#8A8190] mt-0.5">
                            Network Total: <strong className="text-[#1F1720] font-medium tabular-nums">{sku.totalOnHand} {sku.unit}</strong> on-hand
                            {sku.totalInTransit > 0 && (
                              <span className="text-[#E11D48] ml-1.5 font-medium tabular-nums">
                                (+{sku.totalInTransit} in-transit)
                              </span>
                            )}
                            {sku.totalReserved > 0 && (
                              <span className="text-[#B7791F] ml-1.5 font-medium tabular-nums">
                                (-{sku.totalReserved} reserved)
                              </span>
                            )}
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-xs font-bold text-[#1F8A5B] tabular-nums block">
                            {formatINR(sku.totalValuation)}
                          </span>
                          <span className="text-[10px] text-[#8A8190] tabular-nums">
                            {formatINR(sku.unitCost)} / {sku.unit}
                          </span>
                        </div>
                      </div>

                      {/* Multi-Depot Proportional Distribution Bar */}
                      <div>
                        <div className="flex items-center justify-between text-xs text-[#8A8190] mb-1.5">
                          <span>Regional Stock Allocation</span>
                          <span className="text-[10px] text-[#8A8190] tabular-nums">
                            Target Sum: {sku.totalTargetStock} {sku.unit}
                          </span>
                        </div>

                        {/* Segmented Stacked Bar */}
                        <div className="w-full bg-[#F3E3E8] rounded-full h-1.5 overflow-hidden flex gap-0.5">
                          {sku.depotBreakdown.map((depot, idx) => {
                            if (depot.onHand <= 0) return null;
                            const palette = getDepotColor(idx);
                            return (
                              <div
                                key={depot.depotId}
                                className={`h-1.5 ${palette.bg} transition-all duration-500`}
                                style={{ width: `${depot.sharePercent}%` }}
                              />
                            );
                          })}
                        </div>

                        {/* Interactive Legend / Share Chips */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-2 text-xs">
                          {sku.depotBreakdown.map((depot, idx) => {
                            const palette = getDepotColor(idx);
                            return (
                              <div key={depot.depotId} className="flex items-center gap-1.5">
                                <span className={`w-2 h-2 rounded-full ${palette.dot}`} />
                                <span className="text-[#4B4350] font-medium">{depot.depotName}:</span>
                                <span className="font-semibold text-[#1F1720] tabular-nums">
                                  {depot.onHand} {sku.unit}
                                </span>
                                <span className="text-[#8A8190] text-[10px] tabular-nums">
                                  ({depot.sharePercent}%)
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Facility Position Status Rows */}
                      <div className="border-t border-[#F3E3E8] pt-2 space-y-1">
                        {sku.depotBreakdown.map((item) => {
                          let statusClass = 'text-[#8A8190]';
                          let statusText = 'Balanced Buffer';
                          let varianceText = '';

                          if (item.status === 'DEFICIT') {
                            statusClass = 'text-[#B42318] font-medium';
                            statusText = 'Deficit Below Safety';
                            varianceText = `Shortfall: -${item.deficitToTarget} to target`;
                          } else if (item.status === 'SURPLUS') {
                            statusClass = 'text-[#1F8A5B] font-medium';
                            statusText = 'Surplus Above Target';
                            varianceText = `Transferable: +${item.surplusAboveTarget} units`;
                          } else {
                            varianceText = `Within safe buffer (${item.targetStock} target)`;
                          }

                          return (
                            <div
                              key={item.depotId}
                              className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-xl bg-[#FFF5F7] border border-[#F3E3E8]"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-[#1F1720] font-medium">{item.depotName}</span>
                                <span className={`text-[10px] ${statusClass}`}>• {statusText}</span>
                              </div>
                              <div className="flex items-center gap-3 text-xs">
                                <span className="text-[#8A8190] hidden sm:inline">{varianceText}</span>
                                <span className="font-semibold text-[#1F1720] tabular-nums">
                                  {item.onHand} <span className="text-[#8A8190] text-[10px] font-normal">on-hand</span>
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
