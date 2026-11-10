import React, { useState } from 'react';
import {
  FileText,
  AlertOctagon,
  Send,
  Check
} from 'lucide-react';
import { formatINR } from '../../lib/format/formatINR';
import { formatDate } from '../../lib/format/formatDate';

export default function ProcurementDashboard({
  vendors = [],
  vendorDeliveries = [],
  poQueue = [],
  onRaiseBreachNotice,
  isDetailed = false
}) {
  const [selectedVendorForNotice, setSelectedVendorForNotice] = useState(null);
  const [noticeReason, setNoticeReason] = useState('Chronic delay of temperature-sensitive goods exceeding 10% SLA tolerance threshold.');
  const [activeSuccessMsg, setActiveSuccessMsg] = useState(null);

  const handleIssueNotice = (vendor) => {
    setSelectedVendorForNotice(vendor);
  };

  const submitNotice = () => {
    if (selectedVendorForNotice) {
      onRaiseBreachNotice(selectedVendorForNotice.id, noticeReason);
      setActiveSuccessMsg(`Formal SLA Breach Notice issued to ${selectedVendorForNotice.name}. Legal penalty calculation attached.`);
      setSelectedVendorForNotice(null);
      setTimeout(() => setActiveSuccessMsg(null), 4000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Success Notification */}
      {activeSuccessMsg && (
        <div className="p-3.5 rounded-xl bg-[#E8F6EF] border border-[#F3E3E8] text-[#1F8A5B] text-xs flex items-center justify-between shadow-card">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-[#1F8A5B]" />
            <span>{activeSuccessMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setActiveSuccessMsg(null)}
            className="text-xs text-[#1F8A5B] hover:underline font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* PO QUEUE WITH 18% GST BREAKDOWN */}
      <div className="bg-white border border-[#F3E3E8] rounded-2xl p-6 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F3E3E8] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#FFF5F7] text-[#E11D48]">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#1F1720]">
                Automated Replenishment Purchase Orders (18% GST Compliant)
              </h3>
              <p className="text-xs text-[#8A8190] mt-0.5">
                Auto-triggered orders generated when regional depot stock breaches safety thresholds
              </p>
            </div>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-[#FFF5F7] text-[#4B4350] border border-[#F3E3E8] font-medium tabular-nums self-start sm:self-auto">
            {poQueue.length} Active Orders
          </span>
        </div>

        <div className="space-y-3">
          {poQueue.map((po) => (
            <div
              key={po.id}
              className="p-4 rounded-xl bg-[#FFF5F7] border border-[#F3E3E8] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-card"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-[#1F1720] text-xs">{po.skuName}</span>
                  <span className="text-[10px] text-[#8A8190] bg-white px-2 py-0.5 rounded border border-[#F3E3E8]">
                    {po.id}
                  </span>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#FDF4E3] text-[#B7791F]">
                    {po.status}
                  </span>
                </div>
                <div className="text-xs text-[#8A8190] flex items-center gap-2 flex-wrap">
                  <span>Vendor: <strong className="text-[#1F1720] font-medium">{po.vendorName}</strong></span>
                  <span>•</span>
                  <span>Destination: <strong className="text-[#1F1720] font-medium">{po.depotName}</strong></span>
                  <span>•</span>
                  <span>Quantity: <strong className="text-[#1F1720] font-medium">{po.quantity} units</strong></span>
                </div>
                <div className="text-[11px] text-[#8A8190]">
                  Triggered by: {po.triggeredBy} • Created: {formatDate(po.createdAt, { includeTime: true })}
                </div>
              </div>

              {/* Financial GST Breakdown */}
              <div className="p-3 rounded-xl bg-white border border-[#F3E3E8] text-right shrink-0 shadow-card">
                <div className="text-xs text-[#8A8190]">
                  Base ({po.quantity} × {formatINR(po.unitPrice)}): <span className="text-[#1F1720] font-medium">{formatINR(po.baseAmount)}</span>
                </div>
                <div className="text-xs text-[#8A8190] mt-0.5">
                  CGST + SGST (18%): <span className="text-[#B7791F] font-medium">{formatINR(po.gstAmount)}</span>
                </div>
                <div className="text-xs font-semibold text-[#1F8A5B] mt-1 pt-1 border-t border-[#F3E3E8]">
                  Total: {formatINR(po.totalAmount)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SLA ENFORCEMENT & NOTICE DESK */}
      <div className="bg-white border border-[#F3E3E8] rounded-2xl p-6 shadow-card space-y-4">
        <div className="flex items-center justify-between border-b border-[#F3E3E8] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#FFF5F7] text-[#E11D48]">
              <AlertOctagon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#1F1720]">
                Vendor SLA Penalty Enforcement &amp; Corrective Action (CAPA)
              </h3>
              <p className="text-xs text-[#8A8190] mt-0.5">
                Contractual penalty deductions, late shipment disputes, and formal breach notices
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {vendors.map((v) => {
            const isBreach = v.id === 'VND-NORDIC-02' || v.id === 'VND-BIOGUARD-03';
            const penaltyRate = v.slaPenaltyRatePercent || (v.id === 'VND-NORDIC-02' ? 5.0 : 3.5);

            return (
              <div
                key={v.id}
                className="p-4 rounded-xl bg-[#FFF5F7] border border-[#F3E3E8] flex flex-col justify-between space-y-3 shadow-card"
              >
                <div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-semibold text-[#1F1720] text-xs">{v.name}</span>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                      !isBreach
                        ? 'bg-[#E8F6EF] text-[#1F8A5B]'
                        : 'bg-[#FDECEA] text-[#B42318]'
                    }`}>
                      {!isBreach ? 'Compliant' : 'Breach Detected'}
                    </span>
                  </div>
                  <p className="text-xs text-[#8A8190] mt-1">{v.location || 'India'}</p>
                  <p className="text-[10px] text-[#8A8190]">GSTIN: {v.gstin || '27AAACA1234A1Z1'}</p>
                </div>

                <div className="p-2.5 rounded-lg bg-white border border-[#F3E3E8] space-y-1 text-xs shadow-card">
                  <div className="flex items-center justify-between text-[#8A8190]">
                    <span>Penalty Rate:</span>
                    <span className="font-medium text-[#1F1720]">{penaltyRate}% / week</span>
                  </div>
                  <div className="flex items-center justify-between text-[#8A8190]">
                    <span>Value at Risk:</span>
                    <span className={`font-semibold tabular-nums ${v.orderValueAtRisk > 0 ? 'text-[#B42318]' : 'text-[#1F8A5B]'}`}>
                      {formatINR(v.orderValueAtRisk || 0)}
                    </span>
                  </div>
                </div>

                {isBreach ? (
                  <button
                    type="button"
                    onClick={() => handleIssueNotice(v)}
                    className="w-full py-1.5 px-3 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] text-white font-medium text-xs transition shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Issue SLA Notice</span>
                  </button>
                ) : (
                  <div className="py-1.5 px-3 text-center text-[#1F8A5B] text-xs font-medium bg-[#E8F6EF] rounded-xl border border-[#F3E3E8]">
                    SLA Tier-1 Gold Vendor
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL: ISSUE FORMAL BREACH NOTICE */}
      {selectedVendorForNotice && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#F3E3E8] rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 text-[#4B4350]">
            <div className="flex items-center justify-between border-b border-[#F3E3E8] pb-3">
              <div className="flex items-center gap-2">
                <AlertOctagon className="w-5 h-5 text-[#B42318]" />
                <h3 className="text-sm font-semibold text-[#1F1720]">Issue Formal SLA Breach Notice</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedVendorForNotice(null)}
                className="text-[#8A8190] hover:text-[#1F1720] p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-[#4B4350]">
              <div className="p-3 rounded-xl bg-[#FFF5F7] border border-[#F3E3E8] space-y-1">
                <p><strong>Vendor:</strong> {selectedVendorForNotice.name}</p>
                <p><strong>Location:</strong> {selectedVendorForNotice.location}</p>
                <p><strong>GSTIN:</strong> {selectedVendorForNotice.gstin}</p>
                <p><strong>Order Value Subject to Penalty:</strong> {formatINR(selectedVendorForNotice.orderValueAtRisk || 1068000)}</p>
              </div>

              <div>
                <label className="block text-[#4B4350] font-medium mb-1">
                  Contract Breach Grounds &amp; Corrective Action Plan (CAPA) Requirements:
                </label>
                <textarea
                  rows={3}
                  value={noticeReason}
                  onChange={(e) => setNoticeReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#FFFBFC] border border-[#F3E3E8] text-xs text-[#1F1720] focus:outline-none focus:border-[#E11D48]"
                />
              </div>

              <p className="text-[11px] text-[#8A8190] leading-normal">
                This notice will be recorded in the live audit log and transmitted directly to the vendor's digital portal with contractual deduction terms under Section 14(b) of the Supply Agreement.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#F3E3E8]">
              <button
                type="button"
                onClick={() => setSelectedVendorForNotice(null)}
                className="px-3.5 py-1.5 rounded-xl border border-[#F3E3E8] text-[#4B4350] hover:bg-[#FFF5F7] text-xs font-medium transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitNotice}
                className="px-4 py-1.5 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-medium transition shadow-sm flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Transmit Breach Notice</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
