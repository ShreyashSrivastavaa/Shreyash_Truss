import { test, beforeEach, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  resetState,
  getInventoryStatus,
  getTransferOpportunities,
  executeTransfer,
  getTransferHistory
} from '../src/services/inventoryService.js';
import { createTransferSchema } from '../src/schemas/transferSchema.js';

describe('Multi-Depot Inventory Balancing Domain Logic', () => {
  beforeEach(() => {
    resetState();
  });

  test('calculates correct initial inventory status and balance flags', () => {
    const status = getInventoryStatus();
    assert.equal(status.length, 6);

    const northMed = status.find(i => i.depotId === 'depot-north' && i.skuId === 'SKU-MED-01');
    assert.equal(northMed.status, 'DEFICIT');
    assert.equal(northMed.onHand, 25);
    assert.equal(northMed.safetyStock, 50);
    assert.equal(northMed.deficitToSafety, 25);

    const southMed = status.find(i => i.depotId === 'depot-south' && i.skuId === 'SKU-MED-01');
    assert.equal(southMed.status, 'SURPLUS');
    assert.equal(southMed.onHand, 190);
    assert.equal(southMed.availableSurplus, 150); // 190 - 40 safety stock
  });

  test('identifies valid transfer opportunities for deficit depots', () => {
    const opps = getTransferOpportunities();
    assert.equal(opps.length, 2);

    const medOpp = opps.find(o => o.skuId === 'SKU-MED-01');
    assert.ok(medOpp);
    assert.equal(medOpp.fromDepotId, 'depot-south');
    assert.equal(medOpp.toDepotId, 'depot-north');
    assert.equal(medOpp.maxTransferable, 150);
    assert.equal(medOpp.recommendedQuantity, 95);
    assert.equal(medOpp.urgency, 'HIGH');
  });

  test('executes a valid transfer and atomically updates inventory levels', () => {
    const result = executeTransfer({
      skuId: 'SKU-MED-01',
      fromDepotId: 'depot-south',
      toDepotId: 'depot-north',
      quantity: 50
    });

    assert.equal(result.transfer.status, 'COMPLETED');
    assert.equal(result.updatedSource.onHand, 140); // 190 - 50
    assert.equal(result.updatedDestination.onHand, 75); // 25 + 50

    // Verify history logged
    const history = getTransferHistory();
    assert.equal(history.length, 1);
    assert.equal(history[0].quantity, 50);

    // Verify destination is no longer in deficit
    const updatedStatus = getInventoryStatus();
    const northMed = updatedStatus.find(i => i.depotId === 'depot-north' && i.skuId === 'SKU-MED-01');
    assert.equal(northMed.status, 'BALANCED');
  });

  test('rejects transfer when requested quantity depletes source below safety stock', () => {
    assert.throws(
      () => {
        executeTransfer({
          skuId: 'SKU-MED-01',
          fromDepotId: 'depot-south',
          toDepotId: 'depot-north',
          quantity: 160 // onHand is 190, safetyStock is 40; max safe is 150
        });
      },
      {
        message: /Transfer rejected: transferring 160 units would reduce source depot 'depot-south' below its safety stock threshold \(40\)/
      }
    );
  });

  test('rejects transfer when source and destination are identical via Zod', () => {
    const parsed = createTransferSchema.safeParse({
      skuId: 'SKU-MED-01',
      fromDepotId: 'depot-north',
      toDepotId: 'depot-north',
      quantity: 10
    });

    assert.equal(parsed.success, false);
    assert.equal(parsed.error.issues[0].message, 'Source and destination depots must be different');
  });
});
