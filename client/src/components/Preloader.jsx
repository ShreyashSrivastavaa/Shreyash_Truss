import React, { useState, useEffect } from 'react';
import { ShieldCheck, Sparkles } from 'lucide-react';

const STATUS_MESSAGES = [
  'Syncing depots across India (Gurugram, Chennai, Kolkata)...',
  'Loading vendor SLA performance & OTIF records...',
  'Verifying secure multi-role session credentials...',
  'System ready.'
];

export default function Preloader({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [statusIndex, setStatusIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    // Progress interval ~2.5s total
    const intervalTime = 30;
    const increment = 100 / (2400 / intervalTime);

    const timer = setInterval(() => {
      setProgress(prev => {
        const next = prev + increment;
        if (next >= 100) {
          clearInterval(timer);
          setIsFading(true);
          setTimeout(() => {
            onComplete();
          }, 450);
          return 100;
        }
        return next;
      });
    }, intervalTime);

    // Rotate status messages
    const statusTimer = setInterval(() => {
      setStatusIndex(prev => (prev + 1) % STATUS_MESSAGES.length);
    }, 700);

    return () => {
      clearInterval(timer);
      clearInterval(statusTimer);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#FFFBFC] text-[#4B4350] transition-opacity duration-300 ${
        isFading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="relative z-10 flex flex-col items-center text-center max-w-sm w-full px-6 space-y-6">
        {/* Logo Mark */}
        <div className="h-12 w-12 rounded-xl bg-[#E11D48] text-white flex items-center justify-center font-bold text-xl shadow-card">
          N
        </div>

        {/* Brand identity */}
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight text-[#1F1720]">Nexus</h1>
          <p className="text-xs text-[#8A8190]">
            Supply Chain OS · India
          </p>
        </div>

        {/* Progress Bar Container */}
        <div className="w-full space-y-2.5 pt-2">
          <div className="w-full h-1 bg-[#F3E3E8] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#E11D48] transition-all duration-75 ease-out rounded-full"
              style={{ width: `${Math.min(100, Math.round(progress))}%` }}
            />
          </div>

          {/* Rotating Status Text */}
          <div className="flex items-center justify-between text-xs text-[#8A8190] h-5">
            <span className="truncate pr-2">{STATUS_MESSAGES[statusIndex]}</span>
            <span className="tabular-nums text-[#1F1720] font-medium shrink-0">
              {Math.min(100, Math.round(progress))}%
            </span>
          </div>
        </div>

        {/* Skip Button for impatient tester */}
        <button
          type="button"
          onClick={onComplete}
          className="text-xs text-[#8A8190] hover:text-[#1F1720] transition pt-2"
        >
          Skip intro
        </button>
      </div>
    </div>
  );
}

