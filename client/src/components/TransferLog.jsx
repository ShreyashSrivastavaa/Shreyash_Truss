import React, { useState } from 'react';
import {
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { formatINR } from '../lib/format/formatINR';
import { formatDate } from '../lib/format/formatDate';

export default function TransferLog({
  transfers = [],
  onApprove,
  onDispatch,
  onReceive,
  onCancel,
  canApprove = true,
  canDispatch = true,
  canReceive = true,
  userDepotId = null,
  isDetailed = false
}) {
  const [activeTab, setActiveTab] = useState('ACTIVE');
  const [processingId, setProcessingId] = useState(null);
  const [actionError, setActionError] = useState(null);

  const activeTransfers = transfers.filter(
    t => t.status === 'APPROVAL_PENDING' || t.status === 'PENDING' || t.status === 'IN_TRANSIT'
  );
  const pastTransfers = transfers.filter(
    t => t.status === 'RECEIVED' || t.status === 'CANCELLED'
  );

  const handleAction = async (actionFn, transferId) => {
    setActionError(null);
    setProcessingId(transferId);
    try {
      await actionFn(transferId);
    } catch (err) {
      setActionError(err.message || 'Action failed');
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVAL_PENDING':
        return (
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#FDF4E3] text-[#B7791F]">
            Awaiting Approval
          </span>
        );
      case 'PENDING':
        return (
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#FFE4EA] text-[#BE123C]">
            Ready for Highway
          </span>
        );
      case 'IN_TRANSIT':
        return (
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#EEEEFE] text-[#5B5BD6]">
            In Transit (NH 44)
          </span>
        );
      case 'RECEIVED':
        return (
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#E8F6EF] text-[#1F8A5B]">
            Delivered
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

  return (
    <section className="space-y-4" aria-label="Shipments Section">
      {/* Header with simple underline tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F3E3E8] pb-3">
        <div>
          <h2 className="text-lg font-semibold text-[#1F1720]">
            Shipments &amp; Freight Flow
          </h2>
          <p className="text-xs text-[#8A8190] mt-0.5">
            Active highway consignments, E-Way bills, and permanent delivery logs
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('ACTIVE')}
            className={`px-3 py-1.5 text-xs font-medium rounded-xl transition ${
              activeTab === 'ACTIVE'
                ? 'bg-[#E11D48] text-white'
                : 'text-[#8A8190] hover:text-[#1F1720] hover:bg-[#FFF5F7]'
            }`}
          >
            Active Pipeline ({activeTransfers.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('HISTORY')}
            className={`px-3 py-1.5 text-xs font-medium rounded-xl transition ${
              activeTab === 'HISTORY'
                ? 'bg-[#E11D48] text-white'
                : 'text-[#8A8190] hover:text-[#1F1720] hover:bg-[#FFF5F7]'
            }`}
          >
            History ({pastTransfers.length})
          </button>
        </div>
      </div>

      {actionError && (
        <div className="p-3.5 rounded-xl bg-[#FDECEA] border border-[#F8CCC7] text-[#B42318] text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-[#B42318]" />
            <span>{actionError}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="text-xs text-[#B42318] font-medium hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ACTIVE TABLE */}
      {activeTab === 'ACTIVE' && (
        <div className="bg-white border border-[#F3E3E8] rounded-2xl shadow-card overflow-hidden">
          {activeTransfers.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-sm font-medium text-[#1F1720]">No active shipments in pipeline</p>
              <p className="text-xs text-[#8A8190] mt-1 max-w-sm mx-auto">
                Stage a recommended transfer above to create a pending shipment order.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FFF5F7] text-[#8A8190] text-[11px] font-medium border-b border-[#F3E3E8]">
                  <tr>
                    <th className="py-3 px-4">Consignment ID</th>
                    <th className="py-3 px-4">Product &amp; Route</th>
                    <th className="py-3 px-4 text-right">Quantity &amp; Value</th>
                    <th className="py-3 px-4">Manifest &amp; Vehicle</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3E3E8]">
                  {activeTransfers.map(trf => {
                    const isProcessing = processingId === trf.id;
                    const isSourceManager = userDepotId ? userDepotId === trf.fromDepotId : true;
                    const isDestManager = userDepotId ? userDepotId === trf.toDepotId : true;

                    return (
                      <tr key={trf.id} className="hover:bg-[#FFF1F4] transition-colors">
                        <td className="py-3.5 px-4">
                          <span className="font-mono text-xs text-[#1F1720] font-medium">
                            {trf.id}
                          </span>
                          <div className="text-[10px] text-[#8A8190] mt-0.5">
                            {formatDate(trf.stagedAt, { includeTime: true })}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-medium text-[#1F1720]">{trf.skuName || trf.skuId}</div>
                          <div className="flex items-center gap-1.5 text-[#8A8190] text-[11px] mt-0.5">
                            <span>{trf.fromDepotName}</span>
                            <ArrowRight className="w-3 h-3 text-[#8A8190]" />
                            <span>{trf.toDepotName}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="font-semibold text-[#1F1720] tabular-nums">
                            {trf.quantity} units
                          </div>
                          <div className="text-[11px] text-[#8A8190]">
                            {formatINR(trf.value)}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-mono text-xs text-[#4B4350]">
                            {trf.ewayBillNumber || 'EWB-Awaiting'}
                          </div>
                          <div className="text-[11px] text-[#8A8190] mt-0.5">
                            {trf.vehicleNumber ? (
                              <span className="font-mono text-[#1F8A5B] font-medium mr-1.5">{trf.vehicleNumber}</span>
                            ) : null}
                            <span>{trf.carrierName || 'VRL Bharat Freightways'}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          {getStatusBadge(trf.status)}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {trf.status === 'APPROVAL_PENDING' && onApprove && canApprove && isSourceManager && (
                              <button
                                type="button"
                                onClick={() => handleAction(onApprove, trf.id)}
                                disabled={isProcessing}
                                className="px-3 py-1.5 rounded-lg bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-medium transition shadow-subtle disabled:opacity-50"
                              >
                                {isProcessing ? 'Approving...' : 'Approve'}
                              </button>
                            )}

                            {trf.status === 'PENDING' && onDispatch && canDispatch && (
                              <button
                                type="button"
                                onClick={() => handleAction(onDispatch, trf.id)}
                                disabled={isProcessing}
                                className="px-3 py-1.5 rounded-lg bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-medium transition shadow-subtle disabled:opacity-50"
                              >
                                {isProcessing ? 'Dispatching...' : 'Dispatch'}
                              </button>
                            )}

                            {trf.status === 'IN_TRANSIT' && onReceive && canReceive && isDestManager && (
                              <button
                                type="button"
                                onClick={() => handleAction(onReceive, trf.id)}
                                disabled={isProcessing}
                                className="px-3 py-1.5 rounded-lg bg-[#1F8A5B] hover:bg-[#186f49] text-white text-xs font-medium transition shadow-subtle disabled:opacity-50"
                              >
                                {isProcessing ? 'Receiving...' : 'Confirm Receipt'}
                              </button>
                            )}

                            {(trf.status === 'APPROVAL_PENDING' || trf.status === 'PENDING') && onCancel && (
                              <button
                                type="button"
                                onClick={() => handleAction(onCancel, trf.id)}
                                disabled={isProcessing}
                                className="px-2.5 py-1.5 rounded-lg text-xs text-[#8A8190] hover:text-[#B42318] hover:bg-[#FDECEA] transition"
                              >
                                Cancel
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
          )}
        </div>
      )}

      {/* HISTORY TABLE */}
      {activeTab === 'HISTORY' && (
        <div className="bg-white border border-[#F3E3E8] rounded-2xl shadow-card overflow-hidden">
          {pastTransfers.length === 0 ? (
            <div className="p-12 text-center text-xs text-[#8A8190]">
              No completed transfers recorded in history yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FFF5F7] text-[#8A8190] text-[11px] font-medium border-b border-[#F3E3E8]">
                  <tr>
                    <th className="py-3 px-4">Consignment ID</th>
                    <th className="py-3 px-4">Product &amp; Route</th>
                    <th className="py-3 px-4 text-right">Quantity</th>
                    <th className="py-3 px-4 text-right">Value (INR)</th>
                    <th className="py-3 px-4 text-center">Outcome</th>
                    <th className="py-3 px-4">Verified By &amp; Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3E3E8]">
                  {pastTransfers.map(trf => (
                    <tr key={trf.id} className="hover:bg-[#FFF1F4] transition-colors">
                      <td className="py-3 px-4 font-mono text-[#8A8190]">{trf.id}</td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-[#1F1720]">{trf.skuName || trf.skuId}</span>
                        <div className="text-[11px] text-[#8A8190]">{trf.fromDepotName} → {trf.toDepotName}</div>
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-[#1F1720]">{trf.quantity} units</td>
                      <td className="py-3 px-4 text-right font-semibold text-[#1F1720]">{formatINR(trf.value)}</td>
                      <td className="py-3 px-4 text-center">{getStatusBadge(trf.status)}</td>
                      <td className="py-3 px-4 text-[#8A8190] text-[11px]">
                        <div>{trf.receivedBy || trf.cancelledBy || 'Operations Desk'}</div>
                        <div className="text-[10px] text-[#8A8190]">
                          {formatDate(trf.receivedAt || trf.cancelledAt || trf.stagedAt, { includeTime: true })}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
