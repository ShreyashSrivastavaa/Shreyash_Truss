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
  beforeEach(async () => {
    await resetState();
  });

  test('calculates correct initial inventory status and balance flags', async () => {
    const status = await getInventoryStatus();
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

  test('identifies valid transfer opportunities for deficit depots', async () => {
    const opps = await getTransferOpportunities();
    assert.equal(opps.length, 2);

    const medOpp = opps.find(o => o.skuId === 'SKU-MED-01');
    assert.ok(medOpp);
    assert.equal(medOpp.fromDepotId, 'depot-south');
    assert.equal(medOpp.toDepotId, 'depot-north');
    assert.equal(medOpp.maxTransferable, 150);
    assert.equal(medOpp.recommendedQuantity, 90);
    assert.equal(medOpp.urgency, 'HIGH');
  });

  test('executes a valid transfer and atomically updates inventory levels', async () => {
    const result = await executeTransfer({
      skuId: 'SKU-MED-01',
      fromDepotId: 'depot-south',
      toDepotId: 'depot-north',
      quantity: 50
    });

    assert.equal(result.transfer.status, 'COMPLETED');
    assert.equal(result.updatedSource.onHand, 140); // 190 - 50
    assert.equal(result.updatedDestination.onHand, 75); // 25 + 50

    // Verify history logged
    const history = await getTransferHistory();
    assert.equal(history.length, 1);
    assert.equal(history[0].quantity, 50);

    // Verify destination is no longer in deficit
    const updatedStatus = await getInventoryStatus();
    const northMed = updatedStatus.find(i => i.depotId === 'depot-north' && i.skuId === 'SKU-MED-01');
    assert.equal(northMed.status, 'BALANCED');
  });

  test('rejects transfer when requested quantity depletes source below safety stock', async () => {
    await assert.rejects(
      async () => {
        await executeTransfer({
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

  test('rejects transfer when depot or SKU record does not exist', async () => {
    await assert.rejects(
      async () => {
        await executeTransfer({
          skuId: 'NON-EXISTENT-SKU',
          fromDepotId: 'depot-south',
          toDepotId: 'depot-north',
          quantity: 10
        });
      },
      {
        message: /Source inventory record not found/
      }
    );
  });

  test('sequential transfers deplete surplus and reject second transfer when safety stock is breached', async () => {
    // Initial south onHand = 190, safetyStock = 40 (safe surplus = 150)
    // Transfer 1: 90 units to North (North target capacity is 95, remaining South onHand = 100, safe surplus left = 60)
    const firstResult = await executeTransfer({
      skuId: 'SKU-MED-01',
      fromDepotId: 'depot-south',
      toDepotId: 'depot-north',
      quantity: 90
    });
    assert.equal(firstResult.updatedSource.onHand, 100);

    // Transfer 2: 70 units (invalid: 100 - 70 = 30 < 40 safetyStock)
    await assert.rejects(
      async () => {
        await executeTransfer({
          skuId: 'SKU-MED-01',
          fromDepotId: 'depot-south',
          toDepotId: 'depot-north',
          quantity: 70
        });
      },
      {
        message: /Maximum safe transfer is 60 units/
      }
    );
  });

  test('transfer opportunities dynamically reflect updated surplus after a partial transfer', async () => {
    // Initial MED-01 opportunity recommends 90 units from south (maxTransferable 150)
    let opps = await getTransferOpportunities();
    const initialMedOpp = opps.find(o => o.skuId === 'SKU-MED-01');
    assert.equal(initialMedOpp.maxTransferable, 150);
    assert.equal(initialMedOpp.recommendedQuantity, 90);

    // Execute partial transfer of 15 units (recipient onHand goes 25 -> 40, still below safetyStock 50)
    await executeTransfer({
      skuId: 'SKU-MED-01',
      fromDepotId: 'depot-south',
      toDepotId: 'depot-north',
      quantity: 15
    });

    // Check remaining opportunity: recipient now has 40 (still in DEFICIT, deficitToTarget is 80)
    // Donor now has 175 (target 100, so donor surplus above target is 75)
    opps = await getTransferOpportunities();
    const updatedMedOpp = opps.find(o => o.skuId === 'SKU-MED-01');
    assert.ok(updatedMedOpp, 'Opportunity should still exist while recipient is in deficit');
    assert.equal(updatedMedOpp.maxTransferable, 135); // 175 - 40 safetyStock = 135
    assert.equal(updatedMedOpp.recommendedQuantity, 75); // min(80 deficitToTarget, 75 donor surplus above target) = 75
    assert.equal(updatedMedOpp.recipientOnHand, 40);
  });
});
