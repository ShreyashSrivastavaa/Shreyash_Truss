/**
 * Inventory Analytics Domain Calculations
 *
 * Provides authoritative aggregations and metrics for:
 * - Network-wide physical on-hand, reserved, in-transit, and net available inventory.
 * - Depot-wise surplus and deficit against target stock with status classification.
 * - SKU-wise inventory distribution, depot shares, and financial valuation.
 *
 * Adheres strictly to the multi-depot invariant:
 * - Physical on-hand stock is strictly counted in depots.
 * - Pending transfers are reserved, NOT double-counted as physical inventory.
 * - In-transit stock represents dispatched freight currently en route.
 * - Network physical inventory is conserved: totalOnHand + totalInTransit.
 */

/**
 * Aggregates network-wide inventory totals and position health status.
 * Prioritizes authoritative backend summary figures when available,
 * falling back gracefully to direct inventory array aggregation.
 *
 * @param {Object} [summary] - Summary object from /api/inventory
 * @param {Array} [inventory] - Enriched inventory array from /api/inventory
 * @returns {Object} Network totals, stock breakdowns, and position counts
 */
export function calculateNetworkTotals(summary = {}, inventory = []) {
  const safeInventory = Array.isArray(inventory) ? inventory : [];
  const safeSummary = summary && typeof summary === 'object' ? summary : {};

  // Authoritative physical on-hand stock
  const totalOnHand = typeof safeSummary.totalOnHandUnits === 'number'
    ? safeSummary.totalOnHandUnits
    : safeInventory.reduce((sum, item) => sum + (typeof item?.onHand === 'number' ? Math.max(0, item.onHand) : 0), 0);

  // Authoritative reserved stock (pending transfer commitments)
  const totalReserved = typeof safeSummary.reservedUnits === 'number'
    ? safeSummary.reservedUnits
    : safeInventory.reduce((sum, item) => sum + (typeof item?.reserved === 'number' ? Math.max(0, item.reserved) : 0), 0);

  // Authoritative in-transit stock (dispatched freight on the road)
  const totalInTransit = typeof safeSummary.inTransitUnits === 'number'
    ? safeSummary.inTransitUnits
    : safeInventory.reduce((sum, item) => sum + (typeof item?.inTransit === 'number' ? Math.max(0, item.inTransit) : 0), 0);

  // Net available physical stock (on-hand unencumbered by reservations)
  const totalNetAvailable = Math.max(0, totalOnHand - totalReserved);

  // Total physical inventory across the entire supply chain network (depots + road)
  const totalPhysicalNetworkStock = totalOnHand + totalInTransit;

  // Position status counts (DEFICIT, SURPLUS, BALANCED)
  const deficitsCount = typeof safeSummary.deficitsCount === 'number'
    ? safeSummary.deficitsCount
    : safeInventory.filter(item => item?.status === 'DEFICIT').length;

  const surplusesCount = typeof safeSummary.surplusesCount === 'number'
    ? safeSummary.surplusesCount
    : safeInventory.filter(item => item?.status === 'SURPLUS').length;

  const balancedCount = typeof safeSummary.balancedCount === 'number'
    ? safeSummary.balancedCount
    : safeInventory.filter(item => item?.status === 'BALANCED').length;

  const totalTrackedItems = typeof safeSummary.totalTrackedItems === 'number'
    ? safeSummary.totalTrackedItems
    : safeInventory.length;

  const totalDepots = typeof safeSummary.totalDepots === 'number'
    ? safeSummary.totalDepots
    : new Set(safeInventory.map(item => item?.depotId).filter(Boolean)).size;

  const totalSkus = typeof safeSummary.totalSkus === 'number'
    ? safeSummary.totalSkus
    : new Set(safeInventory.map(item => item?.skuId).filter(Boolean)).size;

  return {
    totalOnHand,
    totalReserved,
    totalInTransit,
    totalNetAvailable,
    totalPhysicalNetworkStock,
    deficitsCount,
    surplusesCount,
    balancedCount,
    totalTrackedItems,
    totalDepots,
    totalSkus
  };
}

/**
 * Calculates depot-wise surplus and deficit against target stock.
 * Categorizes overall depot operational status according to business rules:
 * - MIXED: Depot holds both deficit and surplus positions across SKUs.
 * - DEFICIT: Depot holds at least one deficit position and zero surplus positions.
 * - SURPLUS: Depot holds at least one surplus position and zero deficit positions.
 * - BALANCED: All SKU positions at this depot are balanced within operating buffers.
 *
 * @param {Array} depots - Depot records from /api/inventory
 * @param {Array} inventory - Enriched inventory records from /api/inventory
 * @returns {Array} Array of enriched depot analytics objects
 */
export function calculateDepotAnalytics(depots = [], inventory = []) {
  if (!Array.isArray(depots) || depots.length === 0) return [];
  const safeInventory = Array.isArray(inventory) ? inventory : [];

  return depots.map(depot => {
    const depotItems = safeInventory.filter(item => item?.depotId === depot.id);

    const onHand = depotItems.reduce((sum, item) => sum + (typeof item?.onHand === 'number' ? Math.max(0, item.onHand) : 0), 0);
    const reserved = depotItems.reduce((sum, item) => sum + (typeof item?.reserved === 'number' ? Math.max(0, item.reserved) : 0), 0);
    const inTransit = depotItems.reduce((sum, item) => sum + (typeof item?.inTransit === 'number' ? Math.max(0, item.inTransit) : 0), 0);
    const netAvailable = Math.max(0, onHand - reserved);

    const targetStock = depotItems.reduce((sum, item) => sum + (typeof item?.targetStock === 'number' ? Math.max(0, item.targetStock) : 0), 0);
    const safetyStock = depotItems.reduce((sum, item) => sum + (typeof item?.safetyStock === 'number' ? Math.max(0, item.safetyStock) : 0), 0);

    // Surplus above target: sum of item.surplusAboveTarget
    const surplusAboveTarget = depotItems.reduce((sum, item) => {
      if (typeof item?.surplusAboveTarget === 'number') {
        return sum + item.surplusAboveTarget;
      }
      const itemOnHand = typeof item?.onHand === 'number' ? item.onHand : 0;
      const itemReserved = typeof item?.reserved === 'number' ? item.reserved : 0;
      const itemTarget = typeof item?.targetStock === 'number' ? item.targetStock : 0;
      return sum + Math.max(0, itemOnHand - itemReserved - itemTarget);
    }, 0);

    // Deficit to target: sum of item.deficitToTarget
    const deficitToTarget = depotItems.reduce((sum, item) => {
      if (typeof item?.deficitToTarget === 'number') {
        return sum + item.deficitToTarget;
      }
      const itemOnHand = typeof item?.onHand === 'number' ? item.onHand : 0;
      const itemTarget = typeof item?.targetStock === 'number' ? item.targetStock : 0;
      return sum + Math.max(0, itemTarget - itemOnHand);
    }, 0);

    // Deficit to safety stock: sum of item.deficitToSafety
    const deficitToSafety = depotItems.reduce((sum, item) => {
      if (typeof item?.deficitToSafety === 'number') {
        return sum + item.deficitToSafety;
      }
      const itemOnHand = typeof item?.onHand === 'number' ? item.onHand : 0;
      const itemSafety = typeof item?.safetyStock === 'number' ? item.safetyStock : 0;
      return sum + Math.max(0, itemSafety - itemOnHand);
    }, 0);

    // Position breakdown
    const deficitsCount = depotItems.filter(item => item?.status === 'DEFICIT').length;
    const surplusesCount = depotItems.filter(item => item?.status === 'SURPLUS').length;
    const balancedCount = depotItems.filter(item => item?.status === 'BALANCED').length;
    const totalPositions = depotItems.length;

    // Operational classification strictly adhering to business rules
    let status = 'BALANCED';
    if (deficitsCount > 0 && surplusesCount > 0) {
      status = 'MIXED';
    } else if (deficitsCount > 0) {
      status = 'DEFICIT';
    } else if (surplusesCount > 0) {
      status = 'SURPLUS';
    }

    const targetVariance = onHand - targetStock;
    const percentOfTarget = targetStock > 0 ? Math.round((onHand / targetStock) * 100) : 0;

    return {
      depotId: depot.id,
      depotName: depot.name || depot.id,
      city: depot.city || '',
      region: depot.region || '',
      onHand,
      reserved,
      inTransit,
      netAvailable,
      targetStock,
      safetyStock,
      surplusAboveTarget,
      deficitToTarget,
      deficitToSafety,
      targetVariance,
      percentOfTarget,
      deficitsCount,
      surplusesCount,
      balancedCount,
      totalPositions,
      status,
      items: depotItems
    };
  });
}

/**
 * Calculates SKU-wise inventory distribution across depots,
 * including total network stock, financial inventory valuation,
 * and percentage shares per regional depot.
 *
 * @param {Array} skus - SKU records from /api/inventory
 * @param {Array} inventory - Enriched inventory records from /api/inventory
 * @returns {Array} Array of enriched SKU distribution analytics objects
 */
export function calculateSkuDistribution(skus = [], inventory = []) {
  if (!Array.isArray(skus) || skus.length === 0) return [];
  const safeInventory = Array.isArray(inventory) ? inventory : [];

  return skus.map(sku => {
    const skuItems = safeInventory.filter(item => item?.skuId === sku.id);

    const totalOnHand = skuItems.reduce((sum, item) => sum + (typeof item?.onHand === 'number' ? Math.max(0, item.onHand) : 0), 0);
    const totalReserved = skuItems.reduce((sum, item) => sum + (typeof item?.reserved === 'number' ? Math.max(0, item.reserved) : 0), 0);
    const totalInTransit = skuItems.reduce((sum, item) => sum + (typeof item?.inTransit === 'number' ? Math.max(0, item.inTransit) : 0), 0);
    const totalNetAvailable = Math.max(0, totalOnHand - totalReserved);

    const totalTargetStock = skuItems.reduce((sum, item) => sum + (typeof item?.targetStock === 'number' ? Math.max(0, item.targetStock) : 0), 0);
    const totalSafetyStock = skuItems.reduce((sum, item) => sum + (typeof item?.safetyStock === 'number' ? Math.max(0, item.safetyStock) : 0), 0);

    const unitCost = typeof sku.unitCost === 'number' ? sku.unitCost : 0;
    const totalValuation = totalOnHand * unitCost;

    const surplusAboveTarget = skuItems.reduce((sum, item) => {
      if (typeof item?.surplusAboveTarget === 'number') return sum + item.surplusAboveTarget;
      const onHand = typeof item?.onHand === 'number' ? item.onHand : 0;
      const res = typeof item?.reserved === 'number' ? item.reserved : 0;
      const tgt = typeof item?.targetStock === 'number' ? item.targetStock : 0;
      return sum + Math.max(0, onHand - res - tgt);
    }, 0);

    const deficitToTarget = skuItems.reduce((sum, item) => {
      if (typeof item?.deficitToTarget === 'number') return sum + item.deficitToTarget;
      const onHand = typeof item?.onHand === 'number' ? item.onHand : 0;
      const tgt = typeof item?.targetStock === 'number' ? item.targetStock : 0;
      return sum + Math.max(0, tgt - onHand);
    }, 0);

    const deficitsCount = skuItems.filter(item => item?.status === 'DEFICIT').length;
    const surplusesCount = skuItems.filter(item => item?.status === 'SURPLUS').length;
    const balancedCount = skuItems.filter(item => item?.status === 'BALANCED').length;
    const totalPositions = skuItems.length;

    // Distribution breakdown per depot
    const depotBreakdown = skuItems.map(item => {
      const itemOnHand = typeof item?.onHand === 'number' ? item.onHand : 0;
      const itemReserved = typeof item?.reserved === 'number' ? item.reserved : 0;
      const itemInTransit = typeof item?.inTransit === 'number' ? item.inTransit : 0;
      const itemNetAvailable = Math.max(0, itemOnHand - itemReserved);
      const sharePercent = totalOnHand > 0 ? Math.round((itemOnHand / totalOnHand) * 100) : 0;

      return {
        depotId: item.depotId,
        depotName: item.depotName || item.depotId,
        city: item.depotCity || '',
        region: item.region || '',
        onHand: itemOnHand,
        reserved: itemReserved,
        inTransit: itemInTransit,
        netAvailable: itemNetAvailable,
        safetyStock: item.safetyStock || 0,
        targetStock: item.targetStock || 0,
        status: item.status || 'BALANCED',
        surplusAboveTarget: item.surplusAboveTarget || 0,
        deficitToTarget: item.deficitToTarget || 0,
        deficitToSafety: item.deficitToSafety || 0,
        sharePercent
      };
    });

    return {
      skuId: sku.id,
      skuName: sku.name || sku.id,
      unit: sku.unit || 'units',
      unitCost,
      totalOnHand,
      totalReserved,
      totalInTransit,
      totalNetAvailable,
      totalTargetStock,
      totalSafetyStock,
      totalValuation,
      surplusAboveTarget,
      deficitToTarget,
      deficitsCount,
      surplusesCount,
      balancedCount,
      totalPositions,
      depotBreakdown
    };
  });
}
