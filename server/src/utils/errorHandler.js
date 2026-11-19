/**
 * Identifies if an error is a database connection/infrastructure failure.
 * Used to map connection failures to HTTP 503 Service Unavailable.
 *
 * @param {Error|any} err
 * @returns {boolean}
 */
export function isDatabaseConnectionError(err) {
  if (!err) return false;
  if (err.name === 'PrismaClientInitializationError') return true;
  if (err.name === 'PrismaClientRustPanicError') return true;
  if (err.code && ['P1000', 'P1001', 'P1002', 'P1008', 'P1017'].includes(err.code)) return true;
  if (typeof err.message === 'string' && /can't reach database server|connection refused|timeout/i.test(err.message)) {
    return true;
  }
  return false;
}

/**
 * Strips database credentials and connection URIs from error messages.
 *
 * @param {string} message
 * @returns {string}
 */
export function sanitizeErrorMessage(message) {
  if (!message || typeof message !== 'string') return '';
  return message.replace(/postgres(?:ql)?:\/\/[^\s"',]+/gi, '[REDACTED_DATABASE_URL]');
}
