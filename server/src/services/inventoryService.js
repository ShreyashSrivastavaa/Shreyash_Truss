import prisma from '../db.js';
import { initialDepots, initialSkus, initialInventory, initialTransfers } from '../data/mockData.js';
import { seed } from '../../prisma/seed.js';

// In-memory working state (fallback / fast baseline)
let depots = JSON.parse(JSON.stringify(initialDepots));
let skus = JSON.parse(JSON.stringify(initialSkus));
let inventory = JSON.parse(JSON.stringify(initialInventory));
let transfers = JSON.parse(JSON.stringify(initialTransfers));

/**
 * Resets state back to initial synthetic values (re-seeds PostgreSQL if connected)
 */
export async function resetState() {
  depots = JSON.parse(JSON.stringify(initialDepots));
  skus = JSON.parse(JSON.stringify(initialSkus));
  inventory = JSON.parse(JSON.stringify(initialInventory));
  transfers = JSON.parse(JSON.stringify(initialTransfers));

  if (prisma) {
    try {
      await seed(prisma);
    } catch (err) {
      console.warn('Database re-seed failed:', err.message);
    }
  }
}

/**
 * Retrieve all registered depots
 */
export async function getDepots() {
  if (prisma) {
    try {
      return await prisma.depot.findMany({ orderBy: { id: 'asc' } });
    } catch {
      // Fallback
    }
  }
  return depots;
}

/**
 * Retrieve all registered SKUs
 */
export async function getSkus() {
  if (prisma) {
    try {
      return await prisma.sku.findMany({ orderBy: { id: 'asc' } });
    } catch {
      // Fallback
    }
  }
  return skus;
}

/**
 * Retrieve enriched inventory items with calculated supply health status
 */
export async function getInventoryStatus() {
  if (prisma) {
    try {
      const records = await prisma.inventoryLevel.findMany({
        include: {
          depot: true,
          sku: true
        },
        orderBy: [{ depotId: 'asc' }, { skuId: 'asc' }]
      });

      return records.map(item => {
        let status = 'BALANCED';
        if (item.onHand < item.safetyStock) {
          status = 'DEFICIT';
        } else if (item.onHand > item.targetStock) {
          status = 'SURPLUS';
        }

        const availableSurplus = Math.max(0, item.onHand - item.safetyStock);
        const surplusAboveTarget = Math.max(0, item.onHand - item.targetStock);
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
          safetyStock: item.safetyStock,
          targetStock: item.targetStock,
          status,
          availableSurplus,
          surplusAboveTarget,
          deficitToSafety,
          deficitToTarget
        };
      });
    } catch (err) {
      console.warn('Prisma getInventoryStatus fallback:', err.message);
    }
  }

  return inventory.map(item => {
    const depot = depots.find(d => d.id === item.depotId);
    const sku = skus.find(s => s.id === item.skuId);

    let status = 'BALANCED';
    if (item.onHand < item.safetyStock) {
      status = 'DEFICIT';
    } else if (item.onHand > item.targetStock) {
      status = 'SURPLUS';
    }

    const availableSurplus = Math.max(0, item.onHand - item.safetyStock);
    const surplusAboveTarget = Math.max(0, item.onHand - item.targetStock);
    const deficitToSafety = Math.max(0, item.safetyStock - item.onHand);
    const deficitToTarget = Math.max(0, item.targetStock - item.onHand);

    return {
      depotId: item.depotId,
      depotName: depot ? depot.name : item.depotId,
      depotCity: depot ? depot.city : '',
      region: depot ? depot.region : '',
      skuId: item.skuId,
      skuName: sku ? sku.name : item.skuId,
      unit: sku ? sku.unit : 'units',
      unitCost: sku ? sku.unitCost : 0,
      onHand: item.onHand,
      safetyStock: item.safetyStock,
      targetStock: item.targetStock,
      status,
      availableSurplus,
      surplusAboveTarget,
      deficitToSafety,
      deficitToTarget
    };
  });
}

/**
 * Identify viable lateral transfer opportunities across depots
 * Uses donor surplus above target stock (not merely safety stock) and prevents duplicate allocation.
 */
export async function getTransferOpportunities(customItems = null) {
  const enriched = customItems || (await getInventoryStatus());
  const opportunities = [];

  const skuIds = [...new Set(enriched.map(item => item.skuId))];

  for (const skuId of skuIds) {
    const skuItems = enriched.filter(item => item.skuId === skuId);
    const deficitItems = skuItems.filter(item => item.status === 'DEFICIT');
    const surplusItems = skuItems.filter(item => item.status === 'SURPLUS');

    // Track available surplus above target per donor for this SKU
    const donorAvailableSurplus = new Map();
    for (const surplus of surplusItems) {
      const surplusAboveTarget = Math.max(0, surplus.onHand - surplus.targetStock);
      donorAvailableSurplus.set(surplus.depotId, surplusAboveTarget);
    }

    for (const deficit of deficitItems) {
      let remainingShortage = Math.max(0, deficit.targetStock - deficit.onHand);
      if (remainingShortage <= 0) continue;

      for (const surplus of surplusItems) {
        if (remainingShortage <= 0) break;

        const donorSurplus = donorAvailableSurplus.get(surplus.depotId) || 0;
        if (donorSurplus <= 0) continue;

        // Source can safely donate up to availableSurplus without violating safety stock
        const maxTransferable = Math.max(0, surplus.onHand - surplus.safetyStock);
        if (maxTransferable <= 0) continue;

        // Recommended quantity uses donor surplus above target, not merely safety stock,
        // and does not allocate more than remaining shortage
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
          donorSafetyStock: surplus.safetyStock,
          donorTargetStock: surplus.targetStock,
          recipientOnHand: deficit.onHand,
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
 * Execute a validated lateral transfer between depots
 * Protected with PostgreSQL database transactions and row-level locks when persistence is active
 */
export async function executeTransfer({ skuId, fromDepotId, toDepotId, quantity }) {
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

  if (prisma) {
    try {
      return await prisma.$transaction(async (tx) => {
        // 1. Lock both inventory rows with row-level locks (FOR UPDATE) to prevent concurrency races
        const lockedRows = await tx.$queryRaw`
          SELECT id, "depotId", "skuId", "onHand", "safetyStock", "targetStock"
          FROM "InventoryLevel"
          WHERE ("depotId" = ${fromDepotId} AND "skuId" = ${skuId})
             OR ("depotId" = ${toDepotId} AND "skuId" = ${skuId})
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

        // Business Rule 1: Source must not be depleted below safety stock
        const remainingStock = sourceRow.onHand - quantity;
        if (remainingStock < sourceRow.safetyStock) {
          const maxSafe = Math.max(0, sourceRow.onHand - sourceRow.safetyStock);
          const err = new Error(
            `Transfer rejected: transferring ${quantity} units would reduce source depot '${fromDepotId}' below its safety stock threshold (${sourceRow.safetyStock}). Maximum safe transfer is ${maxSafe} units.`
          );
          err.statusCode = 400;
          throw err;
        }

        // Business Rule 2: Destination must not exceed target stock capacity
        const resultingDestStock = destRow.onHand + quantity;
        if (resultingDestStock > destRow.targetStock) {
          const remainingCapacity = Math.max(0, destRow.targetStock - destRow.onHand);
          const err = new Error(
            `Transfer rejected: transferring ${quantity} units would exceed destination depot '${toDepotId}' target stock threshold (${destRow.targetStock}). Maximum allowable transfer is ${remainingCapacity} units.`
          );
          err.statusCode = 400;
          throw err;
        }

        // 2. Perform atomic inventory adjustments in database
        const updatedSource = await tx.inventoryLevel.update({
          where: { id: sourceRow.id },
          data: { onHand: sourceRow.onHand - quantity }
        });

        const updatedDestination = await tx.inventoryLevel.update({
          where: { id: destRow.id },
          data: { onHand: destRow.onHand + quantity }
        });

        // 3. Create immutable transfer order record
        const transferId = `TRF-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
        const transferRecord = await tx.transfer.create({
          data: {
            id: transferId,
            skuId,
            fromDepotId,
            toDepotId,
            quantity,
            status: 'COMPLETED'
          }
        });

        // Mirror in memory state for fast sync
        const inMemorySource = inventory.find(i => i.depotId === fromDepotId && i.skuId === skuId);
        if (inMemorySource) inMemorySource.onHand = updatedSource.onHand;
        const inMemoryDest = inventory.find(i => i.depotId === toDepotId && i.skuId === skuId);
        if (inMemoryDest) inMemoryDest.onHand = updatedDestination.onHand;
        transfers.unshift({
          id: transferRecord.id,
          skuId: transferRecord.skuId,
          fromDepotId: transferRecord.fromDepotId,
          toDepotId: transferRecord.toDepotId,
          quantity: transferRecord.quantity,
          status: transferRecord.status,
          createdAt: transferRecord.createdAt.toISOString()
        });

        return {
          transfer: {
            ...transferRecord,
            createdAt: transferRecord.createdAt.toISOString()
          },
          updatedSource,
          updatedDestination
        };
      });
    } catch (err) {
      if (err.statusCode) throw err;
      throw err;
    }
  }

  // Fallback to in-memory:
  const sourceItem = inventory.find(i => i.depotId === fromDepotId && i.skuId === skuId);
  if (!sourceItem) {
    const err = new Error(`Source inventory record not found for depot ${fromDepotId} and SKU ${skuId}`);
    err.statusCode = 404;
    throw err;
  }

  const destItem = inventory.find(i => i.depotId === toDepotId && i.skuId === skuId);
  if (!destItem) {
    const err = new Error(`Destination inventory record not found for depot ${toDepotId} and SKU ${skuId}`);
    err.statusCode = 404;
    throw err;
  }

  const remainingStock = sourceItem.onHand - quantity;
  if (remainingStock < sourceItem.safetyStock) {
    const maxSafe = Math.max(0, sourceItem.onHand - sourceItem.safetyStock);
    const err = new Error(
      `Transfer rejected: transferring ${quantity} units would reduce source depot '${fromDepotId}' below its safety stock threshold (${sourceItem.safetyStock}). Maximum safe transfer is ${maxSafe} units.`
    );
    err.statusCode = 400;
    throw err;
  }

  const resultingDestStock = destItem.onHand + quantity;
  if (resultingDestStock > destItem.targetStock) {
    const remainingCapacity = Math.max(0, destItem.targetStock - destItem.onHand);
    const err = new Error(
      `Transfer rejected: transferring ${quantity} units would exceed destination depot '${toDepotId}' target stock threshold (${destItem.targetStock}). Maximum allowable transfer is ${remainingCapacity} units.`
    );
    err.statusCode = 400;
    throw err;
  }

  sourceItem.onHand -= quantity;
  destItem.onHand += quantity;

  const transferRecord = {
    id: `TRF-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
    skuId,
    fromDepotId,
    toDepotId,
    quantity,
    status: 'COMPLETED',
    createdAt: new Date().toISOString()
  };

  transfers.unshift(transferRecord);

  return {
    transfer: transferRecord,
    updatedSource: { ...sourceItem },
    updatedDestination: { ...destItem }
  };
}

/**
 * Retrieve transfer history log
 */
export async function getTransferHistory() {
  if (prisma) {
    try {
      const records = await prisma.transfer.findMany({
        orderBy: { createdAt: 'desc' }
      });
      return records.map(r => ({
        ...r,
        createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt
      }));
    } catch {
      // Fallback
    }
  }
  return transfers;
}
