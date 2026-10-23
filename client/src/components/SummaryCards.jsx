import React from 'react';
import { AlertTriangle, CheckCircle2, TrendingUp, Warehouse, Truck } from 'lucide-react';

export default function SummaryCards({ summary }) {
  if (!summary) return null;

  const cards = [
    {
      title: 'Active Deficits',
      value: summary.deficitsCount,
      description: 'Stock below safety threshold',
      icon: AlertTriangle,
      color: 'rose',
      border: 'border-rose-500/30',
      bg: 'bg-rose-500/10',
      text: 'text-rose-400',
      badge: 'Urgent'
    },
    {
      title: 'Available Surpluses',
      value: summary.surplusesCount,
      description: 'Stock available above target',
      icon: TrendingUp,
      color: 'emerald',
      border: 'border-emerald-500/30',
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      badge: 'Transferable'
    },
    {
      title: 'In-Transit Freight',
      value: `${summary.inTransitUnits ?? 0} units`,
      description: 'En route between regional depots',
      icon: Truck,
      color: 'sky',
      border: 'border-sky-500/30',
      bg: 'bg-sky-500/10',
      text: 'text-sky-400',
      badge: 'Pipeline'
    },
    {
      title: 'Balanced Stock',
      value: summary.balancedCount,
      description: 'Between safety and target levels',
      icon: CheckCircle2,
      color: 'indigo',
      border: 'border-indigo-500/30',
      bg: 'bg-indigo-500/10',
      text: 'text-indigo-400',
      badge: 'Stable'
    },
    {
      title: 'Monitored Network',
      value: `${summary.totalDepots} Depots / ${summary.totalSkus} SKUs`,
      description: `${summary.totalTrackedItems} total facility-SKU positions`,
      icon: Warehouse,
      color: 'slate',
      border: 'border-slate-800',
      bg: 'bg-slate-800/60',
      text: 'text-slate-300',
      badge: 'Connected'
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
            <div className="flex items-center justify-between text-xs text-slate-400 mt-2 pt-2 border-t border-slate-800/80">
              <span className="truncate text-[11px]">{card.description}</span>
              <Icon className={`w-4 h-4 ${card.text} shrink-0`} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
