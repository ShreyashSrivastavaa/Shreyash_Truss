import { test, beforeEach, afterEach, describe } from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';
import prisma from '../src/db.js';
import { resetState } from '../src/services/inventoryService.js';

describe('Backend Role-Based Access Control (RBAC) & Depot Scoping (Commit 2.3)', () => {
  let server;
  let baseUrl;

  let headToken;
  let northManagerToken;
  let southManagerToken;
  let procurementToken;
  let viewerToken;

  beforeEach(async () => {
    await resetState();
    await prisma.user.deleteMany();

    await new Promise(resolve => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });

    // Register real personas
    const registerPersona = async (email, password, name, role, depotId = null) => {
      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, role, depotId })
      });
      const json = await res.json();
      return json.token;
    };

    // Enable role registration during persona setup
    app.locals.allowRoleRegistration = true;

    headToken = await registerPersona('priya@truss.supply', 'PriyaPassword2026', 'Priya Nair', 'HEAD_OF_SUPPLY_CHAIN');
    northManagerToken = await registerPersona('rohit@truss.supply', 'RohitPassword2026', 'Rohit Chauhan', 'DEPOT_MANAGER', 'depot-north');
    southManagerToken = await registerPersona('meera@truss.supply', 'MeeraPassword2026', 'Meera Krishnan', 'DEPOT_MANAGER', 'depot-south');
    procurementToken = await registerPersona('sunita@truss.supply', 'SunitaPassword2026', 'Sunita Rao', 'PROCUREMENT_MANAGER');
    viewerToken = await registerPersona('viewer@truss.supply', 'ViewerPassword2026', 'Guest Viewer', 'VIEWER');

    // Turn off role registration after persona setup
    delete app.locals.allowRoleRegistration;
  });

  afterEach(async () => {
    delete app.locals.allowRoleRegistration;
    delete app.locals.enforceAuth;
    delete app.locals.prisma;
    if (server) {
      await new Promise(resolve => server.close(resolve));
    }
  });

  test('Missing or invalid Authorization header returns HTTP 401 Unauthorized', async () => {
    const res = await fetch(`${baseUrl}/api/transfers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        skuId: 'SKU-MED-01',
        fromDepotId: 'depot-south',
        toDepotId: 'depot-north',
        quantity: 10
      })
    });

    assert.equal(res.status, 401, 'Unauthenticated mutation must be rejected with 401');
    const json = await res.json();
    assert.match(json.error, /authentication required/i);
  });

  test('VIEWER role is blocked with HTTP 403 Forbidden from creating transfers', async () => {
    const res = await fetch(`${baseUrl}/api/transfers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${viewerToken}`
      },
      body: JSON.stringify({
        skuId: 'SKU-MED-01',
        fromDepotId: 'depot-south',
        toDepotId: 'depot-north',
        quantity: 10
      })
    });

    assert.equal(res.status, 403, 'VIEWER role must receive 403 Forbidden');
    const json = await res.json();
    assert.match(json.error, /forbidden.*VIEWER.*not authorized/i);
  });

  test('PROCUREMENT_MANAGER role is blocked from creating transfers', async () => {
    const res = await fetch(`${baseUrl}/api/transfers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${procurementToken}`
      },
      body: JSON.stringify({
        skuId: 'SKU-MED-01',
        fromDepotId: 'depot-south',
        toDepotId: 'depot-north',
        quantity: 10
      })
    });

    assert.equal(res.status, 403);
    const json = await res.json();
    assert.match(json.error, /forbidden.*PROCUREMENT_MANAGER.*not authorized/i);
  });

  test('DEPOT_MANAGER role is blocked from configuring vendor SLAs', async () => {
    const res = await fetch(`${baseUrl}/api/vendors`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${northManagerToken}`
      },
      body: JSON.stringify({
        id: 'VND-NEW-TEST',
        name: 'New Test Supplier'
      })
    });

    assert.equal(res.status, 403, 'DEPOT_MANAGER cannot create vendors');
    const json = await res.json();
    assert.match(json.error, /forbidden.*DEPOT_MANAGER.*not authorized/i);
  });

  test('Depot scoping: DEPOT_MANAGER can transfer from assigned depot, but is rejected for other depots', async () => {
    // 1. Cross-depot violation: Rohit (North Manager) tries to move inventory FROM South depot
    const crossDepotRes = await fetch(`${baseUrl}/api/transfers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${northManagerToken}`
      },
      body: JSON.stringify({
        skuId: 'SKU-MED-01',
        fromDepotId: 'depot-south', // Unauthorized: Rohit only manages depot-north
        toDepotId: 'depot-north',
        quantity: 10
      })
    });

    assert.equal(crossDepotRes.status, 403, 'Cross-depot transfer by depot manager must be rejected with 403');
    const crossDepotJson = await crossDepotRes.json();
    assert.match(crossDepotJson.error, /only authorized for depot 'depot-north'/i);

    // 2. Authorized origin: Meera (South Manager) moves inventory FROM South depot
    const authorizedRes = await fetch(`${baseUrl}/api/transfers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${southManagerToken}`
      },
      body: JSON.stringify({
        skuId: 'SKU-MED-01',
        fromDepotId: 'depot-south', // Authorized origin
        toDepotId: 'depot-north',
        quantity: 20
      })
    });

    assert.equal(authorizedRes.status, 201, 'Authorized depot manager must succeed with 201 Created');
    const authJson = await authorizedRes.json();
    assert.equal(authJson.transfer.status, 'PENDING');
  });

  test('HEAD_OF_SUPPLY_CHAIN has global authorization across all depots and vendor management', async () => {
    // 1. Global transfer authority from South
    const transferRes = await fetch(`${baseUrl}/api/transfers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${headToken}`
      },
      body: JSON.stringify({
        skuId: 'SKU-MED-01',
        fromDepotId: 'depot-south',
        toDepotId: 'depot-north',
        quantity: 15
      })
    });
    assert.equal(transferRes.status, 201, 'Head of Supply Chain has universal transfer clearance');

    // 2. Vendor SLA update authority
    const vendorRes = await fetch(`${baseUrl}/api/vendors/VND-APEX-01`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${headToken}`
      },
      body: JSON.stringify({
        targetOtifRate: 98.5
      })
    });
    assert.equal(vendorRes.status, 200, 'Head of Supply Chain has vendor configuration clearance');
    const vendorJson = await vendorRes.json();
    assert.equal(vendorJson.vendor.targetOtifRate, 98.5);
  });

  test('Depot isolation on dispatch: DEPOT_MANAGER cannot dispatch transfer originating from another depot', async () => {
    // 1. Create a transfer originating from South
    const createRes = await fetch(`${baseUrl}/api/transfers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${southManagerToken}`
      },
      body: JSON.stringify({
        skuId: 'SKU-MED-01',
        fromDepotId: 'depot-south',
        toDepotId: 'depot-north',
        quantity: 10
      })
    });
    assert.equal(createRes.status, 201);
    const { transfer } = await createRes.json();

    // 2. Rohit (North Manager) attempts to dispatch South's transfer -> 403
    const crossDispatchRes = await fetch(`${baseUrl}/api/transfers/${transfer.id}/dispatch`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${northManagerToken}` }
    });
    assert.equal(crossDispatchRes.status, 403, 'Cross-depot dispatch must be rejected with 403');
    const crossJson = await crossDispatchRes.json();
    assert.match(crossJson.error, /only authorized to dispatch transfers from depot 'depot-north'/i);

    // 3. Meera (South Manager) dispatches South's transfer -> 200
    const authDispatchRes = await fetch(`${baseUrl}/api/transfers/${transfer.id}/dispatch`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${southManagerToken}` }
    });
    assert.equal(authDispatchRes.status, 200, 'Authorized depot manager dispatches successfully');
  });

  test('Depot isolation on receive: DEPOT_MANAGER cannot receive transfer destined for another depot', async () => {
    // 1. Create and dispatch transfer from South to North
    const createRes = await fetch(`${baseUrl}/api/transfers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${southManagerToken}`
      },
      body: JSON.stringify({
        skuId: 'SKU-MED-01',
        fromDepotId: 'depot-south',
        toDepotId: 'depot-north',
        quantity: 10
      })
    });
    const { transfer } = await createRes.json();

    await fetch(`${baseUrl}/api/transfers/${transfer.id}/dispatch`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${southManagerToken}` }
    });

    // 2. Meera (South Manager) attempts to receive at North -> 403
    const crossReceiveRes = await fetch(`${baseUrl}/api/transfers/${transfer.id}/receive`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${southManagerToken}` }
    });
    assert.equal(crossReceiveRes.status, 403, 'Cross-depot receive must be rejected with 403');
    const crossJson = await crossReceiveRes.json();
    assert.match(crossJson.error, /only authorized to receive transfers at destination depot 'depot-south'/i);

    // 3. Rohit (North Manager) receives at North -> 200
    const authReceiveRes = await fetch(`${baseUrl}/api/transfers/${transfer.id}/receive`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${northManagerToken}` }
    });
    assert.equal(authReceiveRes.status, 200, 'Authorized recipient depot manager receives successfully');
  });

  test('Depot isolation on cancel: DEPOT_MANAGER cannot cancel transfer originating from another depot', async () => {
    // 1. Create a transfer originating from South
    const createRes = await fetch(`${baseUrl}/api/transfers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${southManagerToken}`
      },
      body: JSON.stringify({
        skuId: 'SKU-MED-01',
        fromDepotId: 'depot-south',
        toDepotId: 'depot-north',
        quantity: 10
      })
    });
    const { transfer } = await createRes.json();

    // 2. Rohit (North Manager) attempts to cancel South's transfer -> 403
    const crossCancelRes = await fetch(`${baseUrl}/api/transfers/${transfer.id}/cancel`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${northManagerToken}` }
    });
    assert.equal(crossCancelRes.status, 403, 'Cross-depot cancellation must be rejected with 403');
    const crossJson = await crossCancelRes.json();
    assert.match(crossJson.error, /only authorized to cancel transfers originating from depot 'depot-north'/i);

    // 3. Meera (South Manager) cancels South's transfer -> 200
    const authCancelRes = await fetch(`${baseUrl}/api/transfers/${transfer.id}/cancel`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${southManagerToken}` }
    });
    assert.equal(authCancelRes.status, 200, 'Authorized origin depot manager cancels successfully');
  });

  test('Depot manager without assigned depotId is rejected with HTTP 403', async () => {
    app.locals.allowRoleRegistration = true;
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'unassigned.mgr@truss.supply',
        password: 'Password@2026',
        name: 'Unassigned Manager',
        role: 'DEPOT_MANAGER',
        depotId: null
      })
    });
    delete app.locals.allowRoleRegistration;
    const { token: unassignedToken } = await res.json();

    const transferRes = await fetch(`${baseUrl}/api/transfers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${unassignedToken}`
      },
      body: JSON.stringify({
        skuId: 'SKU-MED-01',
        fromDepotId: 'depot-south',
        toDepotId: 'depot-north',
        quantity: 10
      })
    });

    assert.equal(transferRes.status, 403);
    const json = await transferRes.json();
    assert.match(json.error, /depot manager has no assigned depot/i);
  });

  test('Vendor delivery endpoints require authentication (reject unauthenticated with HTTP 401)', async () => {
    // 1. POST /api/vendors/deliveries without token -> 401
    const postRes = await fetch(`${baseUrl}/api/vendors/deliveries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vendorId: 'VND-APEX-01',
        poNumber: 'PO-TEST-401',
        expectedDeliveryDate: '2026-11-20T00:00:00.000Z',
        expectedQuantity: 100
      })
    });
    assert.equal(postRes.status, 401, 'POST /api/vendors/deliveries must require authentication');

    // 2. PATCH /api/vendors/deliveries/:id without token -> 401
    const patchRes = await fetch(`${baseUrl}/api/vendors/deliveries/DEL-2026-001`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'DELIVERED'
      })
    });
    assert.equal(patchRes.status, 401, 'PATCH /api/vendors/deliveries/:id must require authentication');

    // 3. Authenticated procurement manager succeeds
    const authPostRes = await fetch(`${baseUrl}/api/vendors/deliveries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${procurementToken}`
      },
      body: JSON.stringify({
        vendorId: 'VND-APEX-01',
        poNumber: 'PO-TEST-AUTH',
        expectedDeliveryDate: '2026-11-25T00:00:00.000Z',
        expectedQuantity: 150
      })
    });
    assert.equal(authPostRes.status, 201, 'Authenticated procurement manager can create delivery');
  });

  test('Fail-closed default: unauthenticated mutation fails with 401 even when enforceAuth is not set', async () => {
    // Explicitly delete any test flags
    delete app.locals.enforceAuth;
    delete app.locals.allowAnonymousMutations;

    const res = await fetch(`${baseUrl}/api/transfers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        skuId: 'SKU-MED-01',
        fromDepotId: 'depot-south',
        toDepotId: 'depot-north',
        quantity: 10
      })
    });

    assert.equal(res.status, 401, 'Production default must fail-closed on missing authentication');
  });
});

