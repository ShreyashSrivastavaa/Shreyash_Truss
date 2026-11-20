import { test, beforeEach, afterEach, describe } from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';
import { resetState } from '../src/services/inventoryService.js';

describe('Inventory Reliability & Database Outage Failure Modes (Commit 3)', () => {
  let server;
  let baseUrl;

  beforeEach(async () => {
    app.locals.allowAnonymousMutations = true;
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
    delete app.locals.allowAnonymousMutations;
    delete app.locals.prisma;
    if (server) {
      await new Promise(resolve => server.close(resolve));
    }
  });

  test('GET /api/inventory returns 503 DATABASE_UNAVAILABLE when database connection fails', async () => {
    const fakeSecret = 'sensitive_db_password_xyz';
    const fakeUrl = `postgresql://app_user:${fakeSecret}@127.0.0.1:54339/nexus_inventory`;
    const connectionError = new Error(`Can't reach database server at ${fakeUrl}`);
    connectionError.name = 'PrismaClientInitializationError';
    connectionError.code = 'P1001';

    const failingClient = {
      depot: { findMany: () => Promise.reject(connectionError) },
      sku: { findMany: () => Promise.reject(connectionError) },
      inventoryLevel: { findMany: () => Promise.reject(connectionError) }
    };

    app.locals.prisma = failingClient;

    const res = await fetch(`${baseUrl}/api/inventory`);
    assert.equal(res.status, 503, 'Must return HTTP 503 when database is unreachable');

    const body = await res.json();
    assert.deepEqual(body, {
      error: 'Database service is temporarily unavailable',
      code: 'DATABASE_UNAVAILABLE'
    });

    const raw = JSON.stringify(body);
    assert.ok(!raw.includes(fakeSecret), 'Response body must not leak DB credentials');
    assert.ok(!raw.includes(fakeUrl), 'Response body must not leak DB URL');
  });

  test('POST /api/transfers returns 503 DATABASE_UNAVAILABLE when transaction encounters connection failure', async () => {
    const connectionError = new Error("Connection closed unexpectedly by database server");
    connectionError.name = 'PrismaClientKnownRequestError';
    connectionError.code = 'P1017';

    const failingClient = {
      $transaction: () => Promise.reject(connectionError)
    };

    app.locals.prisma = failingClient;

    const res = await fetch(`${baseUrl}/api/transfers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        skuId: 'SKU-MED-01',
        fromDepotId: 'depot-south',
        toDepotId: 'depot-north',
        quantity: 10
      })
    });

    assert.equal(res.status, 503, 'Must return HTTP 503 on database transaction failure');
    const body = await res.json();
    assert.deepEqual(body, {
      error: 'Database service is temporarily unavailable',
      code: 'DATABASE_UNAVAILABLE'
    });
  });

  test('GET /api/transfers/opportunities returns 503 DATABASE_UNAVAILABLE on database failure', async () => {
    const connectionError = new Error("Timed out fetching a new connection from the connection pool of 5 connections");
    connectionError.name = 'PrismaClientKnownRequestError';
    connectionError.code = 'P1008';

    const failingClient = {
      inventoryLevel: { findMany: () => Promise.reject(connectionError) },
      transfer: { findMany: () => Promise.reject(connectionError) }
    };

    app.locals.prisma = failingClient;

    const res = await fetch(`${baseUrl}/api/transfers/opportunities`);
    assert.equal(res.status, 503);
    const body = await res.json();
    assert.deepEqual(body, {
      error: 'Database service is temporarily unavailable',
      code: 'DATABASE_UNAVAILABLE'
    });
  });

  test('Domain rejections preserve exact 4xx status codes through centralized error handler (not 503)', async () => {
    // 400 for self-transfer
    const resSameDepot = await fetch(`${baseUrl}/api/transfers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        skuId: 'SKU-MED-01',
        fromDepotId: 'depot-south',
        toDepotId: 'depot-south',
        quantity: 10
      })
    });
    assert.equal(resSameDepot.status, 400, 'Same depot must return 400');
    const sameDepotBody = await resSameDepot.json();
    assert.match(JSON.stringify(sameDepotBody), /must be different/i);

    // 404 for unknown transfer ID dispatch
    const resNotFound = await fetch(`${baseUrl}/api/transfers/TRF-NONEXISTENT-9999/dispatch`, {
      method: 'POST'
    });
    assert.equal(resNotFound.status, 404, 'Nonexistent transfer must return 404');
    const notFoundBody = await resNotFound.json();
    assert.match(notFoundBody.error, /not found/i);
  });
});
