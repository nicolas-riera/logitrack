import { formatDate, escapeHtml } from '../core/utils.js';

const shipmentDialog = document.getElementById('shipment-dialog');
const dialogBody = document.getElementById('dialog-body');

export function openShipmentDetails(shipment) {
    dialogBody.innerHTML = `
        <p><strong>ID:</strong> ${escapeHtml(shipment.trackingNumber || shipment.id)}</p>
        <p><strong>Recipient:</strong> ${escapeHtml(shipment.recipient)}</p>
        <p><strong>Destination City:</strong> ${escapeHtml(shipment.destinationCity || shipment.city || '-')}</p>
        <p><strong>Status:</strong> ${escapeHtml(shipment.status)}</p>
        <p><strong>Estimated Delivery:</strong> ${escapeHtml(formatDate(shipment.estimatedDelivery || shipment.date))}</p>
    `;
    shipmentDialog.showModal();
}