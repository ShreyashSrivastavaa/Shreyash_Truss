import React from 'react';
import { Warehouse, MapPin, Truck, Lock } from 'lucide-react';

export default function InventoryGrid({ depots, inventory }) {
  if (!depots || !inventory) return null;

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg">
      <div className="flex items-center gap-2 mb-4">
        <Warehouse className="w-5 h-5 text-indigo-400" />
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
          Regional Depot Inventory Matrix
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {depots.map(depot => {
          const depotItems = inventory.filter(item => item.depotId === depot.id);

          return (
            <div
              key={depot.id}
              className="rounded-lg bg-slate-950/60 border border-slate-800/80 p-4 flex flex-col justify-between"
            >
              {/* Depot Header */}
              <div className="border-b border-slate-800 pb-3 mb-3">
                <div className="flex items-start justify-between">
                  <h3 className="text-sm font-bold text-white">{depot.name}</h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                    {depot.region}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-1">
                  <MapPin className="w-3 h-3 text-slate-500" />
                  <span>{depot.city}</span>
                </div>
              </div>

              {/* SKU List for this Depot */}
              <div className="space-y-4">
                {depotItems.map(item => {
                  const percentOfTarget = Math.min(100, Math.round((item.onHand / item.targetStock) * 100));
                  const isDeficit = item.status === 'DEFICIT';
                  const isSurplus = item.status === 'SURPLUS';
                  const reserved = item.reserved ?? 0;
                  const inTransit = item.inTransit ?? 0;
                  const netAvailable = item.netAvailable ?? (item.onHand - reserved);

                  let badgeColor = 'bg-slate-800 text-slate-300 border-slate-700';
                  let barColor = 'bg-indigo-500';

                  if (isDeficit) {
                    badgeColor = 'bg-rose-500/20 text-rose-300 border-rose-500/30';
                    barColor = 'bg-rose-500';
                  } else if (isSurplus) {
                    badgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
                    barColor = 'bg-emerald-500';
                  }

                  return (
                    <div key={item.skuId} className="bg-slate-900/60 rounded-md p-3 border border-slate-800/60">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-semibold text-slate-200">{item.skuName}</span>
                        <div className="flex items-center gap-1.5">
                          {inTransit > 0 && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                              <Truck className="w-2.5 h-2.5 animate-pulse" />
                              +{inTransit} In-Transit
                            </span>
                          )}
                          {reserved > 0 && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              <Lock className="w-2.5 h-2.5" />
                              -{reserved} Reserved
                            </span>
                          )}
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeColor}`}>
                            {item.status}
                          </span>
                        </div>
                      </div>

                      {/* On-hand vs Thresholds */}
                      <div className="flex items-baseline justify-between text-xs text-slate-300 my-1">
                        <div>
                          On-Hand: <span className="font-bold text-white text-sm">{item.onHand}</span> {item.unit}
                          <span className="text-slate-500 text-[11px] ml-1.5">
                            (Avail: <strong className="text-slate-300">{netAvailable}</strong>)
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 space-x-2">
                          <span>Safety: <strong className="text-slate-300">{item.safetyStock}</strong></span>
                          <span>Target: <strong className="text-slate-300">{item.targetStock}</strong></span>
                        </div>
                      </div>

                      {/* Visual Stock Level Progress Bar */}
                      <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full ${barColor} transition-all duration-500`}
                          style={{ width: `${percentOfTarget}%` }}
                        ></div>
                      </div>

                      {/* Contextual Subtitle */}
                      <div className="text-[10px] text-slate-400 mt-2 flex items-center justify-between">
                        {isDeficit && (
                          <span className="text-rose-400 font-medium">
                            Shortfall to Safety: {item.deficitToSafety} {item.unit}
                          </span>
                        )}
                        {isSurplus && (
                          <span className="text-emerald-400 font-medium">
                            Transferable Surplus: {item.availableSurplus} {item.unit}
                          </span>
                        )}
                        {!isDeficit && !isSurplus && (
                          <span className="text-slate-400">Within normal operating range</span>
                        )}
                        <span className="text-slate-500 font-mono">{item.skuId}</span>
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
