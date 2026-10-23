import { test, beforeEach, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  resetState,
  getInventoryStatus,
  getTransferOpportunities,
  createTransfer,
  dispatchTransfer,
  receiveTransfer,
  cancelTransfer,
  getTransferHistory
} from '../src/services/inventoryService.js';

describe('Transfer Lifecycle & Inventory Accounting (Day 3)', () => {
  beforeEach(async () => {
    await resetState();
  });

  test('happy path: PENDING -> IN_TRANSIT -> RECEIVED preserves network physical stock invariant', async () => {
    // Initial Network Physical Units of SKU-MED-01:
    // North (25) + South (190) + East (70) = 285 units
    const initialStatus = await getInventoryStatus();
    const initialTotalPhysical = initialStatus
      .filter(i => i.skuId === 'SKU-MED-01')
      .reduce((sum, i) => sum + i.onHand + i.inTransit, 0);
    assert.equal(initialTotalPhysical, 285);

    // 1. Stage Transfer: PENDING (50 units from South to North)
    const createRes = await createTransfer({
      skuId: 'SKU-MED-01',
      fromDepotId: 'depot-south',
      toDepotId: 'depot-north',
      quantity: 50
    });
    assert.equal(createRes.transfer.status, 'PENDING');
    assert.equal(createRes.updatedSource.onHand, 190);
    assert.equal(createRes.updatedSource.reserved, 50);

    const pendingStatus = await getInventoryStatus();
    const pendingTotalPhysical = pendingStatus
      .filter(i => i.skuId === 'SKU-MED-01')
      .reduce((sum, i) => sum + i.onHand + i.inTransit, 0);
    assert.equal(pendingTotalPhysical, 285, 'Physical stock invariant must hold at PENDING');

    // 2. Dispatch Transfer: IN_TRANSIT
    const dispatchRes = await dispatchTransfer(createRes.transfer.id);
    assert.equal(dispatchRes.transfer.status, 'IN_TRANSIT');
    assert.equal(dispatchRes.updatedSource.onHand, 140);
    assert.equal(dispatchRes.updatedSource.reserved, 0);
    assert.equal(dispatchRes.updatedDestination.inTransit, 50);
    assert.equal(dispatchRes.updatedDestination.onHand, 25);

    const transitStatus = await getInventoryStatus();
    const transitTotalPhysical = transitStatus
      .filter(i => i.skuId === 'SKU-MED-01')
      .reduce((sum, i) => sum + i.onHand + i.inTransit, 0);
    assert.equal(transitTotalPhysical, 285, 'Physical stock invariant must hold at IN_TRANSIT');

    // 3. Receive Transfer: RECEIVED
    const receiveRes = await receiveTransfer(createRes.transfer.id);
    assert.equal(receiveRes.transfer.status, 'RECEIVED');
    assert.equal(receiveRes.updatedDestination.inTransit, 0);
    assert.equal(receiveRes.updatedDestination.onHand, 75);

    const receivedStatus = await getInventoryStatus();
    const receivedTotalPhysical = receivedStatus
      .filter(i => i.skuId === 'SKU-MED-01')
      .reduce((sum, i) => sum + i.onHand + i.inTransit, 0);
    assert.equal(receivedTotalPhysical, 285, 'Physical stock invariant must hold at RECEIVED');
  });

  test('pre-dispatch cancellation: PENDING -> CANCELLED releases source reservation', async () => {
    // Stage transfer of 60 units from South to North
    const createRes = await createTransfer({
      skuId: 'SKU-MED-01',
      fromDepotId: 'depot-south',
      toDepotId: 'depot-north',
      quantity: 60
    });
    assert.equal(createRes.updatedSource.reserved, 60);

    // Cancel while pending
    const cancelRes = await cancelTransfer(createRes.transfer.id);
    assert.equal(cancelRes.transfer.status, 'CANCELLED');
    assert.equal(cancelRes.updatedSource.reserved, 0);

    // Verify in inventory status
    const status = await getInventoryStatus();
    const southMed = status.find(i => i.depotId === 'depot-south' && i.skuId === 'SKU-MED-01');
    assert.equal(southMed.onHand, 190);
    assert.equal(southMed.reserved, 0);
    assert.equal(southMed.availableSurplus, 90);
  });

  test('in-transit cancellation is strictly rejected with HTTP 400', async () => {
    const createRes = await createTransfer({
      skuId: 'SKU-MED-01',
      fromDepotId: 'depot-south',
      toDepotId: 'depot-north',
      quantity: 40
    });
    await dispatchTransfer(createRes.transfer.id);

    // Attempt to cancel after dispatch
    await assert.rejects(
      async () => {
        await cancelTransfer(createRes.transfer.id);
      },
      (err) => {
        assert.equal(err.statusCode, 400);
        assert.match(err.message, /Cannot cancel a transfer that is already in transit/);
        return true;
      }
    );
  });

  test('duplicate dispatch and duplicate receive are rejected with HTTP 409 Conflict', async () => {
    const createRes = await createTransfer({
      skuId: 'SKU-MED-01',
      fromDepotId: 'depot-south',
      toDepotId: 'depot-north',
      quantity: 30
    });

    // First dispatch succeeds
    await dispatchTransfer(createRes.transfer.id);

    // Second dispatch fails
    await assert.rejects(
      async () => {
        await dispatchTransfer(createRes.transfer.id);
      },
      (err) => {
        assert.equal(err.statusCode, 409);
        assert.match(err.message, /Only PENDING transfers can be dispatched/);
        return true;
      }
    );

    // First receive succeeds
    await receiveTransfer(createRes.transfer.id);

    // Second receive fails
    await assert.rejects(
      async () => {
        await receiveTransfer(createRes.transfer.id);
      },
      (err) => {
        assert.equal(err.statusCode, 409);
        assert.match(err.message, /Only IN_TRANSIT transfers can be received/);
        return true;
      }
    );
  });

  test('inbound pipeline shipments (PENDING and IN_TRANSIT) eliminate duplicate recommendations', async () => {
    // Initial: North has deficit of 95 (target 120 - onHand 25). Opportunity recommends 90.
    let opps = await getTransferOpportunities();
    assert.equal(opps.length, 2);
    const initialOpp = opps.find(o => o.skuId === 'SKU-MED-01');
    assert.equal(initialOpp.recommendedQuantity, 90);

    // Step 1: Stage 90 units (PENDING)
    const createRes = await createTransfer({
      skuId: 'SKU-MED-01',
      fromDepotId: 'depot-south',
      toDepotId: 'depot-north',
      quantity: 90
    });

    // Opportunity check while PENDING:
    // Remaining shortage is 120 - (25 onHand + 0 inTransit + 90 pendingInbound) = 5
    // But donor South has 190 onHand - 90 reserved - 100 targetStock = 0 available surplus
    // So recommendation for SKU-MED-01 is completely cleared!
    opps = await getTransferOpportunities();
    const pendingOpp = opps.find(o => o.skuId === 'SKU-MED-01');
    assert.equal(pendingOpp, undefined, 'Recommendation must be suppressed when transfer is PENDING');

    // Step 2: Dispatch to IN_TRANSIT
    await dispatchTransfer(createRes.transfer.id);

    // Opportunity check while IN_TRANSIT:
    // Remaining shortage is 120 - (25 onHand + 90 inTransit + 0 pending) = 5
    // Donor surplus is still 0 (100 onHand - 100 targetStock = 0)
    opps = await getTransferOpportunities();
    const transitOpp = opps.find(o => o.skuId === 'SKU-MED-01');
    assert.equal(transitOpp, undefined, 'Recommendation must be suppressed while shipment is IN_TRANSIT');

    // Step 3: Receive at Destination
    await receiveTransfer(createRes.transfer.id);

    // North onHand is now 115 (safely above safetyStock 50, deficit is only 5 to targetStock 120)
    opps = await getTransferOpportunities();
    const receivedOpp = opps.find(o => o.skuId === 'SKU-MED-01');
    assert.equal(receivedOpp, undefined, 'Network remains balanced after delivery');
  });

  test('recipient capacity rejects proposed quantity when combined with pending inbound transfers', async () => {
    // For SKU-IND-02:
    // Donor North: onHand = 150, targetStock = 80 (available surplus above target = 70)
    // Recipient South: onHand = 20, targetStock = 80 (total capacity = 60)
    // Transfer 1 stages 50 units from North to South (South pending inbound = 50, remaining capacity = 10; North remaining surplus = 20)
    await createTransfer({
      skuId: 'SKU-IND-02',
      fromDepotId: 'depot-north',
      toDepotId: 'depot-south',
      quantity: 50
    });

    // Transfer 2 tries to stage 15 units from North to South:
    // Donor North has 20 available surplus (15 <= 20, donor passes).
    // Recipient South has 20 onHand + 50 pendingInbound + 15 proposed = 85 > 80 targetStock!
    await assert.rejects(
      async () => {
        await createTransfer({
          skuId: 'SKU-IND-02',
          fromDepotId: 'depot-north',
          toDepotId: 'depot-south',
          quantity: 15
        });
      },
      (err) => {
        assert.equal(err.statusCode, 400);
        assert.match(err.message, /Maximum allowable transfer is 10 units/);
        return true;
      }
    );
  });
});
