import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Truck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { getOpportunityMetrics } from '../utils/opportunityMetrics';
import { formatINR } from '../lib/format/formatINR';
import { LANE_CONSTANTS } from '../data/seedData';

export default function OpportunityList({
  opportunities = [],
  onExecuteTransfer,
  isExecuting = false,
  isDetailed = false,
  canStageTransfer = true
}) {
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
        `Transfer staged: ${metrics.qtyNum} units of ${opp.skuName} reserved at ${opp.fromDepotName}.`
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

  const getLaneMetrics = (opp, qty) => {
    const laneKey = `${opp.fromDepotId}->${opp.toDepotId}`;
    const lane = LANE_CONSTANTS[laneKey] || {
      distanceKm: 2180,
      transitTimeEstimate: '3-4 days by road (NH 44)',
      estimatedFreightCostRelay: 18500,
      estimatedFreightCostSensor: 24000,
      stockoutLossAvoidedRelay: 294000,
      stockoutLossAvoidedSensor: 1424000
    };

    const isRelay = opp.skuId === 'SKU-IND-02';
    const unitPrice = isRelay ? 2450 : 8900;
    const transferValue = (qty || opp.recommendedQuantity || 0) * unitPrice;

    const baseFreight = isRelay ? lane.estimatedFreightCostRelay : lane.estimatedFreightCostSensor;
    const recommended = opp.recommendedQuantity || 1;
    const freightCost = Math.round(baseFreight * (0.8 + 0.2 * ((qty || recommended) / recommended)));

    const baseLoss = isRelay ? lane.stockoutLossAvoidedRelay : lane.stockoutLossAvoidedSensor;
    const stockoutLossAvoided = Math.round(baseLoss * ((qty || recommended) / recommended));
    const netSavings = Math.max(0, stockoutLossAvoided - freightCost);

    return {
      unitPrice,
      transferValue,
      freightCost,
      stockoutLossAvoided,
      netSavings,
      transitTime: lane.transitTimeEstimate,
      distanceKm: lane.distanceKm
    };
  };

  return (
    <section className="space-y-4" aria-label="Recommended Transfers Section">
      {/* Section Header */}
      <div>
        <h2 className="text-lg font-semibold text-[#1F1720]">
          Recommended Transfers
        </h2>
        <p className="text-xs text-[#8A8190] mt-0.5">
          Automated lateral rebalancing recommendations to eliminate regional stockouts
        </p>
      </div>

      {/* Global alert feedback */}
      {activeError && (
        <div className="p-3.5 rounded-xl bg-[#FDECEA] border border-[#F8CCC7] text-[#B42318] text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-[#B42318]" />
            <span>{activeError}</span>
          </div>
          <button
            type="button"
            onClick={() => setActiveError(null)}
            className="text-xs text-[#B42318] font-medium hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {activeSuccess && (
        <div className="p-3.5 rounded-xl bg-[#E8F6EF] border border-[#CBEBDC] text-[#1F8A5B] text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#1F8A5B]" />
            <span>{activeSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setActiveSuccess(null)}
            className="text-xs text-[#1F8A5B] font-medium hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Empty State */}
      {opportunities.length === 0 ? (
        <div className="py-12 px-4 text-center border border-[#F3E3E8] rounded-2xl bg-white shadow-card">
          <div className="w-12 h-12 rounded-full bg-[#FFF1F4] text-[#E11D48] flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-[#1F1720]">Network fully balanced</h3>
          <p className="text-xs text-[#8A8190] mt-1 max-w-sm mx-auto">
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
            const laneMetrics = getLaneMetrics(opp, metrics.qtyNum);

            return (
              <div
                key={oppKey}
                className="rounded-2xl bg-white border border-[#F3E3E8] p-6 shadow-card space-y-4 hover:border-[#E11D48]/30 transition"
              >
                {/* Hero Headline & Primary Action */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-[#1F1720]">
                        Move {metrics.qtyNum || opp.recommendedQuantity} units of {opp.skuName}
                      </h3>
                      <span className="text-xs text-[#8A8190]">from</span>
                      <span className="text-xs font-medium text-[#1F8A5B] bg-[#E8F6EF] px-2 py-0.5 rounded-full">
                        {opp.fromDepotName}
                      </span>
                      <span className="text-xs text-[#8A8190]">to</span>
                      <span className="text-xs font-medium text-[#B42318] bg-[#FDECEA] px-2 py-0.5 rounded-full">
                        {opp.toDepotName}
                      </span>
                    </div>
                    <p className="text-xs text-[#8A8190]">
                      Eliminates {opp.toDepotName} stockout risk while keeping {opp.fromDepotName} above target buffer.
                    </p>
                  </div>

                  {/* Quantity & Stage Button */}
                  <div className="flex items-center gap-3 shrink-0 self-start lg:self-auto">
                    {canStageTransfer && (
                      <div className="flex items-center gap-1.5 bg-[#FFF5F7] px-3 py-1.5 rounded-xl border border-[#F3E3E8]">
                        <span className="text-xs text-[#8A8190]">Units:</span>
                        <input
                          type="number"
                          min="1"
                          max={opp.availableSurplus}
                          value={rawVal}
                          onChange={(e) => handleQuantityChange(opp, e.target.value)}
                          className="w-16 bg-transparent text-xs font-semibold text-[#1F1720] focus:outline-none tabular-nums text-right"
                        />
                      </div>
                    )}

                    {canStageTransfer ? (
                      <button
                        type="button"
                        onClick={() => handleSubmit(opp, metrics)}
                        disabled={isExecuting || isRowSubmitting || !!metrics.validationError}
                        className="px-4 py-2 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] disabled:opacity-40 text-white font-medium text-xs transition shadow-subtle shrink-0"
                      >
                        {isRowSubmitting ? 'Staging...' : 'Stage Transfer'}
                      </button>
                    ) : (
                      <span className="text-xs text-[#8A8190] bg-[#FFF5F7] px-3 py-1.5 rounded-xl">
                        Read-only
                      </span>
                    )}
                  </div>
                </div>

                {/* 4 Metrics Strip (Clean dividers, light cards) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
                  <div className="p-3 rounded-xl bg-[#FFF5F7] border border-[#F3E3E8]">
                    <span className="text-[11px] text-[#8A8190] block">Transfer Value</span>
                    <span className="text-sm font-semibold text-[#1F1720] tabular-nums mt-0.5 block">
                      {formatINR(laneMetrics.transferValue)}
                    </span>
                    <span className="text-[10px] text-[#8A8190] mt-0.5 block">
                      @{formatINR(laneMetrics.unitPrice)}/unit
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#FFF5F7] border border-[#F3E3E8]">
                    <span className="text-[11px] text-[#8A8190] block">Est. Freight Cost</span>
                    <span className="text-sm font-semibold text-[#1F1720] tabular-nums mt-0.5 block">
                      {formatINR(laneMetrics.freightCost)}
                    </span>
                    <span className="text-[10px] text-[#8A8190] mt-0.5 block">
                      Dedicated road freight
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#FFF5F7] border border-[#F3E3E8]">
                    <span className="text-[11px] text-[#8A8190] block">Transit Time</span>
                    <span className="text-sm font-semibold text-[#1F1720] mt-0.5 block">
                      3-4 days by road
                    </span>
                    <span className="text-[10px] text-[#8A8190] mt-0.5 block">
                      ~{laneMetrics.distanceKm.toLocaleString('en-IN')} km (NH Corridor)
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#FFF5F7] border border-[#F3E3E8]">
                    <span className="text-[11px] text-[#8A8190] block">Stockout Loss Avoided</span>
                    <span className="text-sm font-semibold text-[#1F8A5B] tabular-nums mt-0.5 block">
                      {formatINR(laneMetrics.stockoutLossAvoided)}
                    </span>
                    <span className="text-[10px] text-[#1F8A5B] mt-0.5 block font-medium">
                      Net gain: {formatINR(laneMetrics.netSavings)}
                    </span>
                  </div>
                </div>

                {/* Validation Error */}
                {metrics.validationError && (
                  <div className="p-3 rounded-xl bg-[#FDECEA] border border-[#F8CCC7] text-[#B42318] text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{metrics.validationError}</span>
                  </div>
                )}

                {/* Expandable Rationale */}
                <div className="pt-2 border-t border-[#F3E3E8]">
                  {!isDetailed && (
                    <button
                      type="button"
                      onClick={() => toggleWhy(oppKey)}
                      className="text-xs text-[#E11D48] hover:text-[#BE123C] font-medium flex items-center gap-1 transition"
                    >
                      <span>{isWhyOpen ? 'Hide Rationale' : 'Why this recommendation?'}</span>
                      {isWhyOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  )}

                  {isWhyOpen && (
                    <div className="mt-3 p-4 rounded-xl bg-[#FFF5F7] border border-[#F3E3E8] space-y-3 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <span className="text-[#8A8190] block text-[11px]">Donor Surplus</span>
                          <span className="font-semibold text-[#1F8A5B]">
                            +{opp.availableSurplus} units available
                          </span>
                          <p className="text-[10px] text-[#8A8190] mt-0.5">Above buffer at {opp.fromDepotName}</p>
                        </div>
                        <div>
                          <span className="text-[#8A8190] block text-[11px]">Recipient Shortage</span>
                          <span className="font-semibold text-[#B42318]">
                            -{opp.recipientDeficit} units needed
                          </span>
                          <p className="text-[10px] text-[#8A8190] mt-0.5">To restore {opp.toDepotName} target buffer</p>
                        </div>
                        <div>
                          <span className="text-[#8A8190] block text-[11px]">Safety Buffer Guard</span>
                          <span className="font-semibold text-[#1F1720]">
                            Protected
                          </span>
                          <p className="text-[10px] text-[#8A8190] mt-0.5">Donor safety stock is never breached</p>
                        </div>
                      </div>

                      <p className="text-[#4B4350] pt-2 border-t border-[#F3E3E8] leading-relaxed text-[11px]">
                        <strong>Cost-Benefit Analysis:</strong> Investing {formatINR(laneMetrics.freightCost)} in freight saves an estimated {formatINR(laneMetrics.stockoutLossAvoided)} in plant disruption, yielding an ROI of {Math.round((laneMetrics.netSavings / laneMetrics.freightCost) * 100)}% ({formatINR(laneMetrics.netSavings)} net saved).
                      </p>
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
