import React, { useState, useRef, useEffect } from 'react';
import {
  RefreshCw,
  RotateCcw,
  Compass,
  SlidersHorizontal,
  LogOut,
  ChevronDown,
  User,
  Check,
  Sun,
  Moon
} from 'lucide-react';
import { useAuth } from '../lib/auth/AuthContext';
import { useTheme } from '../lib/theme/ThemeContext';
import { getPermissionsForUser } from '../lib/permissions';
import NotificationDropdown from './NotificationDropdown';
import RoleDemoGuideModal from './RoleDemoGuideModal';

export default function Header({
  health,
  isRefreshing,
  onRefresh,
  onReset,
  isResetting,
  activeModule = 'INVENTORY',
  onSelectModule,
  isDetailed = false,
  onToggleDetailed,
  notifications = [],
  onMarkAllRead
}) {
  const { currentUser, switchRole, logout, demoUsers } = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [showRoleGuide, setShowRoleGuide] = useState(false);
  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);
  const avatarMenuRef = useRef(null);

  const permissions = getPermissionsForUser(currentUser);
  const allowedTabs = permissions.allowedTabs || ['INVENTORY', 'VENDORS'];

  // Close avatar dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (avatarMenuRef.current && !avatarMenuRef.current.contains(e.target)) {
        setIsAvatarMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRoleChange = (e) => {
    const selectedId = e.target.value;
    if (selectedId && selectedId !== currentUser?.id) {
      switchRole(selectedId);
      setIsAvatarMenuOpen(false);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-[#F3E3E8] sticky top-0 z-30 px-4 sm:px-8">
      <div className="max-w-[1200px] h-full mx-auto flex items-center justify-between gap-4">
        {/* Left: Brand logo + name + subtitle */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="h-8 w-8 rounded-lg bg-[#E11D48] flex items-center justify-center font-bold text-white text-sm shrink-0 shadow-subtle">
            N
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-base font-semibold tracking-tight text-[#1F1720]">
              Nexus
            </span>
            <span className="text-xs text-[#8A8190] font-normal hidden sm:inline">
              Supply Chain OS · India
            </span>
          </div>
        </div>

        {/* Center: Underline Tab Switcher */}
        {onSelectModule && (
          <nav className="flex items-center h-full overflow-x-auto no-scrollbar" aria-label="Tabs">
            {allowedTabs.includes('EXECUTIVE') && (
              <button
                type="button"
                onClick={() => onSelectModule('EXECUTIVE')}
                className={`h-full px-3.5 flex items-center text-xs sm:text-sm transition-colors whitespace-nowrap border-b-2 font-medium ${
                  activeModule === 'EXECUTIVE'
                    ? 'text-[#E11D48] border-[#E11D48]'
                    : 'text-[#8A8190] hover:text-[#1F1720] border-transparent'
                }`}
              >
                Executive
              </button>
            )}

            {allowedTabs.includes('INVENTORY') && (
              <button
                type="button"
                onClick={() => onSelectModule('INVENTORY')}
                className={`h-full px-3.5 flex items-center text-xs sm:text-sm transition-colors whitespace-nowrap border-b-2 font-medium ${
                  activeModule === 'INVENTORY'
                    ? 'text-[#E11D48] border-[#E11D48]'
                    : 'text-[#8A8190] hover:text-[#1F1720] border-transparent'
                }`}
              >
                Inventory Balancing
              </button>
            )}

            {allowedTabs.includes('VENDORS') && (
              <button
                type="button"
                onClick={() => onSelectModule('VENDORS')}
                className={`h-full px-3.5 flex items-center text-xs sm:text-sm transition-colors whitespace-nowrap border-b-2 font-medium ${
                  activeModule === 'VENDORS'
                    ? 'text-[#E11D48] border-[#E11D48]'
                    : 'text-[#8A8190] hover:text-[#1F1720] border-transparent'
                }`}
              >
                Vendor SLA Monitoring
              </button>
            )}

            {allowedTabs.includes('FLEET') && (
              <button
                type="button"
                onClick={() => onSelectModule('FLEET')}
                className={`h-full px-3.5 flex items-center text-xs sm:text-sm transition-colors whitespace-nowrap border-b-2 font-medium ${
                  activeModule === 'FLEET'
                    ? 'text-[#E11D48] border-[#E11D48]'
                    : 'text-[#8A8190] hover:text-[#1F1720] border-transparent'
                }`}
              >
                Shipments &amp; Freight Flow
              </button>
            )}

            {allowedTabs.includes('PO_QUEUE') && (
              <button
                type="button"
                onClick={() => onSelectModule('PO_QUEUE')}
                className={`h-full px-3.5 flex items-center text-xs sm:text-sm transition-colors whitespace-nowrap border-b-2 font-medium ${
                  activeModule === 'PO_QUEUE'
                    ? 'text-[#E11D48] border-[#E11D48]'
                    : 'text-[#8A8190] hover:text-[#1F1720] border-transparent'
                }`}
              >
                PO Queue (18% GST)
              </button>
            )}

            {allowedTabs.includes('VENDOR_PORTAL') && (
              <button
                type="button"
                onClick={() => onSelectModule('VENDOR_PORTAL')}
                className={`h-full px-3.5 flex items-center text-xs sm:text-sm transition-colors whitespace-nowrap border-b-2 font-medium ${
                  activeModule === 'VENDOR_PORTAL'
                    ? 'text-[#E11D48] border-[#E11D48]'
                    : 'text-[#8A8190] hover:text-[#1F1720] border-transparent'
                }`}
              >
                Vendor Portal
              </button>
            )}

            {allowedTabs.includes('ADMIN') && (
              <button
                type="button"
                onClick={() => onSelectModule('ADMIN')}
                className={`h-full px-3.5 flex items-center text-xs sm:text-sm transition-colors whitespace-nowrap border-b-2 font-medium ${
                  activeModule === 'ADMIN'
                    ? 'text-[#E11D48] border-[#E11D48]'
                    : 'text-[#8A8190] hover:text-[#1F1720] border-transparent'
                }`}
              >
                Admin
              </button>
            )}
          </nav>
        )}

        {/* Right: Theme Toggle + Bell Icon + User Avatar Menu */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Dark / Light Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-[#FFF5F7] text-[#8A8190] hover:text-[#1F1720] transition relative"
            title={isDark ? 'Switch to Light mode' : 'Switch to Dark mode'}
            aria-label={isDark ? 'Switch to Light mode' : 'Switch to Dark mode'}
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-[#8A8190]" />
            )}
          </button>

          {/* Notifications Bell */}
          <NotificationDropdown
            notifications={notifications}
            currentUser={currentUser}
            onNavigate={onSelectModule}
            onMarkAllRead={onMarkAllRead}
          />

          {/* Avatar Menu Container */}
          <div className="relative" ref={avatarMenuRef}>
            <button
              type="button"
              onClick={() => setIsAvatarMenuOpen(!isAvatarMenuOpen)}
              className="flex items-center gap-2 p-1.5 rounded-full hover:bg-[#FFF5F7] transition"
              aria-label="User profile menu"
            >
              <div className="h-8 w-8 rounded-full bg-[#FFE4EA] text-[#BE123C] flex items-center justify-center font-semibold text-xs border border-[#F3E3E8]">
                {currentUser?.avatar || 'U'}
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#8A8190]" />
            </button>

            {/* Avatar Dropdown Drawer */}
            {isAvatarMenuOpen && (
              <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white border border-[#F3E3E8] shadow-card z-50 p-3 space-y-3">
                {/* User info */}
                <div className="px-2 py-1.5 border-b border-[#F3E3E8]">
                  <p className="text-sm font-semibold text-[#1F1720] truncate">
                    {currentUser?.name}
                  </p>
                  <p className="text-xs text-[#8A8190] truncate mt-0.5">
                    {currentUser?.title || currentUser?.role}
                  </p>
                </div>

                {/* Switch Demo Role Selector */}
                <div className="px-2 space-y-1">
                  <label className="text-[11px] font-medium text-[#8A8190] uppercase tracking-wider block">
                    Switch Demo Role
                  </label>
                  <div className="relative">
                    <select
                      value={currentUser?.id || ''}
                      onChange={handleRoleChange}
                      className="w-full pl-2.5 pr-7 py-2 text-xs rounded-xl bg-[#FFF5F7] text-[#1F1720] border border-[#F3E3E8] focus:outline-none focus:ring-1 focus:ring-[#E11D48] cursor-pointer font-medium appearance-none"
                    >
                      {demoUsers.map(u => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.role})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-[#8A8190] absolute right-2.5 top-2.5 pointer-events-none" />
                  </div>
                </div>

                {/* Actions list */}
                <div className="space-y-1 pt-1 border-t border-[#F3E3E8]">
                  {/* Theme Mode Toggle in Menu */}
                  <button
                    type="button"
                    onClick={() => {
                      toggleTheme();
                      setIsAvatarMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-2 text-xs rounded-xl hover:bg-[#FFF5F7] text-[#4B4350] transition"
                  >
                    <span className="flex items-center gap-2">
                      {isDark ? (
                        <Sun className="w-4 h-4 text-amber-400" />
                      ) : (
                        <Moon className="w-4 h-4 text-[#8A8190]" />
                      )}
                      <span>Theme Mode</span>
                    </span>
                    <span className="text-[11px] font-medium text-[#E11D48] bg-[#FFE4EA] px-2 py-0.5 rounded-full capitalize">
                      {theme}
                    </span>
                  </button>

                  {/* Mode Simple/Detailed Toggle */}
                  <button
                    type="button"
                    onClick={() => {
                      onToggleDetailed();
                      setIsAvatarMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-2 text-xs rounded-xl hover:bg-[#FFF5F7] text-[#4B4350] transition"
                  >
                    <span className="flex items-center gap-2">
                      <SlidersHorizontal className="w-4 h-4 text-[#8A8190]" />
                      <span>Display Mode</span>
                    </span>
                    <span className="text-[11px] font-medium text-[#E11D48] bg-[#FFE4EA] px-2 py-0.5 rounded-full">
                      {isDetailed ? 'Detailed' : 'Simple'}
                    </span>
                  </button>

                  {/* Demo Guide */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowRoleGuide(true);
                      setIsAvatarMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 text-xs rounded-xl hover:bg-[#FFF5F7] text-[#4B4350] transition"
                  >
                    <Compass className="w-4 h-4 text-[#8A8190]" />
                    <span>Demo Walkthrough Guide</span>
                  </button>

                  {/* Sync */}
                  <button
                    type="button"
                    onClick={() => {
                      onRefresh();
                      setIsAvatarMenuOpen(false);
                    }}
                    disabled={isRefreshing}
                    className="w-full flex items-center gap-2 px-2.5 py-2 text-xs rounded-xl hover:bg-[#FFF5F7] text-[#4B4350] transition disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 text-[#8A8190] ${isRefreshing ? 'animate-spin text-[#E11D48]' : ''}`} />
                    <span>Sync Depot Network</span>
                  </button>

                  {/* Reset Demo */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowConfirmReset(true);
                      setIsAvatarMenuOpen(false);
                    }}
                    disabled={isResetting}
                    className="w-full flex items-center gap-2 px-2.5 py-2 text-xs rounded-xl hover:bg-[#FDECEA] text-[#B42318] transition disabled:opacity-50"
                  >
                    <RotateCcw className="w-4 h-4 text-[#B42318]" />
                    <span>Reset Demo Baseline</span>
                  </button>
                </div>

                {/* Logout */}
                <div className="pt-1 border-t border-[#F3E3E8]">
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      setIsAvatarMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 text-xs rounded-xl hover:bg-[#FDECEA] text-[#B42318] transition"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Role-Aware Demo Guide Modal */}
      <RoleDemoGuideModal
        isOpen={showRoleGuide}
        onClose={() => setShowRoleGuide(false)}
        onSwitchRole={(newRoleId) => switchRole(newRoleId)}
      />

      {/* Reset Confirmation Modal */}
      {showConfirmReset && (
        <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#F3E3E8] rounded-2xl p-6 max-w-sm w-full shadow-card space-y-4">
            <h3 className="text-base font-semibold text-[#1F1720]">Reset Demo Environment?</h3>
            <p className="text-xs text-[#4B4350] leading-relaxed">
              This will restore all Indian depot on-hand stocks to baseline (495 units total), clear staged transfers, and reset vendor SLA metrics.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#F3E3E8]">
              <button
                type="button"
                onClick={() => setShowConfirmReset(false)}
                className="px-3.5 py-2 rounded-xl text-xs font-medium text-[#4B4350] hover:bg-[#FFF5F7] transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowConfirmReset(false);
                  onReset();
                }}
                className="px-4 py-2 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-semibold transition shadow-subtle"
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
