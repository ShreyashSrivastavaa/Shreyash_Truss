import React, { useState } from 'react';
import {
  RotateCcw,
  Key
} from 'lucide-react';
import { DEMO_USERS } from '../../lib/auth/demoUsers';
import { ROLE_PERMISSIONS } from '../../lib/permissions';
import { formatDate } from '../../lib/format/formatDate';

export default function AdminDashboard({ auditLog = [], onResetDemo }) {
  const [activeTab, setActiveTab] = useState('AUDIT');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="p-6 rounded-2xl bg-white border border-[#F3E3E8] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-card">
        <div>
          <h2 className="text-base font-semibold text-[#1F1720] tracking-tight flex items-center gap-2">
            <Key className="w-5 h-5 text-[#E11D48]" />
            <span>Admin Console · System Administration &amp; Security</span>
          </h2>
          <p className="text-xs text-[#8A8190] mt-0.5">
            Role permission matrices, user credentials registry, and live real-time audit ledger
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            className="px-3.5 py-1.5 rounded-xl border border-[#F3E3E8] hover:bg-[#FDECEA] text-[#B42318] text-xs font-medium transition flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Hard Reset Demo Data</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#F3E3E8] pb-2 text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('AUDIT')}
          className={`px-3 py-1.5 rounded-xl font-medium transition ${
            activeTab === 'AUDIT'
              ? 'bg-[#FFE4EA] text-[#E11D48]'
              : 'text-[#8A8190] hover:text-[#1F1720]'
          }`}
        >
          Audit Log ({auditLog.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('USERS')}
          className={`px-3 py-1.5 rounded-xl font-medium transition ${
            activeTab === 'USERS'
              ? 'bg-[#FFE4EA] text-[#E11D48]'
              : 'text-[#8A8190] hover:text-[#1F1720]'
          }`}
        >
          Demo Users ({DEMO_USERS.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('PERMISSIONS')}
          className={`px-3 py-1.5 rounded-xl font-medium transition ${
            activeTab === 'PERMISSIONS'
              ? 'bg-[#FFE4EA] text-[#E11D48]'
              : 'text-[#8A8190] hover:text-[#1F1720]'
          }`}
        >
          Permissions Matrix
        </button>
      </div>

      {/* TAB 1: AUDIT LOG */}
      {activeTab === 'AUDIT' && (
        <div className="bg-white border border-[#F3E3E8] rounded-2xl p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between border-b border-[#F3E3E8] pb-3">
            <h3 className="text-sm font-semibold text-[#1F1720]">
              Immutable System Audit Ledger (IST)
            </h3>
            <span className="text-xs text-[#8A8190]">
              Timezone: Asia/Kolkata
            </span>
          </div>

          <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
            {auditLog.map((log) => (
              <div
                key={log.id}
                className="p-3.5 rounded-xl bg-[#FFF5F7] border border-[#F3E3E8] text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-card"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-[#1F1720]">{log.userName}</span>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white text-[#4B4350] border border-[#F3E3E8]">
                      {log.userRole}
                    </span>
                    <span className="text-[10px] text-[#8A8190]">{log.action}</span>
                  </div>
                  <p className="text-[#4B4350] text-xs">{log.details}</p>
                </div>
                <div className="text-xs text-[#8A8190] shrink-0 self-start sm:self-auto">
                  {formatDate(log.timestamp, { includeTime: true })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: DEMO USERS */}
      {activeTab === 'USERS' && (
        <div className="bg-white border border-[#F3E3E8] rounded-2xl p-6 shadow-card space-y-4">
          <h3 className="text-sm font-semibold text-[#1F1720] border-b border-[#F3E3E8] pb-3">
            Provisioned Demo Accounts (Password: Nexus@2026)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {DEMO_USERS.map((u) => (
              <div
                key={u.id}
                className="p-4 rounded-xl bg-[#FFF5F7] border border-[#F3E3E8] space-y-2 shadow-card"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-xs font-semibold text-[#1F1720]">{u.name}</h4>
                    <p className="text-xs text-[#8A8190]">{u.title}</p>
                  </div>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white text-[#4B4350] border border-[#F3E3E8]">
                    {u.role}
                  </span>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-[#F3E3E8] text-xs text-[#1F1720] flex items-center justify-between">
                  <span>{u.email}</span>
                  <span className="text-[#8A8190]">Nexus@2026</span>
                </div>
                <p className="text-[11px] text-[#8A8190] leading-normal">{u.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: PERMISSIONS MATRIX */}
      {activeTab === 'PERMISSIONS' && (
        <div className="bg-white border border-[#F3E3E8] rounded-2xl p-6 shadow-card space-y-4">
          <h3 className="text-sm font-semibold text-[#1F1720] border-b border-[#F3E3E8] pb-3">
            Role Capabilities &amp; Action Matrix
          </h3>

          <div className="overflow-x-auto rounded-xl border border-[#F3E3E8]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FFF5F7] text-[#8A8190] font-medium border-b border-[#F3E3E8]">
                <tr>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Default Tab</th>
                  <th className="py-3 px-4 text-center">Stage Transfer</th>
                  <th className="py-3 px-4 text-center">Approve Outgoing</th>
                  <th className="py-3 px-4 text-center">Dispatch Highway</th>
                  <th className="py-3 px-4 text-center">Confirm Dock Intake</th>
                  <th className="py-3 px-4 text-center">SLA Enforcement</th>
                  <th className="py-3 px-4">Data Scoping</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3E3E8]">
                {Object.entries(ROLE_PERMISSIONS).map(([roleKey, perm]) => (
                  <tr key={roleKey} className="hover:bg-[#FFF1F4]">
                    <td className="py-3 px-4 font-semibold text-[#1F1720]">{perm.label}</td>
                    <td className="py-3 px-4 text-[#4B4350]">{perm.defaultTab}</td>
                    <td className="py-3 px-4 text-center">
                      {perm.canStageTransfer ? <span className="text-[#1F8A5B] font-semibold">✓</span> : <span className="text-[#8A8190]">—</span>}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {perm.canApproveTransfer ? <span className="text-[#1F8A5B] font-semibold">✓</span> : <span className="text-[#8A8190]">—</span>}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {perm.canDispatchTransfer ? <span className="text-[#1F8A5B] font-semibold">✓</span> : <span className="text-[#8A8190]">—</span>}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {perm.canReceiveTransfer ? <span className="text-[#1F8A5B] font-semibold">✓</span> : <span className="text-[#8A8190]">—</span>}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {perm.canManageVendors ? <span className="text-[#1F8A5B] font-semibold">✓</span> : <span className="text-[#8A8190]">—</span>}
                    </td>
                    <td className="py-3 px-4 text-xs text-[#8A8190]">
                      {perm.dataScope.scopedToUserDepot ? 'Single Depot' : perm.dataScope.scopedToUserVendor ? 'Single Vendor (External)' : 'All India Network'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RESET CONFIRMATION MODAL */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#F3E3E8] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 text-[#4B4350]">
            <h3 className="text-sm font-semibold text-[#1F1720]">Reset Demo to Baseline?</h3>
            <p className="text-xs text-[#4B4350]">
              This will restore pristine initial inventory numbers (495 units on hand across Gurugram, Chennai, and Kolkata) and reset transfers and audit logs.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#F3E3E8]">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-3.5 py-1.5 rounded-xl border border-[#F3E3E8] text-[#4B4350] hover:bg-[#FFF5F7] text-xs font-medium transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowResetConfirm(false);
                  onResetDemo();
                }}
                className="px-4 py-1.5 rounded-xl bg-[#B42318] hover:bg-[#911c13] text-white text-xs font-medium transition shadow-sm"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
