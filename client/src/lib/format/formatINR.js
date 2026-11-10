/**
 * Indian Rupee (INR - ₹) Formatting Utility
 * Formats according to Indian numbering system (Lakhs and Crores).
 * Never uses $, K, M, or B.
 */

export function formatINR(value, { compact = false, showSymbol = true } = {}) {
  const num = typeof value === 'number' ? value : Number(value);
  if (isNaN(num)) return showSymbol ? '₹0' : '0';

  const sign = num < 0 ? '-' : '';
  const absNum = Math.abs(num);
  const symbol = showSymbol ? '₹' : '';

  if (compact) {
    if (absNum >= 10000000) {
      // 1 Crore = 10,000,000
      const cr = absNum / 10000000;
      const formatted = cr >= 10 ? cr.toFixed(1) : cr.toFixed(2);
      return `${sign}${symbol}${formatted.replace(/\.0+$/, '')} Cr`;
    }
    if (absNum >= 100000) {
      // 1 Lakh = 100,000
      const lk = absNum / 100000;
      const formatted = lk >= 10 ? lk.toFixed(1) : lk.toFixed(1);
      return `${sign}${symbol}${formatted.replace(/\.0+$/, '')} L`;
    }
    if (absNum >= 1000) {
      return `${sign}${symbol}${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(absNum)}`;
    }
    return `${sign}${symbol}${absNum.toLocaleString('en-IN')}`;
  }

  const inrFormatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0
  }).format(absNum);

  return `${sign}${symbol}${inrFormatted}`;
}

export default formatINR;

