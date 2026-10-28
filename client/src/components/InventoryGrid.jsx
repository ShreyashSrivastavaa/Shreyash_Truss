import React from 'react';
import { Warehouse, MapPin, Truck, Lock } from 'lucide-react';

export default function InventoryGrid({ depots, inventory }) {
  if (!depots || !inventory) return null;

  return (
    <div className="bg-slate-900/75 border border-slate-800/80 rounded-xl p-4 sm:p-5 shadow-xs">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-5 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shrink-0">
            <Warehouse className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-normal text-slate-100">
              Regional Depot Inventory Matrix
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Physical depot stock, allocated reservations, and target protection buffers across network nodes
            </p>
          </div>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700/60 font-medium tabular-nums self-start sm:self-auto">
          {depots.length} Regional Facilities
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
        {depots.map(depot => {
          const depotItems = inventory.filter(item => item.depotId === depot.id);

          return (
            <div
              key={depot.id}
              className="rounded-xl bg-slate-950/50 border border-slate-800/80 p-4 sm:p-4.5 flex flex-col justify-between hover:border-slate-700/80 transition-colors shadow-xs"
            >
              {/* Depot Header */}
              <div className="border-b border-slate-800/70 pb-3 mb-3.5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold text-white">{depot.name}</h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                    {depot.region}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>{depot.city}</span>
                </div>
              </div>

              {/* SKU List for this Depot */}
              <div className="space-y-3">
                {depotItems.map(item => {
                  const percentOfTarget = Math.min(100, Math.round((item.onHand / item.targetStock) * 100));
                  const isDeficit = item.status === 'DEFICIT';
                  const isSurplus = item.status === 'SURPLUS';
                  const reserved = item.reserved ?? 0;
                  const inTransit = item.inTransit ?? 0;
                  const netAvailable = item.netAvailable ?? (item.onHand - reserved);

                  let badgeColor = 'bg-slate-800 text-slate-300 border-slate-700/60';
                  let barColor = 'bg-indigo-500';

                  if (isDeficit) {
                    badgeColor = 'bg-rose-500/10 text-rose-300 border-rose-500/25';
                    barColor = 'bg-rose-500';
                  } else if (isSurplus) {
                    badgeColor = 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25';
                    barColor = 'bg-emerald-500';
                  }

                  return (
                    <div key={item.skuId} className="bg-slate-900/60 rounded-xl p-3.5 border border-slate-800/70 space-y-2">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="text-xs font-semibold text-slate-200">{item.skuName}</span>
                        <div className="flex items-center gap-1.5">
                          {inTransit > 0 && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-sky-500/10 text-sky-300 border border-sky-500/25 tabular-nums">
                              <Truck className="w-2.5 h-2.5 text-sky-400" />
                              +{inTransit} Transit
                            </span>
                          )}
                          {reserved > 0 && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/25 tabular-nums">
                              <Lock className="w-2.5 h-2.5 text-amber-400" />
                              -{reserved} Res
                            </span>
                          )}
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${badgeColor}`}>
                            {item.status}
                          </span>
                        </div>
                      </div>

                      {/* On-hand vs Thresholds */}
                      <div className="flex items-baseline justify-between text-xs text-slate-300 pt-0.5">
                        <div>
                          <span className="text-xs text-slate-400">On-Hand: </span>
                          <span className="font-bold text-white text-sm tabular-nums">{item.onHand}</span>{' '}
                          <span className="text-xs text-slate-400">{item.unit}</span>
                          <span className="text-slate-500 text-[11px] ml-1.5">
                            (Avail: <strong className="text-slate-300 font-semibold tabular-nums">{netAvailable}</strong>)
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 space-x-2 tabular-nums">
                          <span>Safety: <strong className="text-slate-300 font-semibold">{item.safetyStock}</strong></span>
                          <span>Target: <strong className="text-slate-300 font-semibold">{item.targetStock}</strong></span>
                        </div>
                      </div>

                      {/* Visual Stock Level Progress Bar */}
                      <div className="w-full bg-slate-800/90 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full ${barColor} transition-all duration-500`}
                          style={{ width: `${percentOfTarget}%` }}
                        ></div>
                      </div>

                      {/* Contextual Subtitle */}
                      <div className="text-[10px] text-slate-400 pt-0.5 flex items-center justify-between">
                        {isDeficit && (
                          <span className="text-rose-400 font-medium tabular-nums">
                            Shortfall to Safety: -{item.deficitToSafety} {item.unit}
                          </span>
                        )}
                        {isSurplus && (
                          <span className="text-emerald-400 font-medium tabular-nums">
                            Transferable Surplus: +{item.availableSurplus} {item.unit}
                          </span>
                        )}
                        {!isDeficit && !isSurplus && (
                          <span className="text-slate-400">Within normal operating buffer</span>
                        )}
                        <span className="text-slate-500 font-mono text-[9px]">{item.skuId}</span>
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
  );
}
