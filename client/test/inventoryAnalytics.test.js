import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateNetworkTotals,
  calculateDepotAnalytics,
  calculateSkuDistribution
} from '../src/utils/inventoryAnalytics.js';

describe('Inventory Analytics Domain Logic & Business Rules', () => {
  const sampleDepots = [
    { id: 'depot-north', name: 'North Logistics Hub', city: 'Chicago, IL', region: 'Midwest' },
    { id: 'depot-south', name: 'South Distribution Center', city: 'Dallas, TX', region: 'South' },
    { id: 'depot-east', name: 'East Gateway Depot', city: 'Philadelphia, PA', region: 'East' }
  ];

  const sampleSkus = [
    { id: 'SKU-MED-01', name: 'Critical Pharmaceuticals', unit: 'cartons', unitCost: 150.00 },
    { id: 'SKU-IND-02', name: 'Industrial Temperature Relay', unit: 'units', unitCost: 80.00 }
  ];

  const sampleInventory = [
    // SKU-MED-01: Deficit in North, Surplus in South, Balanced in East
    {
      depotId: 'depot-north',
      depotName: 'North Logistics Hub',
      skuId: 'SKU-MED-01',
      skuName: 'Critical Pharmaceuticals',
      onHand: 25,
      reserved: 0,
      inTransit: 0,
      safetyStock: 50,
      targetStock: 120,
      status: 'DEFICIT',
      availableSurplus: 0,
      surplusAboveTarget: 0,
      deficitToSafety: 25,
      deficitToTarget: 95
    },
    {
      depotId: 'depot-south',
      depotName: 'South Distribution Center',
      skuId: 'SKU-MED-01',
      skuName: 'Critical Pharmaceuticals',
      onHand: 190,
      reserved: 50, // 50 units reserved for staged transfer
      inTransit: 0,
      safetyStock: 40,
      targetStock: 100,
      status: 'SURPLUS',
      availableSurplus: 40, // 190 - 50 reserved - 100 target = 40
      surplusAboveTarget: 40,
      deficitToSafety: 0,
      deficitToTarget: 0
    },
    {
      depotId: 'depot-east',
      depotName: 'East Gateway Depot',
      skuId: 'SKU-MED-01',
      skuName: 'Critical Pharmaceuticals',
      onHand: 70,
      reserved: 0,
      inTransit: 15, // 15 units inbound in-transit
      safetyStock: 30,
      targetStock: 70,
      status: 'BALANCED',
      availableSurplus: 0,
      surplusAboveTarget: 0,
      deficitToSafety: 0,
      deficitToTarget: 0
    },
    // SKU-IND-02: Surplus in North, Deficit in South, Balanced in East
    {
      depotId: 'depot-north',
      depotName: 'North Logistics Hub',
      skuId: 'SKU-IND-02',
      skuName: 'Industrial Temperature Relay',
      onHand: 150,
      reserved: 0,
      inTransit: 0,
      safetyStock: 30,
      targetStock: 80,
      status: 'SURPLUS',
      availableSurplus: 70,
      surplusAboveTarget: 70,
      deficitToSafety: 0,
      deficitToTarget: 0
    },
    {
      depotId: 'depot-south',
      depotName: 'South Distribution Center',
      skuId: 'SKU-IND-02',
      skuName: 'Industrial Temperature Relay',
      onHand: 20,
      reserved: 0,
      inTransit: 0,
      safetyStock: 35,
      targetStock: 80,
      status: 'DEFICIT',
      availableSurplus: 0,
      surplusAboveTarget: 0,
      deficitToSafety: 15,
      deficitToTarget: 60
    },
    {
      depotId: 'depot-east',
      depotName: 'East Gateway Depot',
      skuId: 'SKU-IND-02',
      skuName: 'Industrial Temperature Relay',
      onHand: 40,
      reserved: 0,
      inTransit: 0,
      safetyStock: 25,
      targetStock: 60,
      status: 'BALANCED',
      availableSurplus: 0,
      surplusAboveTarget: 0,
      deficitToSafety: 0,
      deficitToTarget: 20
    }
  ];

  describe('calculateNetworkTotals', () => {
    test('accurately aggregates physical on-hand, reserved, and in-transit inventory', () => {
      const totals = calculateNetworkTotals(null, sampleInventory);

      // On-hand: 25 + 190 + 70 + 150 + 20 + 40 = 495
      assert.strictEqual(totals.totalOnHand, 495, 'Total on-hand must sum physical stock in depots');
      assert.strictEqual(totals.totalReserved, 50, 'Total reserved must equal staged pending quantity');
      assert.strictEqual(totals.totalInTransit, 15, 'Total in-transit must equal dispatched freight');
      assert.strictEqual(totals.totalNetAvailable, 445, 'Net available must be on-hand minus reserved (495 - 50 = 445)');
      assert.strictEqual(totals.totalPhysicalNetworkStock, 510, 'Network stock must equal on-hand + in-transit (495 + 15 = 510)');

      // Position counts
      assert.strictEqual(totals.deficitsCount, 2, 'Two positions in DEFICIT');
      assert.strictEqual(totals.surplusesCount, 2, 'Two positions in SURPLUS');
      assert.strictEqual(totals.balancedCount, 2, 'Two positions in BALANCED');
      assert.strictEqual(totals.totalTrackedItems, 6, 'Six total tracked items');
    });

    test('prioritizes authoritative backend summary figures when provided', () => {
      const backendSummary = {
        totalDepots: 3,
        totalSkus: 2,
        totalTrackedItems: 6,
        totalOnHandUnits: 495,
        reservedUnits: 50,
        inTransitUnits: 15,
        deficitsCount: 2,
        surplusesCount: 2,
        balancedCount: 2
      };

      const totals = calculateNetworkTotals(backendSummary, sampleInventory);
      assert.strictEqual(totals.totalOnHand, 495);
      assert.strictEqual(totals.totalReserved, 50);
      assert.strictEqual(totals.totalInTransit, 15);
      assert.strictEqual(totals.totalNetAvailable, 445);
      assert.strictEqual(totals.deficitsCount, 2);
    });

    test('handles empty or missing inventory gracefully with zero defaults (no NaN)', () => {
      const emptyTotals = calculateNetworkTotals(null, null);
      assert.strictEqual(emptyTotals.totalOnHand, 0);
      assert.strictEqual(emptyTotals.totalReserved, 0);
      assert.strictEqual(emptyTotals.totalInTransit, 0);
      assert.strictEqual(emptyTotals.totalNetAvailable, 0);
      assert.strictEqual(emptyTotals.totalPhysicalNetworkStock, 0);
      assert.strictEqual(emptyTotals.deficitsCount, 0);
      assert.strictEqual(isNaN(emptyTotals.totalOnHand), false);
    });
  });

  describe('calculateDepotAnalytics', () => {
    test('computes depot-wise surplus and deficit against target stock', () => {
      const depotAnalytics = calculateDepotAnalytics(sampleDepots, sampleInventory);
      assert.strictEqual(depotAnalytics.length, 3);

      // North Depot:
      // SKU-MED-01: 25 on-hand, 120 target -> deficitToTarget = 95, deficitToSafety = 25
      // SKU-IND-02: 150 on-hand, 80 target -> surplusAboveTarget = 70
      const north = depotAnalytics.find(d => d.depotId === 'depot-north');
      assert.ok(north);
      assert.strictEqual(north.onHand, 175, 'North total on-hand is 25 + 150 = 175');
      assert.strictEqual(north.targetStock, 200, 'North total target is 120 + 80 = 200');
      assert.strictEqual(north.surplusAboveTarget, 70, 'North has 70 surplus above target');
      assert.strictEqual(north.deficitToTarget, 95, 'North has 95 deficit to target');
      assert.strictEqual(north.deficitToSafety, 25, 'North has 25 deficit to safety');
      assert.strictEqual(north.targetVariance, -25, 'North target variance is 175 - 200 = -25');
      assert.strictEqual(north.percentOfTarget, 88, 'North is at 88% of target stock');
    });

    test('classifies depot status according to business rules without false balanced labeling', () => {
      const depotAnalytics = calculateDepotAnalytics(sampleDepots, sampleInventory);

      const north = depotAnalytics.find(d => d.depotId === 'depot-north');
      const south = depotAnalytics.find(d => d.depotId === 'depot-south');
      const east = depotAnalytics.find(d => d.depotId === 'depot-east');

      // North has 1 deficit and 1 surplus -> MIXED
      assert.strictEqual(north.status, 'MIXED', 'Depot with both deficit and surplus SKUs must be labeled MIXED');
      assert.notStrictEqual(north.status, 'BALANCED', 'Depot with deficit/surplus must NOT be labeled BALANCED');

      // South has 1 surplus and 1 deficit -> MIXED
      assert.strictEqual(south.status, 'MIXED');

      // East has 2 balanced positions -> BALANCED
      assert.strictEqual(east.status, 'BALANCED', 'Depot where all SKUs are balanced must be labeled BALANCED');
    });

    test('correctly identifies pure DEFICIT and pure SURPLUS depots', () => {
      const customInventory = [
        {
          depotId: 'depot-north',
          skuId: 'SKU-01',
          onHand: 10,
          safetyStock: 30,
          targetStock: 50,
          status: 'DEFICIT',
          surplusAboveTarget: 0,
          deficitToTarget: 40
        },
        {
          depotId: 'depot-south',
          skuId: 'SKU-01',
          onHand: 100,
          safetyStock: 30,
          targetStock: 50,
          status: 'SURPLUS',
          surplusAboveTarget: 50,
          deficitToTarget: 0
        }
      ];

      const analytics = calculateDepotAnalytics(
        [sampleDepots[0], sampleDepots[1]],
        customInventory
      );

      const north = analytics.find(d => d.depotId === 'depot-north');
      const south = analytics.find(d => d.depotId === 'depot-south');

      assert.strictEqual(north.status, 'DEFICIT', 'Depot with only deficit positions must be DEFICIT');
      assert.strictEqual(south.status, 'SURPLUS', 'Depot with only surplus positions must be SURPLUS');
    });

    test('handles empty depot lists without error', () => {
      assert.deepStrictEqual(calculateDepotAnalytics([], sampleInventory), []);
      assert.deepStrictEqual(calculateDepotAnalytics(null, null), []);
    });
  });

  describe('calculateSkuDistribution', () => {
    test('calculates SKU-wise inventory distribution and depot shares', () => {
      const skuDistribution = calculateSkuDistribution(sampleSkus, sampleInventory);
      assert.strictEqual(skuDistribution.length, 2);

      const medSku = skuDistribution.find(s => s.skuId === 'SKU-MED-01');
      assert.ok(medSku);

      // On-hand: 25 (North) + 190 (South) + 70 (East) = 285
      assert.strictEqual(medSku.totalOnHand, 285);
      assert.strictEqual(medSku.totalReserved, 50);
      assert.strictEqual(medSku.totalInTransit, 15);
      assert.strictEqual(medSku.totalNetAvailable, 235); // 285 - 50 = 235

      // Financial valuation: 285 * 150 = 42750
      assert.strictEqual(medSku.totalValuation, 42750);

      // Depot breakdowns
      assert.strictEqual(medSku.depotBreakdown.length, 3);
      const southItem = medSku.depotBreakdown.find(d => d.depotId === 'depot-south');
      // South share: 190 / 285 = 66.66% -> 67%
      assert.strictEqual(southItem.sharePercent, 67);
      assert.strictEqual(southItem.onHand, 190);
      assert.strictEqual(southItem.status, 'SURPLUS');

      const northItem = medSku.depotBreakdown.find(d => d.depotId === 'depot-north');
      // North share: 25 / 285 = 8.77% -> 9%
      assert.strictEqual(northItem.sharePercent, 9);
      assert.strictEqual(northItem.onHand, 25);
      assert.strictEqual(northItem.status, 'DEFICIT');
    });

    test('handles SKUs with zero inventory without division by zero', () => {
      const zeroInventory = [
        {
          depotId: 'depot-north',
          skuId: 'SKU-ZERO',
          onHand: 0,
          reserved: 0,
          inTransit: 0,
          targetStock: 50,
          status: 'DEFICIT'
        }
      ];

      const zeroSku = [{ id: 'SKU-ZERO', name: 'Zero Stock Sku', unit: 'units', unitCost: 10 }];
      const result = calculateSkuDistribution(zeroSku, zeroInventory);

      assert.strictEqual(result[0].totalOnHand, 0);
      assert.strictEqual(result[0].totalValuation, 0);
      assert.strictEqual(result[0].depotBreakdown[0].sharePercent, 0, 'Must safely evaluate to 0% share');
      assert.strictEqual(isNaN(result[0].depotBreakdown[0].sharePercent), false);
    });

    test('handles empty or null skus gracefully', () => {
      assert.deepStrictEqual(calculateSkuDistribution([], sampleInventory), []);
      assert.deepStrictEqual(calculateSkuDistribution(null, null), []);
    });
  });
});
