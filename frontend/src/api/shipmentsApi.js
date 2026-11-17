const API_URL = 'http://localhost:3000/api/v1/';

async function request(path, options = {}) {
    const init = { ...options };
    if (init.body !== undefined) {
        init.headers = { 'Content-Type': 'application/json', ...init.headers };
        init.body = JSON.stringify(init.body);
    }

    let response;
    try {
        response = await fetch(`${API_URL}${path}`, init);
    } catch {
        throw new Error('Unable to reach the server.');
    }

    const json = await response.json().catch(() => ({}));
    if (!response.ok || json.success === false) {
        throw new Error(json.error || `HTTP error! status: ${response.status}`);
    }
    return json.data ?? json;
}

export function getShipments() {
    return request('shipments');
}

export function createShipment(shipment) {
    return request('shipments', { method: 'POST', body: shipment });
}

export function updateShipment(id, changes) {
    return request(`shipments/${encodeURIComponent(id)}`, { method: 'PUT', body: changes });
}

export function resetShipments() {
    return request('reset', { method: 'POST' });
}
