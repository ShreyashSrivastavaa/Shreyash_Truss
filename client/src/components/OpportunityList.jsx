import React, { useState } from 'react';
import {
  ArrowRight,
  Truck,
  Check,
  AlertCircle,
  PackagePlus,
  Info,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import { getOpportunityMetrics } from '../utils/opportunityMetrics';

export default function OpportunityList({ opportunities, onExecuteTransfer, isExecuting }) {
  // Local state to track custom quantities per opportunity unique key (skuId-fromDepotId-toDepotId)
  const [quantities, setQuantities] = useState({});
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

  const handlePresetClick = (opp, presetQty) => {
    const key = getOpportunityKey(opp);
    setQuantities(prev => ({
      ...prev,
      [key]: presetQty
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
        `Staged transfer order (PENDING) for ${metrics.qtyNum} units of ${opp.skuName} from ${opp.fromDepotName} to ${opp.toDepotName}. Reserved at source dock.`
      );
      // Clear local quantity override for this specific opportunity
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
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg">
      {/* Header bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Truck className="w-5 h-5 text-indigo-400" />
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              Detected Rebalancing Opportunities
            </h2>
            <p className="text-[11px] text-slate-400">
              Deterministic lateral transfer recommendations based on protected target-stock buffers
            </p>
          </div>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-medium">
          {opportunities.length} Actionable
        </span>
      </div>

      {/* Global alert feedback */}
      {activeError && (
        <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{activeError}</span>
          </div>
          <button
            onClick={() => setActiveError(null)}
            className="text-[11px] text-rose-400 hover:text-rose-200 font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {activeSuccess && (
        <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{activeSuccess}</span>
          </div>
          <button
            onClick={() => setActiveSuccess(null)}
            className="text-[11px] text-emerald-400 hover:text-emerald-200 font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Empty State */}
      {opportunities.length === 0 ? (
        <div className="p-8 text-center border border-dashed border-slate-800 rounded-lg">
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-2">
            <Check className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-slate-200">Network Inventory Fully Balanced</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            All regional depots currently satisfy their protected target-stock buffers, or active replenishment shipments are already en route in the inbound pipeline.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {opportunities.map((opp) => {
            const oppKey = getOpportunityKey(opp);
            const rawVal = getRawQuantityFor(opp);
            const metrics = getOpportunityMetrics(opp, rawVal);
            const isRowSubmitting = submittingKey === oppKey;
            const isButtonDisabled = isExecuting || isRowSubmitting || Boolean(metrics.validationError) || metrics.effectiveMaxTransferable <= 0;

            return (
              <div
                key={oppKey}
                className="p-4 sm:p-5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700/80 transition shadow-sm space-y-4"
              >
                {/* 1. Header & Routing Overview */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/60 pb-3">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-sm font-bold text-white">{opp.skuName}</span>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono font-semibold">
                      {opp.skuId}
                    </span>
                    {opp.urgency === 'HIGH' ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        <ShieldAlert className="w-3 h-3 text-rose-400" />
                        CRITICAL DEFICIT (BELOW SAFETY)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        <Info className="w-3 h-3 text-amber-400" />
                        BELOW TARGET BUFFER
                      </span>
                    )}
                  </div>

                  {/* Route Summary */}
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
                    <span className="text-emerald-400 font-semibold">{opp.fromDepotName}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="text-rose-400 font-semibold">{opp.toDepotName}</span>
                  </div>
                </div>

                {/* 2. Side-by-Side Donor vs Recipient Inventory Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {/* Donor (Source) Panel */}
                  <div className="p-3.5 rounded-lg bg-slate-900/60 border border-emerald-500/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Source Donor: {opp.fromDepotName}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 font-medium">
                        SURPLUS
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-1">
                      <div>
                        On-Hand Stock: <strong className="text-slate-200">{metrics.donorOnHand}</strong>
                      </div>
                      <div>
                        Reserved Stock: <strong className="text-slate-200">{metrics.donorReserved}</strong>
                      </div>
                      <div>
                        Target Threshold: <strong className="text-slate-200">{metrics.donorTarget}</strong>
                      </div>
                      <div>
                        Safety Floor: <strong className="text-slate-200">{metrics.donorSafety}</strong>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-slate-300">Safe Transferable Surplus:</span>
                      <span className="font-bold text-emerald-400 font-mono text-sm">
                        {metrics.maxSafeTransfer} units
                      </span>
                    </div>
                  </div>

                  {/* Recipient (Destination) Panel */}
                  <div className="p-3.5 rounded-lg bg-slate-900/60 border border-rose-500/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-rose-400 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Destination Recipient: {opp.toDepotName}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-300 font-medium">
                        DEFICIT
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-1">
                      <div>
                        On-Hand Stock: <strong className="text-slate-200">{metrics.destOnHand}</strong>
                      </div>
                      <div>
                        Pipeline Inbound: <strong className="text-slate-200">{metrics.destPipeline}</strong>{' '}
                        {metrics.destPipeline > 0 && (
                          <span className="text-[10px] text-slate-400">
                            ({metrics.destInTransit} transit, {metrics.destPending} pending)
                          </span>
                        )}
                      </div>
                      <div>
                        Target Buffer: <strong className="text-slate-200">{metrics.destTarget}</strong>
                      </div>
                      <div>
                        Safety Threshold: <strong className="text-slate-200">{metrics.destSafety}</strong>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-slate-300">Remaining Target Gap:</span>
                      <span className="font-bold text-rose-400 font-mono text-sm">
                        {metrics.remainingTargetGap} units
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. Explainability Rationale Callout Banner */}
                <div className="p-3 rounded-lg bg-indigo-950/30 border border-indigo-500/25 text-xs text-indigo-200 flex items-start gap-2.5">
                  <Info className="w-4 h-4 shrink-0 text-indigo-400 mt-0.5" />
                  <div className="space-y-1">
                    <div className="font-semibold text-indigo-300 text-[11px] uppercase tracking-wider">
                      Rebalancing Rationale & Impact Analysis
                    </div>
                    <p className="text-slate-300 leading-relaxed text-[11px]">
                      {metrics.explanation}
                    </p>
                  </div>
                </div>

                {/* 4. Action Strip with Quantity Controls & Stage Button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-slate-800/60">
                  {/* Preset Buttons & Safety Boundaries */}
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-[11px] text-slate-400">Quick presets:</span>
                    <button
                      type="button"
                      onClick={() => handlePresetClick(opp, metrics.recommendedQty)}
                      disabled={metrics.effectiveMaxTransferable <= 0}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-medium transition disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Recommended ({metrics.recommendedQty})
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePresetClick(opp, metrics.effectiveMaxTransferable)}
                      disabled={metrics.effectiveMaxTransferable <= 0}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-medium transition disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Max Safe ({metrics.effectiveMaxTransferable})
                    </button>
                  </div>

                  {/* Quantity Input and Submit Button */}
                  <div className="flex items-center gap-2 justify-end">
                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-1.5">
                        <label htmlFor={`qty-${oppKey}`} className="text-[11px] text-slate-400 font-medium">
                          Transfer Qty:
                        </label>
                        <input
                          id={`qty-${oppKey}`}
                          type="number"
                          min="1"
                          max={metrics.effectiveMaxTransferable}
                          value={metrics.rawInput}
                          onChange={(e) => handleQuantityChange(opp, e.target.value)}
                          disabled={isExecuting || isRowSubmitting || metrics.effectiveMaxTransferable <= 0}
                          className={`w-20 px-2.5 py-1.5 text-xs rounded bg-slate-900 border ${
                            metrics.validationError ? 'border-rose-500 text-rose-300' : 'border-slate-700 text-white'
                          } text-right font-mono focus:outline-none focus:border-indigo-500 disabled:opacity-50`}
                        />
                      </div>
                      {metrics.validationError && (
                        <span className="text-[10px] text-rose-400 mt-1 max-w-[260px] text-right">
                          {metrics.validationError}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSubmit(opp, metrics)}
                      disabled={isButtonDisabled}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                      title={
                        metrics.validationError
                          ? metrics.validationError
                          : 'Reserve inventory at source dock and stage PENDING transfer order'
                      }
                    >
                      <PackagePlus className="w-3.5 h-3.5" />
                      <span>{isRowSubmitting ? 'Staging...' : 'Stage Transfer Order'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
