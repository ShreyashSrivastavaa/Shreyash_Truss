import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  filterTransfers,
  calculateTransferOverview,
  calculateLaneMetrics,
  calculateDepotThroughput
} from '../src/utils/transferLaneAnalytics.js';

describe('Transfer Lane Analytics Domain Calculations & Filters', () => {
  const sampleDepots = [
    { id: 'depot-north', name: 'North Logistics Hub', city: 'Chicago, IL', region: 'Midwest' },
    { id: 'depot-south', name: 'South Distribution Center', city: 'Dallas, TX', region: 'South' },
    { id: 'depot-east', name: 'East Gateway Depot', city: 'Philadelphia, PA', region: 'East' }
  ];

  const sampleSkus = [
    { id: 'SKU-MED-01', name: 'Critical Pharmaceuticals', unit: 'cartons', unitCost: 150.00 },
    { id: 'SKU-IND-02', name: 'Industrial Temperature Relay', unit: 'units', unitCost: 80.00 }
  ];

  const sampleTransfers = [
    // Lane 1: South -> North (SKU-MED-01)
    {
      id: 'TRF-001',
      skuId: 'SKU-MED-01',
      fromDepotId: 'depot-south',
      toDepotId: 'depot-north',
      quantity: 50,
      status: 'RECEIVED',
      createdAt: '2026-10-25T10:00:00.000Z'
    },
    {
      id: 'TRF-002',
      skuId: 'SKU-MED-01',
      fromDepotId: 'depot-south',
      toDepotId: 'depot-north',
      quantity: 40,
      status: 'IN_TRANSIT',
      createdAt: '2026-10-26T14:30:00.000Z'
    },
    {
      id: 'TRF-003',
      skuId: 'SKU-MED-01',
      fromDepotId: 'depot-south',
      toDepotId: 'depot-north',
      quantity: 20,
      status: 'PENDING',
      createdAt: '2026-10-27T09:15:00.000Z'
    },
    // Lane 2: North -> South (SKU-IND-02)
    {
      id: 'TRF-004',
      skuId: 'SKU-IND-02',
      fromDepotId: 'depot-north',
      toDepotId: 'depot-south',
      quantity: 60,
      status: 'RECEIVED',
      createdAt: '2026-10-24T08:00:00.000Z'
    },
    {
      id: 'TRF-005',
      skuId: 'SKU-IND-02',
      fromDepotId: 'depot-north',
      toDepotId: 'depot-south',
      quantity: 15,
      status: 'CANCELLED',
      createdAt: '2026-10-26T11:00:00.000Z'
    },
    // Lane 3: South -> East (SKU-MED-01)
    {
      id: 'TRF-006',
      skuId: 'SKU-MED-01',
      fromDepotId: 'depot-south',
      toDepotId: 'depot-east',
      quantity: 25,
      status: 'RECEIVED',
      createdAt: '2026-10-23T12:00:00.000Z'
    }
  ];

  describe('filterTransfers', () => {
    test('filters transfers deterministically by lifecycle status', () => {
      const received = filterTransfers(sampleTransfers, { status: 'RECEIVED' });
      assert.strictEqual(received.length, 3);
      assert.ok(received.every(t => t.status === 'RECEIVED'));

      const inTransit = filterTransfers(sampleTransfers, { status: 'IN_TRANSIT' });
      assert.strictEqual(inTransit.length, 1);
      assert.strictEqual(inTransit[0].id, 'TRF-002');

      const cancelled = filterTransfers(sampleTransfers, { status: 'CANCELLED' });
      assert.strictEqual(cancelled.length, 1);
      assert.strictEqual(cancelled[0].id, 'TRF-005');
    });

    test('filters transfers by SKU', () => {
      const medTransfers = filterTransfers(sampleTransfers, { skuId: 'SKU-MED-01' });
      assert.strictEqual(medTransfers.length, 4);

      const indTransfers = filterTransfers(sampleTransfers, { skuId: 'SKU-IND-02' });
      assert.strictEqual(indTransfers.length, 2);
    });

    test('filters transfers by lane', () => {
      const laneSouthNorth = filterTransfers(sampleTransfers, { laneId: 'depot-south->depot-north' });
      assert.strictEqual(laneSouthNorth.length, 3);

      const laneNorthSouth = filterTransfers(sampleTransfers, { laneId: 'depot-north->depot-south' });
      assert.strictEqual(laneNorthSouth.length, 2);
    });

    test('filters transfers by date range based on stored createdAt', () => {
      // 2026-10-25 to 2026-10-26 covers TRF-001 (25th), TRF-002 (26th), TRF-005 (26th)
      const rangeTransfers = filterTransfers(sampleTransfers, {
        startDate: '2026-10-25',
        endDate: '2026-10-26'
      });
      assert.strictEqual(rangeTransfers.length, 3);
      const ids = rangeTransfers.map(t => t.id).sort();
      assert.deepStrictEqual(ids, ['TRF-001', 'TRF-002', 'TRF-005']);
    });

    test('handles empty or missing transfers gracefully', () => {
      assert.deepStrictEqual(filterTransfers([], {}), []);
      assert.deepStrictEqual(filterTransfers(null, {}), []);
    });
  });

  describe('calculateTransferOverview', () => {
    test('aggregates total transfers, units moved (excluding cancelled), and status breakdown', () => {
      const overview = calculateTransferOverview(sampleTransfers);

      // Total transfer orders: 6 (including 1 cancelled)
      assert.strictEqual(overview.totalTransfers, 6);
      // Total volume moved: 50 + 40 + 20 + 60 + 25 = 195 (excludes 15 cancelled units)
      assert.strictEqual(overview.totalUnits, 195);
      assert.strictEqual(overview.totalUnitsMoved, 195);

      // Completed (RECEIVED): TRF-001 (50) + TRF-004 (60) + TRF-006 (25) = 135 units across 3 transfers
      assert.strictEqual(overview.completedTransfers, 3);
      assert.strictEqual(overview.completedUnits, 135);

      // In-Transit: TRF-002 (40) = 40 units across 1 transfer
      assert.strictEqual(overview.inTransitTransfers, 1);
      assert.strictEqual(overview.inTransitUnits, 40);

      // Pending: TRF-003 (20) = 20 units across 1 transfer
      assert.strictEqual(overview.pendingTransfers, 1);
      assert.strictEqual(overview.pendingUnits, 20);

      // Cancelled: TRF-005 (15) = 15 units across 1 transfer
      assert.strictEqual(overview.cancelledTransfers, 1);
      assert.strictEqual(overview.cancelledUnits, 15);

      // Conservation: completed + inTransit + pending === totalUnitsMoved
      assert.strictEqual(
        overview.completedUnits + overview.inTransitUnits + overview.pendingUnits,
        overview.totalUnitsMoved
      );

      // Unique directional lanes: South->North, North->South, South->East = 3
      assert.strictEqual(overview.activeLanesCount, 3);
    });

    test('handles empty transfers without NaN', () => {
      const empty = calculateTransferOverview([]);
      assert.strictEqual(empty.totalTransfers, 0);
      assert.strictEqual(empty.totalUnits, 0);
      assert.strictEqual(empty.totalUnitsMoved, 0);
      assert.strictEqual(empty.completedTransfers, 0);
      assert.strictEqual(empty.inTransitTransfers, 0);
      assert.strictEqual(empty.pendingTransfers, 0);
      assert.strictEqual(empty.cancelledTransfers, 0);
      assert.strictEqual(empty.activeLanesCount, 0);
    });
  });

  describe('calculateLaneMetrics', () => {
    test('groups transfers by depot-to-depot lane with SKU breakdown and status counts, excluding cancelled units from moved totals', () => {
      const lanes = calculateLaneMetrics(sampleTransfers, sampleDepots, sampleSkus);
      assert.strictEqual(lanes.length, 3);

      // Highest volume lane: South -> North (50 + 40 + 20 = 110 units, 3 transfers)
      const southNorth = lanes.find(l => l.laneId === 'depot-south->depot-north');
      assert.ok(southNorth);
      assert.strictEqual(southNorth.fromDepotName, 'South Distribution Center');
      assert.strictEqual(southNorth.toDepotName, 'North Logistics Hub');
      assert.strictEqual(southNorth.totalTransfers, 3);
      assert.strictEqual(southNorth.totalUnits, 110);
      assert.strictEqual(southNorth.completedUnits, 50);
      assert.strictEqual(southNorth.inTransitUnits, 40);
      assert.strictEqual(southNorth.pendingUnits, 20);
      assert.strictEqual(southNorth.cancelledUnits, 0);

      // SKU breakdown on South -> North
      assert.strictEqual(southNorth.skuBreakdown.length, 1);
      assert.strictEqual(southNorth.skuBreakdown[0].skuId, 'SKU-MED-01');
      assert.strictEqual(southNorth.skuBreakdown[0].totalUnits, 110);
      assert.strictEqual(southNorth.skuBreakdown[0].skuName, 'Critical Pharmaceuticals');

      // Second lane: North -> South (60 completed + 15 cancelled; moved volume is 60)
      const northSouth = lanes.find(l => l.laneId === 'depot-north->depot-south');
      assert.ok(northSouth);
      assert.strictEqual(northSouth.totalTransfers, 2);
      assert.strictEqual(northSouth.totalUnits, 60); // Excludes 15 cancelled units
      assert.strictEqual(northSouth.completedUnits, 60);
      assert.strictEqual(northSouth.cancelledUnits, 15);
      assert.strictEqual(northSouth.cancelledTransfers, 1);
      assert.strictEqual(northSouth.skuBreakdown[0].skuId, 'SKU-IND-02');
      assert.strictEqual(northSouth.skuBreakdown[0].totalUnits, 60);
      assert.strictEqual(northSouth.skuBreakdown[0].cancelledUnits, 15);

      // Proportional share calculation
      // Total network moved units = 195 (110 + 60 + 25). South->North = 110 / 195 = 56%
      assert.strictEqual(southNorth.laneSharePercent, 56);
      assert.strictEqual(northSouth.laneSharePercent, 31);
    });

    test('handles empty transfer list cleanly', () => {
      assert.deepStrictEqual(calculateLaneMetrics([], sampleDepots, sampleSkus), []);
      assert.deepStrictEqual(calculateLaneMetrics(null, null, null), []);
    });
  });

  describe('calculateDepotThroughput', () => {
    test('calculates units sent and received per depot and identifies net role, excluding cancelled from active flow', () => {
      const throughput = calculateDepotThroughput(sampleTransfers, sampleDepots);
      assert.strictEqual(throughput.length, 3);

      // South Depot:
      // Sent: TRF-001 (50), TRF-002 (40), TRF-003 (20), TRF-006 (25) -> unitsSent = 135
      // Received: TRF-004 (60 completed) -> unitsReceived = 60 (excludes TRF-005 cancelled 15)
      // Active outflow = 135
      // Active inflow = 60
      // netFlow = 60 - 135 = -75 -> NET_DONOR
      const south = throughput.find(d => d.depotId === 'depot-south');
      assert.ok(south);
      assert.strictEqual(south.unitsSent, 135);
      assert.strictEqual(south.outboundTransfers, 4);
      assert.strictEqual(south.unitsReceived, 60);
      assert.strictEqual(south.inboundTransfers, 2);
      assert.strictEqual(south.receivedCancelledUnits, 15);
      assert.strictEqual(south.sentCompletedUnits, 75);
      assert.strictEqual(south.sentInTransitUnits, 40);
      assert.strictEqual(south.sentPendingUnits, 20);
      assert.strictEqual(south.role, 'NET_DONOR');

      // North Depot:
      // Sent: TRF-004 (60 completed) -> unitsSent = 60 (excludes TRF-005 cancelled 15)
      // Received: TRF-001 (50), TRF-002 (40), TRF-003 (20) -> unitsReceived = 110
      // Active inflow: 110
      // Active outflow: 60
      // netFlow = 110 - 60 = +50 -> NET_RECIPIENT
      const north = throughput.find(d => d.depotId === 'depot-north');
      assert.ok(north);
      assert.strictEqual(north.unitsSent, 60);
      assert.strictEqual(north.sentCancelledUnits, 15);
      assert.strictEqual(north.outboundTransfers, 2);
      assert.strictEqual(north.unitsReceived, 110);
      assert.strictEqual(north.role, 'NET_RECIPIENT');

      // East Depot:
      // Sent: 0
      // Received: TRF-006 (25) -> unitsReceived = 25
      // netFlow = +25 -> NET_RECIPIENT
      const east = throughput.find(d => d.depotId === 'depot-east');
      assert.ok(east);
      assert.strictEqual(east.unitsSent, 0);
      assert.strictEqual(east.unitsReceived, 25);
      assert.strictEqual(east.role, 'NET_RECIPIENT');
    });

    test('handles depots with zero transfers without NaN', () => {
      const emptyThroughput = calculateDepotThroughput([], sampleDepots);
      for (const d of emptyThroughput) {
        assert.strictEqual(d.unitsSent, 0);
        assert.strictEqual(d.unitsReceived, 0);
        assert.strictEqual(d.netFlow, 0);
        assert.strictEqual(d.role, 'BALANCED_FLOW');
      }
    });
  });
});
