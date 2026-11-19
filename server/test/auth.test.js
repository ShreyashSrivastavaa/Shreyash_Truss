import { test, beforeEach, afterEach, describe } from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';
import prisma from '../src/db.js';
import { verifyToken, createToken } from '../src/utils/crypto.js';

describe('Real User Authentication, Registration & Token Lifecycle (Commit 2.2)', () => {
  let server;
  let baseUrl;

  beforeEach(async () => {
    // Clean users table before each test
    await prisma.user.deleteMany();

    await new Promise(resolve => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  afterEach(async () => {
    delete app.locals.prisma;
    if (server) {
      await new Promise(resolve => server.close(resolve));
    }
  });

  test('POST /api/auth/register persists user in PostgreSQL with hashed password and issues token', async () => {
    const payload = {
      email: 'priya.nair@truss.supply',
      password: 'SecurePassword@2026',
      name: 'Priya Nair',
      role: 'HEAD_OF_SUPPLY_CHAIN',
      depotId: null
    };

    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    assert.equal(res.status, 201, 'Registration must return 201 Created');
    const json = await res.json();

    assert.equal(json.message, 'Account registered successfully');
    assert.equal(json.user.email, 'priya.nair@truss.supply');
    assert.equal(json.user.name, 'Priya Nair');
    assert.equal(json.user.role, 'HEAD_OF_SUPPLY_CHAIN');
    assert.ok(json.token, 'Must return signed token');

    // Verify token can be decoded
    const decoded = verifyToken(json.token);
    assert.equal(decoded.sub, json.user.id);
    assert.equal(decoded.email, 'priya.nair@truss.supply');
    assert.equal(decoded.role, 'HEAD_OF_SUPPLY_CHAIN');

    // Verify direct PostgreSQL persistence
    const dbRecord = await prisma.user.findUnique({
      where: { email: 'priya.nair@truss.supply' }
    });
    assert.ok(dbRecord, 'User record must exist in PostgreSQL database');
    assert.notEqual(dbRecord.passwordHash, 'SecurePassword@2026', 'Password must be hashed, never plain text');
    assert.match(dbRecord.passwordHash, /^[a-f0-9]{32}:[a-f0-9]{128}$/, 'Must be salt:key scrypt hash');
  });

  test('POST /api/auth/register rejects duplicate email with HTTP 409 Conflict', async () => {
    const payload = {
      email: 'rohit.chauhan@truss.supply',
      password: 'Gurugram@Password2026',
      name: 'Rohit Chauhan',
      role: 'DEPOT_MANAGER',
      depotId: 'depot-north'
    };

    // First registration
    const res1 = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    assert.equal(res1.status, 201);

    // Duplicate registration
    const res2 = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    assert.equal(res2.status, 409, 'Duplicate email must return 409 Conflict');
    const json = await res2.json();
    assert.match(json.error, /already exists/i);
  });

  test('POST /api/auth/register rejects weak password or invalid role with HTTP 400', async () => {
    // 1. Weak password (< 8 chars)
    const weakRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@truss.supply',
        password: 'short',
        name: 'Tester'
      })
    });
    assert.equal(weakRes.status, 400);

    // 2. Invalid role
    const invalidRoleRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test2@truss.supply',
        password: 'Password@123',
        name: 'Tester 2',
        role: 'SUPER_HACKER'
      })
    });
    assert.equal(invalidRoleRes.status, 400);
  });

  test('POST /api/auth/login authenticates against PostgreSQL and rejects invalid passwords with 401', async () => {
    // Register test user
    await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'meera.krishnan@truss.supply',
        password: 'Chennai@Password2026',
        name: 'Meera Krishnan',
        role: 'DEPOT_MANAGER',
        depotId: 'depot-south'
      })
    });

    // 1. Successful login
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'meera.krishnan@truss.supply',
        password: 'Chennai@Password2026'
      })
    });
    assert.equal(loginRes.status, 200);
    const loginJson = await loginRes.json();
    assert.equal(loginJson.message, 'Login successful');
    assert.equal(loginJson.user.email, 'meera.krishnan@truss.supply');
    assert.ok(loginJson.token);

    // 2. Wrong password
    const wrongPassRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'meera.krishnan@truss.supply',
        password: 'WrongPassword@999'
      })
    });
    assert.equal(wrongPassRes.status, 401);
    const wrongPassJson = await wrongPassRes.json();
    assert.match(wrongPassJson.error, /invalid email or password/i);

    // 3. Unknown email
    const unknownEmailRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'ghost@truss.supply',
        password: 'SomePassword@123'
      })
    });
    assert.equal(unknownEmailRes.status, 401);
  });

  test('GET /api/auth/me returns authenticated user profile and rejects unauthorized requests', async () => {
    // Register test user
    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'sunita.rao@truss.supply',
        password: 'Procurement@2026',
        name: 'Sunita Rao',
        role: 'PROCUREMENT_MANAGER'
      })
    });
    const { token } = await regRes.json();

    // 1. Authorized GET /api/auth/me
    const meRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.equal(meRes.status, 200);
    const meJson = await meRes.json();
    assert.equal(meJson.user.email, 'sunita.rao@truss.supply');
    assert.equal(meJson.user.role, 'PROCUREMENT_MANAGER');

    // 2. Missing authorization header
    const noAuthRes = await fetch(`${baseUrl}/api/auth/me`);
    assert.equal(noAuthRes.status, 401);

    // 3. Tampered token
    const tamperedToken = token.slice(0, -5) + 'xxxxx';
    const tamperedRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${tamperedToken}` }
    });
    assert.equal(tamperedRes.status, 401);
  });

  test('Auth endpoints map database connection errors to 503 DATABASE_UNAVAILABLE', async () => {
    const connectionError = new Error("Can't reach database server at postgresql://fake_db:5432/nexus");
    connectionError.name = 'PrismaClientInitializationError';
    connectionError.code = 'P1001';

    const failingClient = {
      user: {
        findUnique: () => Promise.reject(connectionError),
        create: () => Promise.reject(connectionError)
      }
    };

    app.locals.prisma = failingClient;

    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@truss.supply',
        password: 'Password@2026'
      })
    });

    assert.equal(res.status, 503);
    const json = await res.json();
    assert.deepEqual(json, {
      error: 'Database service is temporarily unavailable',
      code: 'DATABASE_UNAVAILABLE'
    });
  });
});
