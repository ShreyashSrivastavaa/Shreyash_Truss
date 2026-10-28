import React from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  Building2,
  Calendar,
  Layers,
  Percent
} from 'lucide-react';

export default function VendorScorecards({
  vendors = [],
  overview = {},
  selectedVendorId,
  onSelectVendor
}) {
  const activeVendors = overview.activeVendors ?? vendors.filter(v => v.isActive).length;
  const networkOtif = overview.networkOtifRate ?? 0;
  const networkOnTime = overview.networkOnTimeRate ?? 0;
  const networkInFull = overview.networkInFullRate ?? 0;
  const overdueCount = overview.totalOverdue ?? 0;

  return (
    <div className="space-y-6">
      {/* 1. Network Vendor SLA Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {/* Monitored Vendors */}
        <div className="p-4 rounded-xl bg-slate-900/75 border border-slate-800/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400">Monitored Vendors</span>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border bg-slate-800 text-slate-300 border-slate-700/60">
              Registry
            </span>
          </div>
          <div className="my-1.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-white tabular-nums">
              {vendors.length}
            </span>
            <span className="text-xs text-slate-400">({activeVendors} active)</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 mt-2 pt-2.5 border-t border-slate-800/80">
            <span className="text-[11px] text-slate-400">Supplier portfolio</span>
            <Building2 className="w-3.5 h-3.5 text-indigo-400 opacity-80" />
          </div>
        </div>

        {/* Network OTIF Rate */}
        <div className="p-4 rounded-xl bg-slate-900/75 border border-slate-800/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400">Network OTIF Rate</span>
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
              networkOtif >= 90
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25'
                : 'bg-amber-500/10 text-amber-300 border-amber-500/25'
            }`}>
              Primary KPI
            </span>
          </div>
          <div className="my-1.5 flex items-baseline gap-1.5">
            <span className={`text-2xl font-bold tracking-tight tabular-nums ${
              networkOtif >= 90 ? 'text-emerald-400' : 'text-amber-400'
            }`}>
              {networkOtif}%
            </span>
            <span className="text-xs text-slate-400">overall</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 mt-2 pt-2.5 border-t border-slate-800/80">
            <span className="text-[11px] text-slate-400">On Time & In Full</span>
            <Percent className="w-3.5 h-3.5 text-emerald-400 opacity-80" />
          </div>
        </div>

        {/* On-Time Delivery Rate */}
        <div className="p-4 rounded-xl bg-slate-900/75 border border-slate-800/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400">On-Time Delivery</span>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border bg-slate-800 text-slate-300 border-slate-700/60">
              Schedule
            </span>
          </div>
          <div className="my-1.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-white tabular-nums">
              {networkOnTime}%
            </span>
            <span className="text-xs text-slate-400">compliance</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 mt-2 pt-2.5 border-t border-slate-800/80">
            <span className="text-[11px] text-slate-400">Historical delivery date</span>
            <Clock className="w-3.5 h-3.5 text-sky-400 opacity-80" />
          </div>
        </div>

        {/* In-Full Delivery Rate */}
        <div className="p-4 rounded-xl bg-slate-900/75 border border-slate-800/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400">In-Full Delivery</span>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border bg-slate-800 text-slate-300 border-slate-700/60">
              Fulfillment
            </span>
          </div>
          <div className="my-1.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-white tabular-nums">
              {networkInFull}%
            </span>
            <span className="text-xs text-slate-400">quantity match</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 mt-2 pt-2.5 border-t border-slate-800/80">
            <span className="text-[11px] text-slate-400">Received vs expected</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 opacity-80" />
          </div>
        </div>

        {/* Overdue Shipments Flag */}
        <div className={`p-4 rounded-xl border shadow-xs flex flex-col justify-between ${
          overdueCount > 0
            ? 'bg-rose-950/20 border-rose-500/30'
            : 'bg-slate-900/75 border-slate-800/80'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400">Active Overdue</span>
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
              overdueCount > 0
                ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25'
            }`}>
              {overdueCount > 0 ? 'Urgent Alert' : 'Clean Pipeline'}
            </span>
          </div>
          <div className="my-1.5 flex items-baseline gap-1.5">
            <span className={`text-2xl font-bold tracking-tight tabular-nums ${
              overdueCount > 0 ? 'text-rose-400' : 'text-white'
            }`}>
              {overdueCount}
            </span>
            <span className="text-xs text-slate-400">{overdueCount === 1 ? 'shipment' : 'shipments'}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 mt-2 pt-2.5 border-t border-slate-800/80">
            <span className="text-[11px] text-slate-400">Expected date passed</span>
            <AlertTriangle className={`w-3.5 h-3.5 opacity-80 ${overdueCount > 0 ? 'text-rose-400' : 'text-slate-500'}`} />
          </div>
        </div>
      </div>

      {/* 2. Vendor Scorecard Cards */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
              Vendor Performance Scorecards & SLA Reliability
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Empirical OTIF tracking, lead time variance, and delivery compliance auditing
            </p>
          </div>
          {selectedVendorId && (
            <button
              type="button"
              onClick={() => onSelectVendor('')}
              className="self-start sm:self-center text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition"
            >
              Clear Vendor Filter
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {vendors.map((vendor) => {
            const m = vendor.metrics || {};
            const isSelected = selectedVendorId === vendor.id;
            const targetRate = m.targetOtifRate ?? vendor.targetOtifRate ?? 95.0;
            const actualOtif = m.otifRate ?? 0;
            const otifProgress = Math.min(100, actualOtif);

            return (
              <div
                key={vendor.id}
                onClick={() => onSelectVendor(isSelected ? '' : vendor.id)}
                className={`cursor-pointer rounded-xl bg-slate-900/80 border p-5 transition-all shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-600 ${
                  isSelected
                    ? 'border-indigo-500 ring-1 ring-indigo-500/50 bg-slate-900'
                    : 'border-slate-800/80'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-white">{vendor.name}</h3>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/60">
                        {vendor.id}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{vendor.category}</p>
                  </div>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border whitespace-nowrap ${m.statusBadge}`}>
                    {m.statusLabel}
                  </span>
                </div>

                {/* Primary Metric: OTIF vs Target */}
                <div className="space-y-1.5 bg-slate-950/50 rounded-lg p-3 border border-slate-800/60">
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="text-slate-400">Actual OTIF Rate:</span>
                    <div className="flex items-baseline gap-1.5">
                      <span className={`text-xl font-bold tabular-nums ${
                        actualOtif >= targetRate ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {actualOtif}%
                      </span>
                      <span className="text-[11px] text-slate-400">
                        (Target: {targetRate}%)
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        actualOtif >= targetRate ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${otifProgress}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                    <span>
                      {m.otifGap >= 0
                        ? `+${m.otifGap}% above target`
                        : `${m.otifGap}% below SLA commitment`}
                    </span>
                    <span>SLA Lead Time: {vendor.leadTimeDays} days</span>
                  </div>
                </div>

                {/* Secondary Metrics 2x2 Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-850/60 border border-slate-800/70">
                    <div className="text-[10px] text-slate-400">On-Time Rate</div>
                    <div className="text-sm font-semibold text-slate-200 tabular-nums mt-0.5">
                      {m.onTimeRate}%
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {m.onTimeDeliveries} of {m.eligibleDeliveries} orders
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-850/60 border border-slate-800/70">
                    <div className="text-[10px] text-slate-400">In-Full Rate</div>
                    <div className="text-sm font-semibold text-slate-200 tabular-nums mt-0.5">
                      {m.inFullRate}%
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {m.inFullDeliveries} of {m.eligibleDeliveries} orders
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-850/60 border border-slate-800/70">
                    <div className="text-[10px] text-slate-400">Average Delay</div>
                    <div className="text-sm font-semibold text-slate-200 tabular-nums mt-0.5">
                      {m.averageDelayDays} days
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {m.lateDeliveries} late {m.lateDeliveries === 1 ? 'order' : 'orders'}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-850/60 border border-slate-800/70">
                    <div className="text-[10px] text-slate-400">Overdue Incomplete</div>
                    <div className={`text-sm font-semibold tabular-nums mt-0.5 ${
                      m.overdueDeliveries > 0 ? 'text-rose-400' : 'text-slate-200'
                    }`}>
                      {m.overdueDeliveries}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {m.overdueDeliveries > 0 ? 'Action required' : 'None open'}
                    </div>
                  </div>
                </div>

                {/* Footer Strip */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <span className="text-[11px] text-slate-400">
                    {m.totalDeliveries} total tracked orders
                  </span>
                  <span className="text-indigo-400 hover:text-indigo-300 font-medium text-xs">
                    {isSelected ? '✓ Showing deliveries' : 'Filter deliveries →'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
