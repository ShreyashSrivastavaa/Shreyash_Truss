import { test, beforeEach, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  resetState,
  getInventoryStatus,
  getTransferOpportunities,
  executeTransfer,
  dispatchTransfer,
  receiveTransfer,
  cancelTransfer,
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
    assert.equal(southMed.availableSurplus, 90); // 190 - 100 target stock = 90
    assert.equal(southMed.surplusAboveSafety, 150); // 190 - 40 safety stock = 150
  });

  test('identifies valid transfer opportunities for deficit depots', async () => {
    const opps = await getTransferOpportunities();
    assert.equal(opps.length, 2);

    const medOpp = opps.find(o => o.skuId === 'SKU-MED-01');
    assert.ok(medOpp);
    assert.equal(medOpp.fromDepotId, 'depot-south');
    assert.equal(medOpp.toDepotId, 'depot-north');
    assert.equal(medOpp.maxTransferable, 90); // donor surplus above targetStock
    assert.equal(medOpp.recommendedQuantity, 90);
    assert.equal(medOpp.urgency, 'HIGH');
  });

  test('executes a valid transfer and atomically updates inventory levels across lifecycle', async () => {
    const createResult = await executeTransfer({
      skuId: 'SKU-MED-01',
      fromDepotId: 'depot-south',
      toDepotId: 'depot-north',
      quantity: 50
    });

    // 1. Creation: PENDING, source reserved incremented, physical onHand unchanged
    assert.equal(createResult.transfer.status, 'PENDING');
    assert.equal(createResult.updatedSource.onHand, 190);
    assert.equal(createResult.updatedSource.reserved, 50);
    assert.equal(createResult.updatedDestination.onHand, 25);
    assert.equal(createResult.updatedDestination.inTransit, 0);

    // 2. Dispatch: IN_TRANSIT, physical onHand decremented, inTransit incremented
    const dispatchResult = await dispatchTransfer(createResult.transfer.id);
    assert.equal(dispatchResult.transfer.status, 'IN_TRANSIT');
    assert.equal(dispatchResult.updatedSource.onHand, 140);
    assert.equal(dispatchResult.updatedSource.reserved, 0);
    assert.equal(dispatchResult.updatedDestination.inTransit, 50);

    // 3. Receive: RECEIVED, inTransit decremented, onHand incremented
    const receiveResult = await receiveTransfer(createResult.transfer.id);
    assert.equal(receiveResult.transfer.status, 'RECEIVED');
    assert.equal(receiveResult.updatedDestination.onHand, 75);
    assert.equal(receiveResult.updatedDestination.inTransit, 0);

    // Verify history logged
    const history = await getTransferHistory();
    assert.equal(history.length, 1);
    assert.equal(history[0].quantity, 50);
    assert.equal(history[0].status, 'RECEIVED');

    // Verify destination is no longer in deficit
    const updatedStatus = await getInventoryStatus();
    const northMed = updatedStatus.find(i => i.depotId === 'depot-north' && i.skuId === 'SKU-MED-01');
    assert.equal(northMed.status, 'BALANCED');
  });

  test('rejects transfer when requested quantity depletes source below target stock', async () => {
    await assert.rejects(
      async () => {
        await executeTransfer({
          skuId: 'SKU-MED-01',
          fromDepotId: 'depot-south',
          toDepotId: 'depot-north',
          quantity: 160 // onHand is 190, targetStock is 100; max safe is 90
        });
      },
      {
        message: /Transfer rejected: transferring 160 units would reduce source depot 'depot-south' below its target stock threshold \(100\)/
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

  test('sequential transfers deplete surplus and reject second transfer when target stock is breached', async () => {
    // Initial south onHand = 190, targetStock = 100 (safe surplus above target = 90)
    // Transfer 1: 50 units (remaining safe surplus left = 40)
    const firstResult = await executeTransfer({
      skuId: 'SKU-MED-01',
      fromDepotId: 'depot-south',
      toDepotId: 'depot-north',
      quantity: 50
    });
    assert.equal(firstResult.updatedSource.reserved, 50);
    assert.equal(firstResult.updatedSource.onHand, 190);

    // Transfer 2: 50 units (invalid: 190 - 50 - 50 = 90 < 100 targetStock, maximum safe is 40)
    await assert.rejects(
      async () => {
        await executeTransfer({
          skuId: 'SKU-MED-01',
          fromDepotId: 'depot-south',
          toDepotId: 'depot-north',
          quantity: 50
        });
      },
      {
        message: /Maximum safe transfer is 40 units/
      }
    );
  });

  test('transfer opportunities dynamically reflect updated surplus after a partial transfer', async () => {
    // Initial MED-01 opportunity recommends 90 units from south (maxTransferable 90)
    let opps = await getTransferOpportunities();
    const initialMedOpp = opps.find(o => o.skuId === 'SKU-MED-01');
    assert.equal(initialMedOpp.maxTransferable, 90);
    assert.equal(initialMedOpp.recommendedQuantity, 90);

    // Execute partial transfer of 15 units (reserves 15 at south; pending inbound at north is 15)
    await executeTransfer({
      skuId: 'SKU-MED-01',
      fromDepotId: 'depot-south',
      toDepotId: 'depot-north',
      quantity: 15
    });

    // Check remaining opportunity: recipient deficitToTarget is 95, minus 15 pending inbound = 80 remaining shortage
    // Donor has 190 on hand, 15 reserved, 100 target stock = 75 available surplus above target
    opps = await getTransferOpportunities();
    const updatedMedOpp = opps.find(o => o.skuId === 'SKU-MED-01');
    assert.ok(updatedMedOpp, 'Opportunity should still exist while recipient is in deficit');
    assert.equal(updatedMedOpp.maxTransferable, 75); // 190 - 15 - 100 = 75
    assert.equal(updatedMedOpp.recommendedQuantity, 75); // min(80 remaining shortage, 75 donor surplus above target) = 75
  });
});
