import React, { useState } from 'react';
import {
  ArrowRight,
  Truck,
  Check,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { getOpportunityMetrics } from '../utils/opportunityMetrics';

/**
 * Recommended Transfers Section (The Visual Hero):
 * Displays plain-language transfer recommendations:
 * "Move X units of [SKU] from [Donor] to [Recipient]"
 * Includes one-line reason, expandable "Why?" rationale toggle,
 * and prominent "Stage Transfer" primary action button.
 */
export default function OpportunityList({ opportunities, onExecuteTransfer, isExecuting, isDetailed = false }) {
  const [quantities, setQuantities] = useState({});
  const [expandedWhy, setExpandedWhy] = useState({});
  const [activeError, setActiveError] = useState(null);
  const [activeSuccess, setActiveSuccess] = useState(null);
  const [submittingKey, setSubmittingKey] = useState(null);

  const getOpportunityKey = (opp) => `${opp.skuId}-${opp.fromDepotId}-${opp.toDepotId}`;

  const getRawQuantityFor = (opp) => {
    const key = getOpportunityKey(opp);
    return quantities[key] !== undefined ? quantities[key] : opp.recommendedQuantity;
  };

  const handleQuantityChange = (opp, val) => {
    const key = getOpportunityKey(opp);
    setQuantities(prev => ({
      ...prev,
      [key]: val === '' ? '' : parseInt(val, 10)
    }));
  };

  const toggleWhy = (key) => {
    setExpandedWhy(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSubmit = async (opp, metrics) => {
    setActiveError(null);
    setActiveSuccess(null);
    const key = getOpportunityKey(opp);

    if (metrics.validationError) {
      setActiveError(metrics.validationError);
      return;
    }

    setSubmittingKey(key);
    try {
      await onExecuteTransfer({
        skuId: opp.skuId,
        fromDepotId: opp.fromDepotId,
        toDepotId: opp.toDepotId,
        quantity: metrics.qtyNum
      });
      setActiveSuccess(
        `Transfer staged! ${metrics.qtyNum} units of ${opp.skuName} reserved at ${opp.fromDepotName}.`
      );
      setQuantities(prev => {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });
    } catch (err) {
      setActiveError(err.message || 'Transfer order creation failed');
    } finally {
      setSubmittingKey(null);
    }
  };

  return (
    <section className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-xs" aria-label="Recommended Transfers Section">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shrink-0">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold tracking-tight text-white">
                Recommended Transfers
              </h2>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                Action Required
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Automated rebalancing recommendations to eliminate regional stockouts
            </p>
          </div>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700/60 font-medium tabular-nums self-start sm:self-auto">
          {opportunities.length} {opportunities.length === 1 ? 'Actionable Transfer' : 'Actionable Transfers'}
        </span>
      </div>

      {/* Global alert feedback */}
      {activeError && (
        <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{activeError}</span>
          </div>
          <button
            type="button"
            onClick={() => setActiveError(null)}
            className="text-[11px] text-rose-400 hover:text-rose-200 font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {activeSuccess && (
        <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{activeSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setActiveSuccess(null)}
            className="text-[11px] text-emerald-400 hover:text-emerald-200 font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Empty State */}
      {opportunities.length === 0 ? (
        <div className="py-10 px-4 text-center border border-dashed border-slate-800 rounded-xl bg-slate-950/40">
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-2.5 border border-emerald-500/20">
            <Check className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-slate-200">Network Fully Balanced</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
            All regional depots satisfy target holding levels, or incoming shipments are already on the road.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {opportunities.map((opp) => {
            const oppKey = getOpportunityKey(opp);
            const rawVal = getRawQuantityFor(opp);
            const metrics = getOpportunityMetrics(opp, rawVal);
            const isRowSubmitting = submittingKey === oppKey;
            const isWhyOpen = isDetailed || !!expandedWhy[oppKey];

            return (
              <div
                key={oppKey}
                className="rounded-xl bg-slate-950/70 border border-indigo-500/30 p-5 shadow-xs transition hover:border-indigo-500/50 space-y-4"
              >
                {/* Hero Headline & Primary Action */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Headline */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-white">
                        Move {metrics.qtyNum || opp.recommendedQuantity} units of {opp.skuName}
                      </span>
                      <span className="text-xs text-slate-400">from</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 font-medium text-xs border border-emerald-500/25">
                        {opp.fromDepotName}
                      </span>
                      <span className="text-xs text-slate-400">to</span>
                      <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 font-medium text-xs border border-rose-500/25">
                        {opp.toDepotName}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">
                      Eliminates {opp.toDepotName} stockout risk while keeping {opp.fromDepotName} above target buffer.
                    </p>
                  </div>

                  {/* Quantity & Stage Button */}
                  <div className="flex items-center gap-3 shrink-0 self-start lg:self-auto">
                    {/* Custom Quantity Input */}
                    <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-700">
                      <span className="text-[11px] text-slate-400">Units:</span>
                      <input
                        type="number"
                        min="1"
                        max={opp.availableSurplus}
                        value={rawVal}
                        onChange={(e) => handleQuantityChange(opp, e.target.value)}
                        className="w-16 bg-transparent text-xs font-bold text-white focus:outline-none tabular-nums text-right"
                      />
                    </div>

                    {/* Primary Stage Button */}
                    <button
                      type="button"
                      onClick={() => handleSubmit(opp, metrics)}
                      disabled={isExecuting || isRowSubmitting || !!metrics.validationError}
                      className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white font-semibold text-xs transition shadow-xs flex items-center gap-1.5 shrink-0"
                    >
                      <Check className="w-4 h-4" />
                      <span>{isRowSubmitting ? 'Staging...' : 'Stage Transfer'}</span>
                    </button>
                  </div>
                </div>

                {/* Validation Error if user types an unsafe number */}
                {metrics.validationError && (
                  <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span>{metrics.validationError}</span>
                  </div>
                )}

                {/* Expandable "Why?" Rationale Drawer */}
                <div className="border-t border-slate-800/80 pt-3">
                  {!isDetailed && (
                    <button
                      type="button"
                      onClick={() => toggleWhy(oppKey)}
                      className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium transition"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>{isWhyOpen ? 'Hide Rationale' : 'Why this recommendation?'}</span>
                      {isWhyOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  )}

                  {isWhyOpen && (
                    <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs">
                      <div>
                        <span className="text-slate-400 text-[11px] block">Donor Surplus</span>
                        <span className="font-semibold text-emerald-400 tabular-nums">
                          +{opp.availableSurplus} units available
                        </span>
                        <p className="text-[10px] text-slate-500 mt-0.5">Above target buffer at {opp.fromDepotName}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px] block">Recipient Shortage</span>
                        <span className="font-semibold text-rose-400 tabular-nums">
                          -{opp.recipientDeficit} units needed
                        </span>
                        <p className="text-[10px] text-slate-500 mt-0.5">To restore {opp.toDepotName} to safe holding</p>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px] block">Protected Holding Invariant</span>
                        <span className="font-semibold text-slate-200">
                          Donor Safety Stock Guaranteed
                        </span>
                        <p className="text-[10px] text-slate-500 mt-0.5">Origin depot will never fall below safety levels</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
