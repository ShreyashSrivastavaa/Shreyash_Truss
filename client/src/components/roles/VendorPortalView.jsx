import React, { useState } from 'react';
import {
  Building2,
  MessageSquare,
  Send,
  Check
} from 'lucide-react';
import { formatINR } from '../../lib/format/formatINR';
import { formatDate } from '../../lib/format/formatDate';

export default function VendorPortalView({
  user,
  vendor,
  deliveries = [],
  onConfirmDispatch,
  onDisputeFlag
}) {
  const [selectedDeliveryForDispute, setSelectedDeliveryForDispute] = useState(null);
  const [disputeNote, setDisputeNote] = useState('');
  const [activeSuccess, setActiveSuccess] = useState(null);

  if (!vendor) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-[#F3E3E8] text-[#8A8190] shadow-card">
        Vendor organization profile not mapped.
      </div>
    );
  }

  // Filter deliveries belonging strictly to this vendor
  const vendorDeliveries = deliveries.filter(d => d.vendorId === vendor.id);

  const otifRate = vendor.metrics?.otifRate ?? (vendor.id === 'VND-APEX-01' ? 100 : 0);
  const targetRate = vendor.targetOtifRate || 95;
  const isBreach = otifRate < targetRate;

  const handleOpenDispute = (del) => {
    setSelectedDeliveryForDispute(del);
    setDisputeNote('Shipment experienced customs clearance delay at Nhava Sheva port due to revised bonded warehouse inspection guidelines. Carrier documented force majeure.');
  };

  const submitDispute = () => {
    if (selectedDeliveryForDispute) {
      onDisputeFlag(selectedDeliveryForDispute.id, disputeNote, user);
      setActiveSuccess(`Dispute filed for order ${selectedDeliveryForDispute.id}. Operations notified.`);
      setSelectedDeliveryForDispute(null);
      setTimeout(() => setActiveSuccess(null), 4000);
    }
  };

  const handleDispatch = (del) => {
    onConfirmDispatch(del.id, 'Dispatched by vendor logistics team under E-Way bill.', user);
    setActiveSuccess(`Delivery intake confirmed for ${del.poNumber}.`);
    setTimeout(() => setActiveSuccess(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Vendor Header */}
      <div className="p-6 rounded-2xl bg-white border border-[#F3E3E8] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-card">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-[#FFF5F7] text-[#E11D48] shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-semibold text-[#1F1720]">{vendor.name}</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#FFF5F7] text-[#8A8190] border border-[#F3E3E8]">
                {vendor.id}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#FFF5F7] text-[#4B4350] border border-[#F3E3E8] font-medium">
                Vendor Portal
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-[#8A8190] mt-1 flex-wrap">
              <span>Location: <strong className="text-[#1F1720] font-medium">{vendor.location || 'India'}</strong></span>
              <span>•</span>
              <span>GSTIN: {vendor.gstin}</span>
              <span>•</span>
              <span>Representative: <strong className="text-[#1F1720] font-medium">{user.name}</strong></span>
            </div>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
            !isBreach
              ? 'bg-[#E8F6EF] text-[#1F8A5B]'
              : 'bg-[#FDECEA] text-[#B42318]'
          }`}>
            {!isBreach ? 'Compliant' : 'Breach Review Active'}
          </span>
        </div>
      </div>

      {activeSuccess && (
        <div className="p-3.5 rounded-xl bg-[#E8F6EF] border border-[#F3E3E8] text-[#1F8A5B] text-xs flex items-center justify-between shadow-card">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-[#1F8A5B]" />
            <span>{activeSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setActiveSuccess(null)}
            className="text-xs text-[#1F8A5B] hover:underline font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* SLA Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-white border border-[#F3E3E8] shadow-card space-y-1">
          <span className="text-xs text-[#8A8190] font-medium">Empirical OTIF Rate</span>
          <div className="text-2xl font-semibold text-[#1F1720] tabular-nums">
            <span className={!isBreach ? 'text-[#1F8A5B]' : 'text-[#B42318]'}>{otifRate}%</span>
            <span className="text-xs text-[#8A8190] font-normal ml-1.5">(Target: {targetRate}%)</span>
          </div>
          <p className="text-xs text-[#8A8190]">Verified dock intake timestamps</p>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-[#F3E3E8] shadow-card space-y-1">
          <span className="text-xs text-[#8A8190] font-medium">Total Orders Executed</span>
          <div className="text-2xl font-semibold text-[#1F1720] tabular-nums">
            {vendorDeliveries.length}
          </div>
          <p className="text-xs text-[#8A8190]">Current fiscal quarter intake</p>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-[#F3E3E8] shadow-card space-y-1">
          <span className="text-xs text-[#8A8190] font-medium">Order Value at Risk</span>
          <div className={`text-2xl font-semibold tabular-nums ${vendor.orderValueAtRisk > 0 ? 'text-[#B42318]' : 'text-[#1F8A5B]'}`}>
            {formatINR(vendor.orderValueAtRisk || 0)}
          </div>
          <p className="text-xs text-[#8A8190]">Contractual penalty exposure</p>
        </div>
      </div>

      {/* Your Orders & Deliveries Table */}
      <div className="bg-white border border-[#F3E3E8] rounded-2xl p-6 shadow-card space-y-4">
        <div className="flex items-center justify-between border-b border-[#F3E3E8] pb-3">
          <h3 className="text-sm font-semibold text-[#1F1720]">
            Purchase Orders &amp; Delivery Intake Status
          </h3>
          <span className="text-xs text-[#8A8190]">
            {vendorDeliveries.length} Consignments
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[#F3E3E8]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FFF5F7] text-[#8A8190] font-medium border-b border-[#F3E3E8]">
              <tr>
                <th className="py-3 px-4">PO Number</th>
                <th className="py-3 px-4">Destination Hub</th>
                <th className="py-3 px-4 text-right">Order Value</th>
                <th className="py-3 px-4">Expected Due Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3E3E8]">
              {vendorDeliveries.map((del) => {
                const isLate = del.status === 'DELAYED' || (del.actualDeliveryDate && del.actualDeliveryDate > del.expectedDeliveryDate);
                const canDispute = isLate && del.status !== 'CANCELLED';
                const canDispatch = del.status === 'SCHEDULED';

                return (
                  <tr key={del.id} className="hover:bg-[#FFF1F4] transition">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#1F1720]">{del.poNumber}</div>
                      <div className="text-[10px] text-[#8A8190]">{del.id}</div>
                    </td>
                    <td className="py-3 px-4 text-[#4B4350]">{del.depotName || del.depotId}</td>
                    <td className="py-3 px-4 text-right tabular-nums font-semibold text-[#1F1720]">
                      {formatINR(del.totalAmount || del.orderValue || 890000)}
                    </td>
                    <td className="py-3 px-4 text-[#4B4350] tabular-nums">
                      {formatDate(del.expectedDeliveryDate)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                        del.status === 'DELIVERED'
                          ? 'bg-[#E8F6EF] text-[#1F8A5B]'
                          : del.status === 'DELAYED'
                          ? 'bg-[#FDECEA] text-[#B42318]'
                          : 'bg-[#FDF4E3] text-[#B7791F]'
                      }`}>
                        {del.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {canDispatch && (
                          <button
                            type="button"
                            onClick={() => handleDispatch(del)}
                            className="px-3 py-1 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-medium transition shadow-sm"
                          >
                            Confirm Dispatch
                          </button>
                        )}
                        {canDispute && (
                          <button
                            type="button"
                            onClick={() => handleOpenDispute(del)}
                            className="px-3 py-1 rounded-xl border border-[#F3E3E8] hover:bg-[#FFF5F7] text-[#4B4350] text-xs font-medium transition"
                          >
                            Dispute Late Flag
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* DISPUTE MODAL */}
      {selectedDeliveryForDispute && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#F3E3E8] rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 text-[#4B4350]">
            <div className="flex items-center justify-between border-b border-[#F3E3E8] pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-[#B7791F]" />
                <h3 className="text-sm font-semibold text-[#1F1720]">Dispute Late Flag for Order {selectedDeliveryForDispute.poNumber}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDeliveryForDispute(null)}
                className="text-[#8A8190] hover:text-[#1F1720] p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-[#4B4350]">
              <p>
                Provide documentation or force majeure grounds to contest the late flag. If approved by the Truss Procurement Desk, the SLA penalty deduction will be waived.
              </p>
              <div>
                <label className="block text-[#4B4350] font-medium mb-1">
                  Dispute Grounds &amp; Carrier Reference:
                </label>
                <textarea
                  rows={4}
                  value={disputeNote}
                  onChange={(e) => setDisputeNote(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#FFFBFC] border border-[#F3E3E8] text-xs text-[#1F1720] focus:outline-none focus:border-[#E11D48]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#F3E3E8]">
              <button
                type="button"
                onClick={() => setSelectedDeliveryForDispute(null)}
                className="px-3.5 py-1.5 rounded-xl border border-[#F3E3E8] text-[#4B4350] hover:bg-[#FFF5F7] text-xs font-medium transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitDispute}
                className="px-4 py-1.5 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-medium transition shadow-sm flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Dispute</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
