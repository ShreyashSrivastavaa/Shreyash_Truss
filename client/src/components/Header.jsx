import React, { useState } from 'react';
import {
  RefreshCw,
  RotateCcw,
  Warehouse,
  ShieldCheck,
  Compass,
  SlidersHorizontal,
  X,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';

export default function Header({
  health,
  isRefreshing,
  onRefresh,
  onReset,
  isResetting,
  activeModule = 'INVENTORY',
  onSelectModule,
  isDetailed = false,
  onToggleDetailed
}) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [tourStep, setTourStep] = useState(1);

  const handleResetClick = () => {
    setShowConfirm(true);
  };

  const handleConfirmReset = () => {
    setShowConfirm(false);
    onReset();
  };

  const tourSteps = [
    {
      step: 1,
      title: '1. Monitor Inventory',
      desc: 'Glance at the 4 top KPI cards and the Depot Health matrix to see physical On-Hand vs Target holding levels.'
    },
    {
      step: 2,
      title: '2. Spot the Disbalance',
      desc: 'Notice Chicago is in Red Deficit for medical sensors, while Dallas holds excess Green Surplus.'
    },
    {
      step: 3,
      title: '3. Review Recommendations',
      desc: 'Nexus automatically calculates the exact safe quantity to transfer without draining the donor warehouse.'
    },
    {
      step: 4,
      title: '4. Stage Transfer',
      desc: 'Click "Stage Transfer" to reserve stock at the origin dock under atomic database concurrency control.'
    },
    {
      step: 5,
      title: '5. Dispatch & Track',
      desc: 'Dispatch freight into transit, receive it at destination, and watch the Chicago depot turn healthy Green!'
    }
  ];

  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-6 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
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
                Product 18 • Supply Chain OS
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block mt-0.5">
              Multi-depot rebalancing and supplier SLA compliance
            </p>
          </div>
        </div>

        {/* Center: Module Navigation Switcher */}
        {onSelectModule && (
          <div className="flex items-center p-1 rounded-xl bg-slate-950/80 border border-slate-800 self-start md:self-center">
            <button
              type="button"
              onClick={() => onSelectModule('INVENTORY')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition ${
                activeModule === 'INVENTORY'
                  ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Warehouse className="w-3.5 h-3.5" />
              <span>Inventory Balancing</span>
            </button>
            <button
              type="button"
              onClick={() => onSelectModule('VENDORS')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition ${
                activeModule === 'VENDORS'
                  ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Vendor SLA Monitoring</span>
            </button>
          </div>
        )}

        {/* Header Action Controls */}
        <div className="flex items-center gap-2 flex-wrap self-end md:self-auto">
          {/* Simple / Detailed Mode Toggle */}
          <button
            type="button"
            onClick={onToggleDetailed}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg border transition ${
              isDetailed
                ? 'bg-indigo-950/50 text-indigo-300 border-indigo-500/40 font-semibold'
                : 'bg-slate-800/80 text-slate-300 border-slate-700/60 hover:bg-slate-750 font-medium'
            }`}
            title="Toggle between simplified 2-minute overview and detailed metrics"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{isDetailed ? 'Mode: Detailed' : 'Mode: Simple'}</span>
          </button>

          {/* Demo Guide Button */}
          <button
            type="button"
            onClick={() => setShowTour(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition shadow-xs"
            title="Open 5-step quick demo walkthrough"
          >
            <Compass className="w-3.5 h-3.5 text-emerald-400" />
            <span>Demo Guide</span>
          </button>

          {/* Live Refresh button */}
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Refresh network data"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-400' : 'text-slate-400'}`} />
            <span className="hidden sm:inline">Sync</span>
          </button>

          {/* Reset button with confirmation */}
          <button
            type="button"
            onClick={handleResetClick}
            disabled={isResetting}
            title="Reset to synthetic baseline"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-rose-500/15 text-slate-300 hover:text-rose-300 border border-slate-700/60 hover:border-rose-500/30 transition disabled:opacity-50"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin text-rose-400' : 'text-slate-400'}`} />
            <span>Reset Demo</span>
          </button>
        </div>
      </div>

      {/* 5-Step Demo Walkthrough Modal */}
      {showTour && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-white">2-Minute Demo Script</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowTour(false)}
                className="text-slate-400 hover:text-slate-200 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Stepper Dots */}
            <div className="flex items-center justify-between px-2">
              {tourSteps.map(s => (
                <button
                  key={s.step}
                  type="button"
                  onClick={() => setTourStep(s.step)}
                  className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition ${
                    tourStep === s.step
                      ? 'bg-indigo-600 text-white ring-2 ring-indigo-400/40'
                      : tourStep > s.step
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {tourStep > s.step ? <CheckCircle2 className="w-4 h-4" /> : s.step}
                </button>
              ))}
            </div>

            {/* Step Content */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
              <h4 className="text-sm font-bold text-white">{tourSteps[tourStep - 1].title}</h4>
              <p className="text-xs text-slate-300 leading-relaxed">{tourSteps[tourStep - 1].desc}</p>
            </div>

            {/* Stepper Navigation */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <button
                type="button"
                disabled={tourStep === 1}
                onClick={() => setTourStep(prev => prev - 1)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-300 disabled:opacity-30 transition"
              >
                Previous
              </button>

              <span className="text-[11px] text-slate-400">
                Step {tourStep} of {tourSteps.length}
              </span>

              {tourStep < tourSteps.length ? (
                <button
                  type="button"
                  onClick={() => setTourStep(prev => prev + 1)}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition flex items-center gap-1 shadow-xs"
                >
                  <span>Next</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowTour(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-xs"
                >
                  Start Live Demo
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 max-w-sm w-full shadow-2xl space-y-4">
            <div className="space-y-1.5">
              <h3 className="text-sm font-semibold text-white">Reset Demo State?</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {activeModule === 'VENDORS'
                  ? 'This resets suppliers, orders, and delivery histories back to initial baseline data.'
                  : 'This restores initial depot stock levels (Chicago in deficit, Dallas in surplus) and clears transfer history.'}
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
