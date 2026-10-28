import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';
import {
  calculateDeliveryMetrics,
  calculateVendorSlaMetrics,
  calculateNetworkVendorOverview
} from '../src/utils/slaCalculator.js';
import { resetVendorState } from '../src/services/vendorService.js';

describe('Vendor SLA Domain Calculations & Business Logic', () => {
  const mockNow = new Date('2026-10-25T12:00:00.000Z');

  test('on-time delivery: completed on or before expected date is on-time', () => {
    const delivery = {
      id: 'DEL-TEST-01',
      vendorId: 'VND-01',
      expectedDeliveryDate: '2026-10-20T00:00:00.000Z',
      actualDeliveryDate: '2026-10-19T15:00:00.000Z',
      expectedQuantity: 100,
      receivedQuantity: 100,
      status: 'DELIVERED'
    };

    const metrics = calculateDeliveryMetrics(delivery, mockNow);
    assert.equal(metrics.isCompleted, true);
    assert.equal(metrics.isEligible, true);
    assert.equal(metrics.isOnTime, true);
    assert.equal(metrics.isInFull, true);
    assert.equal(metrics.isOtif, true);
    assert.equal(metrics.delayDays, 0);
    assert.equal(metrics.isOverdue, false);
  });

  test('late delivery: completed after expected date is marked late with delay days', () => {
    const delivery = {
      id: 'DEL-TEST-02',
      vendorId: 'VND-01',
      expectedDeliveryDate: '2026-10-15T00:00:00.000Z',
      actualDeliveryDate: '2026-10-18T12:00:00.000Z',
      expectedQuantity: 100,
      receivedQuantity: 100,
      status: 'DELIVERED'
    };

    const metrics = calculateDeliveryMetrics(delivery, mockNow);
    assert.equal(metrics.isCompleted, true);
    assert.equal(metrics.isOnTime, false);
    assert.equal(metrics.isInFull, true);
    assert.equal(metrics.isOtif, false); // Failed on-time -> not OTIF
    assert.equal(metrics.delayDays, 3); // Oct 18 - Oct 15 = 3 calendar days
  });

  test('partial delivery: received quantity less than expected fails in-full condition', () => {
    const delivery = {
      id: 'DEL-TEST-03',
      vendorId: 'VND-01',
      expectedDeliveryDate: '2026-10-15T00:00:00.000Z',
      actualDeliveryDate: '2026-10-15T00:00:00.000Z',
      expectedQuantity: 100,
      receivedQuantity: 75,
      status: 'PARTIALLY_RECEIVED'
    };

    const metrics = calculateDeliveryMetrics(delivery, mockNow);
    assert.equal(metrics.isCompleted, true);
    assert.equal(metrics.isOnTime, true);
    assert.equal(metrics.isInFull, false);
    assert.equal(metrics.isOtif, false); // Failed in-full -> not OTIF
  });

  test('overdue delivery: incomplete non-cancelled order past expected date is flagged overdue', () => {
    const delivery = {
      id: 'DEL-TEST-04',
      vendorId: 'VND-01',
      expectedDeliveryDate: '2026-10-20T00:00:00.000Z', // Past mockNow (2026-10-25)
      actualDeliveryDate: null,
      expectedQuantity: 50,
      receivedQuantity: 0,
      status: 'DELAYED'
    };

    const metrics = calculateDeliveryMetrics(delivery, mockNow);
    assert.equal(metrics.isCompleted, false);
    assert.equal(metrics.isEligible, false); // Not completed -> not in completed denominator
    assert.equal(metrics.isOverdue, true);
    assert.ok(metrics.delayDays > 0);
  });

  test('cancelled delivery: strictly excluded from historical completed denominators', () => {
    const delivery = {
      id: 'DEL-TEST-05',
      vendorId: 'VND-01',
      expectedDeliveryDate: '2026-10-10T00:00:00.000Z',
      actualDeliveryDate: null,
      expectedQuantity: 100,
      receivedQuantity: 0,
      status: 'CANCELLED'
    };

    const metrics = calculateDeliveryMetrics(delivery, mockNow);
    assert.equal(metrics.isCancelled, true);
    assert.equal(metrics.isCompleted, false);
    assert.equal(metrics.isEligible, false);
    assert.equal(metrics.isOverdue, false); // Cancelled cannot be overdue
  });

  test('zero eligible deliveries: returns safe 0 rates without NaN or Infinity', () => {
    const vendor = {
      id: 'VND-ZERO',
      name: 'Zero Delivery Vendor',
      targetOtifRate: 95.0
    };

    const deliveries = [
      {
        id: 'DEL-FUTURE',
        vendorId: 'VND-ZERO',
        expectedDeliveryDate: '2026-11-20T00:00:00.000Z',
        actualDeliveryDate: null,
        expectedQuantity: 50,
        receivedQuantity: 0,
        status: 'SCHEDULED'
      }
    ];

    const result = calculateVendorSlaMetrics(vendor, deliveries, mockNow);
    assert.equal(result.metrics.eligibleDeliveries, 0);
    assert.equal(result.metrics.onTimeRate, 0);
    assert.equal(result.metrics.inFullRate, 0);
    assert.equal(result.metrics.otifRate, 0);
    assert.equal(Number.isNaN(result.metrics.onTimeRate), false);
    assert.equal(Number.isNaN(result.metrics.otifRate), false);
    assert.equal(result.metrics.status, 'NO_HISTORY');
  });

  test('SLA compliance boundaries: classifies COMPLIANT, AT_RISK, and BREACH', () => {
    const vendor = {
      id: 'VND-TIERS',
      name: 'Tier Test Vendor',
      targetOtifRate: 90.0
    };

    // Case 1: 100% OTIF -> COMPLIANT
    const compliantDeliveries = [
      {
        id: 'D1',
        vendorId: 'VND-TIERS',
        expectedDeliveryDate: '2026-10-10T00:00:00.000Z',
        actualDeliveryDate: '2026-10-10T00:00:00.000Z',
        expectedQuantity: 100,
        receivedQuantity: 100,
        status: 'DELIVERED'
      }
    ];
    const compliant = calculateVendorSlaMetrics(vendor, compliantDeliveries, mockNow);
    assert.equal(compliant.metrics.status, 'COMPLIANT');

    // Case 2: 85% OTIF (target 90%, gap is -5%, which is within 10% threshold) -> AT_RISK
    const atRiskDeliveries = [];
    for (let i = 0; i < 20; i++) {
      atRiskDeliveries.push({
        id: `D-AT-${i}`,
        vendorId: 'VND-TIERS',
        expectedDeliveryDate: '2026-10-10T00:00:00.000Z',
        actualDeliveryDate: i < 17 ? '2026-10-10T00:00:00.000Z' : '2026-10-15T00:00:00.000Z',
        expectedQuantity: 100,
        receivedQuantity: 100,
        status: 'DELIVERED'
      });
    }
    const atRisk = calculateVendorSlaMetrics(vendor, atRiskDeliveries, mockNow);
    assert.equal(atRisk.metrics.otifRate, 85.0);
    assert.equal(atRisk.metrics.status, 'AT_RISK');

    // Case 3: 50% OTIF -> BREACH
    const breachDeliveries = [
      {
        id: 'D-B1',
        vendorId: 'VND-TIERS',
        expectedDeliveryDate: '2026-10-10T00:00:00.000Z',
        actualDeliveryDate: '2026-10-10T00:00:00.000Z',
        expectedQuantity: 100,
        receivedQuantity: 100,
        status: 'DELIVERED'
      },
      {
        id: 'D-B2',
        vendorId: 'VND-TIERS',
        expectedDeliveryDate: '2026-10-10T00:00:00.000Z',
        actualDeliveryDate: '2026-10-15T00:00:00.000Z', // Late
        expectedQuantity: 100,
        receivedQuantity: 100,
        status: 'DELIVERED'
      }
    ];
    const breach = calculateVendorSlaMetrics(vendor, breachDeliveries, mockNow);
    assert.equal(breach.metrics.otifRate, 50.0);
    assert.equal(breach.metrics.status, 'BREACH');
  });

  test('calculateNetworkVendorOverview aggregates network statistics across vendors', () => {
    const vendors = [
      { id: 'V1', name: 'Vendor 1', targetOtifRate: 95, isActive: true },
      { id: 'V2', name: 'Vendor 2', targetOtifRate: 90, isActive: false }
    ];
    const deliveries = [
      {
        id: 'D1',
        vendorId: 'V1',
        expectedDeliveryDate: '2026-10-10T00:00:00.000Z',
        actualDeliveryDate: '2026-10-10T00:00:00.000Z',
        expectedQuantity: 100,
        receivedQuantity: 100,
        status: 'DELIVERED'
      },
      {
        id: 'D2',
        vendorId: 'V2',
        expectedDeliveryDate: '2026-10-10T00:00:00.000Z',
        actualDeliveryDate: '2026-10-12T00:00:00.000Z',
        expectedQuantity: 100,
        receivedQuantity: 100,
        status: 'DELIVERED'
      }
    ];

    const overview = calculateNetworkVendorOverview(vendors, deliveries, mockNow);
    assert.equal(overview.totalVendors, 2);
    assert.equal(overview.activeVendors, 1);
    assert.equal(overview.totalEligible, 2);
    assert.equal(overview.totalOnTime, 1);
    assert.equal(overview.networkOnTimeRate, 50.0);
    assert.equal(overview.networkOtifRate, 50.0);
  });
});

describe('Vendor SLA HTTP API Endpoints', () => {
  let server;
  let baseUrl;

  beforeEach(async () => {
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
    if (server) {
      await new Promise(resolve => server.close(resolve));
    }
  });

  test('GET /api/vendors returns list of vendors with scorecards and overview', async () => {
    const res = await fetch(`${baseUrl}/api/vendors`);
    assert.equal(res.status, 200);

    const json = await res.json();
    assert.ok(json.overview);
    assert.ok(Array.isArray(json.vendors));
    assert.equal(json.vendors.length, 3);

    const apex = json.vendors.find(v => v.id === 'VND-APEX-01');
    assert.ok(apex);
    assert.equal(apex.metrics.otifRate, 100.0);
    assert.equal(apex.metrics.status, 'COMPLIANT');

    const nordic = json.vendors.find(v => v.id === 'VND-NORDIC-02');
    assert.ok(nordic);
    assert.equal(nordic.metrics.status, 'BREACH');
    assert.equal(nordic.metrics.overdueDeliveries, 1);
  });

  test('GET /api/vendors/:id returns vendor scorecard and delivery history', async () => {
    const res = await fetch(`${baseUrl}/api/vendors/VND-APEX-01`);
    assert.equal(res.status, 200);

    const json = await res.json();
    assert.equal(json.id, 'VND-APEX-01');
    assert.equal(json.name, 'Apex Thermal Technologies');
    assert.ok(Array.isArray(json.deliveries));
    assert.equal(json.deliveries.length, 4);
  });

  test('GET /api/vendors/:id returns 404 for unknown vendor ID', async () => {
    const res = await fetch(`${baseUrl}/api/vendors/NON-EXISTENT-VENDOR`);
    assert.equal(res.status, 404);

    const json = await res.json();
    assert.ok(json.error.includes('not found'));
  });

  test('POST /api/vendors validates payload and registers new vendor', async () => {
    // 1. Invalid payload: missing name
    const invalidRes = await fetch(`${baseUrl}/api/vendors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 'VND-NEW-01'
      })
    });
    assert.equal(invalidRes.status, 400);

    // 2. Valid payload
    const validRes = await fetch(`${baseUrl}/api/vendors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 'VND-NEW-01',
        name: 'Delta Precision Sensors',
        leadTimeDays: 7,
        targetOtifRate: 94.5,
        category: 'Sensors'
      })
    });
    assert.equal(validRes.status, 201);
    const createdJson = await validRes.json();
    assert.equal(createdJson.vendor.id, 'VND-NEW-01');
    assert.equal(createdJson.vendor.leadTimeDays, 7);

    // 3. Duplicate registration rejected with 409
    const dupRes = await fetch(`${baseUrl}/api/vendors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 'VND-NEW-01',
        name: 'Delta Duplicate',
        leadTimeDays: 7
      })
    });
    assert.equal(dupRes.status, 409);
  });

  test('PATCH /api/vendors/:id updates vendor SLA configuration', async () => {
    const res = await fetch(`${baseUrl}/api/vendors/VND-APEX-01`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetOtifRate: 98.0,
        leadTimeDays: 3
      })
    });
    assert.equal(res.status, 200);

    const json = await res.json();
    assert.equal(json.vendor.targetOtifRate, 98.0);
    assert.equal(json.vendor.leadTimeDays, 3);
  });

  test('GET /api/vendors/deliveries supports filtering by vendorId and status', async () => {
    // 1. Filter by vendorId
    const vendorRes = await fetch(`${baseUrl}/api/vendors/deliveries?vendorId=VND-APEX-01`);
    assert.equal(vendorRes.status, 200);
    const vendorJson = await vendorRes.json();
    assert.equal(vendorJson.count, 4);
    assert.ok(vendorJson.deliveries.every(d => d.vendorId === 'VND-APEX-01'));

    // 2. Filter by status: PARTIALLY_RECEIVED
    const statusRes = await fetch(`${baseUrl}/api/vendors/deliveries?status=PARTIALLY_RECEIVED`);
    assert.equal(statusRes.status, 200);
    const statusJson = await statusRes.json();
    assert.equal(statusJson.count, 1);
    assert.equal(statusJson.deliveries[0].id, 'DEL-2026-007');

    // 3. Filter by virtual status: OVERDUE
    const overdueRes = await fetch(`${baseUrl}/api/vendors/deliveries?status=OVERDUE`);
    assert.equal(overdueRes.status, 200);
    const overdueJson = await overdueRes.json();
    assert.equal(overdueJson.count, 1);
    assert.equal(overdueJson.deliveries[0].id, 'DEL-2026-008');
  });

  test('POST /api/vendors/deliveries creates new commitment and enforces vendor existence', async () => {
    // 1. Unknown vendor rejected with 400
    const unknownRes = await fetch(`${baseUrl}/api/vendors/deliveries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vendorId: 'VND-UNKNOWN-99',
        poNumber: 'PO-TEST-99',
        expectedDeliveryDate: '2026-11-15T00:00:00.000Z',
        expectedQuantity: 50
      })
    });
    assert.equal(unknownRes.status, 400);

    // 2. Valid delivery creation
    const validRes = await fetch(`${baseUrl}/api/vendors/deliveries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vendorId: 'VND-APEX-01',
        poNumber: 'PO-TEST-01',
        skuId: 'SKU-MED-01',
        depotId: 'depot-north',
        expectedDeliveryDate: '2026-11-15T00:00:00.000Z',
        expectedQuantity: 100
      })
    });
    assert.equal(validRes.status, 201);
    const createdJson = await validRes.json();
    assert.equal(createdJson.delivery.vendorId, 'VND-APEX-01');
    assert.equal(createdJson.delivery.status, 'SCHEDULED');
  });

  test('PATCH /api/vendors/deliveries/:id updates delivery progress and intake', async () => {
    const res = await fetch(`${baseUrl}/api/vendors/deliveries/DEL-2026-004`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        actualDeliveryDate: '2026-11-04T10:00:00.000Z',
        receivedQuantity: 120,
        status: 'DELIVERED',
        notes: 'Delivered 1 day ahead of schedule'
      })
    });
    assert.equal(res.status, 200);

    const json = await res.json();
    assert.equal(json.delivery.status, 'DELIVERED');
    assert.equal(json.delivery.receivedQuantity, 120);
    assert.equal(json.delivery.metrics.isOnTime, true);
    assert.equal(json.delivery.metrics.isOtif, true);
  });

  test('POST /api/vendors/reset restores synthetic vendor state', async () => {
    // Mutate state by adding a vendor
    await fetch(`${baseUrl}/api/vendors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 'VND-TEMP',
        name: 'Temporary Vendor',
        leadTimeDays: 2
      })
    });

    // Reset
    const resetRes = await fetch(`${baseUrl}/api/vendors/reset`, {
      method: 'POST'
    });
    assert.equal(resetRes.status, 200);

    // Verify temp vendor is gone
    const listRes = await fetch(`${baseUrl}/api/vendors`);
    const listJson = await listRes.json();
    assert.equal(listJson.vendors.length, 3);
  });
});
