import React, { useState } from 'react';
import { formatINR } from '../../lib/format/formatINR';
import { ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';

export default function ExecutiveDashboard({
  inventoryTotals,
  vendorOverview,
  transfers = [],
  onNavigateToTab
}) {
  const [expandedRiskId, setExpandedRiskId] = useState(null);
  const inventoryValue = inventoryTotals?.totalInventoryValue || 3051000;
  const completedTransfers = transfers.filter(t => t.status === 'RECEIVED');
  const savingsFromRebalancing = completedTransfers.reduce((sum, t) => sum + (t.value ? Math.round(t.value * 0.25) : 85000), 1718000);
  const penaltyExposure = vendorOverview?.slaPenaltyExposure || 285000;

  const topRisks = [
    {
      id: 'RISK-01',
      severity: 'High',
      title: 'Import Port Congestion (Nhava Sheva / Mumbai)',
      impact: '₹10.68 L delayed with 0% OTIF at Nordic Systems.',
      mitigation: 'Alternate sourcing activated from Apex Thermal Technologies (Pune).'
    },
    {
      id: 'RISK-02',
      severity: 'Medium',
      title: 'Monsoon Highway Rerouting (NH 48 Corridor)',
      impact: '2-day transit delay on Ahmedabad to Gurugram relay corridor.',
      mitigation: 'Buffer stock at Kolkata Port covers immediate eastern requirements.'
    },
    {
      id: 'RISK-03',
      severity: 'Low',
      title: 'Chennai Automobile Corridor Demand Surge',
      impact: 'Industrial Relay on-hand at 20 units vs 80 target.',
      mitigation: 'Recommended inter-depot transfer of 60 units from Gurugram hub staged.'
    }
  ];

  return (
    <div className="space-y-10">
      {/* Shortened Executive AI Briefing in soft rose tint #FFF1F4 with dark text */}
      <div className="p-6 rounded-2xl bg-[#FFF1F4] border border-[#F3E3E8] shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1 max-w-2xl">
          <span className="text-xs text-[#BE123C] font-medium block">
            Executive Summary
          </span>
          <p className="text-sm text-[#1F1720] leading-relaxed">
            Network inventory stands at <strong>{formatINR(inventoryValue, { compact: true })}</strong>. Active lateral rebalancing avoids <strong>{formatINR(savingsFromRebalancing, { compact: true })}</strong> in plant downtime across Gurugram, Chennai, and Kolkata.
          </p>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <button
            type="button"
            onClick={() => onNavigateToTab('INVENTORY')}
            className="px-4 py-2 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-semibold transition shadow-subtle flex items-center gap-1.5"
          >
            <span>View depots</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onNavigateToTab('VENDORS')}
            className="text-xs text-[#BE123C] hover:text-[#E11D48] font-medium transition"
          >
            Audit vendors
          </button>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 rounded-2xl bg-white border border-[#F3E3E8] shadow-card flex flex-col justify-between">
          <span className="text-xs text-[#8A8190] font-medium">Total Inventory Value</span>
          <div className="my-1.5">
            <span className="text-[28px] font-semibold text-[#1F1720] tabular-nums tracking-tight">
              {formatINR(inventoryValue, { compact: true })}
            </span>
          </div>
          <span className="text-xs text-[#8A8190]">495 units across 3 Indian hubs</span>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-[#F3E3E8] shadow-card flex flex-col justify-between">
          <span className="text-xs text-[#8A8190] font-medium">Savings from Rebalancing</span>
          <div className="my-1.5">
            <span className="text-[28px] font-semibold text-[#1F8A5B] tabular-nums tracking-tight">
              {formatINR(savingsFromRebalancing, { compact: true })}
            </span>
          </div>
          <span className="text-xs text-[#8A8190]">Prevented factory disruption penalties</span>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-[#F3E3E8] shadow-card flex flex-col justify-between">
          <span className="text-xs text-[#8A8190] font-medium">SLA Penalty Exposure</span>
          <div className="my-1.5">
            <span className="text-[28px] font-semibold text-[#B42318] tabular-nums tracking-tight">
              {formatINR(penaltyExposure, { compact: true })}
            </span>
          </div>
          <span className="text-xs text-[#8A8190]">2 overdue vendor consignments</span>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-[#F3E3E8] shadow-card flex flex-col justify-between">
          <span className="text-xs text-[#8A8190] font-medium">Network OTIF Rate</span>
          <div className="my-1.5 flex items-baseline gap-2">
            <span className="text-[28px] font-semibold text-[#1F1720] tabular-nums tracking-tight">
              50.0%
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#FDF4E3] text-[#B7791F] font-medium">
              Target &gt;90%
            </span>
          </div>
          <span className="text-xs text-[#8A8190]">87.5% in-full · 62.5% on-time</span>
        </div>
      </div>

      {/* Top 3 Supply Chain Risks (Decluttered: title, one-line impact, single status pill) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-[#1F1720]">
              Supply Chain Risks
            </h3>
            <p className="text-xs text-[#8A8190] mt-0.5">
              Live operational exceptions flagged by autonomous surveillance
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {topRisks.map((risk) => {
            const isExpanded = expandedRiskId === risk.id;

            return (
              <div
                key={risk.id}
                className="p-5 rounded-2xl bg-white border border-[#F3E3E8] shadow-card space-y-2 hover:border-[#E11D48]/30 transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-[#1F1720]">{risk.title}</h4>
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                        risk.severity === 'High'
                          ? 'bg-[#FDECEA] text-[#B42318]'
                          : risk.severity === 'Medium'
                          ? 'bg-[#FDF4E3] text-[#B7791F]'
                          : 'bg-[#EEEEFE] text-[#5B5BD6]'
                      }`}>
                        {risk.severity}
                      </span>
                    </div>
                    <p className="text-xs text-[#4B4350]">{risk.impact}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setExpandedRiskId(isExpanded ? null : risk.id)}
                    className="text-xs text-[#E11D48] hover:text-[#BE123C] font-medium transition shrink-0 flex items-center gap-1"
                  >
                    <span>{isExpanded ? 'Less' : 'Mitigation'}</span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {isExpanded && (
                  <div className="pt-2 border-t border-[#F3E3E8] text-xs text-[#8A8190] leading-relaxed">
                    <strong className="text-[#1F8A5B]">AI Mitigation:</strong> {risk.mitigation}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
