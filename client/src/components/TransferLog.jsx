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
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
            <Clock className="w-3 h-3 text-amber-400" />
            PENDING
          </span>
        );
      case 'IN_TRANSIT':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-300 border border-sky-500/20">
            <Truck className="w-3 h-3 text-sky-400 animate-pulse" />
            IN TRANSIT
          </span>
        );
      case 'RECEIVED':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            RECEIVED
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
            <XCircle className="w-3 h-3 text-slate-500" />
            CANCELLED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Active Shipments Pipeline (Action Section) */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-indigo-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              Active Shipments Pipeline
            </h2>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-medium">
            {activeTransfers.length} Active Shipments
          </span>
        </div>

        {actionError && (
          <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{actionError}</span>
          </div>
        )}

        {activeTransfers.length === 0 ? (
          <div className="p-6 text-center border border-dashed border-slate-800 rounded-lg text-xs text-slate-400">
            No active shipments currently staged or in transit. Stage a transfer order from the recommendations above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Transfer ID</th>
                  <th className="py-2.5 px-3">Staged Time</th>
                  <th className="py-2.5 px-3">SKU</th>
                  <th className="py-2.5 px-3">Routing Lane</th>
                  <th className="py-2.5 px-3 text-right">Quantity</th>
                  <th className="py-2.5 px-3 text-center">Lifecycle Status</th>
                  <th className="py-2.5 px-3 text-right">Operator Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {activeTransfers.map(trf => {
                  const isProcessing = processingId === trf.id;

                  return (
                    <tr key={trf.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3 px-3 font-mono text-indigo-400">{trf.id}</td>
                      <td className="py-3 px-3 text-slate-400">
                        {new Date(trf.createdAt).toLocaleTimeString()}
                      </td>
                      <td className="py-3 px-3 font-mono text-white">{trf.skuId}</td>
                      <td className="py-3 px-3">
                        <span className="text-slate-300 font-semibold">{trf.fromDepotId}</span>
                        <ArrowRight className="w-3 h-3 inline mx-1.5 text-slate-500" />
                        <span className="text-slate-200 font-semibold">{trf.toDepotId}</span>
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-white">
                        {trf.quantity} units
                      </td>
                      <td className="py-3 px-3 text-center">
                        {getStatusBadge(trf.status)}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {trf.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => handleAction(onDispatch, trf.id)}
                                disabled={isProcessing}
                                className="flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold transition disabled:opacity-50"
                                title="Physically dispatch freight from source dock"
                              >
                                <Send className="w-3 h-3" />
                                <span>{isProcessing ? 'Dispatching...' : 'Dispatch'}</span>
                              </button>
                              <button
                                onClick={() => handleAction(onCancel, trf.id)}
                                disabled={isProcessing}
                                className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-500/30 text-[11px] font-semibold transition disabled:opacity-50"
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
                              className="flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold transition disabled:opacity-50"
                              title="Confirm freight arrival and stock into local inventory"
                            >
                              <PackageCheck className="w-3 h-3" />
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
      </div>

      {/* 2. Completed & Cancelled Audit Log */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              Completed Transfer History & Audit Trail
            </h2>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-medium">
            {pastTransfers.length} Logged
          </span>
        </div>

        {pastTransfers.length === 0 ? (
          <div className="p-6 text-center border border-dashed border-slate-800 rounded-lg text-xs text-slate-400">
            No completed or cancelled transfers recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Transfer ID</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">SKU</th>
                  <th className="py-2.5 px-3">Routing Lane</th>
                  <th className="py-2.5 px-3 text-right">Quantity</th>
                  <th className="py-2.5 px-3 text-center">Final Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {pastTransfers.map(trf => (
                  <tr key={trf.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-2.5 px-3 font-mono text-slate-400">{trf.id}</td>
                    <td className="py-2.5 px-3 text-slate-500">
                      {new Date(trf.createdAt).toLocaleTimeString()}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-300">{trf.skuId}</td>
                    <td className="py-2.5 px-3">
                      <span className="text-slate-400">{trf.fromDepotId}</span>
                      <ArrowRight className="w-3 h-3 inline mx-1.5 text-slate-600" />
                      <span className="text-slate-300">{trf.toDepotId}</span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-300">
                      {trf.quantity} units
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {getStatusBadge(trf.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
