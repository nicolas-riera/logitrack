const API_URL = 'http://localhost:3000/api/v1/';

export async function getShipments() {
    const response = await fetch(`${API_URL}shipments`);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const json = await response.json();
    return json.data || json;
}