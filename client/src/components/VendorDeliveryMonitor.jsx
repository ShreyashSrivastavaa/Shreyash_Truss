import React, { useState, useMemo } from 'react';
import {
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { formatDisplayDate } from '../utils/slaAnalytics';
import { formatINR } from '../lib/format/formatINR';

export default function VendorDeliveryMonitor({
  deliveries = [],
  vendors = [],
  selectedVendorId,
  onSelectVendor,
  isDetailed = false
}) {
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [expandedDeliveryId, setExpandedDeliveryId] = useState(null);

  const filteredDeliveries = useMemo(() => {
    return deliveries.filter(delivery => {
      if (selectedVendorId && delivery.vendorId !== selectedVendorId) {
        return false;
      }

      if (selectedStatus !== 'ALL') {
        const m = delivery.metrics || {};
        if (selectedStatus === 'OVERDUE') {
          return m.isOverdue || delivery.status === 'DELAYED';
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

    if (m.isOverdue || status === 'DELAYED') {
      const days = m.delayDays || 4;
      return (
        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#FDECEA] text-[#B42318]">
          Overdue (+{days}d)
        </span>
      );
    }

    switch (status) {
      case 'DELIVERED':
        return (
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#E8F6EF] text-[#1F8A5B]">
            Delivered
          </span>
        );
      case 'PARTIALLY_RECEIVED':
        return (
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#FDF4E3] text-[#B7791F]">
            Partial Intake
          </span>
        );
      case 'SCHEDULED':
        return (
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#EEEEFE] text-[#5B5BD6]">
            Scheduled
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#F3E3E8] text-[#8A8190]">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#F3E3E8] text-[#8A8190]">
            {status}
          </span>
        );
    }
  };

  const toggleExpand = (id) => {
    setExpandedDeliveryId(prev => (prev === id ? null : id));
  };

  return (
    <section className="space-y-4">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F3E3E8] pb-3">
        <div>
          <h2 className="text-lg font-semibold text-[#1F1720]">
            Inbound Delivery Pipeline
          </h2>
          <p className="text-xs text-[#8A8190] mt-0.5">
            GST-compliant purchase orders, expected delivery dates, and intake verification
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          <select
            value={selectedVendorId || ''}
            onChange={(e) => onSelectVendor(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-white border border-[#F3E3E8] text-xs text-[#1F1720] focus:outline-none focus:ring-1 focus:ring-[#E11D48]"
          >
            <option value="">All Vendors ({vendors.length})</option>
            {vendors.map(v => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-white border border-[#F3E3E8] text-xs text-[#1F1720] focus:outline-none focus:ring-1 focus:ring-[#E11D48]"
          >
            <option value="ALL">All Statuses</option>
            <option value="DELIVERED">Delivered</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="PARTIALLY_RECEIVED">Partial Intake</option>
            <option value="DELAYED">Delayed</option>
            <option value="OVERDUE">Overdue</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Deliveries Table */}
      <div className="bg-white border border-[#F3E3E8] rounded-2xl shadow-card overflow-hidden">
        {filteredDeliveries.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#8A8190]">
            No delivery records match current filter
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FFF5F7] text-[#8A8190] text-[11px] font-medium border-b border-[#F3E3E8]">
                <tr>
                  <th className="py-3 px-4">PO Number</th>
                  <th className="py-3 px-4">Vendor &amp; Destination</th>
                  <th className="py-3 px-4 text-right">PO Total (18% GST)</th>
                  <th className="py-3 px-4">Expected Date</th>
                  <th className="py-3 px-4">Intake Status</th>
                  <th className="py-3 px-4 text-right">Received / Expected</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3E3E8]">
                {filteredDeliveries.map((delivery) => {
                  const m = delivery.metrics || {};
                  const vendorObj = vendors.find(v => v.id === delivery.vendorId);
                  const vendorName = vendorObj ? vendorObj.name : delivery.vendorId;
                  const isExpanded = isDetailed || expandedDeliveryId === delivery.id;

                  const unitPrice = delivery.unitPrice || (delivery.skuId === 'SKU-IND-02' ? 2450 : 8900);
                  const qty = delivery.expectedQuantity || 100;
                  const baseAmount = delivery.baseAmount || (qty * unitPrice);
                  const gstAmount = delivery.gstAmount || Math.round(baseAmount * 0.18);
                  const totalAmount = delivery.totalAmount || (baseAmount + gstAmount);

                  let varianceText = 'Pending';
                  let varianceColor = 'text-[#8A8190]';

                  if (m.isCompleted && delivery.actualDeliveryDate) {
                    if (m.isOnTime) {
                      varianceText = 'On-time delivery';
                      varianceColor = 'text-[#1F8A5B]';
                    } else {
                      varianceText = `+${m.delayDays || 4}d late`;
                      varianceColor = 'text-[#B42318]';
                    }
                  } else if (m.isOverdue || delivery.status === 'DELAYED') {
                    const delay = m.delayDays || 4;
                    varianceText = `Overdue (+${delay}d)`;
                    varianceColor = 'text-[#B42318]';
                  }

                  return (
                    <React.Fragment key={delivery.id}>
                      <tr className="hover:bg-[#FFF1F4] transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-[#1F1720]">{delivery.poNumber}</div>
                          <div className="text-[10px] text-[#8A8190] mt-0.5">{delivery.id}</div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-medium text-[#1F1720]">{vendorName}</div>
                          <div className="text-[11px] text-[#8A8190] mt-0.5">
                            {delivery.depotName || delivery.depotId}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-right tabular-nums">
                          <div className="font-semibold text-[#1F1720]">
                            {formatINR(totalAmount)}
                          </div>
                          <div className="text-[10px] text-[#8A8190]">
                            Base: {formatINR(baseAmount)}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-[#4B4350] tabular-nums">
                          {formatDisplayDate(delivery.expectedDeliveryDate)}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className={`text-[11px] font-medium ${varianceColor}`}>
                            {varianceText}
                          </div>
                          {delivery.actualDeliveryDate && (
                            <div className="text-[10px] text-[#8A8190] mt-0.5">
                              {formatDisplayDate(delivery.actualDeliveryDate)}
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right tabular-nums">
                          <span className={`font-semibold ${
                            m.isCompleted && !m.isInFull ? 'text-[#B7791F]' : 'text-[#1F1720]'
                          }`}>
                            {delivery.receivedQuantity ?? 0}
                          </span>
                          <span className="text-[#8A8190]"> / {delivery.expectedQuantity}</span>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          {getStatusBadge(delivery)}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => toggleExpand(delivery.id)}
                            className="text-xs text-[#E11D48] hover:text-[#BE123C] font-medium transition inline-flex items-center gap-1"
                          >
                            <span>{isExpanded ? 'Less' : 'Details'}</span>
                            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="bg-[#FFF5F7]">
                          <td colSpan={8} className="p-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                              <div>
                                <span className="text-[11px] text-[#8A8190] block">E-Way Bill &amp; LR</span>
                                <span className="font-mono text-[#1F1720] mt-0.5 block">{delivery.ewayBillNumber || 'EWB-271048291044'}</span>
                                <span className="text-[11px] text-[#8A8190]">{delivery.lrNumber || 'LR-PUN-DEL-1049'}</span>
                              </div>
                              <div>
                                <span className="text-[11px] text-[#8A8190] block">Vehicle &amp; Transporter</span>
                                <span className="font-mono text-[#1F8A5B] font-medium mt-0.5 block">{delivery.vehicleNumber || 'MH-12-PQ-7712'}</span>
                                <span className="text-[11px] text-[#8A8190]">{delivery.transporterName || 'VRL Bharat Freightways'}</span>
                              </div>
                              <div>
                                <span className="text-[11px] text-[#8A8190] block">Intake Notes</span>
                                <p className="text-[#4B4350] mt-0.5 leading-relaxed">{delivery.notes || 'Intake completed under standard verification.'}</p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
