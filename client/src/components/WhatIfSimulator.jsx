import React from 'react';
import { Sliders, Sparkles, RotateCcw } from 'lucide-react';

export default function WhatIfSimulator({ whatIfFactor = 0, onSetWhatIfFactor }) {
  const isSimulated = whatIfFactor > 0;

  return (
    <div className="p-4 rounded-2xl bg-[#FFF1F4] border border-[#F3E3E8] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-card">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-[#FFE4EA] text-[#E11D48] shrink-0">
          <Sliders className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-semibold text-[#1F1720]">
              Demand Simulation Sandbox
            </h3>
            {isSimulated && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#FDF4E3] text-[#B7791F]">
                +{whatIfFactor}% South Demand
              </span>
            )}
          </div>
          <p className="text-xs text-[#4B4350] mt-0.5">
            Test supply chain resilience: simulate industrial demand surges in South Distribution Center (Chennai).
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
        {!isSimulated ? (
          <button
            type="button"
            onClick={() => onSetWhatIfFactor(20)}
            className="px-3.5 py-1.5 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] text-white font-medium text-xs transition shadow-sm flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Simulate +20% South Demand</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onSetWhatIfFactor(0)}
            className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-[#FFF5F7] text-[#4B4350] font-medium text-xs transition border border-[#F3E3E8] flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Simulation</span>
          </button>
        )}
      </div>
    </div>
  );
}
