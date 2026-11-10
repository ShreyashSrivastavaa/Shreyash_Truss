import React, { useState } from 'react';
import { useAuth } from '../lib/auth/AuthContext';
import { useTheme } from '../lib/theme/ThemeContext';
import { DEMO_PASSWORD } from '../lib/auth/demoUsers';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  TrendingUp,
  Radio,
  Copy,
  Sparkles,
  Warehouse,
  Users,
  Sun,
  Moon
} from 'lucide-react';

export default function LoginPage({ onLoginSuccess }) {
  const { login, loginAsUser, demoUsers } = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedText, setCopiedText] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Simulate quick auth network roundtrip
      await new Promise(r => setTimeout(r, 400));
      login(email, password);
      if (onLoginSuccess) onLoginSuccess();
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (user) => {
    setError(null);
    setIsLoading(true);
    setEmail(user.email);
    setPassword(DEMO_PASSWORD);

    setTimeout(() => {
      loginAsUser(user.id);
      setIsLoading(false);
      if (onLoginSuccess) onLoginSuccess();
    }, 250);
  };

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(DEMO_PASSWORD);
    setCopiedText('Password copied!');
    setTimeout(() => setCopiedText(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#FFFBFC] text-[#4B4350] flex flex-col lg:flex-row">
      {/* LEFT BRAND PANEL (Soft Rose Tint) */}
      <div className="lg:w-5/12 bg-[#FFF1F4] p-8 sm:p-12 lg:p-16 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[#F3E3E8] relative">
        <div className="relative z-10">
          {/* Header logo */}
          <div className="flex items-center gap-3 mb-10">
            <div className="h-10 w-10 rounded-xl bg-[#E11D48] flex items-center justify-center font-bold text-white text-lg shadow-sm shrink-0">
              N
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-semibold tracking-tight text-[#1F1720]">Nexus</span>
              </div>
              <p className="text-xs text-[#8A8190]">Supply Chain OS · India</p>
            </div>
          </div>

          {/* Hero Statement */}
          <div className="space-y-4 max-w-md">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFE4EA] text-[#E11D48] text-xs font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Multi-Depot Rebalancing &amp; Vendor SLA</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#1F1720] leading-tight">
              Predict. Rebalance. Procure.
            </h2>
            <p className="text-sm text-[#4B4350] leading-relaxed">
              Real-time multi-depot inventory balancing, automated freight staging, and empirical OTIF vendor contract enforcement across Indian logistics hubs.
            </p>
          </div>
        </div>

        {/* 3 Key Stats Panel */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-3.5 my-10 lg:my-12">
          <div className="p-4 rounded-2xl bg-white border border-[#F3E3E8] shadow-card space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-[#1F8A5B] tabular-nums">22%</span>
              <TrendingUp className="w-4 h-4 text-[#1F8A5B]" />
            </div>
            <p className="text-xs font-medium text-[#1F1720]">Lower Warehouse Holding Cost</p>
            <p className="text-xs text-[#8A8190] leading-normal">
              Eliminating buffer hoarding across regional Indian depots through dynamic transfers.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[#F3E3E8] shadow-card space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-[#E11D48] tabular-nums">Zero</span>
              <Warehouse className="w-4 h-4 text-[#E11D48]" />
            </div>
            <p className="text-xs font-medium text-[#1F1720]">Regional Stockouts Achieved</p>
            <p className="text-xs text-[#8A8190] leading-normal">
              Autonomous rebalancing safeguards safety stock in Gurugram, Chennai, and Kolkata.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[#F3E3E8] shadow-card space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-[#B7791F] tabular-nums">100%</span>
              <Radio className="w-4 h-4 text-[#B7791F]" />
            </div>
            <p className="text-xs font-medium text-[#1F1720]">Real-Time Highway Telemetry</p>
            <p className="text-xs text-[#8A8190] leading-normal">
              Continuous GPS &amp; temperature logging along the Golden Quadrilateral and NH 44.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-xs text-[#8A8190] border-t border-[#F3E3E8] pt-4 flex items-center justify-between">
          <span>Enterprise Edition · India (IST)</span>
          <span>Truss Studios</span>
        </div>
      </div>

      {/* RIGHT LOGIN & ROLE-CARD PANEL */}
      <div className="lg:w-7/12 p-6 sm:p-10 lg:p-12 flex flex-col justify-center space-y-6 max-w-3xl mx-auto w-full">
        {/* Top Right Theme Toggle */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={toggleTheme}
            className="px-3 py-1.5 rounded-xl border border-[#F3E3E8] bg-white hover:bg-[#FFF5F7] text-[#8A8190] hover:text-[#1F1720] transition flex items-center gap-2 text-xs font-medium shadow-card"
            title={isDark ? 'Switch to Light mode' : 'Switch to Dark mode'}
          >
            {isDark ? (
              <Sun className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-[#8A8190]" />
            )}
            <span>{isDark ? 'Light mode' : 'Dark mode'}</span>
          </button>
        </div>

        {/* Form Container */}
        <div className="bg-white border border-[#F3E3E8] rounded-2xl p-6 sm:p-8 shadow-card space-y-6">
          <div>
            <h3 className="text-xl font-semibold text-[#1F1720] tracking-tight">Sign in to Nexus</h3>
            <p className="text-xs text-[#8A8190] mt-1">
              Select a demo profile below for one-click access or enter your credentials.
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-[#FDECEA] border border-[#F3E3E8] text-[#B42318] text-xs flex items-center gap-2">
              <Lock className="w-4 h-4 shrink-0 text-[#B42318]" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#4B4350] mb-1.5">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#8A8190] absolute left-3 top-3 pointer-events-none" />
                <input
                  type="email"
                  required
                  placeholder="name@nexus-demo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#FFFBFC] border border-[#F3E3E8] text-sm text-[#1F1720] placeholder-[#8A8190] focus:outline-none focus:border-[#E11D48] transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-[#4B4350]">
                  Password
                </label>
                <button
                  type="button"
                  onClick={handleCopyPassword}
                  className="text-xs text-[#E11D48] hover:text-[#BE123C] flex items-center gap-1 transition"
                  title="Copy default demo password"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedText || 'Copy: Nexus@2026'}</span>
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#8A8190] absolute left-3 top-3 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-[#FFFBFC] border border-[#F3E3E8] text-sm text-[#1F1720] placeholder-[#8A8190] focus:outline-none focus:border-[#E11D48] transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-[#8A8190] hover:text-[#1F1720]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] text-white font-medium text-sm transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <span>Verifying credentials...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* DEMO ACCESS: ONE-CLICK ROLE CARDS */}
        <div className="space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#E11D48]" />
              <h4 className="text-xs font-semibold text-[#1F1720]">
                One-Click Demo Access by Persona
              </h4>
            </div>
            <span className="text-xs text-[#8A8190]">Select any persona to enter</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
            {demoUsers.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => handleQuickLogin(user)}
                className="text-left p-3 rounded-xl bg-white hover:bg-[#FFF5F7] border border-[#F3E3E8] transition group flex items-start gap-3 shadow-card"
              >
                <div className="h-9 w-9 rounded-lg bg-[#FFE4EA] text-[#E11D48] flex items-center justify-center font-semibold text-xs shrink-0 group-hover:scale-105 transition-transform">
                  {user.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-semibold text-[#1F1720] truncate">
                      {user.name}
                    </span>
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[#FFF5F7] text-[#4B4350] border border-[#F3E3E8] shrink-0">
                      {user.role}
                    </span>
                  </div>
                  <p className="text-xs text-[#8A8190] truncate mt-0.5">{user.title}</p>
                  <p className="text-[11px] text-[#8A8190] line-clamp-1 mt-1 leading-normal">
                    {user.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
