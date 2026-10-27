import { test, beforeEach, afterEach, describe } from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';
import prisma from '../src/db.js';
import { resetState } from '../src/services/inventoryService.js';

describe('HTTP API Transfer Lifecycle & State Machine Integration (Day 3)', () => {
  let server;
  let baseUrl;

  beforeEach(async () => {
    await resetState();
    await new Promise(resolve => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  afterEach(async () => {
    if (server) {
      await new Promise(resolve => server.close(resolve));
    }
  });

  test('HTTP Happy Path: POST create (201) -> dispatch (200) -> receive (200) persists in PostgreSQL', async () => {
    // 1. Create Transfer: POST /api/transfers
    const createRes = await fetch(`${baseUrl}/api/transfers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        skuId: 'SKU-MED-01',
        fromDepotId: 'depot-south',
        toDepotId: 'depot-north',
        quantity: 50
      })
    });

    assert.equal(createRes.status, 201);
    const createJson = await createRes.json();
    assert.equal(createJson.message, 'Transfer created successfully');
    assert.equal(createJson.transfer.status, 'PENDING');
    assert.equal(createJson.updatedSource.reserved, 50);
    assert.equal(createJson.updatedSource.onHand, 190);

    const transferId = createJson.transfer.id;

    // Verify in PostgreSQL
    if (prisma) {
      const dbSource = await prisma.inventoryLevel.findFirst({
        where: { depotId: 'depot-south', skuId: 'SKU-MED-01' }
      });
      assert.equal(dbSource.reserved, 50);
      assert.equal(dbSource.onHand, 190);
    }

    // 2. Dispatch Transfer: POST /api/transfers/:id/dispatch
    const dispatchRes = await fetch(`${baseUrl}/api/transfers/${transferId}/dispatch`, {
      method: 'POST'
    });
    assert.equal(dispatchRes.status, 200);
    const dispatchJson = await dispatchRes.json();
    assert.equal(dispatchJson.message, 'Transfer dispatched successfully');
    assert.equal(dispatchJson.transfer.status, 'IN_TRANSIT');
    assert.equal(dispatchJson.updatedSource.onHand, 140);
    assert.equal(dispatchJson.updatedSource.reserved, 0);
    assert.equal(dispatchJson.updatedDestination.inTransit, 50);

    // Verify in PostgreSQL
    if (prisma) {
      const dbDest = await prisma.inventoryLevel.findFirst({
        where: { depotId: 'depot-north', skuId: 'SKU-MED-01' }
      });
      assert.equal(dbDest.inTransit, 50);
      assert.equal(dbDest.onHand, 25);
    }

    // 3. Receive Transfer: POST /api/transfers/:id/receive
    const receiveRes = await fetch(`${baseUrl}/api/transfers/${transferId}/receive`, {
      method: 'POST'
    });
    assert.equal(receiveRes.status, 200);
    const receiveJson = await receiveRes.json();
    assert.equal(receiveJson.message, 'Transfer received successfully');
    assert.equal(receiveJson.transfer.status, 'RECEIVED');
    assert.equal(receiveJson.updatedDestination.inTransit, 0);
    assert.equal(receiveJson.updatedDestination.onHand, 75);

    // Verify in PostgreSQL
    if (prisma) {
      const dbDestReceived = await prisma.inventoryLevel.findFirst({
        where: { depotId: 'depot-north', skuId: 'SKU-MED-01' }
      });
      assert.equal(dbDestReceived.inTransit, 0);
      assert.equal(dbDestReceived.onHand, 75);
    }
  });

  test('HTTP Pre-Dispatch Cancellation: POST cancel (200) releases reservation', async () => {
    // Create transfer
    const createRes = await fetch(`${baseUrl}/api/transfers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        skuId: 'SKU-MED-01',
        fromDepotId: 'depot-south',
        toDepotId: 'depot-north',
        quantity: 40
      })
    });
    const createJson = await createRes.json();
    const transferId = createJson.transfer.id;

    // Cancel transfer
    const cancelRes = await fetch(`${baseUrl}/api/transfers/${transferId}/cancel`, {
      method: 'POST'
    });
    assert.equal(cancelRes.status, 200);
    const cancelJson = await cancelRes.json();
    assert.equal(cancelJson.message, 'Transfer cancelled successfully');
    assert.equal(cancelJson.transfer.status, 'CANCELLED');
    assert.equal(cancelJson.updatedSource.reserved, 0);

    // Verify in PostgreSQL
    if (prisma) {
      const dbSource = await prisma.inventoryLevel.findFirst({
        where: { depotId: 'depot-south', skuId: 'SKU-MED-01' }
      });
      assert.equal(dbSource.reserved, 0);
      assert.equal(dbSource.onHand, 190);
    }
  });

  test('HTTP Invariant Rejections: duplicate dispatch, duplicate receive, and cancelling in-transit', async () => {
    // Create transfer
    const createRes = await fetch(`${baseUrl}/api/transfers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        skuId: 'SKU-MED-01',
        fromDepotId: 'depot-south',
        toDepotId: 'depot-north',
        quantity: 30
      })
    });
    const createJson = await createRes.json();
    const transferId = createJson.transfer.id;

    // First dispatch succeeds
    const d1 = await fetch(`${baseUrl}/api/transfers/${transferId}/dispatch`, { method: 'POST' });
    assert.equal(d1.status, 200);

    // Duplicate dispatch returns HTTP 409 Conflict
    const d2 = await fetch(`${baseUrl}/api/transfers/${transferId}/dispatch`, { method: 'POST' });
    assert.equal(d2.status, 409);
    const d2Json = await d2.json();
    assert.match(d2Json.error, /Only PENDING transfers can be dispatched/);

    // Cancelling an IN_TRANSIT transfer returns HTTP 400 Bad Request
    const c1 = await fetch(`${baseUrl}/api/transfers/${transferId}/cancel`, { method: 'POST' });
    assert.equal(c1.status, 400);
    const c1Json = await c1.json();
    assert.match(c1Json.error, /Cannot cancel a transfer that is already in transit/);

    // First receive succeeds
    const r1 = await fetch(`${baseUrl}/api/transfers/${transferId}/receive`, { method: 'POST' });
    assert.equal(r1.status, 200);

    // Duplicate receive returns HTTP 409 Conflict
    const r2 = await fetch(`${baseUrl}/api/transfers/${transferId}/receive`, { method: 'POST' });
    assert.equal(r2.status, 409);
    const r2Json = await r2.json();
    assert.match(r2Json.error, /Only IN_TRANSIT transfers can be received/);
  });

  test('HTTP 404 for Nonexistent Transfer ID across all lifecycle endpoints', async () => {
    const nonexistentId = 'TRF-NONEXISTENT-9999';

    for (const action of ['dispatch', 'receive', 'cancel']) {
      const res = await fetch(`${baseUrl}/api/transfers/${nonexistentId}/${action}`, {
        method: 'POST'
      });
      assert.equal(res.status, 404, `Expected 404 for ${action}`);
      const json = await res.json();
      assert.match(json.error, /not found/i);
    }
  });

  test('HTTP 400 Validation on Malformed or Invalid Payloads', async () => {
    // Identical depots via Zod
    const resIdentical = await fetch(`${baseUrl}/api/transfers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        skuId: 'SKU-MED-01',
        fromDepotId: 'depot-north',
        toDepotId: 'depot-north',
        quantity: 10
      })
    });
    assert.equal(resIdentical.status, 400);
    const jsonIdentical = await resIdentical.json();
    assert.equal(jsonIdentical.error, 'Validation failed');
    assert.ok(jsonIdentical.details.some(d => d.message.includes('Source and destination depots must be different')));

    // Negative quantity via Zod
    const resNegative = await fetch(`${baseUrl}/api/transfers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        skuId: 'SKU-MED-01',
        fromDepotId: 'depot-south',
        toDepotId: 'depot-north',
        quantity: -5
      })
    });
    assert.equal(resNegative.status, 400);

    // Breach donor target stock
    const resDonorBreach = await fetch(`${baseUrl}/api/transfers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        skuId: 'SKU-MED-01',
        fromDepotId: 'depot-south',
        toDepotId: 'depot-north',
        quantity: 150 // South target is 100, onHand is 190. 150 > 90 surplus
      })
    });
    assert.equal(resDonorBreach.status, 400);
    const jsonDonorBreach = await resDonorBreach.json();
    assert.match(jsonDonorBreach.error, /target stock threshold/);
  });

  test('HTTP 400 Validation on Invalid Transfer ID Params across dispatch, receive, and cancel', async () => {
    // Blank/whitespace id parameter via Zod transferIdParamSchema
    for (const action of ['dispatch', 'receive', 'cancel']) {
      const res = await fetch(`${baseUrl}/api/transfers/%20/${action}`, {
        method: 'POST'
      });
      assert.equal(res.status, 400, `Expected 400 for ${action} with blank id`);
      const json = await res.json();
      assert.equal(json.error, 'Validation failed');
      assert.ok(json.details.some(d => d.message.includes('Transfer ID is required and cannot be empty')));
    }
  });

  test('Production reset requests are rejected with HTTP 403 without modifying database state', async () => {
    // 1. Stage a transfer first
    const createRes = await fetch(`${baseUrl}/api/transfers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        skuId: 'SKU-MED-01',
        fromDepotId: 'depot-south',
        toDepotId: 'depot-north',
        quantity: 25
      })
    });
    assert.equal(createRes.status, 201);
    const createJson = await createRes.json();
    const transferId = createJson.transfer.id;

    // 2. Set NODE_ENV to production
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    try {
      // 3. Attempt reset while in production
      const resetRes = await fetch(`${baseUrl}/api/inventory/reset`, {
        method: 'POST'
      });
      assert.equal(resetRes.status, 403);
      const resetJson = await resetRes.json();
      assert.equal(resetJson.error, 'Reset endpoint is disabled in production environments');

      // 4. Verify database state was NOT modified: transfer must still exist
      if (prisma) {
        const persistedTransfer = await prisma.transfer.findUnique({
          where: { id: transferId }
        });
        assert.ok(persistedTransfer, 'Transfer record must not be wiped when reset is rejected in production');

        const dbSource = await prisma.inventoryLevel.findFirst({
          where: { depotId: 'depot-south', skuId: 'SKU-MED-01' }
        });
        assert.equal(dbSource.reserved, 25, 'Source reservation must be preserved');
      }
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });

  test('Development and test reset behavior remains functional', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    try {
      const resetRes = await fetch(`${baseUrl}/api/inventory/reset`, {
        method: 'POST'
      });
      assert.equal(resetRes.status, 200);
      const resetJson = await resetRes.json();
      assert.equal(resetJson.message, 'Inventory state reset to initial synthetic baseline');
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });

  test('GET /api/inventory returns authoritative network summary with totalOnHandUnits', async () => {
    const invRes = await fetch(`${baseUrl}/api/inventory`);
    assert.equal(invRes.status, 200);
    const data = await invRes.json();

    assert.ok(data.summary);
    assert.equal(data.summary.totalOnHandUnits, 495);
    assert.equal(data.summary.inTransitUnits, 0);
    assert.equal(data.summary.reservedUnits, 0);
    assert.equal(data.summary.deficitsCount, 2);
    assert.equal(data.summary.surplusesCount, 2);
    assert.equal(data.summary.balancedCount, 2);
    assert.equal(data.summary.totalDepots, 3);
    assert.equal(data.summary.totalSkus, 2);
    assert.equal(data.summary.totalTrackedItems, 6);
    assert.equal(data.inventory.length, 6);
    assert.equal(data.depots.length, 3);
    assert.equal(data.skus.length, 2);
  });

  test('GET /api/transfers supports bounded pagination, validation, and deterministic ordering', async () => {
    // Create 2 transfers first
    const createRes1 = await fetch(`${baseUrl}/api/transfers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        skuId: 'SKU-MED-01',
        fromDepotId: 'depot-south',
        toDepotId: 'depot-north',
        quantity: 10
      })
    });
    const trf1 = await createRes1.json();

    const createRes2 = await fetch(`${baseUrl}/api/transfers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        skuId: 'SKU-IND-02',
        fromDepotId: 'depot-north',
        toDepotId: 'depot-south',
        quantity: 15
      })
    });
    const trf2 = await createRes2.json();

    // 1. Unbounded fetch preserves backward compatibility for existing unpaginated callers
    const allRes = await fetch(`${baseUrl}/api/transfers`);
    assert.equal(allRes.status, 200);
    const allData = await allRes.json();
    assert.equal(allData.count, 2);
    assert.equal(allData.transfers.length, 2);

    // Deterministic ordering: latest created is first, tie-broken by id DESC
    assert.equal(allData.transfers[0].id, trf2.transfer.id);
    assert.equal(allData.transfers[1].id, trf1.transfer.id);

    // 2. Bounded fetch: limit 1, offset 0
    const pagedRes1 = await fetch(`${baseUrl}/api/transfers?limit=1&offset=0`);
    assert.equal(pagedRes1.status, 200);
    const pagedData1 = await pagedRes1.json();
    assert.equal(pagedData1.count, 1);
    assert.equal(pagedData1.transfers[0].id, trf2.transfer.id);

    // 3. Bounded fetch: limit 1, offset 1
    const pagedRes2 = await fetch(`${baseUrl}/api/transfers?limit=1&offset=1`);
    assert.equal(pagedRes2.status, 200);
    const pagedData2 = await pagedRes2.json();
    assert.equal(pagedData2.count, 1);
    assert.equal(pagedData2.transfers[0].id, trf1.transfer.id);

    // 4. Default page size (50) applied when offset is supplied without limit
    const offsetOnlyRes = await fetch(`${baseUrl}/api/transfers?offset=0`);
    assert.equal(offsetOnlyRes.status, 200);
    const offsetOnlyData = await offsetOnlyRes.json();
    assert.equal(offsetOnlyData.count, 2);

    // 5. Page size capped at 500 when requesting excessively large limit
    const largeLimitRes = await fetch(`${baseUrl}/api/transfers?limit=1000`);
    assert.equal(largeLimitRes.status, 200);
    const largeLimitData = await largeLimitRes.json();
    assert.equal(largeLimitData.count, 2);

    // 6. HTTP 400 Validation on negative, fractional, or malformed pagination params
    const invalidParams = [
      'limit=-1',
      'limit=-10',
      'offset=-5',
      'limit=abc',
      'limit=1.5',
      'offset=2.5',
      'offset=2000000' // exceeds 1,000,000 max offset bound
    ];

    for (const param of invalidParams) {
      const res = await fetch(`${baseUrl}/api/transfers?${param}`);
      assert.equal(res.status, 400, `Expected HTTP 400 for invalid query parameter: ${param}`);
      const json = await res.json();
      assert.equal(json.error, 'Validation failed');
      assert.ok(Array.isArray(json.details) && json.details.length > 0);
    }
  });
});
