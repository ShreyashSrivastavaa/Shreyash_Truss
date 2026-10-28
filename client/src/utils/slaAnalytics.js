/**
 * Client-side utility functions for Vendor SLA metrics, status classification, and formatting.
 */

/**
 * Extracts YYYY-MM-DD from Date or ISO string
 */
export function toCalendarDateString(dateInput) {
  if (!dateInput) return '';
  if (typeof dateInput === 'string') {
    return dateInput.slice(0, 10);
  }
  return dateInput.toISOString().slice(0, 10);
}

/**
 * Evaluates individual delivery metrics.
 */
export function calculateDeliveryMetrics(delivery, referenceTime = new Date()) {
  const expectedDateStr = toCalendarDateString(delivery.expectedDeliveryDate);
  const actualDateStr = delivery.actualDeliveryDate ? toCalendarDateString(delivery.actualDeliveryDate) : null;
  const nowDateStr = toCalendarDateString(referenceTime);

  const isCancelled = delivery.status === 'CANCELLED';
  const isCompleted = !isCancelled && (
    delivery.status === 'DELIVERED' ||
    delivery.status === 'PARTIALLY_RECEIVED' ||
    actualDateStr !== null
  );

  const isOverdue = !isCompleted && !isCancelled && (expectedDateStr < nowDateStr);

  let delayDays = 0;
  if (isCompleted && actualDateStr) {
    const expMs = new Date(expectedDateStr).getTime();
    const actMs = new Date(actualDateStr).getTime();
    const diffDays = Math.round((actMs - expMs) / (1000 * 60 * 60 * 24));
    delayDays = diffDays > 0 ? diffDays : 0;
  } else if (isOverdue) {
    const expMs = new Date(expectedDateStr).getTime();
    const nowMs = new Date(nowDateStr).getTime();
    const diffDays = Math.round((nowMs - expMs) / (1000 * 60 * 60 * 24));
    delayDays = diffDays > 0 ? diffDays : 0;
  }

  const isOnTime = isCompleted && actualDateStr !== null && (actualDateStr <= expectedDateStr);
  const receivedQty = delivery.receivedQuantity ?? 0;
  const expectedQty = delivery.expectedQuantity ?? 0;
  const isInFull = isCompleted && expectedQty > 0 && (receivedQty >= expectedQty);
  const isOtif = isCompleted && isOnTime && isInFull;

  return {
    isCompleted,
    isCancelled,
    isEligible: isCompleted,
    isOverdue,
    isOnTime,
    isInFull,
    isOtif,
    delayDays
  };
}

/**
 * Calculates aggregated SLA metrics for a single vendor.
 */
export function calculateVendorSlaMetrics(vendor, deliveries = [], referenceTime = new Date()) {
  if (!vendor) return null;

  const vendorDeliveries = deliveries.filter(d => d.vendorId === vendor.id);

  let totalDeliveries = vendorDeliveries.length;
  let eligibleDeliveries = 0;
  let onTimeDeliveries = 0;
  let lateDeliveries = 0;
  let inFullDeliveries = 0;
  let otifDeliveries = 0;
  let overdueDeliveries = 0;
  let cancelledDeliveries = 0;
  let totalDelayDays = 0;

  for (const delivery of vendorDeliveries) {
    const evalResult = calculateDeliveryMetrics(delivery, referenceTime);

    if (evalResult.isCancelled) {
      cancelledDeliveries++;
      continue;
    }

    if (evalResult.isCompleted) {
      eligibleDeliveries++;
      if (evalResult.isOnTime) {
        onTimeDeliveries++;
      } else {
        lateDeliveries++;
        totalDelayDays += evalResult.delayDays;
      }

      if (evalResult.isInFull) {
        inFullDeliveries++;
      }

      if (evalResult.isOtif) {
        otifDeliveries++;
      }
    } else if (evalResult.isOverdue) {
      overdueDeliveries++;
    }
  }

  const onTimeRate = eligibleDeliveries > 0
    ? Number(((onTimeDeliveries / eligibleDeliveries) * 100).toFixed(1))
    : 0;

  const inFullRate = eligibleDeliveries > 0
    ? Number(((inFullDeliveries / eligibleDeliveries) * 100).toFixed(1))
    : 0;

  const otifRate = eligibleDeliveries > 0
    ? Number(((otifDeliveries / eligibleDeliveries) * 100).toFixed(1))
    : 0;

  const averageDelayDays = lateDeliveries > 0
    ? Number((totalDelayDays / lateDeliveries).toFixed(1))
    : 0;

  const targetOtifRate = vendor.targetOtifRate ?? 95.0;
  const otifGap = Number((otifRate - targetOtifRate).toFixed(1));

  let status = 'NO_HISTORY';
  let statusLabel = 'No Completed Orders';
  let statusBadge = 'bg-slate-800 text-slate-300 border-slate-700/60';

  if (eligibleDeliveries === 0 && overdueDeliveries === 0) {
    status = 'NO_HISTORY';
    statusLabel = 'No Completed Orders';
    statusBadge = 'bg-slate-800 text-slate-400 border-slate-700/50';
  } else if (overdueDeliveries > 0 && otifRate < (targetOtifRate - 10)) {
    status = 'BREACH';
    statusLabel = 'SLA Breach Detected';
    statusBadge = 'bg-rose-500/10 text-rose-300 border-rose-500/25';
  } else if (otifRate >= targetOtifRate && overdueDeliveries === 0) {
    status = 'COMPLIANT';
    statusLabel = 'SLA Compliant';
    statusBadge = 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25';
  } else if (otifRate >= (targetOtifRate - 10) && overdueDeliveries === 0) {
    status = 'AT_RISK';
    statusLabel = 'At Risk';
    statusBadge = 'bg-amber-500/10 text-amber-300 border-amber-500/25';
  } else {
    status = 'BREACH';
    statusLabel = 'SLA Breach Detected';
    statusBadge = 'bg-rose-500/10 text-rose-300 border-rose-500/25';
  }

  return {
    ...vendor,
    metrics: {
      totalDeliveries,
      eligibleDeliveries,
      onTimeDeliveries,
      lateDeliveries,
      inFullDeliveries,
      otifDeliveries,
      overdueDeliveries,
      cancelledDeliveries,
      onTimeRate,
      inFullRate,
      otifRate,
      targetOtifRate,
      otifGap,
      averageDelayDays,
      status,
      statusLabel,
      statusBadge
    }
  };
}

/**
 * Formats date into human-readable string.
 */
export function formatDisplayDate(dateInput) {
  if (!dateInput) return '—';
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return dateInput;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return dateInput;
  }
}
