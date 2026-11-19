import { test, beforeEach, afterEach, describe } from 'node:test';
import assert from 'node:assert/strict';
import { PrismaClient } from '@prisma/client';
import app from '../src/app.js';
import prisma, { checkDatabaseHealth } from '../src/db.js';

describe('Database Health Check & Readiness Probe (/api/health)', () => {
  let server;
  let baseUrl;

  beforeEach(async () => {
    await new Promise(resolve => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  afterEach(async () => {
    // Guarantees restoration of app.locals state after every test, even if assertions throw
    delete app.locals.prisma;
    delete app.locals.dbHealthTimeoutMs;
    if (server) {
      await new Promise(resolve => server.close(resolve));
    }
  });

  test('healthy DB returns HTTP 200 with ok status and Cache-Control: no-store', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.equal(res.status, 200, 'Healthy database probe must return 200');
    assert.equal(res.headers.get('cache-control'), 'no-store', 'Response must include Cache-Control: no-store');

    const body = await res.json();
    assert.deepEqual(body, {
      status: 'ok',
      database: 'up'
    });
  });

  test('timeout path: probe rejects when query hangs, returning HTTP 503 within timeout', async () => {
    // Stub client where query never resolves, exercising our Promise.race timer directly
    const hangingStubClient = {
      $queryRaw: () => new Promise(() => {})
    };

    app.locals.prisma = hangingStubClient;
    app.locals.dbHealthTimeoutMs = 60; // 60ms timeout for test speed

    const startTime = Date.now();
    const res = await fetch(`${baseUrl}/api/health`);
    const durationMs = Date.now() - startTime;

    assert.equal(res.status, 503, 'Hanging query must return 503');
    assert.equal(res.headers.get('cache-control'), 'no-store');
    assert.ok(durationMs >= 50 && durationMs < 300, `Must trigger around 60ms timeout (took ${durationMs}ms)`);

    const body = await res.json();
    assert.deepEqual(body, {
      status: 'unavailable',
      database: 'down'
    });
  });

  test('connection error path: probe rejects on database connection failure without leaking credentials in logs or HTTP response', async () => {
    const fakeSecret = 'fake_secret_pass_12345';
    const fakeUrl = `postgresql://fake_user:${fakeSecret}@127.0.0.1:54321/fake_db`;
    const connectionError = new Error(`Can't reach database server at ${fakeUrl}`);
    connectionError.name = 'PrismaClientInitializationError';
    connectionError.code = 'P1001';

    const failingClient = {
      $queryRaw: () => Promise.reject(connectionError)
    };

    app.locals.prisma = failingClient;

    // Intercept console.error to verify server-side redaction
    const originalConsoleError = console.error;
    let loggedOutput = '';
    console.error = (...args) => {
      loggedOutput += args.join(' ') + '\n';
    };

    try {
      const res = await fetch(`${baseUrl}/api/health`);
      assert.equal(res.status, 503);
      assert.equal(res.headers.get('cache-control'), 'no-store');

      const body = await res.json();
      assert.deepEqual(body, {
        status: 'unavailable',
        database: 'down'
      });

      // Assert that HTTP response leaks nothing
      const rawBody = JSON.stringify(body);
      assert.ok(!rawBody.includes(fakeSecret), 'Response body must not contain credentials');
      assert.ok(!rawBody.includes('fake_user'), 'Response body must not contain username');
      assert.ok(!rawBody.includes(fakeUrl), 'Response body must not contain database URL');

      // Assert that server logs do NOT leak password or full connection URL
      assert.ok(!loggedOutput.includes(fakeSecret), 'Server logs must never contain the database password');
      assert.ok(!loggedOutput.includes(fakeUrl), 'Server logs must never contain the full database URL');
      assert.ok(loggedOutput.includes('[REDACTED_DATABASE_URL]'), 'Server logs should contain the redacted marker');
      assert.ok(loggedOutput.includes('P1001'), 'Server logs should retain the diagnostic error code');
    } finally {
      console.error = originalConsoleError;
      delete app.locals.prisma;
    }
  });

  test('real network timeout: unreachable DB client times out and returns HTTP 503 without leaking details', async () => {
    // Real Prisma client pointed at an unreachable port with connect_timeout
    const unreachableClient = new PrismaClient({
      datasources: {
        db: {
          url: 'postgresql://fake_probe_user:fake_placeholder_password_never_logged@127.0.0.1:54339/nexus_unreachable?connect_timeout=1'
        }
      }
    });

    try {
      app.locals.prisma = unreachableClient;
      app.locals.dbHealthTimeoutMs = 300;

      const startTime = Date.now();
      const res = await fetch(`${baseUrl}/api/health`);
      const probeDurationMs = Date.now() - startTime;

      assert.equal(res.status, 503, 'Unreachable DB must return 503 Service Unavailable');
      assert.equal(res.headers.get('cache-control'), 'no-store', 'Response must include Cache-Control: no-store');
      assert.ok(probeDurationMs < 2000, `Probe must fail fast within timeout (took ${probeDurationMs}ms)`);

      const body = await res.json();
      assert.deepEqual(body, {
        status: 'unavailable',
        database: 'down'
      });

      // Assert strictly that no internal details are present in the response
      const rawText = JSON.stringify(body);
      assert.ok(!rawText.includes('fake_placeholder_password_never_logged'), 'Must never leak connection password');
      assert.ok(!rawText.includes('fake_probe_user'), 'Must never leak connection username');
      assert.ok(!rawText.includes('127.0.0.1:54339'), 'Must never leak database host/port');
      assert.ok(!rawText.includes('Prisma'), 'Must never leak ORM details');
      assert.ok(!rawText.includes('error'), 'Must not include raw error keys');
    } finally {
      await unreachableClient.$disconnect().catch(() => {});
      delete app.locals.prisma;
      delete app.locals.dbHealthTimeoutMs;
    }
  });

  test('null database client (DATABASE_URL missing) returns HTTP 503 unavailable', async () => {
    app.locals.prisma = null;

    try {
      const res = await fetch(`${baseUrl}/api/health`);
      assert.equal(res.status, 503);
      const body = await res.json();
      assert.deepEqual(body, {
        status: 'unavailable',
        database: 'down'
      });
    } finally {
      delete app.locals.prisma;
    }
  });

  test('checkDatabaseHealth direct probe handles timeouts cleanly without open handles', async () => {
    const hangingStubClient = {
      $queryRaw: () => new Promise(() => {})
    };

    const startTime = Date.now();
    const probeResult = await checkDatabaseHealth(hangingStubClient, { timeoutMs: 50 });
    const durationMs = Date.now() - startTime;

    assert.equal(probeResult.ok, false);
    assert.ok(probeResult.error instanceof Error);
    assert.match(probeResult.error.message, /timed out after 50ms/i);
    assert.ok(durationMs >= 45 && durationMs < 200);
  });
});
