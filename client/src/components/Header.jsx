import React, { useState } from 'react';
import { RefreshCw, RotateCcw } from 'lucide-react';

export default function Header({ health, isRefreshing, onRefresh, onReset, isResetting }) {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleResetClick = () => {
    setShowConfirm(true);
  };

  const handleConfirmReset = () => {
    setShowConfirm(false);
    onReset();
  };

  return (
    <header className="border-b border-slate-800/80 bg-slate-900/70 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-6 py-3.5">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white text-sm shadow-xs border border-indigo-400/30 shrink-0">
            N
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold tracking-tight text-white">
                Nexus
              </h1>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700/60">
                MVP 2A
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block mt-0.5">
              Multi-Depot Inventory Balancing & Lateral Transfer Engine
            </p>
          </div>
        </div>

        {/* Header Action Controls */}
        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          {/* Health status badge */}
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-850/80 border border-slate-700/50 text-xs">
            <span className="flex h-2 w-2 relative">
              <span className={`inline-flex rounded-full h-2 w-2 ${health?.status === 'ok' ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
            </span>
            <span className="text-slate-300 font-medium text-[11px]">
              {health?.status === 'ok' ? `Backend Online (${health.uptimeSeconds}s)` : 'Connecting...'}
            </span>
          </div>

          {/* Refresh button */}
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Refresh network data"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 border border-slate-700/60 hover:border-slate-600 transition shadow-xs disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-400' : 'text-slate-400'}`} />
            <span>Refresh</span>
          </button>

          {/* Reset button with confirmation */}
          <button
            type="button"
            onClick={handleResetClick}
            disabled={isResetting}
            title="Reset to imbalanced synthetic baseline"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800/50 hover:bg-rose-500/10 text-slate-400 hover:text-rose-300 border border-slate-700/50 hover:border-rose-500/30 transition disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-rose-500/40"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin text-rose-400' : 'text-slate-400'}`} />
            <span>Reset Demo</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 max-w-sm w-full shadow-2xl space-y-4">
            <div className="space-y-1.5">
              <h3 className="text-sm font-semibold text-white">Reset to Synthetic Baseline?</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                This restores the initial imbalanced inventory levels across all 3 regional depots and clears active and completed transfers.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-500 text-white transition shadow-xs"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
