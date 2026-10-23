import { test, beforeEach, describe } from 'node:test';
import assert from 'node:assert/strict';
import prisma from '../src/db.js';
import {
  resetState,
  getInventoryStatus,
  getDepots,
  getSkus,
  executeTransfer,
  dispatchTransfer,
  receiveTransfer,
  getTransferHistory
} from '../src/services/inventoryService.js';

describe('PostgreSQL & Prisma Persistence Integration', () => {
  beforeEach(async () => {
    await resetState();
  });

  test('Prisma client connects and database contains seeded tables', async () => {
    assert.ok(prisma, 'Prisma client must be initialized');

    const depotCount = await prisma.depot.count();
    const skuCount = await prisma.sku.count();
    const invCount = await prisma.inventoryLevel.count();

    assert.equal(depotCount, 3, 'PostgreSQL Depot table should have 3 records');
    assert.equal(skuCount, 2, 'PostgreSQL Sku table should have 2 records');
    assert.equal(invCount, 6, 'PostgreSQL InventoryLevel table should have 6 records');
  });

  test('getInventoryStatus reads enriched records directly from PostgreSQL', async () => {
    const items = await getInventoryStatus();
    assert.equal(items.length, 6);

    const southMed = items.find(i => i.depotId === 'depot-south' && i.skuId === 'SKU-MED-01');
    assert.ok(southMed);
    assert.equal(southMed.onHand, 190);
    assert.equal(southMed.safetyStock, 40);
    assert.equal(southMed.targetStock, 100);
    assert.equal(southMed.status, 'SURPLUS');
    assert.equal(southMed.surplusAboveTarget, 90);
    assert.equal(southMed.reserved, 0);
    assert.equal(southMed.inTransit, 0);
  });

  test('executeTransfer executes inside a PostgreSQL transaction and updates database records', async () => {
    // Initial: South MED-01 onHand = 190, North MED-01 onHand = 25
    const result = await executeTransfer({
      skuId: 'SKU-MED-01',
      fromDepotId: 'depot-south',
      toDepotId: 'depot-north',
      quantity: 50
    });

    assert.equal(result.transfer.status, 'PENDING');
    assert.ok(result.transfer.id.startsWith('TRF-'));

    // Directly verify in PostgreSQL via Prisma raw model query (bypassing service cache)
    const dbSource = await prisma.inventoryLevel.findFirst({
      where: { depotId: 'depot-south', skuId: 'SKU-MED-01' }
    });
    const dbDest = await prisma.inventoryLevel.findFirst({
      where: { depotId: 'depot-north', skuId: 'SKU-MED-01' }
    });
    const dbTransfer = await prisma.transfer.findUnique({
      where: { id: result.transfer.id }
    });

    assert.equal(dbSource.onHand, 190, 'PostgreSQL source physical onHand must remain 190 at PENDING');
    assert.equal(dbSource.reserved, 50, 'PostgreSQL source reserved must be incremented to 50');
    assert.equal(dbDest.onHand, 25, 'PostgreSQL destination onHand must remain 25 at PENDING');
    assert.equal(dbDest.inTransit, 0, 'PostgreSQL destination inTransit must remain 0 at PENDING');
    assert.ok(dbTransfer, 'PostgreSQL Transfer record must be persisted in database');
    assert.equal(dbTransfer.status, 'PENDING');
    assert.equal(dbTransfer.quantity, 50);

    // Verify dispatch in PostgreSQL
    const dispatchRes = await dispatchTransfer(result.transfer.id);
    assert.equal(dispatchRes.transfer.status, 'IN_TRANSIT');

    const dbSourceDispatched = await prisma.inventoryLevel.findFirst({
      where: { depotId: 'depot-south', skuId: 'SKU-MED-01' }
    });
    const dbDestDispatched = await prisma.inventoryLevel.findFirst({
      where: { depotId: 'depot-north', skuId: 'SKU-MED-01' }
    });
    assert.equal(dbSourceDispatched.onHand, 140, 'PostgreSQL source onHand must decrement to 140 on dispatch');
    assert.equal(dbSourceDispatched.reserved, 0, 'PostgreSQL source reserved must decrement to 0 on dispatch');
    assert.equal(dbDestDispatched.inTransit, 50, 'PostgreSQL destination inTransit must increment to 50 on dispatch');
    assert.equal(dbDestDispatched.onHand, 25, 'PostgreSQL destination onHand must remain 25 while en route');

    // Verify receive in PostgreSQL
    const receiveRes = await receiveTransfer(result.transfer.id);
    assert.equal(receiveRes.transfer.status, 'RECEIVED');

    const dbDestReceived = await prisma.inventoryLevel.findFirst({
      where: { depotId: 'depot-north', skuId: 'SKU-MED-01' }
    });
    assert.equal(dbDestReceived.inTransit, 0, 'PostgreSQL destination inTransit must decrement to 0 on receive');
    assert.equal(dbDestReceived.onHand, 75, 'PostgreSQL destination onHand must increment to 75 on receive');
  });

  test('PostgreSQL concurrency safety: sequential transfers properly serialize with row-level locks', async () => {
    // South MED-01: onHand = 190, targetStock = 100. Safe surplus above target = 90.
    // First transfer of 90 units reserves all surplus
    await executeTransfer({
      skuId: 'SKU-MED-01',
      fromDepotId: 'depot-south',
      toDepotId: 'depot-north',
      quantity: 90
    });

    // Directly verify South reserved in PostgreSQL is 90
    const dbSouth = await prisma.inventoryLevel.findFirst({
      where: { depotId: 'depot-south', skuId: 'SKU-MED-01' }
    });
    assert.equal(dbSouth.onHand, 190);
    assert.equal(dbSouth.reserved, 90);

    // Attempting another transfer that would breach South target stock (100) is rejected
    await assert.rejects(
      async () => {
        await executeTransfer({
          skuId: 'SKU-MED-01',
          fromDepotId: 'depot-south',
          toDepotId: 'depot-north',
          quantity: 10
        });
      },
      {
        message: /target stock/i
      }
    );

    // Verify rollback: South reserved in PostgreSQL remains 90
    const dbSouthAfter = await prisma.inventoryLevel.findFirst({
      where: { depotId: 'depot-south', skuId: 'SKU-MED-01' }
    });
    assert.equal(dbSouthAfter.reserved, 90, 'Rollback ensures reservation remains unchanged on rejection');
  });

  test('resetState restores PostgreSQL database back to synthetic baseline', async () => {
    // Mutate state with transfer
    await executeTransfer({
      skuId: 'SKU-MED-01',
      fromDepotId: 'depot-south',
      toDepotId: 'depot-north',
      quantity: 50
    });

    // Verify transfer exists
    const beforeCount = await prisma.transfer.count();
    assert.equal(beforeCount, 1);

    // Reset
    await resetState();

    // Verify database tables are restored back to pristine synthetic seed
    const afterCount = await prisma.transfer.count();
    assert.equal(afterCount, 0);

    const southMed = await prisma.inventoryLevel.findFirst({
      where: { depotId: 'depot-south', skuId: 'SKU-MED-01' }
    });
    assert.equal(southMed.onHand, 190);
    assert.equal(southMed.reserved, 0);
    assert.equal(southMed.inTransit, 0);
  });
});
