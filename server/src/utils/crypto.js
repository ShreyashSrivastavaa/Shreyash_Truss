import crypto from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(crypto.scrypt);

const AUTH_SECRET = process.env.AUTH_SECRET || 'nexus_secure_auth_token_signing_key_2026';

/**
 * Hashes a plaintext password using scrypt with a random 16-byte salt.
 * Format: `<saltHex>:<derivedKeyHex>`
 *
 * @param {string} password
 * @returns {Promise<string>}
 */
export async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = await scryptAsync(password, salt, 64);
  return `${salt}:${derivedKey.toString('hex')}`;
}

/**
 * Verifies a plaintext password against a stored `<salt>:<derivedKey>` scrypt hash
 * using constant-time comparison to prevent timing attacks.
 *
 * @param {string} password
 * @param {string} storedHash
 * @returns {Promise<boolean>}
 */
export async function verifyPassword(password, storedHash) {
  if (!storedHash || typeof storedHash !== 'string') return false;
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;

  const [salt, keyHex] = parts;
  const expectedKey = Buffer.from(keyHex, 'hex');
  const derivedKey = await scryptAsync(password, salt, expectedKey.length);

  return crypto.timingSafeEqual(expectedKey, derivedKey);
}

/**
 * Creates a signed bearer token with payload and expiration.
 * Format: `<base64UrlPayload>.<base64UrlHmacSignature>`
 *
 * @param {Object} payload
 * @param {number} [expiresInSeconds=86400] 24 hours default
 * @returns {string}
 */
export function createToken(payload, expiresInSeconds = 86400) {
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const fullPayload = { ...payload, exp };
  const payloadB64 = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', AUTH_SECRET)
    .update(payloadB64)
    .digest('base64url');

  return `${payloadB64}.${signature}`;
}

/**
 * Verifies and decodes a signed bearer token.
 * Validates HMAC signature and token expiration.
 *
 * @param {string} token
 * @returns {Object} decoded payload
 */
export function verifyToken(token) {
  if (!token || typeof token !== 'string') {
    throw new Error('Token is missing');
  }

  const parts = token.split('.');
  if (parts.length !== 2) {
    throw new Error('Invalid token structure');
  }

  const [payloadB64, signature] = parts;
  const expectedSig = crypto
    .createHmac('sha256', AUTH_SECRET)
    .update(payloadB64)
    .digest('base64url');

  const sigBuffer = Buffer.from(signature);
  const expectedSigBuffer = Buffer.from(expectedSig);

  if (sigBuffer.length !== expectedSigBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedSigBuffer)) {
    throw new Error('Invalid token signature');
  }

  const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < now) {
    throw new Error('Token has expired');
  }

  return payload;
}
