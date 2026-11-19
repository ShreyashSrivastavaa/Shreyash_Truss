import prisma from '../db.js';
import { seed } from '../../prisma/seed.js';

/**
 * Resets state back to initial synthetic values by re-seeding PostgreSQL.
 */
export async function resetState(client = prisma) {
  await seed(client);
}

/**
 * Retrieve all registered depots
 */
export async function getDepots(client = prisma) {
  return await client.depot.findMany({ orderBy: { id: 'asc' } });
}

/**
 * Retrieve all registered SKUs
 */
export async function getSkus(client = prisma) {
  return await client.sku.findMany({ orderBy: { id: 'asc' } });
}

/**
 * Retrieve enriched inventory items with calculated supply health status and custody dimensions
 */
export async function getInventoryStatus(client = prisma) {
  const records = await client.inventoryLevel.findMany({
    include: {
      depot: true,
      sku: true
    },
    orderBy: [{ depotId: 'asc' }, { skuId: 'asc' }]
  });

  return records.map(item => {
    const reserved = item.reserved ?? 0;
    const inTransit = item.inTransit ?? 0;
    const netAvailable = item.onHand - reserved;

    let status = 'BALANCED';
    if (item.onHand < item.safetyStock) {
      status = 'DEFICIT';
    } else if (item.onHand > item.targetStock) {
      status = 'SURPLUS';
    }

    const availableSurplus = Math.max(0, item.onHand - reserved - item.targetStock);
    const surplusAboveTarget = Math.max(0, item.onHand - reserved - item.targetStock);
    const surplusAboveSafety = Math.max(0, item.onHand - reserved - item.safetyStock);
    const deficitToSafety = Math.max(0, item.safetyStock - item.onHand);
    const deficitToTarget = Math.max(0, item.targetStock - item.onHand);

    return {
      depotId: item.depotId,
      depotName: item.depot ? item.depot.name : item.depotId,
      depotCity: item.depot ? item.depot.city : '',
      region: item.depot ? item.depot.region : '',
      skuId: item.skuId,
      skuName: item.sku ? item.sku.name : item.skuId,
      unit: item.sku ? item.sku.unit : 'units',
      unitCost: item.sku ? item.sku.unitCost : 0,
      onHand: item.onHand,
      reserved,
      inTransit,
      netAvailable,
      safetyStock: item.safetyStock,
      targetStock: item.targetStock,
      status,
      availableSurplus,
      surplusAboveTarget,
      surplusAboveSafety,
      deficitToSafety,
      deficitToTarget
    };
  });
}

/**
 * Identify viable lateral transfer opportunities across depots.
 * Accounts for pending inbound and in-transit stock to eliminate duplicate recommendations.
 * Strictly uses donor surplus above targetStock.
 */
export async function getTransferOpportunities(customItems = null, client = prisma) {
  const enriched = customItems || (await getInventoryStatus(client));
  const opportunities = [];

  // Track pending inbound quantities if customItems is not provided
  const pendingInboundMap = new Map();
  if (!customItems) {
    const pendingTransfers = await client.transfer.findMany({
      where: { status: 'PENDING' },
      select: { toDepotId: true, skuId: true, quantity: true }
    });
    for (const pt of pendingTransfers) {
      const key = `${pt.toDepotId}-${pt.skuId}`;
      pendingInboundMap.set(key, (pendingInboundMap.get(key) || 0) + pt.quantity);
    }
  }

  const skuIds = [...new Set(enriched.map(item => item.skuId))];

  for (const skuId of skuIds) {
    const skuItems = enriched.filter(item => item.skuId === skuId);
    const deficitItems = skuItems.filter(item => item.status === 'DEFICIT');
    const surplusItems = skuItems.filter(item => item.status === 'SURPLUS');

    // Track available surplus above target per donor for this SKU (subtracting reserved)
    const donorAvailableSurplus = new Map();
    for (const surplus of surplusItems) {
      const reserved = surplus.reserved ?? 0;
      const surplusAboveTarget = Math.max(0, surplus.onHand - reserved - surplus.targetStock);
      donorAvailableSurplus.set(surplus.depotId, surplusAboveTarget);
    }

    for (const deficit of deficitItems) {
      const destKey = `${deficit.depotId}-${skuId}`;
      const pendingInbound = pendingInboundMap.get(destKey) || deficit.pendingInbound || 0;
      const inTransit = deficit.inTransit || 0;

      // Net shortage deducts inbound pipeline (inTransit + pendingInbound) to prevent duplicate recommendations
      let remainingShortage = Math.max(0, deficit.targetStock - (deficit.onHand + inTransit + pendingInbound));
      if (remainingShortage <= 0) continue;

      for (const surplus of surplusItems) {
        if (remainingShortage <= 0) break;

        const donorSurplus = donorAvailableSurplus.get(surplus.depotId) || 0;
        if (donorSurplus <= 0) continue;

        // Source can safely donate up to surplus above target
        const reserved = surplus.reserved ?? 0;
        const maxTransferable = Math.max(0, surplus.onHand - reserved - surplus.targetStock);
        if (maxTransferable <= 0) continue;

        const recommendedQuantity = Math.min(remainingShortage, donorSurplus);
        if (recommendedQuantity <= 0) continue;

        opportunities.push({
          skuId,
          skuName: deficit.skuName,
          fromDepotId: surplus.depotId,
          fromDepotName: surplus.depotName,
          toDepotId: deficit.depotId,
          toDepotName: deficit.depotName,
          donorOnHand: surplus.onHand,
          donorReserved: reserved,
          donorSafetyStock: surplus.safetyStock,
          donorTargetStock: surplus.targetStock,
          recipientOnHand: deficit.onHand,
          recipientInTransit: inTransit,
          recipientPendingInbound: pendingInbound,
          recipientSafetyStock: deficit.safetyStock,
          recipientTargetStock: deficit.targetStock,
          recommendedQuantity,
          maxTransferable,
          urgency: deficit.onHand < deficit.safetyStock ? 'HIGH' : 'MEDIUM'
        });

        remainingShortage -= recommendedQuantity;
        donorAvailableSurplus.set(surplus.depotId, donorSurplus - recommendedQuantity);
      }
    }
  }

  return opportunities;
}

/**
 * Creates a transfer in PENDING status, atomically reserving source inventory.
 * Validates donor target-stock protection and recipient capacity (accounting for in-transit & pending inbound).
 */
export async function createTransfer({ skuId, fromDepotId, toDepotId, quantity }, client = prisma) {
  if (fromDepotId === toDepotId) {
    const err = new Error('Source and destination depots must be different');
    err.statusCode = 400;
    throw err;
  }

  if (quantity <= 0 || !Number.isInteger(quantity)) {
    const err = new Error('Transfer quantity must be a positive integer');
    err.statusCode = 400;
    throw err;
  }

  return await client.$transaction(async (tx) => {
    // 1. Lock both inventory rows with row-level locks (FOR UPDATE) in deterministic order
    const lockedRows = await tx.$queryRaw`
      SELECT id, "depotId", "skuId", "onHand", reserved, "inTransit", "safetyStock", "targetStock"
      FROM "InventoryLevel"
      WHERE ("depotId" = ${fromDepotId} AND "skuId" = ${skuId})
         OR ("depotId" = ${toDepotId} AND "skuId" = ${skuId})
      ORDER BY "depotId" ASC, "skuId" ASC
      FOR UPDATE
    `;

    const sourceRow = lockedRows.find(r => r.depotId === fromDepotId && r.skuId === skuId);
    if (!sourceRow) {
      const err = new Error(`Source inventory record not found for depot ${fromDepotId} and SKU ${skuId}`);
      err.statusCode = 404;
      throw err;
    }

    const destRow = lockedRows.find(r => r.depotId === toDepotId && r.skuId === skuId);
    if (!destRow) {
      const err = new Error(`Destination inventory record not found for depot ${toDepotId} and SKU ${skuId}`);
      err.statusCode = 404;
      throw err;
    }

    // Business Rule 1: Donor target-stock preservation (onHand - reserved - quantity >= targetStock)
    const donorAvailableSurplus = Math.max(0, sourceRow.onHand - sourceRow.reserved - sourceRow.targetStock);
    if (quantity > donorAvailableSurplus) {
      const err = new Error(
        `Transfer rejected: transferring ${quantity} units would reduce source depot '${fromDepotId}' below its target stock threshold (${sourceRow.targetStock}). Maximum safe transfer is ${donorAvailableSurplus} units.`
      );
      err.statusCode = 400;
      throw err;
    }

    // Business Rule 2: Recipient capacity must account for onHand + inTransit + all outstanding PENDING inbound + quantity
    const pendingTransfers = await tx.transfer.findMany({
      where: {
        toDepotId,
        skuId,
        status: 'PENDING'
      },
      select: { quantity: true }
    });
    const pendingInbound = pendingTransfers.reduce((sum, t) => sum + t.quantity, 0);

    const totalIncomingAndPresent = destRow.onHand + destRow.inTransit + pendingInbound;
    const resultingDestStock = totalIncomingAndPresent + quantity;
    if (resultingDestStock > destRow.targetStock) {
      const remainingCapacity = Math.max(0, destRow.targetStock - totalIncomingAndPresent);
      const err = new Error(
        `Transfer rejected: transferring ${quantity} units would exceed destination depot '${toDepotId}' target stock threshold (${destRow.targetStock}). Maximum allowable transfer is ${remainingCapacity} units.`
      );
      err.statusCode = 400;
      throw err;
    }

    // 2. Reserve source inventory (onHand does NOT change at creation)
    const updatedSource = await tx.inventoryLevel.update({
      where: { id: sourceRow.id },
      data: { reserved: sourceRow.reserved + quantity }
    });

    // 3. Create transfer in PENDING status
    const transferId = `TRF-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const transferRecord = await tx.transfer.create({
      data: {
        id: transferId,
        skuId,
        fromDepotId,
        toDepotId,
        quantity,
        status: 'PENDING'
      }
    });

    return {
      transfer: {
        ...transferRecord,
        createdAt: transferRecord.createdAt.toISOString()
      },
      updatedSource,
      updatedDestination: destRow
    };
  });
}

// Backwards-compatible alias for executeTransfer
export const executeTransfer = createTransfer;

/**
 * Dispatches a PENDING transfer.
 * Decrements source onHand and reserved, increments destination inTransit, sets status to IN_TRANSIT.
 */
export async function dispatchTransfer(transferId, client = prisma) {
  if (!transferId) {
    const err = new Error('transferId is required');
    err.statusCode = 400;
    throw err;
  }

  return await client.$transaction(async (tx) => {
    const transferRows = await tx.$queryRaw`
      SELECT id, "skuId", "fromDepotId", "toDepotId", quantity, status
      FROM "Transfer"
      WHERE id = ${transferId}
      FOR UPDATE
    `;
    const transferRecord = transferRows[0];
    if (!transferRecord) {
      const err = new Error(`Transfer '${transferId}' not found`);
      err.statusCode = 404;
      throw err;
    }

    if (transferRecord.status !== 'PENDING') {
      const err = new Error(`Cannot dispatch transfer '${transferId}' with status '${transferRecord.status}'. Only PENDING transfers can be dispatched.`);
      err.statusCode = 409;
      throw err;
    }

    const lockedRows = await tx.$queryRaw`
      SELECT id, "depotId", "skuId", "onHand", reserved, "inTransit", "safetyStock", "targetStock"
      FROM "InventoryLevel"
      WHERE ("depotId" = ${transferRecord.fromDepotId} AND "skuId" = ${transferRecord.skuId})
         OR ("depotId" = ${transferRecord.toDepotId} AND "skuId" = ${transferRecord.skuId})
      ORDER BY "depotId" ASC, "skuId" ASC
      FOR UPDATE
    `;

    const sourceRow = lockedRows.find(r => r.depotId === transferRecord.fromDepotId && r.skuId === transferRecord.skuId);
    const destRow = lockedRows.find(r => r.depotId === transferRecord.toDepotId && r.skuId === transferRecord.skuId);

    if (!sourceRow || !destRow) {
      const err = new Error('Inventory records for transfer routing lane not found');
      err.statusCode = 404;
      throw err;
    }

    const updatedSource = await tx.inventoryLevel.update({
      where: { id: sourceRow.id },
      data: {
        onHand: sourceRow.onHand - transferRecord.quantity,
        reserved: Math.max(0, sourceRow.reserved - transferRecord.quantity)
      }
    });

    const updatedDestination = await tx.inventoryLevel.update({
      where: { id: destRow.id },
      data: {
        inTransit: destRow.inTransit + transferRecord.quantity
      }
    });

    const updatedTransfer = await tx.transfer.update({
      where: { id: transferRecord.id },
      data: { status: 'IN_TRANSIT' }
    });

    return {
      transfer: {
        ...updatedTransfer,
        createdAt: updatedTransfer.createdAt.toISOString()
      },
      updatedSource,
      updatedDestination
    };
  });
}

/**
 * Receives an IN_TRANSIT transfer at the destination depot.
 * Decrements destination inTransit, increments destination onHand, sets status to RECEIVED.
 */
export async function receiveTransfer(transferId, client = prisma) {
  if (!transferId) {
    const err = new Error('transferId is required');
    err.statusCode = 400;
    throw err;
  }

  return await client.$transaction(async (tx) => {
    const transferRows = await tx.$queryRaw`
      SELECT id, "skuId", "fromDepotId", "toDepotId", quantity, status
      FROM "Transfer"
      WHERE id = ${transferId}
      FOR UPDATE
    `;
    const transferRecord = transferRows[0];
    if (!transferRecord) {
      const err = new Error(`Transfer '${transferId}' not found`);
      err.statusCode = 404;
      throw err;
    }

    if (transferRecord.status !== 'IN_TRANSIT') {
      const err = new Error(`Cannot receive transfer '${transferId}' with status '${transferRecord.status}'. Only IN_TRANSIT transfers can be received.`);
      err.statusCode = 409;
      throw err;
    }

    const lockedRows = await tx.$queryRaw`
      SELECT id, "depotId", "skuId", "onHand", reserved, "inTransit", "safetyStock", "targetStock"
      FROM "InventoryLevel"
      WHERE "depotId" = ${transferRecord.toDepotId} AND "skuId" = ${transferRecord.skuId}
      ORDER BY "depotId" ASC, "skuId" ASC
      FOR UPDATE
    `;
    const destRow = lockedRows[0];

    if (!destRow) {
      const err = new Error(`Destination inventory record not found for depot ${transferRecord.toDepotId} and SKU ${transferRecord.skuId}`);
      err.statusCode = 404;
      throw err;
    }

    const updatedDestination = await tx.inventoryLevel.update({
      where: { id: destRow.id },
      data: {
        inTransit: Math.max(0, destRow.inTransit - transferRecord.quantity),
        onHand: destRow.onHand + transferRecord.quantity
      }
    });

    const updatedTransfer = await tx.transfer.update({
      where: { id: transferRecord.id },
      data: { status: 'RECEIVED' }
    });

    return {
      transfer: {
        ...updatedTransfer,
        createdAt: updatedTransfer.createdAt.toISOString()
      },
      updatedDestination
    };
  });
}

/**
 * Cancels a PENDING transfer and releases the source depot's reserved inventory.
 * Cancellation of IN_TRANSIT shipments is strictly prohibited.
 */
export async function cancelTransfer(transferId, client = prisma) {
  if (!transferId) {
    const err = new Error('transferId is required');
    err.statusCode = 400;
    throw err;
  }

  return await client.$transaction(async (tx) => {
    const transferRows = await tx.$queryRaw`
      SELECT id, "skuId", "fromDepotId", "toDepotId", quantity, status
      FROM "Transfer"
      WHERE id = ${transferId}
      FOR UPDATE
    `;
    const transferRecord = transferRows[0];
    if (!transferRecord) {
      const err = new Error(`Transfer '${transferId}' not found`);
      err.statusCode = 404;
      throw err;
    }

    if (transferRecord.status === 'IN_TRANSIT') {
      const err = new Error('Cannot cancel a transfer that is already in transit. Freight must be received at destination or returned via a new transfer order.');
      err.statusCode = 400;
      throw err;
    }

    if (transferRecord.status !== 'PENDING') {
      const err = new Error(`Cannot cancel transfer '${transferId}' with status '${transferRecord.status}'. Only PENDING transfers can be cancelled.`);
      err.statusCode = 409;
      throw err;
    }

    const lockedRows = await tx.$queryRaw`
      SELECT id, "depotId", "skuId", "onHand", reserved, "inTransit", "safetyStock", "targetStock"
      FROM "InventoryLevel"
      WHERE "depotId" = ${transferRecord.fromDepotId} AND "skuId" = ${transferRecord.skuId}
      ORDER BY "depotId" ASC, "skuId" ASC
      FOR UPDATE
    `;
    const sourceRow = lockedRows[0];

    if (!sourceRow) {
      const err = new Error(`Source inventory record not found for depot ${transferRecord.fromDepotId} and SKU ${transferRecord.skuId}`);
      err.statusCode = 404;
      throw err;
    }

    const updatedSource = await tx.inventoryLevel.update({
      where: { id: sourceRow.id },
      data: {
        reserved: Math.max(0, sourceRow.reserved - transferRecord.quantity)
      }
    });

    const updatedTransfer = await tx.transfer.update({
      where: { id: transferRecord.id },
      data: { status: 'CANCELLED' }
    });

    return {
      transfer: {
        ...updatedTransfer,
        createdAt: updatedTransfer.createdAt.toISOString()
      },
      updatedSource
    };
  });
}

/**
 * Retrieve transfer history log (supports bounded pagination via optional limit and offset)
 */
export async function getTransferHistory(options = {}, client = prisma) {
  const { limit, offset } = options;
  const records = await client.transfer.findMany({
    orderBy: [
      { createdAt: 'desc' },
      { id: 'desc' }
    ],
    ...(typeof limit === 'number' && !isNaN(limit) ? { take: limit } : {}),
    ...(typeof offset === 'number' && !isNaN(offset) ? { skip: offset } : {})
  });
  return records.map(r => ({
    ...r,
    createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt
  }));
}
