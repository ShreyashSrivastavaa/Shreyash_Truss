/**
 * Centralized Role-Based Permissions Configuration for Nexus Product 18
 * Defines tab access, action capabilities, data scoping, and view defaults for all roles.
 * No scattered if-statements in UI components.
 */

export const ROLES = {
  EXECUTIVE: 'EXECUTIVE',
  SCM_HEAD: 'SCM_HEAD',
  DEPOT_MANAGER: 'DEPOT_MANAGER',
  PROCUREMENT_MANAGER: 'PROCUREMENT_MANAGER',
  FLEET_MANAGER: 'FLEET_MANAGER',
  VENDOR_PORTAL: 'VENDOR_PORTAL',
  ADMIN: 'ADMIN'
};

export const ROLE_PERMISSIONS = {
  [ROLES.EXECUTIVE]: {
    label: 'Executive (CEO)',
    defaultTab: 'EXECUTIVE',
    allowedTabs: ['EXECUTIVE', 'INVENTORY', 'VENDORS'],
    defaultMode: 'simple',
    canStageTransfer: false,
    canApproveTransfer: false,
    canDispatchTransfer: false,
    canReceiveTransfer: false,
    canCancelTransfer: false,
    canManageVendors: false,
    canRunSimulator: false,
    canViewAuditLog: true,
    dataScope: {
      depotFilter: null, // all depots
      vendorFilter: null, // all vendors
      hideInternalData: false
    },
    features: {
      executiveSummary: true,
      inventoryValuation: true,
      slaPenaltySummary: true,
      topRisks: true,
      whatIfSimulator: false
    }
  },

  [ROLES.SCM_HEAD]: {
    label: 'Supply Chain Head',
    defaultTab: 'INVENTORY',
    allowedTabs: ['INVENTORY', 'VENDORS', 'SIMULATOR'],
    defaultMode: 'detailed',
    canStageTransfer: true,
    canApproveTransfer: true,
    canDispatchTransfer: true,
    canReceiveTransfer: true,
    canCancelTransfer: true,
    canManageVendors: true,
    canRunSimulator: true,
    canViewAuditLog: true,
    dataScope: {
      depotFilter: null,
      vendorFilter: null,
      hideInternalData: false
    },
    features: {
      costBenefitRationale: true,
      whatIfSimulator: true,
      fullNetworkControl: true
    }
  },

  [ROLES.DEPOT_MANAGER]: {
    label: 'Depot Manager',
    defaultTab: 'INVENTORY',
    allowedTabs: ['INVENTORY'],
    defaultMode: 'simple',
    canStageTransfer: false,
    canApproveTransfer: true, // can approve outgoing staged transfers from own depot
    canDispatchTransfer: false,
    canReceiveTransfer: true, // can confirm receipt for inbound shipments to own depot
    canCancelTransfer: true,
    canManageVendors: false,
    canRunSimulator: false,
    canViewAuditLog: false,
    dataScope: {
      scopedToUserDepot: true, // filtered to user's assigned depot
      vendorFilter: null,
      hideInternalData: false
    },
    features: {
      depotSpecificView: true,
      dockIntakeAction: true,
      outgoingTransferApproval: true
    }
  },

  [ROLES.PROCUREMENT_MANAGER]: {
    label: 'Procurement & Vendor Manager',
    defaultTab: 'VENDORS',
    allowedTabs: ['VENDORS', 'PO_QUEUE', 'INVENTORY'],
    defaultMode: 'detailed',
    canStageTransfer: false,
    canApproveTransfer: false,
    canDispatchTransfer: false,
    canReceiveTransfer: false,
    canCancelTransfer: false,
    canManageVendors: true,
    canRunSimulator: false,
    canViewAuditLog: true,
    dataScope: {
      depotFilter: null,
      vendorFilter: null,
      hideInternalData: false
    },
    features: {
      poQueueWithGst: true,
      slaBreachNotices: true,
      vendorCorrectiveAction: true,
      penaltyCalculations: true
    }
  },

  [ROLES.FLEET_MANAGER]: {
    label: 'Logistics / Fleet Manager',
    defaultTab: 'FLEET',
    allowedTabs: ['FLEET', 'INVENTORY'],
    defaultMode: 'detailed',
    canStageTransfer: false,
    canApproveTransfer: false,
    canDispatchTransfer: true,
    canReceiveTransfer: false,
    canCancelTransfer: true,
    canManageVendors: false,
    canRunSimulator: false,
    canViewAuditLog: true,
    dataScope: {
      depotFilter: null,
      vendorFilter: null,
      hideInternalData: false
    },
    features: {
      freightFlowManagement: true,
      vehicleAssignment: true,
      ewayBillGeneration: true,
      indiaRouteMap: true
    }
  },

  [ROLES.VENDOR_PORTAL]: {
    label: 'Vendor Partner',
    defaultTab: 'VENDOR_PORTAL',
    allowedTabs: ['VENDOR_PORTAL'],
    defaultMode: 'simple',
    canStageTransfer: false,
    canApproveTransfer: false,
    canDispatchTransfer: false,
    canReceiveTransfer: false,
    canCancelTransfer: false,
    canManageVendors: false,
    canRunSimulator: false,
    canViewAuditLog: false,
    dataScope: {
      scopedToUserVendor: true, // strictly their own vendor scorecard and deliveries
      depotFilter: null,
      hideInternalData: true // hides internal depot stock, internal company financials
    },
    features: {
      vendorScorecardOnly: true,
      dispatchConfirmation: true,
      disputeLateFlag: true
    }
  },

  [ROLES.ADMIN]: {
    label: 'System Administrator',
    defaultTab: 'ADMIN',
    allowedTabs: ['ADMIN', 'INVENTORY', 'VENDORS', 'FLEET'],
    defaultMode: 'detailed',
    canStageTransfer: true,
    canApproveTransfer: true,
    canDispatchTransfer: true,
    canReceiveTransfer: true,
    canCancelTransfer: true,
    canManageVendors: true,
    canRunSimulator: true,
    canViewAuditLog: true,
    dataScope: {
      depotFilter: null,
      vendorFilter: null,
      hideInternalData: false
    },
    features: {
      systemMatrix: true,
      auditLogViewer: true,
      demoReset: true,
      userManagement: true
    }
  }
};

export function getPermissionsForUser(user) {
  if (!user || !user.role) {
    return ROLE_PERMISSIONS[ROLES.EXECUTIVE];
  }
  return ROLE_PERMISSIONS[user.role] || ROLE_PERMISSIONS[ROLES.EXECUTIVE];
}

export function isTabAllowed(user, tabKey) {
  const perm = getPermissionsForUser(user);
  return perm.allowedTabs.includes(tabKey);
}

