import { formatDate, formatStatus, statusClass, escapeHtml, toDateInputValue, fromDateInputValue } from '../core/utils.js';

const shipmentDialog = document.getElementById('shipment-dialog');
const dialogTitle = document.getElementById('dialog-title');
const dialogBody = document.getElementById('dialog-body');
const formTemplate = document.getElementById('shipment-form-template');

let handlers = {};
let currentShipment = null;
let currentView = null;

export function initShipmentModal({ onCreate, onUpdate, onReset }) {
    handlers = { onCreate, onUpdate, onReset };

    shipmentDialog.addEventListener('click', (e) => {
        if (e.target === shipmentDialog) {
            closeDialog();
            return;
        }

        const action = e.target.closest('[data-action]')?.dataset.action;

        switch (action) {
            case 'close':
                closeDialog();
                break;
            case 'edit':
                openShipmentForm(currentShipment);
                break;
            case 'cancel':
                if (currentView === 'form' && currentShipment) openShipmentDetails(currentShipment);
                else closeDialog();
                break;
            case 'confirm-reset':
                confirmReset(e.target.closest('.dialog-body'));
                break;
        }
    });

    shipmentDialog.addEventListener('submit', (e) => {
        const form = e.target.closest('.shipment-form');
        if (!form) return;
        e.preventDefault();
        submitShipmentForm(form);
    });
}

function openDialog(view, shipment, title, content) {
    currentView = view;
    currentShipment = shipment;
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

    openDialog('details', shipment, 'Shipment Details', content);
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

    openDialog('form', shipment, isEdit ? 'Edit Shipment' : 'New Shipment', form);
    fields.recipient.focus();
}

async function submitShipmentForm(form) {
    const fields = form.elements;
    const shipment = currentShipment;

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
        if (shipment) {
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
}

export function openResetConfirm() {
    const content = document.createElement('div');

    content.innerHTML = `
        <p class="dialog-text">This will restore the initial dataset. Every shipment you created or edited will be lost.</p>
        <p class="form-error" hidden></p>
        <div class="dialog-actions">
            <button type="button" class="btn-secondary" data-action="cancel">Cancel</button>
            <button type="button" class="btn-danger" data-action="confirm-reset">Reset Data</button>
        </div>
    `;

    openDialog('reset', null, 'Reset Data', content);
}

async function confirmReset(container) {
    showError(container, null);
    setBusy(container, true);
    try {
        await handlers.onReset();
        closeDialog();
    } catch (error) {
        setBusy(container, false);
        showError(container, error.message);
    }
}
