import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { getOpportunityMetrics } from '../src/utils/opportunityMetrics.js';

describe('Opportunity Metrics & Rebalancing UI Logic', () => {
  const baseOpportunity = {
    skuId: 'SKU-MED-01',
    skuName: 'Critical Pharmaceuticals',
    fromDepotId: 'DEPOT-NORTH',
    fromDepotName: 'North Logistics Hub',
    toDepotId: 'DEPOT-SOUTH',
    toDepotName: 'South Distribution Center',
    donorOnHand: 150,
    donorReserved: 0,
    donorSafetyStock: 50,
    donorTargetStock: 80,
    recipientOnHand: 20,
    recipientInTransit: 0,
    recipientPendingInbound: 0,
    recipientSafetyStock: 40,
    recipientTargetStock: 80,
    recommendedQuantity: 60,
    maxTransferable: 70,
    urgency: 'HIGH'
  };

  test('bounds maximum quantity when donor surplus exceeds recipient capacity', () => {
    // Donor surplus is 70, but recipient capacity is only 30 (target 80 - onHand 50)
    const opp = {
      ...baseOpportunity,
      recipientOnHand: 50,
      recommendedQuantity: 30
    };

    const metrics = getOpportunityMetrics(opp);
    assert.strictEqual(metrics.maxSafeTransfer, 70, 'Donor surplus is 70');
    assert.strictEqual(metrics.remainingTargetGap, 30, 'Recipient remaining gap is 30');
    assert.strictEqual(metrics.effectiveMaxTransferable, 30, 'Effective max is capped at recipient gap (30)');
    assert.strictEqual(metrics.recommendedQty, 30, 'Recommended quantity is capped at 30');

    // Trying to transfer 70 should trigger recipient capacity error
    const overCapacityMetrics = getOpportunityMetrics(opp, 70);
    assert.match(
      overCapacityMetrics.validationError,
      /exceeds recipient target capacity \(30 units\)/,
      'Validates against recipient capacity'
    );
  });

  test('bounds maximum quantity when recipient capacity exceeds donor surplus', () => {
    // Donor surplus is 40 (120 - 80), recipient gap is 60 (80 - 20)
    const opp = {
      ...baseOpportunity,
      donorOnHand: 120,
      maxTransferable: 40,
      recommendedQuantity: 40
    };

    const metrics = getOpportunityMetrics(opp);
    assert.strictEqual(metrics.maxSafeTransfer, 40);
    assert.strictEqual(metrics.remainingTargetGap, 60);
    assert.strictEqual(metrics.effectiveMaxTransferable, 40, 'Effective max is capped at donor surplus (40)');

    // Trying to transfer 50 should trigger donor surplus error
    const overSurplusMetrics = getOpportunityMetrics(opp, 50);
    assert.match(
      overSurplusMetrics.validationError,
      /exceeds maximum allowable donor surplus \(40 units\)/,
      'Validates against donor surplus'
    );
  });

  test('clamps recommended quantity if raw recommendation exceeds effective maximum', () => {
    // Raw recommendation is 60, but recipient gap is only 25
    const opp = {
      ...baseOpportunity,
      recipientOnHand: 55,
      recommendedQuantity: 60
    };

    const metrics = getOpportunityMetrics(opp);
    assert.strictEqual(metrics.remainingTargetGap, 25);
    assert.strictEqual(metrics.effectiveMaxTransferable, 25);
    assert.strictEqual(metrics.recommendedQty, 25, 'Clamps recommendation to effective max');
  });

  test('handles null and missing stock attributes with defensive defaults (no NaN)', () => {
    const incompleteOpp = {
      skuId: 'SKU-001',
      fromDepotName: 'Depot A',
      toDepotName: 'Depot B'
      // all stock fields omitted
    };

    const metrics = getOpportunityMetrics(incompleteOpp);
    assert.strictEqual(metrics.donorOnHand, 0);
    assert.strictEqual(metrics.donorReserved, 0);
    assert.strictEqual(metrics.donorTarget, 0);
    assert.strictEqual(metrics.destOnHand, 0);
    assert.strictEqual(metrics.destTarget, 0);
    assert.strictEqual(metrics.effectiveMaxTransferable, 0);
    assert.strictEqual(isNaN(metrics.qtyNum), false);
    assert.doesNotMatch(metrics.explanation, /NaN/);
  });

  test('safely rejects transfers when effective capacity is zero', () => {
    // Donor has 0 surplus (onHand 80 == target 80)
    const zeroSurplusOpp = {
      ...baseOpportunity,
      donorOnHand: 80,
      maxTransferable: 0
    };

    const metrics = getOpportunityMetrics(zeroSurplusOpp);
    assert.strictEqual(metrics.effectiveMaxTransferable, 0);
    assert.match(metrics.validationError, /No transferable surplus available/);
    assert.match(metrics.explanation, /No transfer is currently possible/);
  });

  test('validates non-numeric, decimal, zero, negative, and empty inputs', () => {
    assert.match(
      getOpportunityMetrics(baseOpportunity, '').validationError,
      /Please enter a valid positive integer quantity/
    );
    assert.match(
      getOpportunityMetrics(baseOpportunity, 'abc').validationError,
      /Please enter a valid positive integer quantity/
    );
    assert.match(
      getOpportunityMetrics(baseOpportunity, 0).validationError,
      /Please enter a valid positive integer quantity/
    );
    assert.match(
      getOpportunityMetrics(baseOpportunity, -10).validationError,
      /Please enter a valid positive integer quantity/
    );
    assert.match(
      getOpportunityMetrics(baseOpportunity, 12.5).validationError,
      /Please enter a valid positive integer quantity/
    );
  });

  test('distinguishes invalid proposed quantity from recommendation in explanation', () => {
    const invalidMetrics = getOpportunityMetrics(baseOpportunity, 95);
    assert.match(
      invalidMetrics.explanation,
      /Proposed quantity \(95 units\) cannot be transferred/,
      'Explicitly calls out the invalid proposed quantity'
    );
    assert.match(
      invalidMetrics.explanation,
      /The recommended transfer for this lane is 60 units/,
      'Clearly separates the recommendation from the invalid proposed input'
    );
    assert.doesNotMatch(
      invalidMetrics.explanation,
      /Transferring 60 units fully closes/,
      'Does not falsely claim the recommendation is what was entered'
    );
  });

  test('accurately explains full versus partial deficit resolution', () => {
    // Full resolution (transfer quantity 60 == remaining gap 60)
    const fullMetrics = getOpportunityMetrics(baseOpportunity, 60);
    assert.strictEqual(fullMetrics.validationError, null);
    assert.match(
      fullMetrics.explanation,
      /fully closes the destination target gap/,
      'Identifies full resolution'
    );
    assert.match(
      fullMetrics.explanation,
      /90 available vs 80 target floor/,
      'Calculates source remaining available correctly (150 - 60 = 90)'
    );

    // Partial resolution (transfer quantity 40 < remaining gap 60)
    const partialMetrics = getOpportunityMetrics(baseOpportunity, 40);
    assert.strictEqual(partialMetrics.validationError, null);
    assert.match(
      partialMetrics.explanation,
      /addresses 40 of the 60-unit deficit \(leaving 20 units to target\)/,
      'Identifies partial resolution and remaining deficit accurately'
    );
  });
});
