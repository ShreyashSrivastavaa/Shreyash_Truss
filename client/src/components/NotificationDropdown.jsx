import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check } from 'lucide-react';
import { formatRelativeTime } from '../lib/format/formatDate';

export default function NotificationDropdown({
  notifications = [],
  currentUser,
  onNavigate,
  onMarkAllRead
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const userNotifications = notifications.filter(
    n => n.targetRole === 'ALL' || n.targetRole === currentUser?.role
  );

  const unreadCount = userNotifications.filter(n => !n.read).length;

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleItemClick = (notif) => {
    if (notif.linkTab && onNavigate) {
      onNavigate(notif.linkTab);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-[#8A8190] hover:text-[#1F1720] hover:bg-[#FFF5F7] transition"
        title="Notifications"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 flex h-2 w-2 rounded-full bg-[#E11D48]" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white border border-[#F3E3E8] shadow-card z-50 p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-[#F3E3E8] pb-2.5">
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-semibold text-[#1F1720]">
                Notifications
              </h4>
              {unreadCount > 0 && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#FFE4EA] text-[#BE123C] font-medium">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={onMarkAllRead}
                className="text-xs text-[#E11D48] hover:text-[#BE123C] font-medium flex items-center gap-1 transition"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
            {userNotifications.length === 0 ? (
              <p className="text-xs text-[#8A8190] text-center py-6">No notifications</p>
            ) : (
              userNotifications.map(n => (
                <div
                  key={n.id}
                  onClick={() => handleItemClick(n)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition flex flex-col gap-1 ${
                    !n.read
                      ? 'bg-[#FFF5F7] border-[#F3E3E8] hover:border-[#E11D48]/30'
                      : 'bg-white border-[#F3E3E8] hover:bg-[#FFFBFC]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-medium text-[#1F1720]">{n.title}</span>
                    <span className="text-[10px] text-[#8A8190]">
                      {formatRelativeTime(n.timestamp)}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#4B4350] leading-relaxed">{n.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
