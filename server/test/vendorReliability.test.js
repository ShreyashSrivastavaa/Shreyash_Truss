import { test, beforeEach, afterEach, describe } from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';
import { resetVendorState } from '../src/services/vendorService.js';

describe('Vendor SLA Reliability & Database Outage Failure Modes (Commit 4)', () => {
  let server;
  let baseUrl;

  beforeEach(async () => {
    app.locals.allowAnonymousMutations = true;
    await resetVendorState();
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

  test('GET /api/vendors returns 503 DATABASE_UNAVAILABLE when database is unreachable', async () => {
    const fakeSecret = 'vendor_db_password_123';
    const fakeUrl = `postgresql://vendor_user:${fakeSecret}@127.0.0.1:54339/nexus_inventory`;
    const connectionError = new Error(`Can't reach database server at ${fakeUrl}`);
    connectionError.name = 'PrismaClientInitializationError';
    connectionError.code = 'P1001';

    const failingClient = {
      vendor: { findMany: () => Promise.reject(connectionError) },
      vendorDelivery: { findMany: () => Promise.reject(connectionError) }
    };

    app.locals.prisma = failingClient;

    const res = await fetch(`${baseUrl}/api/vendors`);
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

  test('GET /api/vendors/deliveries returns 503 DATABASE_UNAVAILABLE on database connection failure', async () => {
    const connectionError = new Error('Connection closed unexpectedly by database server');
    connectionError.name = 'PrismaClientKnownRequestError';
    connectionError.code = 'P1017';

    const failingClient = {
      vendorDelivery: { findMany: () => Promise.reject(connectionError) }
    };

    app.locals.prisma = failingClient;

    const res = await fetch(`${baseUrl}/api/vendors/deliveries`);
    assert.equal(res.status, 503);
    const body = await res.json();
    assert.deepEqual(body, {
      error: 'Database service is temporarily unavailable',
      code: 'DATABASE_UNAVAILABLE'
    });
  });

  test('Domain rejections preserve exact 4xx status codes through centralized error handler (not 503)', async () => {
    // 404 for unknown vendor ID
    const resNotFound = await fetch(`${baseUrl}/api/vendors/VND-NONEXISTENT-9999`);
    assert.equal(resNotFound.status, 404);
    const notFoundBody = await resNotFound.json();
    assert.match(notFoundBody.error, /not found/i);

    // 400 for delivery to nonexistent vendor
    const resInvalidVendor = await fetch(`${baseUrl}/api/vendors/deliveries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vendorId: 'VND-UNKNOWN-999',
        poNumber: 'PO-2026-999',
        expectedDeliveryDate: '2026-12-01T00:00:00.000Z',
        expectedQuantity: 50
      })
    });
    assert.equal(resInvalidVendor.status, 400);
    const invalidBody = await resInvalidVendor.json();
    assert.match(invalidBody.error, /does not exist/i);
  });
});
