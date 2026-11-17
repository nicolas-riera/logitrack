import { formatDate, formatStatus, statusClass, escapeHtml, toDateInputValue, fromDateInputValue } from '../core/utils.js';

const shipmentDialog = document.getElementById('shipment-dialog');
const dialogTitle = document.getElementById('dialog-title');
const dialogBody = document.getElementById('dialog-body');
const dialogClose = document.getElementById('dialog-close');
const formTemplate = document.getElementById('shipment-form-template');

let handlers = {};

export function initShipmentModal({ onCreate, onUpdate, onReset }) {
    handlers = { onCreate, onUpdate, onReset };

    dialogClose.addEventListener('click', closeDialog);

    shipmentDialog.addEventListener('click', (e) => {
        if (e.target === shipmentDialog) closeDialog();
    });
}

function openDialog(title, content) {
    dialogTitle.textContent = title;
    dialogBody.replaceChildren(content);
    if (!shipmentDialog.open) shipmentDialog.showModal();
}

function closeDialog() {
    shipmentDialog.close();
}

function setBusy(container, busy) {
    container.querySelectorAll('button, input, select, textarea').forEach(el => {
        el.disabled = busy;
    });
}

function showError(container, message) {
    const errorEl = container.querySelector('.form-error');
    errorEl.textContent = message || '';
    errorEl.hidden = !message;
}

export function openShipmentDetails(shipment) {
    const content = document.createElement('div');
    const priorityClass = shipment.isPriority ? ' is-priority' : '';

    content.innerHTML = `
        <dl class="details-list">
            <div>
                <dt>Tracking Number</dt>
                <dd class="details-id${priorityClass}">${escapeHtml(shipment.trackingNumber || shipment.id)}</dd>
            </div>
            <div>
                <dt>Status</dt>
                <dd><span class="badge ${statusClass(shipment.status)}">${escapeHtml(formatStatus(shipment.status))}</span></dd>
            </div>
            <div>
                <dt>Recipient</dt>
                <dd>${escapeHtml(shipment.recipient || '-')}</dd>
            </div>
            <div>
                <dt>Destination City</dt>
                <dd>${escapeHtml(shipment.destinationCity || shipment.city || '-')}</dd>
            </div>
            <div>
                <dt>Carrier</dt>
                <dd>${escapeHtml(shipment.carrier || '-')}</dd>
            </div>
            <div>
                <dt>Priority</dt>
                <dd>${shipment.isPriority ? '<span class="priority-flag">Priority</span>' : 'Standard'}</dd>
            </div>
            <div>
                <dt>Departure</dt>
                <dd>${escapeHtml(formatDate(shipment.departureDate))}</dd>
            </div>
            <div>
                <dt>Estimated Delivery</dt>
                <dd>${escapeHtml(formatDate(shipment.estimatedDelivery || shipment.date))}</dd>
            </div>
            <div class="details-full">
                <dt>Internal Notes</dt>
                <dd>${escapeHtml(shipment.internalNotes || '-')}</dd>
            </div>
        </dl>
        <div class="dialog-actions">
            <button type="button" class="btn-primary" data-action="edit">Edit Shipment</button>
        </div>
    `;

    content.querySelector('[data-action="edit"]').addEventListener('click', () => openShipmentForm(shipment));

    openDialog('Shipment Details', content);
}

export function openShipmentForm(shipment = null) {
    const isEdit = Boolean(shipment);
    const form = formTemplate.content.firstElementChild.cloneNode(true);
    const fields = form.elements;

    if (isEdit) {
        fields.recipient.value = shipment.recipient || '';
        fields.destinationCity.value = shipment.destinationCity || shipment.city || '';
        fields.carrier.value = shipment.carrier || '';
        fields.status.value = shipment.status || 'PENDING';
        fields.estimatedDelivery.value = toDateInputValue(shipment.estimatedDelivery);
        fields.isPriority.checked = Boolean(shipment.isPriority);
        fields.internalNotes.value = shipment.internalNotes || '';
        form.querySelector('[data-action="submit"]').textContent = 'Save Changes';
    } else {
        form.querySelector('[data-action="submit"]').textContent = 'Create Shipment';
    }

    form.querySelector('[data-action="cancel"]').addEventListener('click', () => {
        if (isEdit) openShipmentDetails(shipment);
        else closeDialog();
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const invalidField = [...fields].find(field => field.required && !field.value.trim());
        if (invalidField) {
            showError(form, 'Recipient, destination city and carrier are required.');
            invalidField.focus();
            return;
        }

        const payload = {
            recipient: fields.recipient.value.trim(),
            destinationCity: fields.destinationCity.value.trim(),
            carrier: fields.carrier.value,
            status: fields.status.value,
            isPriority: fields.isPriority.checked,
            internalNotes: fields.internalNotes.value.trim()
        };

        const estimatedDelivery = fromDateInputValue(fields.estimatedDelivery.value);
        if (estimatedDelivery) payload.estimatedDelivery = estimatedDelivery;

        showError(form, null);
        setBusy(form, true);

        try {
            if (isEdit) {
                const updated = await handlers.onUpdate(shipment.id, payload);
                openShipmentDetails(updated);
            } else {
                await handlers.onCreate(payload);
                closeDialog();
            }
        } catch (error) {
            setBusy(form, false);
            showError(form, error.message);
        }
    });

    openDialog(isEdit ? 'Edit Shipment' : 'New Shipment', form);
    fields.recipient.focus();
}

export function openResetConfirm() {
    const content = document.createElement('div');

    content.innerHTML = `
        <p class="dialog-text">This will restore the initial dataset. Every shipment you created or edited will be lost.</p>
        <p class="form-error" hidden></p>
        <div class="dialog-actions">
            <button type="button" class="btn-secondary" data-action="cancel">Cancel</button>
            <button type="button" class="btn-danger" data-action="confirm">Reset Data</button>
        </div>
    `;

    content.querySelector('[data-action="cancel"]').addEventListener('click', closeDialog);

    content.querySelector('[data-action="confirm"]').addEventListener('click', async () => {
        showError(content, null);
        setBusy(content, true);
        try {
            await handlers.onReset();
            closeDialog();
        } catch (error) {
            setBusy(content, false);
            showError(content, error.message);
        }
    });

    openDialog('Reset Data', content);
}
