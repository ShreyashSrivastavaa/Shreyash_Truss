import React, { useState } from 'react';
import {
  Truck,
  Clock,
  CheckCircle2,
  Send
} from 'lucide-react';
import IndiaRouteMap from '../IndiaRouteMap';
import { formatINR } from '../../lib/format/formatINR';
import { TRANSPORTERS, SAMPLE_VEHICLES } from '../../data/seedData';

export default function FleetManagerDashboard({
  user,
  transfers = [],
  onDispatchTransfer,
  onCancelTransfer,
  isDetailed = false
}) {
  const [selectedTransferForDispatch, setSelectedTransferForDispatch] = useState(null);
  const [vehicleNumber, setVehicleNumber] = useState('HR-55-XY-3021');
  const [carrierName, setCarrierName] = useState('VRL Bharat Freightways');
  const [ewayBillNumber, setEwayBillNumber] = useState('EWB-061048291044');
  const [lrNumber, setLrNumber] = useState('LR-DEL-CHN-8821');
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  const readyForDispatch = transfers.filter(t => t.status === 'PENDING');
  const inTransitTransfers = transfers.filter(t => t.status === 'IN_TRANSIT');

  const openDispatchModal = (trf) => {
    setSelectedTransferForDispatch(trf);
    const samplePlate = SAMPLE_VEHICLES[Math.floor(Math.random() * SAMPLE_VEHICLES.length)];
    setVehicleNumber(samplePlate);
    setCarrierName(trf.fromDepotId === 'depot-south' ? 'GatiShakti Express Logistics' : 'VRL Bharat Freightways');
    setEwayBillNumber(`EWB-06${Math.floor(1000000000 + Math.random() * 9000000000)}`);
    setLrNumber(`LR-${trf.fromDepotId.slice(6, 9).toUpperCase()}-${trf.toDepotId.slice(6, 9).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`);
  };

  const handleConfirmDispatch = async () => {
    if (!selectedTransferForDispatch) return;

    await onDispatchTransfer(
      selectedTransferForDispatch.id,
      {
        vehicleNumber,
        carrierName,
        ewayBillNumber,
        lrNumber
      },
      user
    );

    setFeedbackMsg(`Consignment ${selectedTransferForDispatch.id} successfully dispatched on vehicle ${vehicleNumber}.`);
    setSelectedTransferForDispatch(null);
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Route Radar Map */}
      <IndiaRouteMap activeTransfers={inTransitTransfers} />

      {feedbackMsg && (
        <div className="p-3.5 rounded-xl bg-[#E8F6EF] border border-[#F3E3E8] text-[#1F8A5B] text-xs flex items-center justify-between shadow-card">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#1F8A5B]" />
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

      {/* DISPATCH ACTION QUEUE */}
      <div className="bg-white border border-[#F3E3E8] rounded-2xl p-6 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F3E3E8] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#FFF5F7] text-[#E11D48]">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#1F1720]">
                Consignments Awaiting Vehicle Assignment &amp; E-Way Bill Dispatch
              </h3>
              <p className="text-xs text-[#8A8190] mt-0.5">
                Staged inventory movements approved by origin depots ready for transport manifest
              </p>
            </div>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-[#FFF5F7] text-[#4B4350] border border-[#F3E3E8] font-medium tabular-nums self-start sm:self-auto">
            {readyForDispatch.length} Ready for Highway
          </span>
        </div>

        {readyForDispatch.length === 0 ? (
          <div className="py-8 px-4 text-center border border-dashed border-[#F3E3E8] rounded-xl bg-[#FFF5F7]">
            <p className="text-xs text-[#8A8190]">All staged shipments are currently assigned to vehicles or en route.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {readyForDispatch.map((trf) => (
              <div
                key={trf.id}
                className="p-4 rounded-xl bg-[#FFF5F7] border border-[#F3E3E8] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-card"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#1F1720] text-xs">{trf.quantity} units of {trf.skuName}</span>
                    <span className="text-[10px] text-[#8A8190] bg-white px-2 py-0.5 rounded border border-[#F3E3E8]">
                      {trf.id}
                    </span>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#E8F6EF] text-[#1F8A5B]">
                      Origin Approved
                    </span>
                  </div>
                  <div className="text-xs text-[#8A8190] mt-1 flex items-center gap-3 flex-wrap">
                    <span>Route: <strong className="text-[#1F1720] font-medium">{trf.fromDepotName} → {trf.toDepotName}</strong></span>
                    <span>•</span>
                    <span>Value: <strong className="text-[#1F1720] font-medium">{formatINR(trf.value)}</strong></span>
                    <span>•</span>
                    <span>Transit: <strong>3-4 days</strong></span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => openDispatchModal(trf)}
                  className="px-4 py-2 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] text-white font-medium text-xs transition flex items-center gap-1.5 shadow-sm shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Assign Vehicle &amp; Dispatch</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ACTIVE HIGHWAY IN-TRANSIT RADAR */}
      <div className="bg-white border border-[#F3E3E8] rounded-2xl p-6 shadow-card space-y-4">
        <div className="flex items-center justify-between border-b border-[#F3E3E8] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#FFF5F7] text-[#E11D48]">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#1F1720]">
                Active Freight Movement Along Indian Expressways ({inTransitTransfers.length} Active)
              </h3>
              <p className="text-xs text-[#8A8190] mt-0.5">
                Real-time tracking of lorry receipts, vehicles, and ETA buffers
              </p>
            </div>
          </div>
        </div>

        {inTransitTransfers.length === 0 ? (
          <div className="py-8 px-4 text-center border border-dashed border-[#F3E3E8] rounded-xl bg-[#FFF5F7]">
            <p className="text-xs text-[#8A8190]">No freight currently in transit on the road.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {inTransitTransfers.map(trf => (
              <div
                key={trf.id}
                className="p-4 rounded-xl bg-[#FFF5F7] border border-[#F3E3E8] space-y-3 shadow-card"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#1F1720] text-xs">{trf.skuName}</span>
                  <span className="text-[10px] text-[#8A8190] bg-white px-2 py-0.5 rounded border border-[#F3E3E8]">
                    {trf.id}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-white p-2.5 rounded-xl border border-[#F3E3E8] shadow-card">
                  <div>
                    <span className="text-[10px] text-[#8A8190] block">Vehicle Reg. No.</span>
                    <span className="font-mono text-[#1F8A5B] font-medium">{trf.vehicleNumber}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#8A8190] block">E-Way Bill</span>
                    <span className="font-mono text-[#4B4350]">{trf.ewayBillNumber}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#8A8190] block">Transporter</span>
                    <span className="text-[#1F1720] font-medium truncate block">{trf.carrierName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#8A8190] block">Quantity</span>
                    <span className="text-[#1F1720] font-medium">{trf.quantity} units</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-[#8A8190]">
                  <span>Route: {trf.fromDepotName} → {trf.toDepotName}</span>
                  <span className="text-[#B7791F] font-medium">ETA: ~3 days</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL: ASSIGN VEHICLE & DISPATCH */}
      {selectedTransferForDispatch && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#F3E3E8] rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 text-[#4B4350]">
            <div className="flex items-center justify-between border-b border-[#F3E3E8] pb-3">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-[#E11D48]" />
                <h3 className="text-sm font-semibold text-[#1F1720]">
                  Transport Manifest &amp; Vehicle Assignment
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTransferForDispatch(null)}
                className="text-[#8A8190] hover:text-[#1F1720] p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-[#4B4350]">
              <div className="p-3 rounded-xl bg-[#FFF5F7] border border-[#F3E3E8] space-y-1">
                <p><strong>Transfer Order:</strong> {selectedTransferForDispatch.id}</p>
                <p><strong>Cargo:</strong> {selectedTransferForDispatch.quantity} units of {selectedTransferForDispatch.skuName}</p>
                <p><strong>Lane:</strong> {selectedTransferForDispatch.fromDepotName} → {selectedTransferForDispatch.toDepotName}</p>
                <p><strong>Cargo Valuation:</strong> {formatINR(selectedTransferForDispatch.value)}</p>
              </div>

              <div>
                <label className="block text-[#4B4350] font-medium mb-1">
                  Indian Vehicle Registration Number:
                </label>
                <input
                  type="text"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  placeholder="HR-55-XY-3021"
                  className="w-full px-3 py-2 rounded-xl bg-[#FFFBFC] border border-[#F3E3E8] font-mono text-[#1F8A5B] font-semibold focus:outline-none focus:border-[#E11D48]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#4B4350] font-medium mb-1">
                    Transporter Agency:
                  </label>
                  <select
                    value={carrierName}
                    onChange={(e) => setCarrierName(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl bg-[#FFFBFC] border border-[#F3E3E8] text-xs text-[#1F1720] focus:outline-none focus:border-[#E11D48]"
                  >
                    {TRANSPORTERS.map(tr => (
                      <option key={tr.id} value={tr.name}>
                        {tr.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[#4B4350] font-medium mb-1">
                    E-Way Bill Number (GST Portal):
                  </label>
                  <input
                    type="text"
                    value={ewayBillNumber}
                    onChange={(e) => setEwayBillNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FFFBFC] border border-[#F3E3E8] font-mono text-[#1F1720] text-xs focus:outline-none focus:border-[#E11D48]"
                  >
                  </input>
                </div>
              </div>

              <div>
                <label className="block text-[#4B4350] font-medium mb-1">
                  Lorry Receipt (LR) Number:
                </label>
                <input
                  type="text"
                  value={lrNumber}
                  onChange={(e) => setLrNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FFFBFC] border border-[#F3E3E8] font-mono text-[#1F1720] text-xs focus:outline-none focus:border-[#E11D48]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#F3E3E8]">
              <button
                type="button"
                onClick={() => setSelectedTransferForDispatch(null)}
                className="px-3.5 py-1.5 rounded-xl border border-[#F3E3E8] text-[#4B4350] hover:bg-[#FFF5F7] text-xs font-medium transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDispatch}
                className="px-4 py-1.5 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-medium transition shadow-sm flex items-center gap-1.5"
              >
                <Truck className="w-3.5 h-3.5" />
                <span>Confirm Dispatch</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
