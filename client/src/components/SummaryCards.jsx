import React from 'react';
import { Warehouse, Lock, Truck, Scale, Layers } from 'lucide-react';
import { calculateNetworkTotals } from '../utils/inventoryAnalytics.js';

export default function SummaryCards({ summary, inventory }) {
  if (!summary && (!inventory || inventory.length === 0)) return null;

  const totals = calculateNetworkTotals(summary, inventory);

  const cards = [
    {
      title: 'Total On-Hand Stock',
      value: `${totals.totalOnHand.toLocaleString()} units`,
      description: 'Physical stock verified in depots',
      icon: Warehouse,
      border: 'border-indigo-500/30',
      bg: 'bg-indigo-500/10',
      text: 'text-indigo-400',
      badge: 'Physical'
    },
    {
      title: 'Reserved Stock',
      value: `${totals.totalReserved.toLocaleString()} units`,
      description: 'Committed to pending transfers',
      icon: Lock,
      border: totals.totalReserved > 0 ? 'border-amber-500/40' : 'border-slate-800',
      bg: totals.totalReserved > 0 ? 'bg-amber-500/10' : 'bg-slate-800/60',
      text: totals.totalReserved > 0 ? 'text-amber-400' : 'text-slate-400',
      badge: totals.totalReserved > 0 ? 'Committed' : 'Zero Hold'
    },
    {
      title: 'In-Transit Freight',
      value: `${totals.totalInTransit.toLocaleString()} units`,
      description: 'En route between regional depots',
      icon: Truck,
      border: totals.totalInTransit > 0 ? 'border-sky-500/40' : 'border-slate-800',
      bg: totals.totalInTransit > 0 ? 'bg-sky-500/10' : 'bg-slate-800/60',
      text: totals.totalInTransit > 0 ? 'text-sky-400' : 'text-slate-400',
      badge: totals.totalInTransit > 0 ? 'En Route' : 'Pipeline Idle'
    },
    {
      title: 'Net Available Stock',
      value: `${totals.totalNetAvailable.toLocaleString()} units`,
      description: 'Physical stock minus reservations',
      icon: Scale,
      border: 'border-emerald-500/30',
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      badge: 'Unencumbered'
    },
    {
      title: 'Position Health',
      value: `${totals.totalTrackedItems} Positions`,
      description: `${totals.totalDepots} Depots • ${totals.totalSkus} SKUs`,
      icon: Layers,
      border: 'border-slate-800',
      bg: 'bg-slate-800/60',
      text: 'text-slate-300',
      badge: 'Network',
      isPositionHealth: true
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={index}
            className={`p-4 rounded-xl bg-slate-900/80 border ${card.border} shadow-lg backdrop-blur-xs flex flex-col justify-between`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400">{card.title}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${card.bg} ${card.text}`}>
                {card.badge}
              </span>
            </div>

            <div className="flex items-baseline gap-2 my-1">
              <span className="text-2xl font-extrabold text-white">{card.value}</span>
            </div>

            {card.isPositionHealth ? (
              <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-slate-800/80">
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {totals.deficitsCount} Deficit
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {totals.surplusesCount} Surplus
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {totals.balancedCount} Balanced
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-between text-xs text-slate-400 mt-2 pt-2 border-t border-slate-800/80">
                <span className="truncate text-[11px]">{card.description}</span>
                <Icon className={`w-4 h-4 ${card.text} shrink-0`} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
