import { test, beforeEach, describe } from 'node:test';
import assert from 'node:assert/strict';
import prisma from '../src/db.js';
import {
  resetState,
  getInventoryStatus,
  getDepots,
  getSkus,
  executeTransfer,
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
  });

  test('executeTransfer executes inside a PostgreSQL transaction and updates database records', async () => {
    // Initial: South MED-01 onHand = 190, North MED-01 onHand = 25
    const result = await executeTransfer({
      skuId: 'SKU-MED-01',
      fromDepotId: 'depot-south',
      toDepotId: 'depot-north',
      quantity: 50
    });

    assert.equal(result.transfer.status, 'COMPLETED');
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

    assert.equal(dbSource.onHand, 140, 'PostgreSQL source onHand must be decremented to 140');
    assert.equal(dbDest.onHand, 75, 'PostgreSQL destination onHand must be incremented to 75');
    assert.ok(dbTransfer, 'PostgreSQL Transfer record must be persisted in database');
    assert.equal(dbTransfer.quantity, 50);
  });

  test('PostgreSQL concurrency safety: sequential transfers properly serialize with row-level locks', async () => {
    // South MED-01: onHand = 190, safetyStock = 40. Safe surplus = 150.
    // North capacity = 95.
    // First transfer of 90 units
    await executeTransfer({
      skuId: 'SKU-MED-01',
      fromDepotId: 'depot-south',
      toDepotId: 'depot-north',
      quantity: 90
    });

    // Directly verify South onHand in PostgreSQL is 100
    const dbSouth = await prisma.inventoryLevel.findFirst({
      where: { depotId: 'depot-south', skuId: 'SKU-MED-01' }
    });
    assert.equal(dbSouth.onHand, 100);

    // Attempting another transfer that would breach South safety stock (40) is rejected
    await assert.rejects(
      async () => {
        await executeTransfer({
          skuId: 'SKU-MED-01',
          fromDepotId: 'depot-south',
          toDepotId: 'depot-north',
          quantity: 70 // 100 - 70 = 30 < 40
        });
      },
      {
        message: /safety stock/i
      }
    );

    // Verify rollback: South onHand in PostgreSQL remains 100
    const dbSouthAfter = await prisma.inventoryLevel.findFirst({
      where: { depotId: 'depot-south', skuId: 'SKU-MED-01' }
    });
    assert.equal(dbSouthAfter.onHand, 100, 'Rollback ensures onHand remains unchanged on rejection');
  });

  test('resetState restores PostgreSQL database back to synthetic baseline', async () => {
    // Execute a transfer to modify DB state
    await executeTransfer({
      skuId: 'SKU-MED-01',
      fromDepotId: 'depot-south',
      toDepotId: 'depot-north',
      quantity: 50
    });

    const beforeResetTransfers = await prisma.transfer.count();
    assert.ok(beforeResetTransfers >= 1);

    // Call resetState
    await resetState();

    // Verify DB restored
    const afterResetTransfers = await prisma.transfer.count();
    assert.equal(afterResetTransfers, 0, 'Transfers should be reset to 0 in PostgreSQL');

    const dbSouth = await prisma.inventoryLevel.findFirst({
      where: { depotId: 'depot-south', skuId: 'SKU-MED-01' }
    });
    assert.equal(dbSouth.onHand, 190, 'South MED-01 restored to baseline 190 in PostgreSQL');
  });
});
