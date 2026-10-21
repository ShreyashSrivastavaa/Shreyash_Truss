import React, { useState } from 'react';
import { ArrowRight, Truck, Check, AlertCircle, Clock } from 'lucide-react';

export default function OpportunityList({ opportunities, onExecuteTransfer, isExecuting }) {
  // Local state to track custom quantities per opportunity index/key
  const [quantities, setQuantities] = useState({});
  const [activeError, setActiveError] = useState(null);
  const [activeSuccess, setActiveSuccess] = useState(null);

  const getQuantityFor = (opp, index) => {
    return quantities[index] !== undefined ? quantities[index] : opp.recommendedQuantity;
  };

  const handleQuantityChange = (index, val) => {
    setQuantities(prev => ({
      ...prev,
      [index]: val === '' ? '' : parseInt(val, 10)
    }));
  };

  const handleSubmit = async (opp, index) => {
    setActiveError(null);
    setActiveSuccess(null);
    const qty = getQuantityFor(opp, index);

    if (!qty || qty <= 0) {
      setActiveError(`Please enter a valid positive quantity for ${opp.skuName}`);
      return;
    }

    try {
      await onExecuteTransfer({
        skuId: opp.skuId,
        fromDepotId: opp.fromDepotId,
        toDepotId: opp.toDepotId,
        quantity: Number(qty)
      });
      setActiveSuccess(`Dispatched ${qty} units of ${opp.skuName} to ${opp.toDepotName}`);
      // Clear local quantity override
      setQuantities(prev => {
        const copy = { ...prev };
        delete copy[index];
        return copy;
      });
    } catch (err) {
      setActiveError(err.message || 'Transfer failed');
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Truck className="w-5 h-5 text-indigo-400" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
            Detected Rebalancing Opportunities
          </h2>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-medium">
          {opportunities.length} Actionable
        </span>
      </div>

      {/* Global alert messages */}
      {activeError && (
        <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{activeError}</span>
        </div>
      )}

      {activeSuccess && (
        <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{activeSuccess}</span>
        </div>
      )}

      {opportunities.length === 0 ? (
        <div className="p-8 text-center border border-dashed border-slate-800 rounded-lg">
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-2">
            <Check className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-slate-200">Network Fully Balanced</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            No regional deficits detected below safety stock. All depots maintain sufficient local inventory buffers.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {opportunities.map((opp, index) => {
            const currentQty = getQuantityFor(opp, index);
            const isExcessive = currentQty > opp.maxTransferable;

            return (
              <div
                key={`${opp.skuId}-${opp.fromDepotId}-${opp.toDepotId}`}
                className="p-4 rounded-lg bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Left: Routing Details */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-bold text-white">{opp.skuName}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                      {opp.skuId}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400">
                      DEFICIT DETECTED
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-300 flex-wrap">
                    <span className="font-semibold text-emerald-400">{opp.fromDepotName}</span>
                    <span className="text-slate-500 text-[11px]">(On-hand: {opp.donorOnHand}, Safety: {opp.donorSafetyStock})</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="font-semibold text-rose-400">{opp.toDepotName}</span>
                    <span className="text-slate-500 text-[11px]">(On-hand: {opp.recipientOnHand}, Safety: {opp.recipientSafetyStock})</span>
                  </div>

                  <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-400">
                    <span>
                      Max Safe Transfer: <strong className="text-slate-200">{opp.maxTransferable} units</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Recommended Target: <strong className="text-indigo-300">{opp.recommendedQuantity} units</strong>
                    </span>
                  </div>
                </div>

                {/* Right: Quantity Input & Action Button */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-1.5">
                      <label htmlFor={`qty-${index}`} className="text-[11px] text-slate-400">Qty:</label>
                      <input
                        id={`qty-${index}`}
                        type="number"
                        min="1"
                        max={opp.maxTransferable}
                        value={currentQty}
                        onChange={(e) => handleQuantityChange(index, e.target.value)}
                        disabled={isExecuting}
                        className={`w-20 px-2.5 py-1.5 text-xs rounded bg-slate-900 border ${isExcessive ? 'border-rose-500 text-rose-300' : 'border-slate-700 text-white'} text-right focus:outline-none focus:border-indigo-500`}
                      />
                    </div>
                    {isExcessive && (
                      <span className="text-[10px] text-rose-400 mt-1">Exceeds safe stock ({opp.maxTransferable})</span>
                    )}
                  </div>

                  <button
                    onClick={() => handleSubmit(opp, index)}
                    disabled={isExecuting || isExcessive || !currentQty || currentQty <= 0}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>{isExecuting ? 'Dispatching...' : 'Approve Transfer'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
