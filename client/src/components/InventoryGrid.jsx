import React, { useState } from 'react';
import { Warehouse, MapPin, ChevronDown, ChevronUp, Info } from 'lucide-react';

/**
 * Unified Depot Health Matrix:
 * Displays all 3 depots x 2 SKUs in one compact grid.
 * Color-coded chips: green Surplus, amber Balanced, red Deficit.
 * Default view shows On-Hand vs Target only.
 * Detailed view or per-card expansion reveals Safety, Reserved, Available, and In-Transit.
 */
export default function InventoryGrid({ depots, inventory, isDetailed = false }) {
  const [expandedDepots, setExpandedDepots] = useState({});

  if (!depots || !inventory) return null;

  const toggleExpand = (depotId) => {
    setExpandedDepots(prev => ({
      ...prev,
      [depotId]: !prev[depotId]
    }));
  };

  return (
    <section className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-xs" aria-label="Depot Health Matrix">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shrink-0">
            <Warehouse className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold tracking-tight text-slate-100">
              Depot Health
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live stock levels vs ideal targets across regional warehouses
            </p>
          </div>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700/60 font-medium tabular-nums self-start sm:self-auto">
          {depots.length} Regional Facilities
        </span>
      </div>

      {/* Compact 3-Column Grid for the 3 Depots */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {depots.map(depot => {
          const depotItems = inventory.filter(item => item.depotId === depot.id);
          const isExpanded = isDetailed || !!expandedDepots[depot.id];

          return (
            <div
              key={depot.id}
              className="rounded-xl bg-slate-950/60 border border-slate-800 p-4 flex flex-col justify-between hover:border-slate-700/80 transition-colors shadow-xs"
            >
              {/* Depot Header */}
              <div className="border-b border-slate-800/80 pb-3 mb-3 flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-semibold text-white">{depot.name}</h3>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/40">
                      {depot.id}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                    <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                    <span>{depot.city}, {depot.region}</span>
                  </div>
                </div>
                {!isDetailed && (
                  <button
                    type="button"
                    onClick={() => toggleExpand(depot.id)}
                    className="text-slate-400 hover:text-slate-200 text-xs flex items-center gap-1 px-2 py-1 rounded-md bg-slate-850 hover:bg-slate-800 border border-slate-700/50 transition"
                    title={isExpanded ? 'Hide safety & available details' : 'Show safety & available details'}
                  >
                    <span>{isExpanded ? 'Less' : 'Details'}</span>
                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                )}
              </div>

              {/* SKU List (2 SKUs per Depot) */}
              <div className="space-y-3">
                {depotItems.map(item => {
                  const isDeficit = item.status === 'DEFICIT';
                  const isSurplus = item.status === 'SURPLUS';
                  const percentOfTarget = Math.min(100, Math.round((item.onHand / item.targetStock) * 100));

                  // Status badge styling
                  let statusChipClass = 'bg-amber-500/10 text-amber-300 border-amber-500/30';
                  let barClass = 'bg-amber-500';
                  let statusLabel = 'Balanced';

                  if (isDeficit) {
                    statusChipClass = 'bg-rose-500/15 text-rose-300 border-rose-500/30';
                    barClass = 'bg-rose-500';
                    statusLabel = 'Deficit';
                  } else if (isSurplus) {
                    statusChipClass = 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
                    barClass = 'bg-emerald-500';
                    statusLabel = 'Surplus';
                  }

                  const reserved = item.reserved ?? 0;
                  const inTransit = item.inTransit ?? 0;
                  const netAvailable = item.netAvailable ?? (item.onHand - reserved);

                  return (
                    <div
                      key={item.skuId}
                      className="bg-slate-900/70 rounded-lg p-3 border border-slate-800/80 space-y-2 hover:border-slate-700 transition"
                    >
                      {/* SKU Name & Status Chip */}
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="text-xs font-semibold text-slate-200 truncate" title={item.skuName}>
                          {item.skuName}
                        </span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${statusChipClass}`}>
                          {statusLabel}
                        </span>
                      </div>

                      {/* On-Hand vs Target (The Primary Metric) */}
                      <div className="flex items-baseline justify-between text-xs text-slate-300">
                        <div>
                          <span className="text-slate-400 text-[11px]">On-Hand: </span>
                          <span className="font-bold text-white text-sm tabular-nums">{item.onHand}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-slate-400 text-[11px]">Target: </span>
                          <span className="font-semibold text-slate-200 tabular-nums">{item.targetStock}</span>
                        </div>
                      </div>

                      {/* Visual Stock Meter against Target */}
                      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${barClass}`}
                          style={{ width: `${percentOfTarget}%` }}
                        />
                      </div>

                      {/* Expandable Details (Safety, Reserved, Available, In-Transit) */}
                      {isExpanded && (
                        <div className="pt-2 mt-1 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                          <div>
                            <span className="text-slate-400">Safety Buffer: </span>
                            <span className="font-medium text-slate-300 tabular-nums">{item.safetyStock}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-slate-400">Available: </span>
                            <span className="font-semibold text-emerald-400 tabular-nums">{netAvailable}</span>
                          </div>
                          {reserved > 0 && (
                            <div className="text-amber-400 font-medium">
                              Reserved: -{reserved}
                            </div>
                          )}
                          {inTransit > 0 && (
                            <div className="text-sky-400 font-medium text-right">
                              In-Transit: +{inTransit}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
