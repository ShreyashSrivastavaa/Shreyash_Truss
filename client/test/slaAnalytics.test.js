import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  toCalendarDateString,
  calculateDeliveryMetrics,
  calculateVendorSlaMetrics,
  formatDisplayDate
} from '../src/utils/slaAnalytics.js';

describe('Client Vendor SLA Analytics Domain Logic & Business Rules', () => {
  const mockNow = new Date('2026-10-25T12:00:00.000Z');

  describe('toCalendarDateString & formatDisplayDate', () => {
    test('extracts YYYY-MM-DD from ISO strings and Date objects', () => {
      assert.equal(toCalendarDateString('2026-10-15T14:30:00.000Z'), '2026-10-15');
      assert.equal(toCalendarDateString(new Date('2026-10-20T00:00:00.000Z')), '2026-10-20');
      assert.equal(toCalendarDateString(null), '');
      assert.equal(toCalendarDateString(''), '');
    });

    test('formats dates safely for UI display', () => {
      assert.equal(formatDisplayDate(null), '—');
      assert.equal(formatDisplayDate(undefined), '—');
      const formatted = formatDisplayDate('2026-10-15T00:00:00.000Z');
      assert.ok(formatted.includes('2026'));
      assert.ok(formatted.includes('Oct') || formatted.includes('10'));
    });
  });

  describe('calculateDeliveryMetrics', () => {
    test('on-time delivery: completed on or before expected calendar day', () => {
      const delivery = {
        id: 'D1',
        expectedDeliveryDate: '2026-10-15T00:00:00.000Z',
        actualDeliveryDate: '2026-10-15T16:00:00.000Z', // Same day afternoon
        expectedQuantity: 100,
        receivedQuantity: 100,
        status: 'DELIVERED'
      };

      const metrics = calculateDeliveryMetrics(delivery, mockNow);
      assert.equal(metrics.isCompleted, true);
      assert.equal(metrics.isOnTime, true);
      assert.equal(metrics.isInFull, true);
      assert.equal(metrics.isOtif, true);
      assert.equal(metrics.delayDays, 0);
      assert.equal(metrics.isOverdue, false);
    });

    test('late delivery: completed after expected calendar day with delay days', () => {
      const delivery = {
        id: 'D2',
        expectedDeliveryDate: '2026-10-10T00:00:00.000Z',
        actualDeliveryDate: '2026-10-14T09:00:00.000Z',
        expectedQuantity: 80,
        receivedQuantity: 80,
        status: 'DELIVERED'
      };

      const metrics = calculateDeliveryMetrics(delivery, mockNow);
      assert.equal(metrics.isCompleted, true);
      assert.equal(metrics.isOnTime, false);
      assert.equal(metrics.isInFull, true);
      assert.equal(metrics.isOtif, false);
      assert.equal(metrics.delayDays, 4); // Oct 14 - Oct 10 = 4 days
    });

    test('partial intake: on-time arrival but shortfall in received quantity', () => {
      const delivery = {
        id: 'D3',
        expectedDeliveryDate: '2026-10-15T00:00:00.000Z',
        actualDeliveryDate: '2026-10-15T08:00:00.000Z',
        expectedQuantity: 100,
        receivedQuantity: 70, // 30 short
        status: 'PARTIALLY_RECEIVED'
      };

      const metrics = calculateDeliveryMetrics(delivery, mockNow);
      assert.equal(metrics.isCompleted, true);
      assert.equal(metrics.isOnTime, true);
      assert.equal(metrics.isInFull, false);
      assert.equal(metrics.isOtif, false); // Failed in-full
    });

    test('overdue incomplete delivery: expected date has passed without receipt', () => {
      const delivery = {
        id: 'D4',
        expectedDeliveryDate: '2026-10-20T00:00:00.000Z',
        actualDeliveryDate: null,
        expectedQuantity: 100,
        receivedQuantity: 0,
        status: 'DELAYED'
      };

      const metrics = calculateDeliveryMetrics(delivery, mockNow); // mockNow is 2026-10-25
      assert.equal(metrics.isCompleted, false);
      assert.equal(metrics.isOverdue, true);
      assert.equal(metrics.delayDays, 5); // Oct 25 - Oct 20 = 5 days
    });

    test('cancelled delivery: strictly excluded from eligible completed calculations', () => {
      const delivery = {
        id: 'D5',
        expectedDeliveryDate: '2026-10-10T00:00:00.000Z',
        actualDeliveryDate: null,
        expectedQuantity: 50,
        receivedQuantity: 0,
        status: 'CANCELLED'
      };

      const metrics = calculateDeliveryMetrics(delivery, mockNow);
      assert.equal(metrics.isCancelled, true);
      assert.equal(metrics.isCompleted, false);
      assert.equal(metrics.isEligible, false);
      assert.equal(metrics.isOverdue, false);
    });
  });

  describe('calculateVendorSlaMetrics', () => {
    test('handles zero eligible deliveries without division by zero or NaN', () => {
      const vendor = {
        id: 'VND-EMPTY',
        name: 'Empty Vendor',
        targetOtifRate: 95.0
      };

      const result = calculateVendorSlaMetrics(vendor, [], mockNow);
      assert.equal(result.metrics.totalDeliveries, 0);
      assert.equal(result.metrics.eligibleDeliveries, 0);
      assert.equal(result.metrics.onTimeRate, 0);
      assert.equal(result.metrics.inFullRate, 0);
      assert.equal(result.metrics.otifRate, 0);
      assert.equal(Number.isNaN(result.metrics.onTimeRate), false);
      assert.equal(Number.isNaN(result.metrics.otifRate), false);
      assert.equal(result.metrics.status, 'NO_HISTORY');
    });

    test('accurate scorecard calculation for reliable vendor (100% OTIF)', () => {
      const vendor = {
        id: 'VND-01',
        name: 'Apex Reliable',
        targetOtifRate: 95.0
      };

      const deliveries = [
        {
          id: 'D1',
          vendorId: 'VND-01',
          expectedDeliveryDate: '2026-10-10T00:00:00.000Z',
          actualDeliveryDate: '2026-10-09T00:00:00.000Z',
          expectedQuantity: 100,
          receivedQuantity: 100,
          status: 'DELIVERED'
        },
        {
          id: 'D2',
          vendorId: 'VND-01',
          expectedDeliveryDate: '2026-10-15T00:00:00.000Z',
          actualDeliveryDate: '2026-10-15T00:00:00.000Z',
          expectedQuantity: 50,
          receivedQuantity: 50,
          status: 'DELIVERED'
        }
      ];

      const result = calculateVendorSlaMetrics(vendor, deliveries, mockNow);
      assert.equal(result.metrics.totalDeliveries, 2);
      assert.equal(result.metrics.eligibleDeliveries, 2);
      assert.equal(result.metrics.onTimeRate, 100.0);
      assert.equal(result.metrics.inFullRate, 100.0);
      assert.equal(result.metrics.otifRate, 100.0);
      assert.equal(result.metrics.status, 'COMPLIANT');
      assert.equal(result.metrics.overdueDeliveries, 0);
    });

    test('accurate scorecard calculation for breached vendor with delays and overdue', () => {
      const vendor = {
        id: 'VND-02',
        name: 'Nordic Delays',
        targetOtifRate: 92.0
      };

      const deliveries = [
        {
          id: 'D3',
          vendorId: 'VND-02',
          expectedDeliveryDate: '2026-10-05T00:00:00.000Z',
          actualDeliveryDate: '2026-10-09T00:00:00.000Z', // 4 days late
          expectedQuantity: 100,
          receivedQuantity: 100,
          status: 'DELIVERED'
        },
        {
          id: 'D4',
          vendorId: 'VND-02',
          expectedDeliveryDate: '2026-10-10T00:00:00.000Z',
          actualDeliveryDate: '2026-10-10T00:00:00.000Z',
          expectedQuantity: 100,
          receivedQuantity: 70, // Partial
          status: 'PARTIALLY_RECEIVED'
        },
        {
          id: 'D5',
          vendorId: 'VND-02',
          expectedDeliveryDate: '2026-10-20T00:00:00.000Z',
          actualDeliveryDate: null, // Overdue
          expectedQuantity: 50,
          receivedQuantity: 0,
          status: 'DELAYED'
        }
      ];

      const result = calculateVendorSlaMetrics(vendor, deliveries, mockNow);
      assert.equal(result.metrics.totalDeliveries, 3);
      assert.equal(result.metrics.eligibleDeliveries, 2); // D3 and D4
      assert.equal(result.metrics.onTimeDeliveries, 1); // D4
      assert.equal(result.metrics.lateDeliveries, 1); // D3
      assert.equal(result.metrics.inFullDeliveries, 1); // D3
      assert.equal(result.metrics.otifDeliveries, 0); // Neither was OTIF
      assert.equal(result.metrics.otifRate, 0.0);
      assert.equal(result.metrics.overdueDeliveries, 1); // D5
      assert.equal(result.metrics.status, 'BREACH');
    });

    test('handles missing vendor parameter defensively', () => {
      const result = calculateVendorSlaMetrics(null, []);
      assert.equal(result, null);
    });
  });
});
