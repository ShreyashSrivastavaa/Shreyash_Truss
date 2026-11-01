import React, { useState } from 'react';
import {
  Truck,
  History,
  ArrowRight,
  CheckCircle2,
  Clock,
  XCircle,
  PackageCheck,
  AlertCircle
} from 'lucide-react';

/**
 * Unified Shipments Section:
 * Combines "Active Shipments" and "Transfer History" into a single, clean container with 2 tabs:
 * - "Active": PENDING (with Dispatch / Cancel) and IN_TRANSIT (with Receive)
 * - "History": RECEIVED and CANCELLED historical audit log
 * Plain-English status badges: Pending, In Transit, Delivered, Cancelled
 */
export default function TransferLog({ transfers, onDispatch, onReceive, onCancel, isDetailed = false }) {
  const [activeTab, setActiveTab] = useState('ACTIVE'); // 'ACTIVE' | 'HISTORY'
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
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <Clock className="w-3 h-3 text-amber-400" />
            Pending
          </span>
        );
      case 'IN_TRANSIT':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/30">
            <Truck className="w-3 h-3 text-sky-400" />
            In Transit
          </span>
        );
      case 'RECEIVED':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            Delivered
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700/60">
            <XCircle className="w-3 h-3 text-slate-500" />
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300">
            {status}
          </span>
        );
    }
  };

  return (
    <section className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-xs" aria-label="Shipments Section">
      {/* Section Header with Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shrink-0">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold tracking-tight text-white">
              Shipments & Freight Flow
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Track active movements from staging to delivery, with a permanent audit history
            </p>
          </div>
        </div>

        {/* 2 Tabs: Active vs History */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('ACTIVE')}
            className={`px-3 py-1.5 rounded-md font-semibold transition ${
              activeTab === 'ACTIVE'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            Active ({activeTransfers.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('HISTORY')}
            className={`px-3 py-1.5 rounded-md font-semibold transition ${
              activeTab === 'HISTORY'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            History ({pastTransfers.length})
          </button>
        </div>
      </div>

      {/* Global Error Banner */}
      {actionError && (
        <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{actionError}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="text-[11px] text-rose-400 hover:text-rose-200 font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* TAB 1: ACTIVE SHIPMENTS */}
      {activeTab === 'ACTIVE' && (
        <div>
          {activeTransfers.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl bg-slate-950/40">
              <div className="w-10 h-10 rounded-full bg-slate-800/60 flex items-center justify-center mx-auto mb-2 text-slate-400">
                <Truck className="w-5 h-5 text-slate-500" />
              </div>
              <p className="text-sm font-semibold text-slate-300">No active shipments in pipeline</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Stage a recommended transfer above to create a pending shipment order.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 text-[11px] font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-3.5">Shipment ID</th>
                    <th className="py-3 px-3.5">Product</th>
                    <th className="py-3 px-3.5">Route</th>
                    <th className="py-3 px-3.5 text-right">Quantity</th>
                    <th className="py-3 px-3.5 text-center">Status</th>
                    <th className="py-3 px-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 font-medium">
                  {activeTransfers.map(trf => {
                    const isProcessing = processingId === trf.id;

                    return (
                      <tr key={trf.id} className="hover:bg-slate-800/30 transition">
                        <td className="py-3 px-3.5">
                          <span className="font-mono text-xs text-indigo-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                            {trf.id}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 text-slate-200 font-semibold">{trf.skuId}</td>
                        <td className="py-3 px-3.5">
                          <div className="inline-flex items-center gap-1.5 font-medium">
                            <span className="text-slate-300">{trf.fromDepotId}</span>
                            <ArrowRight className="w-3 h-3 text-slate-500" />
                            <span className="text-slate-200">{trf.toDepotId}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3.5 text-right font-bold text-white tabular-nums">
                          {trf.quantity} <span className="text-[10px] font-normal text-slate-400">units</span>
                        </td>
                        <td className="py-3 px-3.5 text-center">
                          {getStatusBadge(trf.status)}
                        </td>
                        <td className="py-3 px-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {trf.status === 'PENDING' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleAction(onDispatch, trf.id)}
                                  disabled={isProcessing}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition disabled:opacity-50"
                                >
                                  <Truck className="w-3 h-3" />
                                  <span>{isProcessing ? 'Dispatching...' : 'Dispatch'}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleAction(onCancel, trf.id)}
                                  disabled={isProcessing}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/10 text-slate-300 hover:text-rose-300 border border-slate-700/60 text-xs font-medium transition disabled:opacity-50"
                                >
                                  <XCircle className="w-3 h-3" />
                                  <span>Cancel</span>
                                </button>
                              </>
                            )}
                            {trf.status === 'IN_TRANSIT' && (
                              <button
                                type="button"
                                onClick={() => handleAction(onReceive, trf.id)}
                                disabled={isProcessing}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition shadow-xs disabled:opacity-50"
                              >
                                <PackageCheck className="w-3.5 h-3.5" />
                                <span>{isProcessing ? 'Receiving...' : 'Receive'}</span>
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

      {/* TAB 2: AUDIT HISTORY */}
      {activeTab === 'HISTORY' && (
        <div>
          {pastTransfers.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl bg-slate-950/40">
              <div className="w-10 h-10 rounded-full bg-slate-800/60 flex items-center justify-center mx-auto mb-2 text-slate-400">
                <History className="w-5 h-5 text-slate-500" />
              </div>
              <p className="text-sm font-semibold text-slate-300">No transfer audit records</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Completed deliveries and cancelled shipments will automatically appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 text-[11px] font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-3.5">Shipment ID</th>
                    <th className="py-3 px-3.5">Completed Date</th>
                    <th className="py-3 px-3.5">Product</th>
                    <th className="py-3 px-3.5">Route</th>
                    <th className="py-3 px-3.5 text-right">Quantity</th>
                    <th className="py-3 px-3.5 text-center">Final Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 font-medium">
                  {pastTransfers.map(trf => (
                    <tr key={trf.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3 px-3.5 font-mono text-xs text-slate-300">{trf.id}</td>
                      <td className="py-3 px-3.5 text-slate-400 tabular-nums">
                        {new Date(trf.updatedAt || trf.createdAt).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="py-3 px-3.5 text-slate-200">{trf.skuId}</td>
                      <td className="py-3 px-3.5">
                        <div className="inline-flex items-center gap-1.5">
                          <span className="text-slate-300">{trf.fromDepotId}</span>
                          <ArrowRight className="w-3 h-3 text-slate-500" />
                          <span className="text-slate-200">{trf.toDepotId}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3.5 text-right font-bold text-white tabular-nums">
                        {trf.quantity} units
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        {getStatusBadge(trf.status)}
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
