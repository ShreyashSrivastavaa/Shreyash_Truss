import React, { useState } from 'react';
import {
  Compass,
  X,
  ArrowRight,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { useAuth } from '../lib/auth/AuthContext';

export default function RoleDemoGuideModal({ isOpen, onClose, onSwitchRole }) {
  const { currentUser } = useAuth();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  if (!isOpen) return null;

  const role = currentUser?.role || 'SCM_HEAD';

  const GUIDES_BY_ROLE = {
    SCM_HEAD: {
      title: 'Supply Chain Head Walkthrough',
      suggestedNextRole: { id: 'user-depot-north', name: 'Rohit Chauhan (Gurugram Depot Manager)' },
      steps: [
        {
          step: 1,
          title: '1. Spot Regional Deficit',
          desc: 'Notice Chennai is in Deficit (-60 units) for Industrial Relays, while Gurugram holds +70 units excess Surplus above safety buffer.'
        },
        {
          step: 2,
          title: '2. Review INR Financial Metrics',
          desc: 'Examine Recommended Transfers: transfer value is ₹1,47,000 with ₹18,500 road freight, avoiding ₹2,94,000 in factory downtime.'
        },
        {
          step: 3,
          title: '3. Stage the Rebalance Order',
          desc: 'Click "Stage Transfer" for 60 units. Stock will be reserved atomically at Gurugram origin dock awaiting depot approval.'
        },
        {
          step: 4,
          title: '4. Handshake: Switch to Gurugram Manager',
          desc: 'Switch to Rohit Chauhan (Gurugram Depot Manager) to approve the physical dispatch from North Hub dock.'
        }
      ]
    },

    DEPOT_MANAGER: {
      title: `${currentUser?.name} (${currentUser?.depotName || 'Depot Manager'}) Walkthrough`,
      suggestedNextRole: currentUser?.depotId === 'depot-north'
        ? { id: 'user-fleet', name: 'Karan Singh (Logistics / Fleet Manager)' }
        : { id: 'user-ceo', name: 'Rajesh Mehta (Executive CEO)' },
      steps: [
        {
          step: 1,
          title: '1. Facility Live Stock & Guardrails',
          desc: 'Your view is strictly scoped to your facility. Observe On-Hand vs Target buffer for both SKUs.'
        },
        {
          step: 2,
          title: '2. Outgoing Staging Approval',
          desc: 'If an outbound transfer was staged from your hub, review the "Approval Required" banner and click "Approve Outgoing Transfer".'
        },
        {
          step: 3,
          title: '3. Inbound Freight Dock Intake',
          desc: 'When highway shipments arrive at your dock, inspect E-Way Bill & vehicle plates, then click "Confirm Receipt & Dock Intake".'
        },
        {
          step: 4,
          title: '4. Stock Restored to Balanced',
          desc: 'Watch your facility stock turn healthy Balanced as inventory is physically intake-verified.'
        }
      ]
    },

    FLEET_MANAGER: {
      title: 'Logistics / Fleet Manager Walkthrough',
      suggestedNextRole: { id: 'user-depot-south', name: 'Meera Krishnan (Chennai Depot Manager)' },
      steps: [
        {
          step: 1,
          title: '1. Inspect India Expressway Corridors',
          desc: 'Review the All-India Route Radar map displaying active freight movements across NH 44 and the Golden Quadrilateral.'
        },
        {
          step: 2,
          title: '2. Assign Transport Manifest',
          desc: 'In the "Ready for Highway" queue, click "Assign Vehicle & Dispatch". Nexus pre-populates Indian registration numbers (e.g. HR-55-XY-3021) and transporter agency.'
        },
        {
          step: 3,
          title: '3. Transmit E-Way Bill',
          desc: 'Confirm the dispatch to transition the consignment to IN_TRANSIT with a 3-4 day road transit ETA.'
        },
        {
          step: 4,
          title: '4. Destination Dock Handshake',
          desc: 'Switch role to Meera Krishnan (Chennai Depot Manager) to confirm arrival and dock intake.'
        }
      ]
    },

    EXECUTIVE: {
      title: 'Executive (CEO) Walkthrough',
      suggestedNextRole: { id: 'user-scm', name: 'Priya Nair (Supply Chain Head)' },
      steps: [
        {
          step: 1,
          title: '1. Capital Inventory Valuation',
          desc: 'Observe the top valuation KPI: ₹30.5 L across 3 Indian facilities (495 total units on hand).'
        },
        {
          step: 2,
          title: '2. Cost Avoidance & Rebalancing ROI',
          desc: 'Automated transfers have avoided ₹17.18 L in factory downtime penalties, yielding an 8.2x return on freight spend.'
        },
        {
          step: 3,
          title: '3. Vendor SLA Risk Radar',
          desc: 'Inspect network OTIF (50%) and ₹2.85 L in penalty exposure due to delays at Nhava Sheva / Mumbai port.'
        },
        {
          step: 4,
          title: '4. Read-Only Governance',
          desc: 'Executive views are non-operational to maintain segregation of duties. Switch to SCM Head to execute operations.'
        }
      ]
    },

    PROCUREMENT_MANAGER: {
      title: 'Procurement & Vendor Manager Walkthrough',
      suggestedNextRole: { id: 'user-vendor-nordic', name: 'Arjun Malhotra (Nordic Vendor Portal)' },
      steps: [
        {
          step: 1,
          title: '1. Vendor SLA Performance',
          desc: 'Audit the 3 vendors: Apex (100% compliant) vs Nordic (0% OTIF, chronic customs delay at Nhava Sheva).'
        },
        {
          step: 2,
          title: '2. Issue SLA Breach Notice',
          desc: 'Click "Issue Formal SLA Notice" on Nordic Cold-Chain Systems to attach contractual penalty terms.'
        },
        {
          step: 3,
          title: '3. Auto-Replenishment PO Queue',
          desc: 'Inspect automated purchase orders generated for depot deficits with complete base + 18% GST calculation.'
        },
        {
          step: 4,
          title: '4. Vendor Portal Inspection',
          desc: 'Switch to Arjun Malhotra (Nordic Systems) to see how the vendor receives the notice and files disputes.'
        }
      ]
    },

    VENDOR_PORTAL: {
      title: 'Vendor Partner Portal Walkthrough',
      suggestedNextRole: { id: 'user-procurement', name: 'Sunita Rao (Procurement Manager)' },
      steps: [
        {
          step: 1,
          title: '1. External Role Isolation',
          desc: 'Notice that internal depot stocks, internal margins, and competitor metrics are completely hidden from this view.'
        },
        {
          step: 2,
          title: '2. Order Pipeline & Performance',
          desc: 'Inspect your own purchase orders in INR and verified dock intake timestamps.'
        },
        {
          step: 3,
          title: '3. File Late Flag Dispute',
          desc: 'Click "Dispute Late Flag" on delayed orders to document port customs exceptions and appeal penalty deductions.'
        },
        {
          step: 4,
          title: '4. Dispatch Confirmation',
          desc: 'Click "Confirm Dispatch" on scheduled orders to notify Truss Supply Chain operations.'
        }
      ]
    },

    ADMIN: {
      title: 'System Administrator Walkthrough',
      suggestedNextRole: { id: 'user-scm', name: 'Priya Nair (Supply Chain Head)' },
      steps: [
        {
          step: 1,
          title: '1. Live Real-Time Audit Log',
          desc: 'Every single transfer, approval, dispatch, and SLA notice is recorded with user identity and IST timestamp.'
        },
        {
          step: 2,
          title: '2. Role Permission Matrix',
          desc: 'Inspect centralized action capabilities across all 7 role tiers.'
        },
        {
          step: 3,
          title: '3. 10 Demo Personas',
          desc: 'All 10 users share common password "Nexus@2026" with one-click role switching.'
        },
        {
          step: 4,
          title: '4. Hard Reset Guarantee',
          desc: 'Click "Hard Reset Demo Data" at any time to restore pristine synthetic baselines.'
        }
      ]
    }
  };

  const activeGuide = GUIDES_BY_ROLE[role] || GUIDES_BY_ROLE.SCM_HEAD;
  const steps = activeGuide.steps;
  const currentStep = steps[currentStepIndex] || steps[0];

  const handleNextRoleClick = () => {
    if (activeGuide.suggestedNextRole && onSwitchRole) {
      onSwitchRole(activeGuide.suggestedNextRole.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-[#F3E3E8] rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-5 text-[#4B4350]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#F3E3E8] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#FFF5F7] text-[#E11D48] border border-[#F3E3E8]">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#1F1720]">
                {activeGuide.title}
              </h3>
              <p className="text-xs text-[#8A8190]">
                4-step guided walkthrough for <span className="text-[#1F1720] font-medium">{currentUser?.name}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#8A8190] hover:text-[#1F1720] p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Stepper Dots */}
        <div className="flex items-center justify-between px-2">
          {steps.map((s, idx) => (
            <button
              key={s.step}
              type="button"
              onClick={() => setCurrentStepIndex(idx)}
              className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium transition ${
                currentStepIndex === idx
                  ? 'bg-[#E11D48] text-white shadow-sm'
                  : currentStepIndex > idx
                  ? 'bg-[#E8F6EF] text-[#1F8A5B] border border-[#F3E3E8]'
                  : 'bg-[#FFF5F7] text-[#8A8190] hover:bg-[#FFE4EA]'
              }`}
            >
              {s.step}
            </button>
          ))}
        </div>

        {/* Current Step Content */}
        <div className="p-4 rounded-xl bg-[#FFF5F7] border border-[#F3E3E8] space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#FFE4EA] text-[#E11D48]">
              Step {currentStepIndex + 1} of {steps.length}
            </span>
            <h4 className="text-xs font-semibold text-[#1F1720]">{currentStep.title}</h4>
          </div>
          <p className="text-xs text-[#4B4350] leading-relaxed">
            {currentStep.desc}
          </p>
        </div>

        {/* Suggested Next Persona Handshake */}
        {activeGuide.suggestedNextRole && (
          <div className="p-3.5 rounded-xl bg-[#FFF5F7] border border-[#F3E3E8] flex items-center justify-between text-xs">
            <div className="space-y-0.5">
              <span className="text-[10px] text-[#8A8190] font-medium block">
                Suggested Cross-Role Handshake
              </span>
              <span className="text-[#1F1720] font-medium">
                {activeGuide.suggestedNextRole.name}
              </span>
            </div>
            <button
              type="button"
              onClick={handleNextRoleClick}
              className="px-3 py-1.5 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] text-white font-medium text-xs transition flex items-center gap-1 shadow-sm"
            >
              <span>Switch</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-[#F3E3E8] text-xs">
          <button
            type="button"
            disabled={currentStepIndex === 0}
            onClick={() => setCurrentStepIndex(prev => prev - 1)}
            className="px-3.5 py-1.5 rounded-xl border border-[#F3E3E8] text-[#4B4350] hover:bg-[#FFF5F7] disabled:opacity-40 font-medium flex items-center gap-1 transition"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Previous</span>
          </button>

          {currentStepIndex < steps.length - 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStepIndex(prev => prev + 1)}
              className="px-4 py-1.5 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] text-white font-medium flex items-center gap-1 transition shadow-sm"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] text-white font-medium transition shadow-sm"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
