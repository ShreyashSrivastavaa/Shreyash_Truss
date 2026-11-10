import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

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
    <section className="space-y-4" aria-label="Depot Health Matrix">
      {/* Section Header */}
      <div>
        <h2 className="text-lg font-semibold text-[#1F1720]">
          Depot Health
        </h2>
        <p className="text-xs text-[#8A8190] mt-0.5">
          Live stock levels versus target holding across regional warehouses
        </p>
      </div>

      {/* 3-Column Grid for Depots */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {depots.map(depot => {
          const depotItems = inventory.filter(item => item.depotId === depot.id);
          const isExpanded = isDetailed || !!expandedDepots[depot.id];

          return (
            <div
              key={depot.id}
              className="rounded-2xl bg-white border border-[#F3E3E8] p-6 shadow-card flex flex-col justify-between space-y-5 hover:border-[#E11D48]/30 transition"
            >
              {/* Depot Header */}
              <div className="border-b border-[#F3E3E8] pb-3 flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-[#1F1720]">{depot.name}</h3>
                  <p className="text-xs text-[#8A8190] mt-0.5">{depot.city}</p>
                  <span className="text-[10px] text-[#8A8190]">{depot.id}</span>
                </div>
                {!isDetailed && (
                  <button
                    type="button"
                    onClick={() => toggleExpand(depot.id)}
                    className="text-[#8A8190] hover:text-[#1F1720] text-xs flex items-center gap-1 transition"
                  >
                    <span>{isExpanded ? 'Less' : 'Details'}</span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>

              {/* SKU List (No nested boxed containers, clean dividers) */}
              <div className="space-y-4">
                {depotItems.map(item => {
                  const isDeficit = item.status === 'DEFICIT';
                  const isSurplus = item.status === 'SURPLUS';
                  const percentOfTarget = Math.min(100, Math.round((item.onHand / item.targetStock) * 100));

                  let statusPillClass = 'bg-[#FDF4E3] text-[#B7791F]';
                  let barClass = 'bg-[#B7791F]';
                  let statusLabel = 'Balanced';

                  if (isDeficit) {
                    statusPillClass = 'bg-[#FDECEA] text-[#B42318]';
                    barClass = 'bg-[#B42318]';
                    statusLabel = 'Deficit';
                  } else if (isSurplus) {
                    statusPillClass = 'bg-[#E8F6EF] text-[#1F8A5B]';
                    barClass = 'bg-[#1F8A5B]';
                    statusLabel = 'Surplus';
                  }

                  const reserved = item.reserved ?? 0;
                  const inTransit = item.inTransit ?? 0;
                  const netAvailable = item.netAvailable ?? (item.onHand - reserved);

                  return (
                    <div key={item.skuId} className="space-y-2">
                      {/* SKU Name & Status Pill */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-[#1F1720] truncate" title={item.skuName}>
                          {item.skuName}
                        </span>
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0 ${statusPillClass}`}>
                          {statusLabel}
                        </span>
                      </div>

                      {/* On-Hand vs Target */}
                      <div className="flex items-baseline justify-between text-xs text-[#4B4350]">
                        <div>
                          <span className="text-[#8A8190] text-[11px]">On-Hand: </span>
                          <span className="font-semibold text-[#1F1720] tabular-nums">{item.onHand}</span>
                        </div>
                        <div>
                          <span className="text-[#8A8190] text-[11px]">Target: </span>
                          <span className="font-medium text-[#4B4350] tabular-nums">{item.targetStock}</span>
                        </div>
                      </div>

                      {/* Thin 6px rounded progress track */}
                      <div className="w-full bg-[#F3E3E8] rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${barClass}`}
                          style={{ width: `${percentOfTarget}%` }}
                        />
                      </div>

                      {/* Expandable Details */}
                      {isExpanded && (
                        <div className="pt-2 grid grid-cols-2 gap-2 text-[11px] text-[#8A8190]">
                          <div>
                            <span>Safety Buffer: </span>
                            <span className="font-medium text-[#1F1720] tabular-nums">{item.safetyStock}</span>
                          </div>
                          <div className="text-right">
                            <span>Available: </span>
                            <span className="font-medium text-[#1F8A5B] tabular-nums">{netAvailable}</span>
                          </div>
                          {reserved > 0 && (
                            <div className="text-[#B7791F]">
                              Reserved: -{reserved}
                            </div>
                          )}
                          {inTransit > 0 && (
                            <div className="text-[#5B5BD6] text-right">
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
