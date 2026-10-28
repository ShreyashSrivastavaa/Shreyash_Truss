import React, { useState, useMemo } from 'react';
import {
  Truck,
  Filter,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowRight,
  PackageCheck
} from 'lucide-react';
import { formatDisplayDate } from '../utils/slaAnalytics';

export default function VendorDeliveryMonitor({
  deliveries = [],
  vendors = [],
  selectedVendorId,
  onSelectVendor
}) {
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Filter deliveries according to selected vendor and status
  const filteredDeliveries = useMemo(() => {
    return deliveries.filter(delivery => {
      // Vendor filter
      if (selectedVendorId && delivery.vendorId !== selectedVendorId) {
        return false;
      }

      // Status filter
      if (selectedStatus !== 'ALL') {
        const m = delivery.metrics || {};
        if (selectedStatus === 'OVERDUE') {
          return m.isOverdue;
        }
        if (delivery.status !== selectedStatus) {
          return false;
        }
      }

      return true;
    });
  }, [deliveries, selectedVendorId, selectedStatus]);

  const getStatusBadge = (delivery) => {
    const m = delivery.metrics || {};
    const status = delivery.status;

    if (m.isOverdue) {
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-rose-950/50 text-rose-300 border border-rose-800/50">
          <AlertCircle className="w-3 h-3 text-rose-400" />
          OVERDUE ({m.delayDays}d)
        </span>
      );
    }

    switch (status) {
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-950/50 text-emerald-300 border border-emerald-800/50">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            DELIVERED
          </span>
        );
      case 'PARTIALLY_RECEIVED':
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-950/50 text-amber-300 border border-amber-800/50">
            <Clock className="w-3 h-3 text-amber-400" />
            PARTIAL INTAKE
          </span>
        );
      case 'DELAYED':
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-950/50 text-amber-300 border border-amber-800/50">
            <Clock className="w-3 h-3 text-amber-400" />
            DELAYED
          </span>
        );
      case 'SCHEDULED':
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-sky-950/50 text-sky-300 border border-sky-800/50">
            <Truck className="w-3 h-3 text-sky-400" />
            SCHEDULED
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-800/70 text-slate-400 border border-slate-700/60">
            <XCircle className="w-3 h-3 text-slate-500" />
            CANCELLED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300">
            {status}
          </span>
        );
    }
  };

  return (
    <section className="bg-slate-900/75 border border-slate-800/80 rounded-xl p-5 sm:p-6 shadow-sm space-y-5">
      {/* Header and Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Truck className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-100 tracking-tight">
              Vendor Delivery Pipeline & Inbound Receipts
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Purchase orders, expected vs. actual delivery dates, and intake verification
            </p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          {/* Vendor Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-300">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedVendorId || ''}
              onChange={(e) => onSelectVendor(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-850 border border-slate-700/60 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">All Vendors ({vendors.length})</option>
              {vendors.map(v => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-850 border border-slate-700/60 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="DELIVERED">Delivered</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="PARTIALLY_RECEIVED">Partial Intake</option>
            <option value="DELAYED">Delayed</option>
            <option value="OVERDUE">Overdue Incomplete</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          {/* Count Badge */}
          <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700/60 font-medium tabular-nums">
            {filteredDeliveries.length} of {deliveries.length} Orders
          </span>
        </div>
      </div>

      {/* Deliveries Table */}
      {filteredDeliveries.length === 0 ? (
        <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl bg-slate-950/30">
          <div className="w-10 h-10 rounded-full bg-slate-800/60 flex items-center justify-center mx-auto mb-2.5 text-slate-400">
            <Truck className="w-5 h-5 text-slate-500" />
          </div>
          <p className="text-sm font-medium text-slate-300">No delivery records match current filter</p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting the vendor or status filter above to inspect scheduled or completed deliveries.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-800/80">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 text-slate-400 text-[11px] font-medium border-b border-slate-800/80">
              <tr>
                <th className="py-3 px-3.5">PO & Delivery ID</th>
                <th className="py-3 px-3.5">Vendor</th>
                <th className="py-3 px-3.5">SKU / Destination</th>
                <th className="py-3 px-3.5">Expected Date</th>
                <th className="py-3 px-3.5">Actual Date & Variance</th>
                <th className="py-3 px-3.5 text-right">Received / Expected</th>
                <th className="py-3 px-3.5 text-center">SLA Outcome</th>
                <th className="py-3 px-3.5">Intake Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredDeliveries.map((delivery) => {
                const m = delivery.metrics || {};
                const vendorObj = vendors.find(v => v.id === delivery.vendorId);
                const vendorName = vendorObj ? vendorObj.name : delivery.vendorId;

                // Delivery variance calculation text
                let varianceText = 'Pending';
                let varianceColor = 'text-slate-400';

                if (m.isCompleted && delivery.actualDeliveryDate) {
                  if (m.isOnTime) {
                    varianceText = 'On-time delivery';
                    varianceColor = 'text-emerald-400';
                  } else {
                    varianceText = `+${m.delayDays}d late`;
                    varianceColor = 'text-rose-400';
                  }
                } else if (m.isOverdue) {
                  varianceText = `Overdue (+${m.delayDays}d)`;
                  varianceColor = 'text-rose-400';
                }

                return (
                  <tr key={delivery.id} className="hover:bg-slate-800/25 transition">
                    {/* PO & Delivery ID */}
                    <td className="py-3 px-3.5">
                      <div className="font-semibold text-white">{delivery.poNumber}</div>
                      <div className="font-mono text-[10px] text-slate-400 mt-0.5">{delivery.id}</div>
                    </td>

                    {/* Vendor */}
                    <td className="py-3 px-3.5">
                      <div className="text-slate-200">{vendorName}</div>
                      <div className="text-[10px] font-mono text-slate-400 mt-0.5">{delivery.vendorId}</div>
                    </td>

                    {/* SKU & Destination */}
                    <td className="py-3 px-3.5">
                      <div className="text-slate-300 font-mono text-[11px]">{delivery.skuId || 'General Supply'}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{delivery.depotId || 'Central Hub'}</div>
                    </td>

                    {/* Expected Date */}
                    <td className="py-3 px-3.5 text-slate-300 tabular-nums">
                      {formatDisplayDate(delivery.expectedDeliveryDate)}
                    </td>

                    {/* Actual Date & Variance */}
                    <td className="py-3 px-3.5">
                      <div className="text-slate-300 tabular-nums">
                        {delivery.actualDeliveryDate ? formatDisplayDate(delivery.actualDeliveryDate) : '—'}
                      </div>
                      <div className={`text-[10px] font-medium mt-0.5 ${varianceColor}`}>
                        {varianceText}
                      </div>
                    </td>

                    {/* Received / Expected Quantity */}
                    <td className="py-3 px-3.5 text-right tabular-nums">
                      <div className="flex items-center justify-end gap-1">
                        <span className={`font-bold ${
                          m.isCompleted && !m.isInFull ? 'text-amber-400' : 'text-white'
                        }`}>
                          {delivery.receivedQuantity ?? 0}
                        </span>
                        <span className="text-slate-400">/</span>
                        <span className="text-slate-300">{delivery.expectedQuantity}</span>
                        <span className="text-[10px] text-slate-400">units</span>
                      </div>
                      {m.isCompleted && !m.isInFull && (
                        <div className="text-[10px] text-amber-400 font-medium mt-0.5">
                          Shortfall: -{delivery.expectedQuantity - (delivery.receivedQuantity ?? 0)}
                        </div>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-3.5 text-center">
                      {getStatusBadge(delivery)}
                    </td>

                    {/* Intake Notes */}
                    <td className="py-3 px-3.5 text-slate-400 text-xs max-w-xs truncate" title={delivery.notes}>
                      {delivery.notes || '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
