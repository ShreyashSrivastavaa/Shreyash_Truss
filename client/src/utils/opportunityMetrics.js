/**
 * Derives explainable stock metrics, safety boundaries, and validation state for an inventory transfer opportunity.
 *
 * @param {Object} opp - Raw opportunity object from /api/transfers/opportunities
 * @param {number|string} [customQty] - User-entered quantity (defaults to opp.recommendedQuantity)
 * @returns {Object} Enriched metrics, effective safety limits, validation status, and human-readable explanation
 */
export function getOpportunityMetrics(opp, customQty) {
  const fromDepotName = opp?.fromDepotName || opp?.fromDepotId || 'Source depot';
  const toDepotName = opp?.toDepotName || opp?.toDepotId || 'Destination depot';

  // Defensive defaults for donor stock
  const donorOnHand = typeof opp?.donorOnHand === 'number' ? opp.donorOnHand : 0;
  const donorReserved = typeof opp?.donorReserved === 'number' ? opp.donorReserved : 0;
  const donorSafety = typeof opp?.donorSafetyStock === 'number' ? opp.donorSafetyStock : 0;
  const donorTarget = typeof opp?.donorTargetStock === 'number' ? opp.donorTargetStock : 0;

  // Safe donor surplus above protected target stock: onHand - reserved - targetStock
  const calculatedDonorSurplus = Math.max(0, donorOnHand - donorReserved - donorTarget);
  const maxSafeTransfer = typeof opp?.maxTransferable === 'number' ? opp.maxTransferable : calculatedDonorSurplus;

  // Defensive defaults for recipient stock
  const destOnHand = typeof opp?.recipientOnHand === 'number' ? opp.recipientOnHand : 0;
  const destInTransit = typeof opp?.recipientInTransit === 'number' ? opp.recipientInTransit : 0;
  const destPending = typeof opp?.recipientPendingInbound === 'number' ? opp.recipientPendingInbound : 0;
  const destPipeline = destInTransit + destPending;
  const destSafety = typeof opp?.recipientSafetyStock === 'number' ? opp.recipientSafetyStock : 0;
  const destTarget = typeof opp?.recipientTargetStock === 'number' ? opp.recipientTargetStock : 0;
  const totalDestStock = destOnHand + destPipeline;

  // Recipient remaining target capacity: targetStock - (onHand + inTransit + pendingInbound)
  const remainingTargetGap = Math.max(0, destTarget - totalDestStock);

  // Effective maximum quantity safely transferable: min(donor surplus above target, recipient remaining capacity)
  const effectiveMaxTransferable = Math.max(0, Math.min(maxSafeTransfer, remainingTargetGap));

  // Recommended quantity bounded by effective maximum
  const rawRecommended = typeof opp?.recommendedQuantity === 'number' ? opp.recommendedQuantity : 0;
  const recommendedQty = Math.max(0, Math.min(rawRecommended, effectiveMaxTransferable));

  const rawInput = customQty !== undefined ? customQty : recommendedQty;
  const qtyNum = rawInput === '' ? NaN : Number(rawInput);

  // Validation rules
  let validationError = null;
  if (effectiveMaxTransferable <= 0) {
    if (maxSafeTransfer <= 0) {
      validationError = `No transferable surplus available. ${fromDepotName} is at or below its target threshold (${donorTarget} units).`;
    } else {
      validationError = `Destination capacity full. ${toDepotName} already meets its target threshold (${destTarget} units).`;
    }
  } else if (rawInput === '' || isNaN(qtyNum) || !Number.isInteger(qtyNum) || qtyNum <= 0) {
    validationError = 'Please enter a valid positive integer quantity.';
  } else if (qtyNum > effectiveMaxTransferable) {
    if (qtyNum > maxSafeTransfer) {
      validationError = `Quantity ${qtyNum} exceeds maximum allowable donor surplus (${maxSafeTransfer} units). Donor target stock (${donorTarget}) would be breached.`;
    } else {
      validationError = `Quantity ${qtyNum} exceeds recipient target capacity (${remainingTargetGap} units). Destination target stock (${destTarget}) would be exceeded.`;
    }
  }

  // Factual, grounded explanation based on actual inventory numbers
  let explanation = '';
  if (validationError) {
    if (effectiveMaxTransferable <= 0) {
      explanation = `${fromDepotName} has no transferable surplus above its target buffer (${donorTarget} target, ${donorOnHand} on-hand), or ${toDepotName} already satisfies its target buffer (${destTarget} target, ${destOnHand} on-hand). No transfer is currently possible.`;
    } else {
      explanation = `Proposed quantity (${rawInput === '' ? 'empty' : rawInput} units) cannot be transferred: ${validationError} The recommended transfer for this lane is ${recommendedQty} units, up to the safe limit of ${effectiveMaxTransferable} units.`;
    }
  } else {
    const fullyResolves = qtyNum >= remainingTargetGap;
    const remainingGapAfter = Math.max(0, remainingTargetGap - qtyNum);
    const donorAvailableAfter = donorOnHand - donorReserved - qtyNum;

    explanation = `${fromDepotName} holds ${maxSafeTransfer} transferable units above target (${donorTarget} target, ${donorOnHand} on-hand${donorReserved > 0 ? `, ${donorReserved} reserved` : ''}), while ${toDepotName} is ${remainingTargetGap} units below target (${destTarget} target, ${destOnHand} on-hand${destPipeline > 0 ? `, ${destPipeline} pipeline` : ''}). Transferring ${qtyNum} units ${fullyResolves ? 'fully closes the destination target gap' : `addresses ${qtyNum} of the ${remainingTargetGap}-unit deficit (leaving ${remainingGapAfter} units to target)`} without taking the source below its protected target stock (${donorAvailableAfter} available vs ${donorTarget} target floor).`;
  }

  return {
    fromDepotName,
    toDepotName,
    donorOnHand,
    donorReserved,
    donorSafety,
    donorTarget,
    maxSafeTransfer,
    destOnHand,
    destInTransit,
    destPending,
    destPipeline,
    destSafety,
    destTarget,
    totalDestStock,
    remainingTargetGap,
    effectiveMaxTransferable,
    recommendedQty,
    qtyNum,
    rawInput,
    validationError,
    explanation
  };
}
