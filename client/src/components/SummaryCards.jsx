import React from 'react';
import { calculateNetworkTotals } from '../utils/inventoryAnalytics.js';
import { formatINR } from '../lib/format/formatINR.js';

export default function SummaryCards({ summary, inventory, isDetailed = false }) {
  if (!summary && (!inventory || inventory.length === 0)) return null;

  const totals = calculateNetworkTotals(summary, inventory);

  return (
    <section aria-label="Network KPI Strip">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* 1. Total On-Hand */}
        <div className="p-6 rounded-2xl bg-white border border-[#F3E3E8] shadow-card flex flex-col justify-between">
          <span className="text-xs text-[#8A8190] font-medium">Total On-Hand</span>
          <div className="my-1.5 flex items-baseline gap-2">
            <span className="text-[28px] font-semibold text-[#1F1720] tabular-nums tracking-tight">
              {totals.totalOnHand.toLocaleString('en-IN')}
            </span>
            <span className="text-xs text-[#8A8190]">units</span>
          </div>
          <span className="text-xs text-[#8A8190]">Across 3 regional facilities</span>
        </div>

        {/* 2. Net Available */}
        <div className="p-6 rounded-2xl bg-white border border-[#F3E3E8] shadow-card flex flex-col justify-between">
          <span className="text-xs text-[#8A8190] font-medium">Net Available</span>
          <div className="my-1.5 flex items-baseline gap-2">
            <span className="text-[28px] font-semibold text-[#1F1720] tabular-nums tracking-tight">
              {totals.totalNetAvailable.toLocaleString('en-IN')}
            </span>
            {totals.totalReserved > 0 && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#FDF4E3] text-[#B7791F] font-medium">
                {totals.totalReserved} reserved
              </span>
            )}
          </div>
          <span className="text-xs text-[#8A8190]">
            {totals.totalReserved > 0 ? `${totals.totalReserved} units committed to transfers` : 'Zero stock holds committed'}
          </span>
        </div>

        {/* 3. Network Health */}
        <div className="p-6 rounded-2xl bg-white border border-[#F3E3E8] shadow-card flex flex-col justify-between">
          <span className="text-xs text-[#8A8190] font-medium">Network Health</span>
          <div className="my-1.5 flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#FDECEA] text-[#B42318] font-medium tabular-nums">
              {totals.deficitsCount} Deficit
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#FDF4E3] text-[#B7791F] font-medium tabular-nums">
              {totals.balancedCount} Balanced
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#E8F6EF] text-[#1F8A5B] font-medium tabular-nums">
              {totals.surplusesCount} Surplus
            </span>
          </div>
          <span className="text-xs text-[#8A8190]">6 tracked SKU positions</span>
        </div>

        {/* 4. Inventory Value */}
        <div className="p-6 rounded-2xl bg-white border border-[#F3E3E8] shadow-card flex flex-col justify-between">
          <span className="text-xs text-[#8A8190] font-medium">Inventory Value</span>
          <div className="my-1.5 flex items-baseline gap-2">
            <span className="text-[28px] font-semibold text-[#1F1720] tabular-nums tracking-tight">
              {formatINR(totals.totalInventoryValue, { compact: true })}
            </span>
          </div>
          <span className="text-xs text-[#8A8190]">
            {formatINR(totals.totalInventoryValue)} net total
          </span>
        </div>
      </div>
    </section>
  );
}
