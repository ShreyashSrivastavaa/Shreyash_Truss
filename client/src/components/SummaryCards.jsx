import React from 'react';
import { Warehouse, Lock, Scale, Activity } from 'lucide-react';
import { calculateNetworkTotals } from '../utils/inventoryAnalytics.js';

export default function SummaryCards({ summary, inventory, isDetailed = false }) {
  if (!summary && (!inventory || inventory.length === 0)) return null;

  const totals = calculateNetworkTotals(summary, inventory);

  return (
    <section aria-label="Network KPI Strip">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* 1. Total On-Hand */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-slate-400">Total On-Hand</span>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border bg-slate-800 text-slate-300 border-slate-700/60">
              Physical
            </span>
          </div>
          <div className="my-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-white tabular-nums">
              {totals.totalOnHand.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400">units</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 mt-2 pt-2 border-t border-slate-800/80">
            <span className="text-[11px] text-slate-400">Stock physically in depots</span>
            <Warehouse className="w-3.5 h-3.5 text-indigo-400 opacity-80" />
          </div>
        </div>

        {/* 2. Reserved */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-slate-400">Reserved</span>
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
              totals.totalReserved > 0
                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                : 'bg-slate-800 text-slate-400 border-slate-700/40'
            }`}>
              {totals.totalReserved > 0 ? 'Committed' : 'Zero Hold'}
            </span>
          </div>
          <div className="my-1 flex items-baseline gap-1.5">
            <span className={`text-2xl font-bold tracking-tight tabular-nums ${
              totals.totalReserved > 0 ? 'text-amber-300' : 'text-white'
            }`}>
              {totals.totalReserved.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400">units</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 mt-2 pt-2 border-t border-slate-800/80">
            <span className="text-[11px] text-slate-400">Committed to staged transfers</span>
            <Lock className={`w-3.5 h-3.5 opacity-80 ${totals.totalReserved > 0 ? 'text-amber-400' : 'text-slate-500'}`} />
          </div>
        </div>

        {/* 3. Net Available */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-slate-400">Net Available</span>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border bg-emerald-500/10 text-emerald-300 border-emerald-500/25">
              Free Stock
            </span>
          </div>
          <div className="my-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-emerald-400 tabular-nums">
              {totals.totalNetAvailable.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400">units</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 mt-2 pt-2 border-t border-slate-800/80">
            <span className="text-[11px] text-slate-400">On-hand minus reserved</span>
            <Scale className="w-3.5 h-3.5 text-emerald-400 opacity-80" />
          </div>
        </div>

        {/* 4. Network Health */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-slate-400">Network Health</span>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border bg-slate-800 text-slate-300 border-slate-700/60">
              {totals.totalTrackedItems} Positions
            </span>
          </div>
          <div className="my-1.5 flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30 tabular-nums">
              {totals.deficitsCount} Deficit
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 tabular-nums">
              {totals.balancedCount} Balanced
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 tabular-nums">
              {totals.surplusesCount} Surplus
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 mt-2 pt-2 border-t border-slate-800/80">
            <span className="text-[11px] text-slate-400">Across {totals.totalDepots} regional depots</span>
            <Activity className="w-3.5 h-3.5 text-indigo-400 opacity-80" />
          </div>
        </div>
      </div>
    </section>
  );
}
