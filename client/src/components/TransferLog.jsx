import React from 'react';
import { History, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function TransferLog({ transfers }) {
  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-indigo-400" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
            Transfer Audit Log
          </h2>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-medium">
          {transfers.length} Executed
        </span>
      </div>

      {transfers.length === 0 ? (
        <div className="p-6 text-center border border-dashed border-slate-800 rounded-lg text-xs text-slate-400">
          No lateral inventory transfers executed yet during this session.
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
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {transfers.map(trf => (
                <tr key={trf.id} className="hover:bg-slate-800/30 transition">
                  <td className="py-2.5 px-3 font-mono text-indigo-400">{trf.id}</td>
                  <td className="py-2.5 px-3 text-slate-400">{new Date(trf.createdAt).toLocaleTimeString()}</td>
                  <td className="py-2.5 px-3 font-mono text-white">{trf.skuId}</td>
                  <td className="py-2.5 px-3">
                    <span className="text-slate-300">{trf.fromDepotId}</span>
                    <ArrowRight className="w-3 h-3 inline mx-1.5 text-slate-500" />
                    <span className="text-slate-200">{trf.toDepotId}</span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-white">{trf.quantity} units</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3" />
                      {trf.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
