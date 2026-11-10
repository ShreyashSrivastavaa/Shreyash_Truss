/**
 * Indian Date & Time Formatter
 * Formats: DD MMM YYYY (e.g. 10 Nov 2026)
 * Time: 24h / 12h with "IST"
 * Timezone: Asia/Kolkata
 */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatDate(dateInput, { includeTime = false, is24h = true } = {}) {
  if (!dateInput) return '—';

  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);

    // Format in Asia/Kolkata timezone
    const formatter = new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: includeTime ? '2-digit' : undefined,
      minute: includeTime ? '2-digit' : undefined,
      hour12: !is24h
    });

    const parts = formatter.formatToParts(d);
    let day = '';
    let month = '';
    let year = '';
    let hour = '';
    let minute = '';
    let dayPeriod = '';

    for (const part of parts) {
      if (part.type === 'day') day = part.value;
      if (part.type === 'month') month = part.value;
      if (part.type === 'year') year = part.value;
      if (part.type === 'hour') hour = part.value;
      if (part.type === 'minute') minute = part.value;
      if (part.type === 'dayPeriod') dayPeriod = part.value.toUpperCase();
    }

    let result = `${day} ${month} ${year}`;
    if (includeTime) {
      if (is24h) {
        result += `, ${hour}:${minute} IST`;
      } else {
        result += `, ${hour}:${minute} ${dayPeriod} IST`;
      }
    }

    return result;
  } catch (err) {
    return String(dateInput);
  }
}

export function formatRelativeTime(dateInput) {
  if (!dateInput) return '—';
  try {
    const d = new Date(dateInput);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.round(diffMs / (1000 * 60));

    if (diffMin < 1) return 'Just now';
    if (diffMin === 1) return '1 min ago';
    if (diffMin < 60) return `${diffMin} mins ago`;
    const diffHours = Math.round(diffMin / 60);
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    const diffDays = Math.round(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  } catch {
    return formatDate(dateInput);
  }
}

export default formatDate;

