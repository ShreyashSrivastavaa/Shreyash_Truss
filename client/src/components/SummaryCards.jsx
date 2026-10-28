import React from 'react';
import { Warehouse, Lock, Truck, Scale, Layers } from 'lucide-react';
import { calculateNetworkTotals } from '../utils/inventoryAnalytics.js';

export default function SummaryCards({ summary, inventory }) {
  if (!summary && (!inventory || inventory.length === 0)) return null;

  const totals = calculateNetworkTotals(summary, inventory);

  const cards = [
    {
      title: 'Total On-Hand Stock',
      value: totals.totalOnHand.toLocaleString(),
      unit: 'units',
      description: 'Physical stock verified in depots',
      icon: Warehouse,
      badge: 'Physical',
      badgeClass: 'bg-slate-800 text-slate-300 border-slate-700/60',
      iconClass: 'text-indigo-400'
    },
    {
      title: 'Reserved Stock',
      value: totals.totalReserved.toLocaleString(),
      unit: 'units',
      description: totals.totalReserved > 0 ? 'Committed to pending transfers' : 'Zero hold — fully allocatable',
      icon: Lock,
      badge: totals.totalReserved > 0 ? 'Committed' : 'Zero Hold',
      badgeClass: totals.totalReserved > 0 ? 'bg-amber-500/10 text-amber-300 border-amber-500/25' : 'bg-slate-800/50 text-slate-400 border-slate-700/40',
      iconClass: totals.totalReserved > 0 ? 'text-amber-400' : 'text-slate-400',
      valueColor: totals.totalReserved > 0 ? 'text-amber-300' : 'text-white'
    },
    {
      title: 'In-Transit Freight',
      value: totals.totalInTransit.toLocaleString(),
      unit: 'units',
      description: totals.totalInTransit > 0 ? 'En route between regional depots' : 'No active freight on road',
      icon: Truck,
      badge: totals.totalInTransit > 0 ? 'En Route' : 'Pipeline Idle',
      badgeClass: totals.totalInTransit > 0 ? 'bg-sky-500/10 text-sky-300 border-sky-500/25' : 'bg-slate-800/50 text-slate-400 border-slate-700/40',
      iconClass: totals.totalInTransit > 0 ? 'text-sky-400' : 'text-slate-400',
      valueColor: totals.totalInTransit > 0 ? 'text-sky-300' : 'text-white'
    },
    {
      title: 'Net Available Stock',
      value: totals.totalNetAvailable.toLocaleString(),
      unit: 'units',
      description: 'Physical stock minus reservations',
      icon: Scale,
      badge: 'Unencumbered',
      badgeClass: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25',
      iconClass: 'text-emerald-400'
    },
    {
      title: 'Position Health',
      value: totals.totalTrackedItems,
      unit: 'positions',
      description: `${totals.totalDepots} Depots • ${totals.totalSkus} SKUs`,
      icon: Layers,
      badge: 'Network',
      badgeClass: 'bg-slate-800 text-slate-300 border-slate-700/60',
      iconClass: 'text-indigo-400',
      isPositionHealth: true
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={index}
            className="p-4 sm:p-4.5 rounded-xl bg-slate-900/75 border border-slate-800/80 shadow-xs hover:border-slate-700/80 transition-colors flex flex-col justify-between"
          >
            {/* Header: Label and Badge */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-400 tracking-wide">{card.title}</span>
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${card.badgeClass}`}>
                {card.badge}
              </span>
            </div>

            {/* Metric Value */}
            <div className="my-1.5 flex items-baseline gap-1.5">
              <span className={`text-2xl font-bold tracking-tight tabular-nums ${card.valueColor || 'text-white'}`}>
                {card.value}
              </span>
              <span className="text-xs font-normal text-slate-400">{card.unit}</span>
            </div>

            {/* Bottom context / subtext */}
            {card.isPositionHealth ? (
              <div className="flex items-center gap-1.5 mt-2 pt-2.5 border-t border-slate-800/80">
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/25 tabular-nums">
                  {totals.deficitsCount} Deficit
                </span>
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 tabular-nums">
                  {totals.surplusesCount} Surplus
                </span>
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60 tabular-nums">
                  {totals.balancedCount} Balanced
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-between text-xs text-slate-400 mt-2 pt-2.5 border-t border-slate-800/80">
                <span className="truncate text-[11px] text-slate-400">{card.description}</span>
                <Icon className={`w-3.5 h-3.5 ${card.iconClass} shrink-0 ml-1 opacity-80`} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
