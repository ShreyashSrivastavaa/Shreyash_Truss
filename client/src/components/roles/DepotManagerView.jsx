import React, { useState } from 'react';
import {
  Warehouse,
  MapPin,
  Truck,
  AlertCircle,
  Check,
  X,
  PackageCheck,
  ShieldCheck,
  Phone
} from 'lucide-react';
import { formatINR } from '../../lib/format/formatINR';

export default function DepotManagerView({
  user,
  depot,
  inventory = [],
  transfers = [],
  onApproveTransfer,
  onReceiveTransfer,
  onCancelTransfer,
  isDetailed = false
}) {
  const [activeActionId, setActiveActionId] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  if (!depot) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-[#F3E3E8] text-[#8A8190] shadow-card">
        Depot profile not assigned to this user.
      </div>
    );
  }

  // Filter inventory items for this depot only
  const depotInventory = inventory.filter(i => i.depotId === depot.id);

  // Transfers where this depot is origin
  const outgoingTransfers = transfers.filter(t => t.fromDepotId === depot.id);
  const pendingApprovals = outgoingTransfers.filter(t => t.status === 'APPROVAL_PENDING');

  // Transfers where this depot is destination
  const incomingTransfers = transfers.filter(t => t.toDepotId === depot.id);
  const inboundInTransit = incomingTransfers.filter(t => t.status === 'IN_TRANSIT');

  const handleApprove = async (transferId) => {
    setActiveActionId(transferId);
    try {
      await onApproveTransfer(transferId, user);
      setFeedbackMsg(`Transfer ${transferId} approved for dispatch! Freight forwarded to Fleet Manager.`);
      setTimeout(() => setFeedbackMsg(null), 4000);
    } finally {
      setActiveActionId(null);
    }
  };

  const handleReceive = async (transferId) => {
    setActiveActionId(transferId);
    try {
      await onReceiveTransfer(transferId, user);
      setFeedbackMsg(`Dock intake confirmed! Physical stock updated at ${depot.name}.`);
      setTimeout(() => setFeedbackMsg(null), 4000);
    } finally {
      setActiveActionId(null);
    }
  };

  const handleReject = async (transferId) => {
    setActiveActionId(transferId);
    try {
      await onCancelTransfer(transferId, user);
      setFeedbackMsg(`Transfer ${transferId} rejected and cancelled.`);
      setTimeout(() => setFeedbackMsg(null), 4000);
    } finally {
      setActiveActionId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Depot Facility Identity Header */}
      <div className="p-6 rounded-2xl bg-white border border-[#F3E3E8] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-card">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-[#FFF5F7] text-[#E11D48] shrink-0">
            <Warehouse className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-semibold text-[#1F1720]">{depot.name}</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#FFF5F7] text-[#8A8190] border border-[#F3E3E8]">
                {depot.id}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#E8F6EF] text-[#1F8A5B] font-medium">
                Active Depot
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-[#8A8190] mt-1 flex-wrap">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#8A8190]" />
                {depot.city}
              </span>
              <span>•</span>
              <span>GSTIN: {depot.gstin}</span>
              <span>•</span>
              <span>Manager: <strong className="text-[#1F1720] font-medium">{user.name}</strong></span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3 text-[#8A8190]" />
                {depot.contactPhone || '+91 98101 44520'}
              </span>
            </div>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-2 text-xs">
          <div className="p-2.5 rounded-xl bg-[#FFF5F7] border border-[#F3E3E8] text-right">
            <span className="text-[10px] text-[#8A8190] block">Assigned Role</span>
            <span className="font-semibold text-[#E11D48]">Regional Depot Manager</span>
          </div>
        </div>
      </div>

      {feedbackMsg && (
        <div className="p-3.5 rounded-xl bg-[#E8F6EF] border border-[#F3E3E8] text-[#1F8A5B] text-xs flex items-center justify-between shadow-card">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-[#1F8A5B]" />
            <span>{feedbackMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMsg(null)}
            className="text-xs text-[#1F8A5B] hover:underline font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ACTION REQUIRED BANNER: OUTGOING TRANSFERS REQUIRING APPROVAL */}
      {pendingApprovals.length > 0 && (
        <div className="p-5 rounded-2xl bg-[#FFF5F7] border border-[#F3E3E8] text-xs space-y-3 shadow-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#1F1720] font-semibold">
              <AlertCircle className="w-4 h-4 text-[#B7791F]" />
              <span>Action Required: {pendingApprovals.length} Outgoing Transfer Orders Awaiting Sign-Off</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FDF4E3] text-[#B7791F] font-medium">
              Approval Required
            </span>
          </div>
          <p className="text-[#4B4350] text-xs">
            Outbound stock movements staged from your depot. Inspect physical holding and sign off on dock reservation.
          </p>

          <div className="space-y-2 pt-1">
            {pendingApprovals.map(trf => (
              <div
                key={trf.id}
                className="p-4 rounded-xl bg-white border border-[#F3E3E8] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-card"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#1F1720] text-xs">{trf.quantity} units of {trf.skuName}</span>
                    <span className="text-[10px] text-[#8A8190] bg-[#FFF5F7] px-1.5 py-0.5 rounded border border-[#F3E3E8]">
                      {trf.id}
                    </span>
                  </div>
                  <p className="text-xs text-[#8A8190] mt-0.5">
                    Destination: <strong className="text-[#1F1720] font-medium">{trf.toDepotName}</strong> · Value: <strong>{formatINR(trf.value)}</strong> · Staged by {trf.stagedBy}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleApprove(trf.id)}
                    disabled={activeActionId === trf.id}
                    className="px-3.5 py-1.5 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] text-white font-medium text-xs transition flex items-center gap-1 shadow-sm disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{activeActionId === trf.id ? 'Processing...' : 'Approve Outgoing'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReject(trf.id)}
                    disabled={activeActionId === trf.id}
                    className="px-3 py-1.5 rounded-xl border border-[#F3E3E8] hover:bg-[#FFF5F7] text-[#4B4350] font-medium text-xs transition disabled:opacity-50"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DOCK INTAKE: INBOUND IN-TRANSIT SHIPMENTS TO RECEIVE */}
      {inboundInTransit.length > 0 && (
        <div className="p-5 rounded-2xl bg-[#FFF5F7] border border-[#F3E3E8] text-xs space-y-3 shadow-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#1F1720] font-semibold">
              <Truck className="w-4 h-4 text-[#E11D48]" />
              <span>Inbound Freight Approaching Dock: {inboundInTransit.length} Shipments</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FFE4EA] text-[#E11D48] font-medium">
              Dock Intake Ready
            </span>
          </div>

          <div className="space-y-2 pt-1">
            {inboundInTransit.map(trf => (
              <div
                key={trf.id}
                className="p-4 rounded-xl bg-white border border-[#F3E3E8] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-card"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#1F1720] text-xs">{trf.quantity} units of {trf.skuName}</span>
                    <span className="text-[10px] text-[#8A8190] bg-[#FFF5F7] px-1.5 py-0.5 rounded border border-[#F3E3E8]">
                      {trf.id}
                    </span>
                  </div>
                  <div className="text-xs text-[#8A8190] mt-1 flex items-center gap-3 flex-wrap">
                    <span>Origin: <strong className="text-[#1F1720] font-medium">{trf.fromDepotName}</strong></span>
                    <span>Carrier: <strong className="text-[#1F1720] font-medium">{trf.carrierName}</strong></span>
                    <span>Vehicle: <strong className="text-[#1F8A5B] font-mono">{trf.vehicleNumber}</strong></span>
                    <span>E-Way: <strong className="text-[#4B4350] font-mono">{trf.ewayBillNumber}</strong></span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleReceive(trf.id)}
                  disabled={activeActionId === trf.id}
                  className="px-3.5 py-2 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] text-white font-medium text-xs transition flex items-center gap-1.5 shadow-sm shrink-0 disabled:opacity-50"
                >
                  <PackageCheck className="w-4 h-4" />
                  <span>{activeActionId === trf.id ? 'Confirming...' : 'Confirm Receipt & Intake'}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* LIVE DEPOT STOCK HEALTH FOR ASSIGNED FACILITY */}
      <div className="bg-white border border-[#F3E3E8] rounded-2xl p-6 shadow-card space-y-4">
        <div className="flex items-center justify-between border-b border-[#F3E3E8] pb-3">
          <div>
            <h3 className="text-sm font-semibold text-[#1F1720] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#E11D48]" />
              <span>Assigned Facility Live Stock &amp; Buffer Status</span>
            </h3>
            <p className="text-xs text-[#8A8190] mt-0.5">
              Live physical on-hand vs protected target stock for {depot.name}
            </p>
          </div>
          <span className="text-xs text-[#8A8190]">
            2 SKUs Under Surveillance
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {depotInventory.map(item => {
            const isDeficit = item.status === 'DEFICIT';
            const isSurplus = item.status === 'SURPLUS';
            const percentOfTarget = Math.min(100, Math.round((item.onHand / item.targetStock) * 100));

            return (
              <div
                key={item.skuId}
                className="p-4 rounded-xl bg-[#FFF5F7] border border-[#F3E3E8] space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-semibold text-[#1F1720]">{item.skuName}</h4>
                    <span className="text-[10px] text-[#8A8190]">{item.skuId}</span>
                  </div>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                    isDeficit
                      ? 'bg-[#FDECEA] text-[#B42318]'
                      : isSurplus
                      ? 'bg-[#E8F6EF] text-[#1F8A5B]'
                      : 'bg-[#FDF4E3] text-[#B7791F]'
                  }`}>
                    {item.status}
                  </span>
                </div>

                <div className="flex items-baseline justify-between text-xs">
                  <div>
                    <span className="text-[#8A8190]">Physical On-Hand: </span>
                    <span className="text-base font-semibold text-[#1F1720] tabular-nums">{item.onHand}</span>
                    <span className="text-[10px] text-[#8A8190] ml-1">{item.unit}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[#8A8190]">Target: </span>
                    <span className="font-medium text-[#1F1720] tabular-nums">{item.targetStock}</span>
                  </div>
                </div>

                <div className="w-full bg-[#F3E3E8] rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isDeficit ? 'bg-[#B42318]' : isSurplus ? 'bg-[#1F8A5B]' : 'bg-[#B7791F]'
                    }`}
                    style={{ width: `${percentOfTarget}%` }}
                  />
                </div>

                <div className="pt-2 border-t border-[#F3E3E8] grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-[#8A8190] block text-[11px]">Safety Floor</span>
                    <span className="text-[#1F1720] font-medium tabular-nums">{item.safetyStock}</span>
                  </div>
                  <div>
                    <span className="text-[#8A8190] block text-[11px]">Reserved</span>
                    <span className={`font-medium tabular-nums ${item.reserved > 0 ? 'text-[#B7791F]' : 'text-[#8A8190]'}`}>
                      {item.reserved || 0}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[#8A8190] block text-[11px]">In-Transit</span>
                    <span className={`font-medium tabular-nums ${item.inTransit > 0 ? 'text-[#E11D48]' : 'text-[#8A8190]'}`}>
                      +{item.inTransit || 0}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
