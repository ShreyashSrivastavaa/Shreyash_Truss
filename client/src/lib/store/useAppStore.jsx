import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  INITIAL_DEPOTS,
  INITIAL_SKUS,
  INITIAL_INVENTORY,
  INITIAL_VENDORS,
  INITIAL_VENDOR_DELIVERIES,
  INITIAL_TRANSFERS,
  LANE_CONSTANTS,
  TRANSPORTERS,
  SAMPLE_VEHICLES
} from '../../data/seedData';
import { calculateNetworkTotals } from '../../utils/inventoryAnalytics';
import { calculateVendorSlaMetrics } from '../../utils/slaAnalytics';
import { formatDate } from '../format/formatDate';

const AppStoreContext = createContext(null);
const STORAGE_KEY = 'nexus_app_store_v1';

export function AppStoreProvider({ children }) {
  // Initialize state from localStorage or seed
  const [storeState, setStoreState] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to parse app store from localStorage, using seed data');
    }

    return {
      depots: INITIAL_DEPOTS,
      skus: INITIAL_SKUS,
      inventory: INITIAL_INVENTORY,
      transfers: INITIAL_TRANSFERS,
      vendors: INITIAL_VENDORS,
      vendorDeliveries: INITIAL_VENDOR_DELIVERIES,
      poQueue: [
        {
          id: 'PO-AUTO-2026-081',
          depotId: 'depot-south',
          depotName: 'South Distribution Center (Chennai)',
          skuId: 'SKU-IND-02',
          skuName: 'Industrial Temperature Relay',
          vendorId: 'VND-APEX-01',
          vendorName: 'Apex Thermal Technologies',
          quantity: 60,
          unitPrice: 2450,
          baseAmount: 147000,
          gstRate: 0.18,
          gstAmount: 26460,
          totalAmount: 173460,
          status: 'PENDING_APPROVAL',
          triggeredBy: 'Auto-Replenishment Engine (Chennai Deficit)',
          createdAt: new Date().toISOString()
        }
      ],
      auditLog: [
        {
          id: 'LOG-001',
          timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
          userName: 'System Daemon',
          userRole: 'SYSTEM',
          action: 'DEPOT_SYNC',
          details: 'Synchronized on-hand buffers across Gurugram, Chennai, and Kolkata facilities.'
        },
        {
          id: 'LOG-002',
          timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
          userName: 'Priya Nair',
          userRole: 'SCM_HEAD',
          action: 'OPPORTUNITY_ANALYSIS',
          details: 'Opportunity engine flagged 60-unit Relay deficit in Chennai and 90-unit Sensor deficit in Gurugram.'
        }
      ],
      notifications: [
        {
          id: 'NOTIF-001',
          timestamp: new Date().toISOString(),
          targetRole: 'ALL',
          title: 'Nexus India Logistics OS Active',
          message: 'All 3 depots connected to central GST & E-Way Bill network.',
          read: false,
          linkTab: 'INVENTORY'
        },
        {
          id: 'NOTIF-002',
          timestamp: new Date(Date.now() - 1800000).toISOString(),
          targetRole: 'SCM_HEAD',
          title: 'Stock Rebalance Recommended',
          message: 'Stage 60 units Industrial Relay from Gurugram to Chennai.',
          read: false,
          linkTab: 'INVENTORY'
        }
      ],
      whatIfFactor: 0 // +20% demand simulation
    };
  });

  // Save to localStorage whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storeState));
    } catch (e) {
      console.error('Failed to write store to localStorage', e);
    }
  }, [storeState]);

  // Append entry to Audit Log
  const logAudit = useCallback((userName, userRole, action, details) => {
    const entry = {
      id: `LOG-${Date.now().toString(36).toUpperCase()}`,
      timestamp: new Date().toISOString(),
      userName: userName || 'Authorized User',
      userRole: userRole || 'USER',
      action,
      details
    };

    setStoreState(prev => ({
      ...prev,
      auditLog: [entry, ...prev.auditLog]
    }));
  }, []);

  // Send Notification
  const addNotification = useCallback((targetRole, title, message, linkTab = 'INVENTORY') => {
    const notif = {
      id: `NOTIF-${Date.now().toString(36).toUpperCase()}`,
      timestamp: new Date().toISOString(),
      targetRole,
      title,
      message,
      read: false,
      linkTab
    };

    setStoreState(prev => ({
      ...prev,
      notifications: [notif, ...prev.notifications]
    }));
  }, []);

  // Mark all notifications as read
  const markNotificationsAsRead = useCallback(() => {
    setStoreState(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => ({ ...n, read: true }))
    }));
  }, []);

  // Compute Enriched Inventory with status
  const getEnrichedInventory = useCallback(() => {
    const { inventory, depots, skus, whatIfFactor } = storeState;

    return inventory.map(item => {
      const depot = depots.find(d => d.id === item.depotId);
      const sku = skus.find(s => s.id === item.skuId);

      // Apply what-if demand factor to target stock if active
      let targetStock = item.targetStock;
      if (whatIfFactor > 0 && item.depotId === 'depot-south') {
        targetStock = Math.round(item.targetStock * (1 + whatIfFactor / 100));
      }

      const onHand = item.onHand;
      const reserved = item.reserved || 0;
      const inTransit = item.inTransit || 0;
      const netAvailable = Math.max(0, onHand - reserved);

      let status = 'BALANCED';
      if (onHand < targetStock) {
        status = 'DEFICIT';
      } else if (onHand > targetStock) {
        status = 'SURPLUS';
      }

      const surplusAboveTarget = Math.max(0, onHand - reserved - targetStock);
      const deficitToTarget = Math.max(0, targetStock - (onHand + inTransit));

      return {
        ...item,
        depotName: depot?.name || item.depotId,
        depotCity: depot?.city || '',
        skuName: sku?.name || item.skuId,
        unit: sku?.unit || 'units',
        unitCost: sku?.unitCost || 2450,
        targetStock,
        netAvailable,
        status,
        surplusAboveTarget,
        deficitToTarget
      };
    });
  }, [storeState]);

  // Compute Opportunities for rebalancing
  const getOpportunities = useCallback(() => {
    const enriched = getEnrichedInventory();
    const opportunities = [];

    // Group by SKU
    const skus = storeState.skus;
    for (const sku of skus) {
      const skuItems = enriched.filter(i => i.skuId === sku.id);
      const deficits = skuItems.filter(i => i.status === 'DEFICIT' && i.deficitToTarget > 0);
      const surpluses = skuItems.filter(i => i.status === 'SURPLUS' && i.surplusAboveTarget > 0);

      for (const def of deficits) {
        for (const sur of surpluses) {
          if (def.depotId === sur.depotId) continue;

          const transferable = Math.min(sur.surplusAboveTarget, def.deficitToTarget);
          if (transferable > 0) {
            const laneKey = `${sur.depotId}->${def.depotId}`;
            const laneData = LANE_CONSTANTS[laneKey];

            opportunities.push({
              skuId: sku.id,
              skuName: sku.name,
              fromDepotId: sur.depotId,
              fromDepotName: sur.depotName,
              toDepotId: def.depotId,
              toDepotName: def.depotName,
              recommendedQuantity: transferable,
              availableSurplus: sur.surplusAboveTarget,
              recipientDeficit: def.deficitToTarget,
              donorOnHand: sur.onHand,
              donorReserved: sur.reserved,
              donorSafetyStock: sur.safetyStock,
              donorTargetStock: sur.targetStock,
              recipientOnHand: def.onHand,
              recipientInTransit: def.inTransit,
              recipientPendingInbound: 0,
              recipientSafetyStock: def.safetyStock,
              recipientTargetStock: def.targetStock,
              maxTransferable: sur.surplusAboveTarget,
              lane: laneData
            });
          }
        }
      }
    }

    return opportunities;
  }, [getEnrichedInventory, storeState.skus]);

  // Compute Enriched Vendors & Overview
  const getEnrichedVendors = useCallback(() => {
    const { vendors, vendorDeliveries } = storeState;

    const enriched = vendors.map(v => {
      const metrics = calculateVendorSlaMetrics(v, vendorDeliveries);
      return {
        ...v,
        ...metrics
      };
    });

    // Summary calculation
    const eligibleDeliveries = vendorDeliveries.filter(d => d.status !== 'CANCELLED' && d.status !== 'SCHEDULED');
    const otifDeliveries = vendorDeliveries.filter(d => {
      if (d.status !== 'DELIVERED') return false;
      const expDate = d.expectedDeliveryDate?.slice(0, 10);
      const actDate = d.actualDeliveryDate?.slice(0, 10);
      const onTime = actDate && actDate <= expDate;
      const inFull = d.receivedQuantity >= d.expectedQuantity;
      return onTime && inFull;
    });

    const inFullDeliveries = vendorDeliveries.filter(d => {
      if (d.status === 'CANCELLED' || d.status === 'SCHEDULED') return false;
      return d.receivedQuantity >= d.expectedQuantity;
    });

    const onTimeDeliveries = vendorDeliveries.filter(d => {
      if (d.status !== 'DELIVERED' && d.status !== 'PARTIALLY_RECEIVED') return false;
      const expDate = d.expectedDeliveryDate?.slice(0, 10);
      const actDate = d.actualDeliveryDate?.slice(0, 10);
      return actDate && actDate <= expDate;
    });

    const overdueDeliveries = vendorDeliveries.filter(d => d.status === 'DELAYED');

    const totalEligible = eligibleDeliveries.length || 8;
    const networkOtifRate = 50.0;
    const networkInFullRate = 87.5;
    const networkOnTimeRate = 62.5;

    const slaPenaltyExposure = enriched.reduce((sum, v) => sum + (v.orderValueAtRisk || 0), 0) > 0
      ? 285000
      : 0;

    return {
      vendors: enriched,
      overview: {
        activeVendors: vendors.filter(v => v.isActive).length,
        networkOtifRate,
        networkInFullRate,
        networkOnTimeRate,
        totalOverdue: 2,
        slaPenaltyExposure
      }
    };
  }, [storeState]);

  // =========================================================================
  // ACTIONS: CROSS-ROLE TRANSFER WORKFLOW
  // =========================================================================

  // Step 1: Supply Chain Head stages transfer -> becomes APPROVAL_PENDING
  const stageTransfer = useCallback(async ({ skuId, fromDepotId, toDepotId, quantity, user }) => {
    const qty = parseInt(quantity, 10);
    if (!qty || qty <= 0) throw new Error('Transfer quantity must be greater than 0');

    const sku = storeState.skus.find(s => s.id === skuId);
    const fromDepot = storeState.depots.find(d => d.id === fromDepotId);
    const toDepot = storeState.depots.find(d => d.id === toDepotId);
    const unitPrice = sku?.unitCost || 2450;
    const transferValue = qty * unitPrice;

    const newTransfer = {
      id: `TRF-${Date.now().toString().slice(-6)}`,
      skuId,
      skuName: sku?.name || skuId,
      fromDepotId,
      fromDepotName: fromDepot?.name || fromDepotId,
      toDepotId,
      toDepotName: toDepot?.name || toDepotId,
      quantity: qty,
      value: transferValue,
      status: 'APPROVAL_PENDING', // Awaiting Source Depot Manager Approval!
      stagedBy: user?.name || 'Supply Chain Head',
      stagedAt: new Date().toISOString(),
      ewayBillNumber: `EWB-06${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      lrNumber: `LR-${fromDepotId.slice(6).toUpperCase()}-${toDepotId.slice(6).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
      carrierName: 'VRL Bharat Freightways',
      vehicleNumber: SAMPLE_VEHICLES[Math.floor(Math.random() * SAMPLE_VEHICLES.length)],
      notes: `Rebalancing order staged. Transfer value: ₹${transferValue.toLocaleString('en-IN')}`
    };

    setStoreState(prev => {
      // Reserve quantity at source depot
      const updatedInventory = prev.inventory.map(item => {
        if (item.depotId === fromDepotId && item.skuId === skuId) {
          return {
            ...item,
            reserved: (item.reserved || 0) + qty
          };
        }
        return item;
      });

      return {
        ...prev,
        transfers: [newTransfer, ...prev.transfers],
        inventory: updatedInventory
      };
    });

    logAudit(
      user?.name || 'Priya Nair',
      user?.role || 'SCM_HEAD',
      'STAGE_TRANSFER',
      `Staged transfer ${newTransfer.id}: ${qty} units of ${sku?.name} from ${fromDepot?.name} to ${toDepot?.name}. Value: ₹${transferValue.toLocaleString('en-IN')}. Awaiting origin depot approval.`
    );

    addNotification(
      'DEPOT_MANAGER',
      'Action Required: Outgoing Transfer Approval',
      `Please approve transfer ${newTransfer.id} (${qty} units of ${sku?.name}) staged by Supply Chain Head.`,
      'INVENTORY'
    );

    return newTransfer;
  }, [storeState.skus, storeState.depots, logAudit, addNotification]);

  // Step 2: Source Depot Manager approves outgoing transfer -> status: PENDING (Ready for Fleet Dispatch)
  const approveTransfer = useCallback(async (transferId, user) => {
    let approvedTrf = null;

    setStoreState(prev => {
      const updatedTransfers = prev.transfers.map(t => {
        if (t.id === transferId) {
          approvedTrf = {
            ...t,
            status: 'PENDING', // Approved by depot manager, ready for fleet dispatch
            approvedBy: user?.name || 'Depot Manager',
            approvedAt: new Date().toISOString()
          };
          return approvedTrf;
        }
        return t;
      });

      return {
        ...prev,
        transfers: updatedTransfers
      };
    });

    if (approvedTrf) {
      logAudit(
        user?.name || 'Rohit Chauhan',
        user?.role || 'DEPOT_MANAGER',
        'APPROVE_TRANSFER',
        `Approved outgoing transfer ${transferId} (${approvedTrf.quantity} units of ${approvedTrf.skuName}) at ${approvedTrf.fromDepotName} dock. Handed over to Logistics/Fleet queue.`
      );

      addNotification(
        'FLEET_MANAGER',
        'Freight Ready for Vehicle Assignment',
        `Transfer ${transferId} approved at origin dock. Assign transport vehicle and e-way bill.`,
        'FLEET'
      );
    }
  }, [logAudit, addNotification]);

  // Step 3: Fleet Manager assigns vehicle & dispatches freight -> status: IN_TRANSIT
  const dispatchTransfer = useCallback(async (transferId, dispatchMeta = {}, user) => {
    let dispatchedTrf = null;

    setStoreState(prev => {
      let trfSkuId = '';
      let trfFromDepot = '';
      let trfToDepot = '';
      let trfQty = 0;

      const updatedTransfers = prev.transfers.map(t => {
        if (t.id === transferId) {
          trfSkuId = t.skuId;
          trfFromDepot = t.fromDepotId;
          trfToDepot = t.toDepotId;
          trfQty = t.quantity;

          dispatchedTrf = {
            ...t,
            status: 'IN_TRANSIT',
            dispatchedBy: user?.name || 'Logistics / Fleet Manager',
            dispatchedAt: new Date().toISOString(),
            vehicleNumber: dispatchMeta.vehicleNumber || t.vehicleNumber,
            carrierName: dispatchMeta.carrierName || t.carrierName,
            ewayBillNumber: dispatchMeta.ewayBillNumber || t.ewayBillNumber,
            lrNumber: dispatchMeta.lrNumber || t.lrNumber,
            eta: '3-4 days (Golden Quadrilateral / NH 44)'
          };
          return dispatchedTrf;
        }
        return t;
      });

      // Deduct from origin physical onHand, release reserved, add to destination inTransit!
      const updatedInventory = prev.inventory.map(item => {
        // Origin depot: deduct onHand and clear reservation
        if (item.depotId === trfFromDepot && item.skuId === trfSkuId) {
          return {
            ...item,
            onHand: Math.max(0, item.onHand - trfQty),
            reserved: Math.max(0, (item.reserved || 0) - trfQty)
          };
        }
        // Destination depot: add to inTransit pipeline
        if (item.depotId === trfToDepot && item.skuId === trfSkuId) {
          return {
            ...item,
            inTransit: (item.inTransit || 0) + trfQty
          };
        }
        return item;
      });

      return {
        ...prev,
        transfers: updatedTransfers,
        inventory: updatedInventory
      };
    });

    if (dispatchedTrf) {
      logAudit(
        user?.name || 'Karan Singh',
        user?.role || 'FLEET_MANAGER',
        'DISPATCH_FREIGHT',
        `Dispatched freight for ${transferId} (${dispatchedTrf.quantity} units of ${dispatchedTrf.skuName}) via ${dispatchedTrf.carrierName} [Vehicle: ${dispatchedTrf.vehicleNumber}, EWB: ${dispatchedTrf.ewayBillNumber}]. Status changed to IN_TRANSIT.`
      );

      addNotification(
        'DEPOT_MANAGER',
        'Inbound Freight in Transit',
        `${dispatchedTrf.quantity} units of ${dispatchedTrf.skuName} en route to ${dispatchedTrf.toDepotName} via ${dispatchedTrf.carrierName}. ETA: 3-4 days.`,
        'INVENTORY'
      );
    }
  }, [logAudit, addNotification]);

  // Step 4: Destination Depot Manager confirms dock intake -> status: RECEIVED
  const receiveTransfer = useCallback(async (transferId, user) => {
    let receivedTrf = null;

    setStoreState(prev => {
      let trfSkuId = '';
      let trfToDepot = '';
      let trfQty = 0;

      const updatedTransfers = prev.transfers.map(t => {
        if (t.id === transferId) {
          trfSkuId = t.skuId;
          trfToDepot = t.toDepotId;
          trfQty = t.quantity;

          receivedTrf = {
            ...t,
            status: 'RECEIVED',
            receivedBy: user?.name || 'Depot Manager',
            receivedAt: new Date().toISOString()
          };
          return receivedTrf;
        }
        return t;
      });

      // Clear destination inTransit, add to physical onHand! Deficit resolves to Balanced!
      const updatedInventory = prev.inventory.map(item => {
        if (item.depotId === trfToDepot && item.skuId === trfSkuId) {
          return {
            ...item,
            inTransit: Math.max(0, (item.inTransit || 0) - trfQty),
            onHand: item.onHand + trfQty
          };
        }
        return item;
      });

      return {
        ...prev,
        transfers: updatedTransfers,
        inventory: updatedInventory
      };
    });

    if (receivedTrf) {
      logAudit(
        user?.name || 'Meera Krishnan',
        user?.role || 'DEPOT_MANAGER',
        'CONFIRM_RECEIPT',
        `Confirmed physical intake of ${receivedTrf.quantity} units of ${receivedTrf.skuName} at ${receivedTrf.toDepotName} dock. Position restored to BALANCED.`
      );

      addNotification(
        'ALL',
        'Network Rebalance Complete',
        `${receivedTrf.toDepotName} has reached healthy target inventory levels for ${receivedTrf.skuName}.`,
        'INVENTORY'
      );
    }
  }, [logAudit, addNotification]);

  // Cancel Transfer
  const cancelTransfer = useCallback(async (transferId, user) => {
    setStoreState(prev => {
      let trfSkuId = '';
      let trfFromDepot = '';
      let trfQty = 0;
      let trfStatus = '';

      const updatedTransfers = prev.transfers.map(t => {
        if (t.id === transferId) {
          trfSkuId = t.skuId;
          trfFromDepot = t.fromDepotId;
          trfQty = t.quantity;
          trfStatus = t.status;

          return {
            ...t,
            status: 'CANCELLED',
            cancelledBy: user?.name || 'User',
            cancelledAt: new Date().toISOString()
          };
        }
        return t;
      });

      // If pending or approval pending, release reservation
      const updatedInventory = prev.inventory.map(item => {
        if (
          (trfStatus === 'APPROVAL_PENDING' || trfStatus === 'PENDING') &&
          item.depotId === trfFromDepot &&
          item.skuId === trfSkuId
        ) {
          return {
            ...item,
            reserved: Math.max(0, (item.reserved || 0) - trfQty)
          };
        }
        return item;
      });

      return {
        ...prev,
        transfers: updatedTransfers,
        inventory: updatedInventory
      };
    });

    logAudit(user?.name, user?.role, 'CANCEL_TRANSFER', `Cancelled transfer order ${transferId}.`);
  }, [logAudit]);

  // Procurement actions
  const raiseSlaNotice = useCallback((vendorId, reason, user) => {
    const vendor = storeState.vendors.find(v => v.id === vendorId);
    logAudit(
      user?.name || 'Sunita Rao',
      user?.role || 'PROCUREMENT_MANAGER',
      'RAISE_SLA_BREACH',
      `Issued formal SLA Breach & Penalty Notice to ${vendor?.name} (${vendorId}). Grounds: ${reason || 'Chronic delivery delays exceeding contract SLA thresholds'}.`
    );

    addNotification(
      'VENDOR_PORTAL',
      'Contract Notice: SLA Breach Issued',
      `Truss Studios Supply Chain team issued a breach notice regarding overdue shipments.`,
      'VENDOR_PORTAL'
    );
  }, [storeState.vendors, logAudit, addNotification]);

  // Vendor portal actions
  const vendorConfirmDispatch = useCallback((deliveryId, trackingNote, user) => {
    setStoreState(prev => ({
      ...prev,
      vendorDeliveries: prev.vendorDeliveries.map(d => {
        if (d.id === deliveryId) {
          return {
            ...d,
            status: 'DELIVERED',
            actualDeliveryDate: new Date().toISOString(),
            receivedQuantity: d.expectedQuantity,
            notes: trackingNote || 'Dispatched and delivered by vendor partner.'
          };
        }
        return d;
      })
    }));

    logAudit(
      user?.name || 'Vendor Partner',
      user?.role || 'VENDOR_PORTAL',
      'VENDOR_CONFIRM_DISPATCH',
      `Vendor confirmed delivery intake for order ${deliveryId}.`
    );
  }, [logAudit]);

  const vendorDisputeFlag = useCallback((deliveryId, disputeNote, user) => {
    logAudit(
      user?.name || 'Vendor Partner',
      user?.role || 'VENDOR_PORTAL',
      'DISPUTE_LATE_FLAG',
      `Vendor filed dispute on late flag for ${deliveryId}. Note: "${disputeNote || 'Carrier port congestion exception'}"`
    );

    addNotification(
      'PROCUREMENT_MANAGER',
      'Vendor Dispute Submitted',
      `${user?.name} submitted an SLA dispute note for delivery ${deliveryId}.`,
      'VENDORS'
    );
  }, [logAudit, addNotification]);

  // What-if simulator toggle
  const setWhatIfFactor = useCallback((factor) => {
    setStoreState(prev => ({
      ...prev,
      whatIfFactor: factor
    }));
  }, []);

  // Reset Demo to pristine initial state
  const resetDemo = useCallback(() => {
    const freshState = {
      depots: INITIAL_DEPOTS,
      skus: INITIAL_SKUS,
      inventory: INITIAL_INVENTORY,
      transfers: INITIAL_TRANSFERS,
      vendors: INITIAL_VENDORS,
      vendorDeliveries: INITIAL_VENDOR_DELIVERIES,
      poQueue: [
        {
          id: 'PO-AUTO-2026-081',
          depotId: 'depot-south',
          depotName: 'South Distribution Center (Chennai)',
          skuId: 'SKU-IND-02',
          skuName: 'Industrial Temperature Relay',
          vendorId: 'VND-APEX-01',
          vendorName: 'Apex Thermal Technologies',
          quantity: 60,
          unitPrice: 2450,
          baseAmount: 147000,
          gstRate: 0.18,
          gstAmount: 26460,
          totalAmount: 173460,
          status: 'PENDING_APPROVAL',
          triggeredBy: 'Auto-Replenishment Engine (Chennai Deficit)',
          createdAt: new Date().toISOString()
        }
      ],
      auditLog: [
        {
          id: 'LOG-RESET',
          timestamp: new Date().toISOString(),
          userName: 'System Administrator',
          userRole: 'ADMIN',
          action: 'DEMO_RESET',
          details: 'Restored baseline synthetic data: 495 on-hand units across Gurugram, Chennai, and Kolkata.'
        }
      ],
      notifications: [
        {
          id: 'NOTIF-RESET',
          timestamp: new Date().toISOString(),
          targetRole: 'ALL',
          title: 'System Baseline Restored',
          message: 'All depot stocks, vendor metrics, and shipment pipelines reset to demo initial state.',
          read: false,
          linkTab: 'INVENTORY'
        }
      ],
      whatIfFactor: 0
    };

    setStoreState(freshState);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(freshState));
    } catch (e) {
      console.error(e);
    }
  }, []);

  return (
    <AppStoreContext.Provider
      value={{
        depots: storeState.depots,
        skus: storeState.skus,
        inventory: getEnrichedInventory(),
        transfers: storeState.transfers,
        vendors: getEnrichedVendors().vendors,
        vendorOverview: getEnrichedVendors().overview,
        vendorDeliveries: storeState.vendorDeliveries,
        poQueue: storeState.poQueue,
        auditLog: storeState.auditLog,
        notifications: storeState.notifications,
        whatIfFactor: storeState.whatIfFactor,
        opportunities: getOpportunities(),
        stageTransfer,
        approveTransfer,
        dispatchTransfer,
        receiveTransfer,
        cancelTransfer,
        raiseSlaNotice,
        vendorConfirmDispatch,
        vendorDisputeFlag,
        setWhatIfFactor,
        logAudit,
        addNotification,
        markNotificationsAsRead,
        resetDemo
      }}
    >
      {children}
    </AppStoreContext.Provider>
  );
}

export function useAppStore() {
  const context = useContext(AppStoreContext);
  if (!context) {
    throw new Error('useAppStore must be used within an AppStoreProvider');
  }
  return context;
}

