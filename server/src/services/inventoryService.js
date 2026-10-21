import { initialDepots, initialSkus, initialInventory, initialTransfers } from '../data/mockData.js';

// In-memory working state
let depots = JSON.parse(JSON.stringify(initialDepots));
let skus = JSON.parse(JSON.stringify(initialSkus));
let inventory = JSON.parse(JSON.stringify(initialInventory));
let transfers = JSON.parse(JSON.stringify(initialTransfers));

/**
 * Resets state back to initial synthetic values (useful for testing)
 */
export function resetState() {
  depots = JSON.parse(JSON.stringify(initialDepots));
  skus = JSON.parse(JSON.stringify(initialSkus));
  inventory = JSON.parse(JSON.stringify(initialInventory));
  transfers = JSON.parse(JSON.stringify(initialTransfers));
}

/**
 * Retrieve all registered depots
 */
export function getDepots() {
  return depots;
}

/**
 * Retrieve all registered SKUs
 */
export function getSkus() {
  return skus;
}

/**
 * Retrieve enriched inventory items with calculated supply health status
 */
export function getInventoryStatus() {
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
      status, // 'DEFICIT' | 'BALANCED' | 'SURPLUS'
      availableSurplus, // Units that can be transferred without violating own safety stock
      deficitToSafety,
      deficitToTarget
    };
  });
}

/**
 * Identify viable lateral transfer opportunities across depots
 */
export function getTransferOpportunities() {
  const enriched = getInventoryStatus();
  const opportunities = [];

  // Group by SKU
  const skuIds = [...new Set(enriched.map(item => item.skuId))];

  for (const skuId of skuIds) {
    const skuItems = enriched.filter(item => item.skuId === skuId);
    const deficitItems = skuItems.filter(item => item.status === 'DEFICIT');
    const surplusItems = skuItems.filter(item => item.status === 'SURPLUS');

    for (const deficit of deficitItems) {
      for (const surplus of surplusItems) {
        // Source can safely donate up to its availableSurplus
        const maxTransferable = surplus.availableSurplus;
        if (maxTransferable <= 0) continue;

        // Recommended quantity brings deficit to target if possible, otherwise satisfies safety stock
        const recommendedQuantity = Math.min(deficit.deficitToTarget, maxTransferable);

        if (recommendedQuantity > 0) {
          opportunities.push({
            skuId,
            skuName: deficit.skuName,
            fromDepotId: surplus.depotId,
            fromDepotName: surplus.depotName,
            toDepotId: deficit.depotId,
            toDepotName: deficit.depotName,
            donorOnHand: surplus.onHand,
            donorSafetyStock: surplus.safetyStock,
            recipientOnHand: deficit.onHand,
            recipientSafetyStock: deficit.safetyStock,
            recommendedQuantity,
            maxTransferable,
            urgency: deficit.onHand < deficit.safetyStock ? 'HIGH' : 'MEDIUM'
          });
        }
      }
    }
  }

  return opportunities;
}

/**
 * Execute a validated lateral transfer between depots
 */
export function executeTransfer({ skuId, fromDepotId, toDepotId, quantity }) {
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

  // Business Rule: Source must not be depleted below safety stock
  const remainingStock = sourceItem.onHand - quantity;
  if (remainingStock < sourceItem.safetyStock) {
    const maxSafe = Math.max(0, sourceItem.onHand - sourceItem.safetyStock);
    const err = new Error(
      `Transfer rejected: transferring ${quantity} units would reduce source depot '${fromDepotId}' below its safety stock threshold (${sourceItem.safetyStock}). Maximum safe transfer is ${maxSafe} units.`
    );
    err.statusCode = 400;
    throw err;
  }

  // Atomic state update
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
export function getTransferHistory() {
  return transfers;
}
