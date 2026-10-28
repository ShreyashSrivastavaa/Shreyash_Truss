/**
 * API client for interacting with the Nexus backend service.
 * In development, requests to /api are proxied to http://localhost:5000 via Vite.
 */

async function handleResponse(response) {
  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    let errorMessage = 'Request failed';
    if (typeof data === 'object' && data !== null) {
      if (data.details && Array.isArray(data.details)) {
        errorMessage = data.details.map(d => `${d.field}: ${d.message}`).join(', ');
      } else if (data.error) {
        errorMessage = data.error;
      }
    } else if (typeof data === 'string') {
      errorMessage = data;
    }
    const error = new Error(errorMessage);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export async function fetchHealth() {
  const res = await fetch('/api/health');
  return handleResponse(res);
}

export async function fetchInventory() {
  const res = await fetch('/api/inventory');
  return handleResponse(res);
}

export async function fetchOpportunities() {
  const res = await fetch('/api/transfers/opportunities');
  return handleResponse(res);
}

export async function fetchTransferHistory() {
  const res = await fetch('/api/transfers');
  return handleResponse(res);
}

export async function createTransfer(transferPayload) {
  const res = await fetch('/api/transfers', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(transferPayload)
  });
  return handleResponse(res);
}

// Backwards-compatible alias for executeTransfer
export const executeTransfer = createTransfer;

export async function dispatchTransfer(transferId) {
  const res = await fetch(`/api/transfers/${encodeURIComponent(transferId)}/dispatch`, {
    method: 'POST'
  });
  return handleResponse(res);
}

export async function receiveTransfer(transferId) {
  const res = await fetch(`/api/transfers/${encodeURIComponent(transferId)}/receive`, {
    method: 'POST'
  });
  return handleResponse(res);
}

export async function cancelTransfer(transferId) {
  const res = await fetch(`/api/transfers/${encodeURIComponent(transferId)}/cancel`, {
    method: 'POST'
  });
  return handleResponse(res);
}

export async function resetInventory() {
  const res = await fetch('/api/inventory/reset', {
    method: 'POST'
  });
  return handleResponse(res);
}

export async function fetchVendors() {
  const res = await fetch('/api/vendors');
  return handleResponse(res);
}

export async function fetchVendorById(vendorId) {
  const res = await fetch(`/api/vendors/${encodeURIComponent(vendorId)}`);
  return handleResponse(res);
}

export async function fetchVendorDeliveries(params = {}) {
  const query = new URLSearchParams();
  if (params.vendorId) query.append('vendorId', params.vendorId);
  if (params.status) query.append('status', params.status);
  if (params.limit) query.append('limit', params.limit);
  if (params.offset) query.append('offset', params.offset);

  const qs = query.toString();
  const url = qs ? `/api/vendors/deliveries?${qs}` : '/api/vendors/deliveries';
  const res = await fetch(url);
  return handleResponse(res);
}

export async function createVendorDelivery(payload) {
  const res = await fetch('/api/vendors/deliveries', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  return handleResponse(res);
}

export async function updateVendorDelivery(deliveryId, payload) {
  const res = await fetch(`/api/vendors/deliveries/${encodeURIComponent(deliveryId)}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  return handleResponse(res);
}

export async function resetVendors() {
  const res = await fetch('/api/vendors/reset', {
    method: 'POST'
  });
  return handleResponse(res);
}
