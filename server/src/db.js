import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

let prisma = null;

if (process.env.DATABASE_URL) {
  try {
    prisma = new PrismaClient();
  } catch (err) {
    console.warn('⚠️ Prisma client initialization warning:', err.message);
    prisma = null;
  }
}

/**
 * Probes database health with a quick `SELECT 1` query.
 * Accepts an optional client override and timeoutMs for testing.
 *
 * @param {import('@prisma/client').PrismaClient|null} client
 * @param {{ timeoutMs?: number }} options
 * @returns {Promise<{ ok: boolean, error?: Error }>}
 */
export async function checkDatabaseHealth(client = prisma, { timeoutMs = 2000 } = {}) {
  if (!client) {
    console.error('Health check failed: database client is not initialized');
    return { ok: false, error: new Error('Database client is not initialized') };
  }

  let timer;
  try {
    const timeoutPromise = new Promise((_, reject) => {
      timer = setTimeout(() => {
        reject(new Error(`Database health probe timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });

    const queryPromise = client.$queryRaw`SELECT 1`;
    // Prevent unhandled promise rejection if timeout wins the race
    queryPromise.catch(() => {});

    await Promise.race([queryPromise, timeoutPromise]);
    return { ok: true };
  } catch (err) {
    // Sanitize any database URIs and credentials from the logged message
    const errorType = err.name || 'Error';
    const errorCode = err.code ? ` (${err.code})` : '';
    const rawMessage = err.message || 'Unknown database error';
    const sanitizedMessage = rawMessage.replace(/postgres(?:ql)?:\/\/[^\s"',]+/gi, '[REDACTED_DATABASE_URL]');

    console.error(`Health check failed: database probe error [${errorType}${errorCode}]: ${sanitizedMessage}`);
    return { ok: false, error: err };
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}

export default prisma;
