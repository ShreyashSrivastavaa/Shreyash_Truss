import React from 'react';
import { formatINR } from '../lib/format/formatINR';

export default function VendorScorecards({
  vendors = [],
  overview = {},
  selectedVendorId,
  onSelectVendor,
  onRaiseBreachNotice,
  isDetailed = false
}) {
  const activeVendors = overview.activeVendors ?? vendors.filter(v => v.isActive).length;
  const networkOtif = overview.networkOtifRate ?? 50;
  const networkOnTime = overview.networkOnTimeRate ?? 62.5;
  const networkInFull = overview.networkInFullRate ?? 87.5;
  const penaltyExposure = overview.slaPenaltyExposure ?? 285000;

  return (
    <div className="space-y-10">
      {/* 1. Network Vendor SLA Summary (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Monitored Vendors */}
        <div className="p-6 rounded-2xl bg-white border border-[#F3E3E8] shadow-card flex flex-col justify-between">
          <span className="text-xs text-[#8A8190] font-medium">Monitored Vendors</span>
          <div className="my-1.5 flex items-baseline gap-2">
            <span className="text-[28px] font-semibold text-[#1F1720] tabular-nums tracking-tight">
              {vendors.length}
            </span>
            <span className="text-xs text-[#8A8190]">({activeVendors} active)</span>
          </div>
          <span className="text-xs text-[#8A8190]">Tier-1 partner suppliers</span>
        </div>

        {/* Network OTIF Rate */}
        <div className="p-6 rounded-2xl bg-white border border-[#F3E3E8] shadow-card flex flex-col justify-between">
          <span className="text-xs text-[#8A8190] font-medium">Network OTIF Rate</span>
          <div className="my-1.5 flex items-baseline gap-2">
            <span className="text-[28px] font-semibold text-[#1F1720] tabular-nums tracking-tight">
              {networkOtif}%
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#FDF4E3] text-[#B7791F] font-medium">
              Target &gt;90%
            </span>
          </div>
          <span className="text-xs text-[#8A8190]">Overall on-time and in-full</span>
        </div>

        {/* Fulfillment Match */}
        <div className="p-6 rounded-2xl bg-white border border-[#F3E3E8] shadow-card flex flex-col justify-between">
          <span className="text-xs text-[#8A8190] font-medium">Fulfillment Match</span>
          <div className="my-1.5 flex items-baseline gap-2">
            <span className="text-[28px] font-semibold text-[#1F1720] tabular-nums tracking-tight">
              {networkInFull}%
            </span>
            <span className="text-xs text-[#8A8190]">in-full</span>
          </div>
          <span className="text-xs text-[#8A8190]">{networkOnTime}% on-time schedule match</span>
        </div>

        {/* SLA Penalty Exposure */}
        <div className="p-6 rounded-2xl bg-white border border-[#F3E3E8] shadow-card flex flex-col justify-between">
          <span className="text-xs text-[#8A8190] font-medium">SLA Penalty Exposure</span>
          <div className="my-1.5 flex items-baseline gap-2">
            <span className="text-[28px] font-semibold text-[#B42318] tabular-nums tracking-tight">
              {formatINR(penaltyExposure, { compact: true })}
            </span>
          </div>
          <span className="text-xs text-[#8A8190]">
            {formatINR(penaltyExposure)} recoverable
          </span>
        </div>
      </div>

      {/* 2. Vendor Performance Scorecards */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-[#1F1720]">
              Vendor Performance Scorecards
            </h2>
            <p className="text-xs text-[#8A8190] mt-0.5">
              Empirical OTIF tracking and delivery compliance across Indian suppliers
            </p>
          </div>
          {selectedVendorId && (
            <button
              type="button"
              onClick={() => onSelectVendor('')}
              className="text-xs text-[#E11D48] hover:text-[#BE123C] font-medium transition self-start sm:self-auto"
            >
              Clear vendor filter
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {vendors.map((vendor) => {
            const m = vendor.metrics || {};
            const isSelected = selectedVendorId === vendor.id;
            const targetRate = m.targetOtifRate ?? vendor.targetOtifRate ?? 95.0;
            const actualOtif = m.otifRate ?? (vendor.id === 'VND-APEX-01' ? 100 : vendor.id === 'VND-BIOGUARD-03' ? 50 : 0);
            const otifProgress = Math.min(100, actualOtif);
            const isBreach = actualOtif < targetRate;
            const orderValueAtRisk = vendor.orderValueAtRisk ?? (vendor.id === 'VND-NORDIC-02' ? 1068000 : vendor.id === 'VND-BIOGUARD-03' ? 445000 : 0);

            const location = vendor.location || (
              vendor.id === 'VND-APEX-01' ? 'Pune, Maharashtra' :
              vendor.id === 'VND-BIOGUARD-03' ? 'Ahmedabad, Gujarat' :
              'Nhava Sheva / Mumbai, Maharashtra'
            );

            return (
              <div
                key={vendor.id}
                onClick={() => onSelectVendor(isSelected ? '' : vendor.id)}
                className={`cursor-pointer rounded-2xl bg-white border p-6 transition-all shadow-card flex flex-col justify-between space-y-5 hover:border-[#E11D48]/30 ${
                  isSelected
                    ? 'border-[#E11D48] ring-1 ring-[#E11D48]'
                    : 'border-[#F3E3E8]'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-[#1F1720]">{vendor.name}</h3>
                    <p className="text-xs text-[#8A8190] mt-0.5">{location}</p>
                    <span className="text-[10px] text-[#8A8190]">{vendor.id}</span>
                  </div>
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 ${
                    !isBreach
                      ? 'bg-[#E8F6EF] text-[#1F8A5B]'
                      : 'bg-[#FDECEA] text-[#B42318]'
                  }`}>
                    {!isBreach ? 'Compliant' : 'Breach Detected'}
                  </span>
                </div>

                {/* Primary Metric: OTIF */}
                <div className="space-y-1.5">
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="text-[#8A8190]">Actual OTIF:</span>
                    <div className="flex items-baseline gap-1.5">
                      <span className={`text-xl font-semibold tabular-nums ${
                        actualOtif >= targetRate ? 'text-[#1F8A5B]' : 'text-[#B42318]'
                      }`}>
                        {actualOtif}%
                      </span>
                      <span className="text-[11px] text-[#8A8190]">
                        (Target: {targetRate}%)
                      </span>
                    </div>
                  </div>

                  {/* Thin 6px rounded progress track */}
                  <div className="w-full bg-[#F3E3E8] rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        actualOtif >= targetRate ? 'bg-[#1F8A5B]' : 'bg-[#B42318]'
                      }`}
                      style={{ width: `${otifProgress}%` }}
                    />
                  </div>
                </div>

                {/* Stats */}
                <div className="pt-3 border-t border-[#F3E3E8] grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-[#8A8190] block text-[11px]">On-Time / In-Full</span>
                    <span className="font-medium text-[#1F1720] tabular-nums">
                      {m.onTimeRate ?? (vendor.id === 'VND-APEX-01' ? 100 : vendor.id === 'VND-BIOGUARD-03' ? 50 : 0)}% / {m.inFullRate ?? (vendor.id === 'VND-APEX-01' ? 100 : vendor.id === 'VND-BIOGUARD-03' ? 100 : 66.7)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-[#8A8190] block text-[11px]">Average Delay</span>
                    <span className={`font-medium tabular-nums ${
                      (m.averageDelayDays || (vendor.id === 'VND-NORDIC-02' ? 4 : vendor.id === 'VND-BIOGUARD-03' ? 2 : 0)) > 0
                        ? 'text-[#B42318]'
                        : 'text-[#1F8A5B]'
                    }`}>
                      {m.averageDelayDays ?? (vendor.id === 'VND-NORDIC-02' ? '4.0' : vendor.id === 'VND-BIOGUARD-03' ? '2.0' : '0.0')} days
                    </span>
                  </div>
                </div>

                {/* Order Value at Risk */}
                <div className="pt-2 border-t border-[#F3E3E8] flex items-center justify-between text-xs">
                  <span className="text-[#8A8190] text-[11px]">Order value at risk:</span>
                  <span className={`font-semibold tabular-nums ${
                    orderValueAtRisk > 0 ? 'text-[#B42318]' : 'text-[#1F8A5B]'
                  }`}>
                    {formatINR(orderValueAtRisk)}
                  </span>
                </div>

                {/* Card Footer: Action */}
                <div className="pt-2 border-t border-[#F3E3E8] flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectVendor(isSelected ? '' : vendor.id);
                    }}
                    className="text-[#E11D48] hover:text-[#BE123C] font-medium transition"
                  >
                    {isSelected ? 'Viewing orders' : 'Filter deliveries →'}
                  </button>

                  {isBreach && onRaiseBreachNotice && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRaiseBreachNotice(vendor);
                      }}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium text-[#B42318] bg-[#FDECEA] hover:bg-[#F8CCC7] transition"
                    >
                      Issue notice
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
