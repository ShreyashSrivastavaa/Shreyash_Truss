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

export async function executeTransfer(transferPayload) {
  const res = await fetch('/api/transfers', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(transferPayload)
  });
  return handleResponse(res);
}

export async function resetInventory() {
  const res = await fetch('/api/inventory/reset', {
    method: 'POST'
  });
  return handleResponse(res);
}
