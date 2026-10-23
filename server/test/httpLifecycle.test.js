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
});
