import React, { useState } from 'react';
import {
  History,
  ArrowRight,
  CheckCircle2,
  Clock,
  Truck,
  XCircle,
  Send,
  PackageCheck,
  AlertCircle
} from 'lucide-react';

export default function TransferLog({ transfers, onDispatch, onReceive, onCancel }) {
  const [processingId, setProcessingId] = useState(null);
  const [actionError, setActionError] = useState(null);

  const activeTransfers = transfers.filter(t => t.status === 'PENDING' || t.status === 'IN_TRANSIT');
  const pastTransfers = transfers.filter(t => t.status === 'RECEIVED' || t.status === 'CANCELLED');

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
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-950/50 text-amber-300 border border-amber-800/50">
            <Clock className="w-3 h-3 text-amber-400" />
            PENDING
          </span>
        );
      case 'IN_TRANSIT':
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-sky-950/50 text-sky-300 border border-sky-800/50">
            <Truck className="w-3 h-3 text-sky-400" />
            IN TRANSIT
          </span>
        );
      case 'RECEIVED':
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-950/50 text-emerald-300 border border-emerald-800/50">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            RECEIVED
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
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-800/70 text-slate-300 border border-slate-700/60">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Active Shipments Pipeline (Action Section) */}
      <section className="bg-slate-900/75 border border-slate-800/80 rounded-xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100 tracking-tight">
                Active Shipments Pipeline
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Staged transfer orders awaiting dispatch and live in-transit inventory movements
              </p>
            </div>
          </div>
          <span className="self-start sm:self-center text-xs px-2.5 py-1 rounded-full bg-indigo-950/60 text-indigo-300 border border-indigo-800/50 font-medium tabular-nums">
            {activeTransfers.length} {activeTransfers.length === 1 ? 'Active Shipment' : 'Active Shipments'}
          </span>
        </div>

        {actionError && (
          <div className="mb-4 p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{actionError}</span>
          </div>
        )}

        {activeTransfers.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl bg-slate-950/30">
            <div className="w-10 h-10 rounded-full bg-slate-800/60 flex items-center justify-center mx-auto mb-2.5 text-slate-400">
              <Truck className="w-5 h-5 text-slate-500" />
            </div>
            <p className="text-sm font-medium text-slate-300">No active shipments in pipeline</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Stage a transfer order from the detected opportunities above to initiate inventory movements.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-800/80">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 text-slate-400 text-[11px] font-medium border-b border-slate-800/80">
                <tr>
                  <th className="py-3 px-3.5">Transfer ID</th>
                  <th className="py-3 px-3.5">Staged Time</th>
                  <th className="py-3 px-3.5">SKU</th>
                  <th className="py-3 px-3.5">Routing Lane</th>
                  <th className="py-3 px-3.5 text-right">Quantity</th>
                  <th className="py-3 px-3.5 text-center">Lifecycle Status</th>
                  <th className="py-3 px-3.5 text-right">Operator Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {activeTransfers.map(trf => {
                  const isProcessing = processingId === trf.id;

                  return (
                    <tr key={trf.id} className="hover:bg-slate-800/25 transition">
                      <td className="py-3.5 px-3.5">
                        <span className="font-mono text-[11px] text-indigo-300 bg-slate-950/60 px-2 py-0.5 rounded border border-slate-800/80 font-medium">
                          {trf.id}
                        </span>
                      </td>
                      <td className="py-3.5 px-3.5 text-slate-400 tabular-nums">
                        {new Date(trf.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td className="py-3.5 px-3.5 font-mono font-medium text-slate-200">{trf.skuId}</td>
                      <td className="py-3.5 px-3.5">
                        <div className="inline-flex items-center gap-1.5 font-medium">
                          <span className="text-slate-300">{trf.fromDepotId}</span>
                          <ArrowRight className="w-3 h-3 text-slate-500" />
                          <span className="text-slate-200">{trf.toDepotId}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3.5 text-right font-semibold text-slate-100 tabular-nums">
                        {trf.quantity} <span className="text-[10px] font-normal text-slate-400">units</span>
                      </td>
                      <td className="py-3.5 px-3.5 text-center">
                        {getStatusBadge(trf.status)}
                      </td>
                      <td className="py-3.5 px-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {trf.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => handleAction(onDispatch, trf.id)}
                                disabled={isProcessing}
                                className="inline-flex items-center gap-1.5 h-7 sm:h-8 px-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-sm transition disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                title="Physically dispatch freight from source dock"
                              >
                                <Send className="w-3 h-3" />
                                <span>{isProcessing ? 'Dispatching...' : 'Dispatch'}</span>
                              </button>
                              <button
                                onClick={() => handleAction(onCancel, trf.id)}
                                disabled={isProcessing}
                                className="inline-flex items-center gap-1.5 h-7 sm:h-8 px-2.5 rounded-lg bg-slate-800/80 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-slate-700/80 hover:border-rose-500/30 text-xs font-medium transition disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                                title="Abort transfer order and release reserved stock"
                              >
                                <XCircle className="w-3 h-3" />
                                <span>Cancel</span>
                              </button>
                            </>
                          )}

                          {trf.status === 'IN_TRANSIT' && (
                            <button
                              onClick={() => handleAction(onReceive, trf.id)}
                              disabled={isProcessing}
                              className="inline-flex items-center gap-1.5 h-7 sm:h-8 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium shadow-sm transition disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                              title="Confirm freight arrival and stock into local inventory"
                            >
                              <PackageCheck className="w-3.5 h-3.5" />
                              <span>{isProcessing ? 'Receiving...' : 'Receive at Dock'}</span>
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
      </section>

      {/* 2. Completed & Cancelled Audit Log */}
      <section className="bg-slate-900/75 border border-slate-800/80 rounded-xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-slate-800 text-slate-300 border border-slate-700/80">
              <History className="w-4 h-4 text-slate-300" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100 tracking-tight">
                Transfer History & Audit Trail
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Archived records of completed deliveries and cancelled movements
              </p>
            </div>
          </div>
          <span className="self-start sm:self-center text-xs px-2.5 py-1 rounded-full bg-slate-800/70 text-slate-300 border border-slate-700/60 font-medium tabular-nums">
            {pastTransfers.length} {pastTransfers.length === 1 ? 'Record' : 'Records'} Logged
          </span>
        </div>

        {pastTransfers.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl bg-slate-950/30">
            <p className="text-sm font-medium text-slate-300">No transfer audit records</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Completed and cancelled transfers will automatically appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-800/80">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 text-slate-400 text-[11px] font-medium border-b border-slate-800/80">
                <tr>
                  <th className="py-3 px-3.5">Transfer ID</th>
                  <th className="py-3 px-3.5">Timestamp</th>
                  <th className="py-3 px-3.5">SKU</th>
                  <th className="py-3 px-3.5">Routing Lane</th>
                  <th className="py-3 px-3.5 text-right">Quantity</th>
                  <th className="py-3 px-3.5 text-center">Final Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {pastTransfers.map(trf => (
                  <tr key={trf.id} className="hover:bg-slate-800/25 transition">
                    <td className="py-3.5 px-3.5">
                      <span className="font-mono text-[11px] text-slate-300 bg-slate-950/60 px-2 py-0.5 rounded border border-slate-800/80 font-medium">
                        {trf.id}
                      </span>
                    </td>
                    <td className="py-3.5 px-3.5 text-slate-400 tabular-nums">
                      {new Date(trf.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="py-3.5 px-3.5 font-mono font-medium text-slate-300">{trf.skuId}</td>
                    <td className="py-3.5 px-3.5">
                      <div className="inline-flex items-center gap-1.5 font-medium">
                        <span className="text-slate-300">{trf.fromDepotId}</span>
                        <ArrowRight className="w-3 h-3 text-slate-500" />
                        <span className="text-slate-200">{trf.toDepotId}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3.5 text-right font-medium text-slate-300 tabular-nums">
                      {trf.quantity} <span className="text-[10px] font-normal text-slate-500">units</span>
                    </td>
                    <td className="py-3.5 px-3.5 text-center">
                      {getStatusBadge(trf.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
