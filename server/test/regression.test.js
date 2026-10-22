import { test, beforeEach, afterEach, describe } from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';
import {
  resetState,
  getInventoryStatus,
  getTransferOpportunities,
  executeTransfer
} from '../src/services/inventoryService.js';

describe('Phase 1 Regression Tests — Business Logic & Error Handling', () => {
  beforeEach(async () => {
    await resetState();
  });

  test('Bug 1: Transfer recommendations must NOT leave donor below its target stock', async () => {
    // Initial state:
    // South SKU-MED-01: onHand = 190, targetStock = 100, safetyStock = 40. Surplus above target = 90.
    // North SKU-MED-01: onHand = 25, targetStock = 120, safetyStock = 50. Deficit to target = 95.
    const opps = await getTransferOpportunities();
    const medOpp = opps.find(o => o.skuId === 'SKU-MED-01' && o.fromDepotId === 'depot-south' && o.toDepotId === 'depot-north');
    assert.ok(medOpp, 'Opportunity should exist');

    // BUG CHECK: The recommendation must NOT recommend 95, because 190 - 95 = 95 (below donor target stock 100).
    // Donor surplus above target is 190 - 100 = 90.
    assert.equal(
      medOpp.recommendedQuantity,
      90,
      `Recommended quantity (${medOpp.recommendedQuantity}) must equal donor surplus above target (90), not deplete donor below target stock (100)`
    );
  });

  test('Bug 2: executeTransfer must reject transfers exceeding recipient remaining target-stock capacity', async () => {
    // North SKU-MED-01: onHand = 25, targetStock = 120. Remaining capacity to target is 95 units.
    // South SKU-MED-01: onHand = 190, safetyStock = 40 (safe donor buffer is 150 units).
    // Transferring 100 units would leave North with 125 units (> targetStock 120).
    await assert.rejects(
      async () => {
        await executeTransfer({
          skuId: 'SKU-MED-01',
          fromDepotId: 'depot-south',
          toDepotId: 'depot-north',
          quantity: 100 // exceeds target capacity 95
        });
      },
      {
        message: /target stock/i
      },
      'Transfer exceeding recipient target stock must be rejected'
    );
  });

  test('Bug 3: Multiple donors must not duplicate allocation of the same recipient shortage', async () => {
    // Synthetic scenario with two donors and one deficit recipient:
    // Recipient needs 50 units (targetStock 75 - onHand 25 = 50)
    // Donor A has 40 units surplus above target (onHand 140 - target 100 = 40)
    // Donor B has 40 units surplus above target (onHand 140 - target 100 = 40)
    const customItems = [
      {
        depotId: 'depot-north',
        depotName: 'North Hub',
        skuId: 'SKU-TEST',
        skuName: 'Test SKU',
        onHand: 25,
        safetyStock: 50,
        targetStock: 75,
        status: 'DEFICIT',
        availableSurplus: 0,
        deficitToSafety: 25,
        deficitToTarget: 50
      },
      {
        depotId: 'depot-south',
        depotName: 'South Hub',
        skuId: 'SKU-TEST',
        skuName: 'Test SKU',
        onHand: 140,
        safetyStock: 40,
        targetStock: 100,
        status: 'SURPLUS',
        availableSurplus: 100,
        deficitToSafety: 0,
        deficitToTarget: 0
      },
      {
        depotId: 'depot-east',
        depotName: 'East Hub',
        skuId: 'SKU-TEST',
        skuName: 'Test SKU',
        onHand: 140,
        safetyStock: 40,
        targetStock: 100,
        status: 'SURPLUS',
        availableSurplus: 100,
        deficitToSafety: 0,
        deficitToTarget: 0
      }
    ];

    const opps = await getTransferOpportunities(customItems);
    const testOpps = opps.filter(o => o.skuId === 'SKU-TEST' && o.toDepotId === 'depot-north');
    const totalRecommended = testOpps.reduce((sum, o) => sum + o.recommendedQuantity, 0);

    assert.equal(
      totalRecommended,
      50,
      `Total recommended quantity (${totalRecommended}) across multiple donors must equal the recipient shortage (50) without duplicate allocation`
    );
    assert.equal(testOpps.length, 2, 'Should create 2 split transfer recommendations');
    assert.equal(testOpps[0].recommendedQuantity, 40, 'First donor allocates full surplus (40)');
    assert.equal(testOpps[1].recommendedQuantity, 10, 'Second donor allocates only remaining shortage (10)');
  });

  describe('HTTP API Error Handling & Consistency', () => {
    let server;
    let baseUrl;

    beforeEach(async () => {
      await new Promise(resolve => {
        server = app.listen(0, () => {
          const port = server.address().port;
          baseUrl = `http://127.0.0.1:${port}`;
          resolve();
        });
      });
    });

    afterEach(async () => {
      await new Promise(resolve => server.close(resolve));
    });

    test('Bug 4a: Malformed JSON body returns JSON error response, not HTML', async () => {
      const res = await fetch(`${baseUrl}/api/transfers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: '{"skuId": "SKU-MED-01", malformed_json_here'
      });

      assert.equal(res.status, 400);
      const contentType = res.headers.get('content-type');
      assert.ok(
        contentType && contentType.includes('application/json'),
        `Content-Type must be application/json, got ${contentType}`
      );

      const json = await res.json();
      assert.ok(json.error, 'Response JSON must contain error field');
    });

    test('Bug 4b: Unknown routes return JSON 404 response, not HTML', async () => {
      const res = await fetch(`${baseUrl}/api/nonexistent-route-12345`);
      assert.equal(res.status, 404);
      const contentType = res.headers.get('content-type');
      assert.ok(
        contentType && contentType.includes('application/json'),
        `Content-Type must be application/json, got ${contentType}`
      );

      const json = await res.json();
      assert.ok(json.error, 'Response JSON must contain error field');
    });
  });
});
