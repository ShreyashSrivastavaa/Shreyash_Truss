/**
 * Transfer Lane Analytics Domain Calculations
 *
 * Provides authoritative aggregations and metrics for:
 * - Depot-to-depot routing lane volume, units, and SKU distributions.
 * - Completed, in-transit, pending, and cancelled transfer counts and quantities.
 * - Outbound (sent) and inbound (received) throughput per regional depot.
 * - Deterministic filtering by transfer status, SKU, lane, and date range.
 *
 * NOTE on historical data:
 * - Transfers store `createdAt` and `updatedAt`.
 * - Stored records do NOT track separate `dispatchedAt` or `receivedAt` timestamps.
 * - Delivery durations and historical speed trends are not fabricated.
 */

/**
 * Filters transfers deterministically by status, SKU, lane, and creation date.
 *
 * @param {Array} transfers - Array of transfer records from /api/transfers
 * @param {Object} [filters] - Filter criteria
 * @returns {Array} Filtered transfer records
 */
export function filterTransfers(transfers = [], filters = {}) {
  if (!Array.isArray(transfers) || transfers.length === 0) return [];
  const {
    status = 'ALL',
    skuId = 'ALL',
    laneId = 'ALL',
    fromDepotId = 'ALL',
    toDepotId = 'ALL',
    startDate = null,
    endDate = null
  } = filters;

  return transfers.filter(trf => {
    if (!trf) return false;

    // 1. Status Filter
    if (status !== 'ALL' && trf.status !== status) {
      return false;
    }

    // 2. SKU Filter
    if (skuId !== 'ALL' && trf.skuId !== skuId) {
      return false;
    }

    // 3. Lane Filter (composite "fromId->toId")
    if (laneId !== 'ALL') {
      const trfLane = `${trf.fromDepotId}->${trf.toDepotId}`;
      if (trfLane !== laneId) return false;
    }

    // 4. Source Depot Filter
    if (fromDepotId !== 'ALL' && trf.fromDepotId !== fromDepotId) {
      return false;
    }

    // 5. Destination Depot Filter
    if (toDepotId !== 'ALL' && trf.toDepotId !== toDepotId) {
      return false;
    }

    // 6. Creation Date Range Filter (based on stored createdAt timestamp)
    if (startDate || endDate) {
      if (!trf.createdAt) return false;
      const trfDate = new Date(trf.createdAt);
      if (isNaN(trfDate.getTime())) return false;

      if (startDate) {
        const start = new Date(startDate);
        // Start of the given date (00:00:00.000)
        start.setHours(0, 0, 0, 0);
        if (trfDate < start) return false;
      }

      if (endDate) {
        const end = new Date(endDate);
        // End of the given date (23:59:59.999)
        end.setHours(23, 59, 59, 999);
        if (trfDate > end) return false;
      }
    }

    return true;
  });
}

/**
 * Calculates network-level transfer overview metrics across all transfers.
 * Cancelled transfers are excluded from totalUnitsMoved / totalUnits because
 * cancelled transfer orders did not physically move inventory. Cancelled counts
 * and units remain accessible via cancelledTransfers and cancelledUnits.
 *
 * @param {Array} transfers - Array of transfer records
 * @returns {Object} Network transfer counts and unit quantities
 */
export function calculateTransferOverview(transfers = []) {
  const safeTransfers = Array.isArray(transfers) ? transfers : [];

  const totalTransfers = safeTransfers.length;

  let completedTransfers = 0;
  let completedUnits = 0;
  let inTransitTransfers = 0;
  let inTransitUnits = 0;
  let pendingTransfers = 0;
  let pendingUnits = 0;
  let cancelledTransfers = 0;
  let cancelledUnits = 0;

  const lanesSet = new Set();

  for (const t of safeTransfers) {
    if (!t) continue;
    const qty = typeof t.quantity === 'number' ? Math.max(0, t.quantity) : 0;
    if (t.fromDepotId && t.toDepotId) {
      lanesSet.add(`${t.fromDepotId}->${t.toDepotId}`);
    }

    switch (t.status) {
      case 'RECEIVED':
        completedTransfers += 1;
        completedUnits += qty;
        break;
      case 'IN_TRANSIT':
        inTransitTransfers += 1;
        inTransitUnits += qty;
        break;
      case 'PENDING':
        pendingTransfers += 1;
        pendingUnits += qty;
        break;
      case 'CANCELLED':
        cancelledTransfers += 1;
        cancelledUnits += qty;
        break;
      default:
        break;
    }
  }

  // Moved volume represents physical/active freight (delivered, on road, or staged for dispatch)
  // Cancelled transfers are explicitly excluded
  const totalUnitsMoved = completedUnits + inTransitUnits + pendingUnits;

  return {
    totalTransfers,
    totalUnits: totalUnitsMoved,
    totalUnitsMoved,
    completedTransfers,
    completedUnits,
    inTransitTransfers,
    inTransitUnits,
    pendingTransfers,
    pendingUnits,
    cancelledTransfers,
    cancelledUnits,
    activeLanesCount: lanesSet.size
  };
}

/**
 * Aggregates transfers by depot-to-depot routing lane, calculating transfer counts,
 * unit volumes, lifecycle status breakdowns, and SKU-level distributions per lane.
 * Cancelled orders do not contribute to physical moved volume totals.
 *
 * @param {Array} transfers - Array of transfer records
 * @param {Array} [depots] - Array of depot records for name resolution
 * @param {Array} [skus] - Array of SKU records for name and unit resolution
 * @returns {Array} Array of enriched lane analytics objects, ordered by total units moved descending
 */
export function calculateLaneMetrics(transfers = [], depots = [], skus = []) {
  if (!Array.isArray(transfers) || transfers.length === 0) return [];
  const safeDepots = Array.isArray(depots) ? depots : [];
  const safeSkus = Array.isArray(skus) ? skus : [];

  const depotMap = new Map(safeDepots.map(d => [d.id, d]));
  const skuMap = new Map(safeSkus.map(s => [s.id, s]));

  // Group by lane composite key: "fromDepotId->toDepotId"
  const laneMap = new Map();

  for (const t of transfers) {
    if (!t?.fromDepotId || !t?.toDepotId) continue;
    const laneKey = `${t.fromDepotId}->${t.toDepotId}`;

    if (!laneMap.has(laneKey)) {
      const fromDepot = depotMap.get(t.fromDepotId);
      const toDepot = depotMap.get(t.toDepotId);

      laneMap.set(laneKey, {
        laneId: laneKey,
        fromDepotId: t.fromDepotId,
        fromDepotName: fromDepot?.name || t.fromDepotId,
        fromDepotCity: fromDepot?.city || '',
        fromDepotRegion: fromDepot?.region || '',
        toDepotId: t.toDepotId,
        toDepotName: toDepot?.name || t.toDepotId,
        toDepotCity: toDepot?.city || '',
        toDepotRegion: toDepot?.region || '',
        totalTransfers: 0,
        totalUnits: 0,
        completedTransfers: 0,
        completedUnits: 0,
        inTransitTransfers: 0,
        inTransitUnits: 0,
        pendingTransfers: 0,
        pendingUnits: 0,
        cancelledTransfers: 0,
        cancelledUnits: 0,
        skuGroups: new Map()
      });
    }

    const lane = laneMap.get(laneKey);
    const qty = typeof t.quantity === 'number' ? Math.max(0, t.quantity) : 0;

    lane.totalTransfers += 1;
    // Exclude cancelled transfers from physically moved volume
    if (t.status !== 'CANCELLED') {
      lane.totalUnits += qty;
    }

    switch (t.status) {
      case 'RECEIVED':
        lane.completedTransfers += 1;
        lane.completedUnits += qty;
        break;
      case 'IN_TRANSIT':
        lane.inTransitTransfers += 1;
        lane.inTransitUnits += qty;
        break;
      case 'PENDING':
        lane.pendingTransfers += 1;
        lane.pendingUnits += qty;
        break;
      case 'CANCELLED':
        lane.cancelledTransfers += 1;
        lane.cancelledUnits += qty;
        break;
      default:
        break;
    }

    // SKU-level grouping within this lane
    const skuId = t.skuId || 'UNKNOWN';
    if (!lane.skuGroups.has(skuId)) {
      const sku = skuMap.get(skuId);
      lane.skuGroups.set(skuId, {
        skuId,
        skuName: sku?.name || skuId,
        unit: sku?.unit || 'units',
        unitCost: sku?.unitCost || 0,
        totalTransfers: 0,
        totalUnits: 0,
        completedUnits: 0,
        inTransitUnits: 0,
        pendingUnits: 0,
        cancelledUnits: 0
      });
    }

    const skuSummary = lane.skuGroups.get(skuId);
    skuSummary.totalTransfers += 1;
    if (t.status !== 'CANCELLED') {
      skuSummary.totalUnits += qty;
    }

    if (t.status === 'RECEIVED') skuSummary.completedUnits += qty;
    if (t.status === 'IN_TRANSIT') skuSummary.inTransitUnits += qty;
    if (t.status === 'PENDING') skuSummary.pendingUnits += qty;
    if (t.status === 'CANCELLED') skuSummary.cancelledUnits += qty;
  }

  // Calculate total units moved across all lanes for proportional share calculation
  const networkLaneUnits = Array.from(laneMap.values()).reduce((sum, l) => sum + l.totalUnits, 0);

  return Array.from(laneMap.values())
    .map(lane => {
      const skuBreakdown = Array.from(lane.skuGroups.values()).sort((a, b) => b.totalUnits - a.totalUnits);
      const laneSharePercent = networkLaneUnits > 0 ? Math.round((lane.totalUnits / networkLaneUnits) * 100) : 0;

      return {
        ...lane,
        skuBreakdown,
        laneSharePercent
      };
    })
    .sort((a, b) => b.totalUnits - a.totalUnits);
}

/**
 * Calculates units sent (outbound) and received (inbound) per depot,
 * determining the net inventory rebalancing flow and donor/recipient role.
 * Cancelled transfers are excluded from sent and received totals.
 *
 * @param {Array} transfers - Array of transfer records
 * @param {Array} depots - Array of depot records
 * @returns {Array} Array of depot throughput metrics
 */
export function calculateDepotThroughput(transfers = [], depots = []) {
  if (!Array.isArray(depots) || depots.length === 0) return [];
  const safeTransfers = Array.isArray(transfers) ? transfers : [];

  return depots.map(depot => {
    let unitsSent = 0;
    let outboundTransfers = 0;
    let sentCompletedUnits = 0;
    let sentInTransitUnits = 0;
    let sentPendingUnits = 0;
    let sentCancelledUnits = 0;

    let unitsReceived = 0;
    let inboundTransfers = 0;
    let receivedCompletedUnits = 0;
    let receivedInTransitUnits = 0;
    let receivedPendingUnits = 0;
    let receivedCancelledUnits = 0;

    const partnerDepotsOut = new Set();
    const partnerDepotsIn = new Set();

    for (const t of safeTransfers) {
      if (!t) continue;
      const qty = typeof t.quantity === 'number' ? Math.max(0, t.quantity) : 0;

      // Outbound (Depot is donor/source)
      if (t.fromDepotId === depot.id) {
        outboundTransfers += 1;
        if (t.toDepotId) partnerDepotsOut.add(t.toDepotId);

        if (t.status === 'RECEIVED') {
          sentCompletedUnits += qty;
          unitsSent += qty;
        } else if (t.status === 'IN_TRANSIT') {
          sentInTransitUnits += qty;
          unitsSent += qty;
        } else if (t.status === 'PENDING') {
          sentPendingUnits += qty;
          unitsSent += qty;
        } else if (t.status === 'CANCELLED') {
          sentCancelledUnits += qty;
        }
      }

      // Inbound (Depot is recipient/destination)
      if (t.toDepotId === depot.id) {
        inboundTransfers += 1;
        if (t.fromDepotId) partnerDepotsIn.add(t.fromDepotId);

        if (t.status === 'RECEIVED') {
          receivedCompletedUnits += qty;
          unitsReceived += qty;
        } else if (t.status === 'IN_TRANSIT') {
          receivedInTransitUnits += qty;
          unitsReceived += qty;
        } else if (t.status === 'PENDING') {
          receivedPendingUnits += qty;
          unitsReceived += qty;
        } else if (t.status === 'CANCELLED') {
          receivedCancelledUnits += qty;
        }
      }
    }

    // Net units physically moved / committed into this depot:
    // positive = net recipient (inflow > outflow), negative = net donor (outflow > inflow)
    const activeOutflow = sentCompletedUnits + sentInTransitUnits + sentPendingUnits;
    const activeInflow = receivedCompletedUnits + receivedInTransitUnits + receivedPendingUnits;
    const netFlow = activeInflow - activeOutflow;

    let role = 'BALANCED_FLOW';
    if (netFlow < 0) {
      role = 'NET_DONOR';
    } else if (netFlow > 0) {
      role = 'NET_RECIPIENT';
    }

    return {
      depotId: depot.id,
      depotName: depot.name || depot.id,
      city: depot.city || '',
      region: depot.region || '',
      unitsSent,
      outboundTransfers,
      sentCompletedUnits,
      sentInTransitUnits,
      sentPendingUnits,
      sentCancelledUnits,
      unitsReceived,
      inboundTransfers,
      receivedCompletedUnits,
      receivedInTransitUnits,
      receivedPendingUnits,
      receivedCancelledUnits,
      activeOutflow,
      activeInflow,
      netFlow,
      role,
      outboundPartnersCount: partnerDepotsOut.size,
      inboundPartnersCount: partnerDepotsIn.size
    };
  });
}
