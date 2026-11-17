const API_URL = 'http://localhost:3000/api/v1/';

const shipmentsList = document.getElementById('shipments-list');
const networkState = document.getElementById('network-state');
const shipmentTemplate = document.getElementById('shipment-template');
const searchInput = document.getElementById('search-input');
const filterButtons = document.querySelectorAll('.filter-btn');
const mobileStatusSelect = document.getElementById('mobile-status-select');
const shipmentDialog = document.getElementById('shipment-dialog');
const dialogBody = document.getElementById('dialog-body');
const appSidebar = document.getElementById('app-sidebar');
const mobileNavToggle = document.getElementById('mobile-nav-toggle');
const sortHeaders = document.querySelectorAll('.list-header .sortable');

let allShipments = [];
let currentFilter = 'ALL';
let currentSearch = '';
let currentSort = { column: null, ascending: true };
let searchDebounceTimer = null;

async function fetchShipments() {
    showLoading();
    try {
        const response = await fetch(`${API_URL}shipments`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const json = await response.json();
        allShipments = json.data || json;
        hideNetworkState();
        renderShipments();
    } catch (error) {
        showError('Unable to connect to the server. Please check if the backend is running.');
    }
}

function showLoading() {
    networkState.className = 'network-state loading';
    networkState.innerHTML = `
        <div class="spinner"></div>
        <p>Loading shipments...</p>
    `;
    shipmentsList.innerHTML = '';
}

function showError(message) {
    networkState.className = 'network-state error';
    networkState.innerHTML = `
        <p class="error-message">${message}</p>
        <button id="retry-btn" class="btn-primary">Retry</button>
    `;
    document.getElementById('retry-btn').addEventListener('click', fetchShipments);
}

function hideNetworkState() {
    networkState.className = 'network-state hidden';
    networkState.innerHTML = '';
}

function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function renderShipments() {
    shipmentsList.innerHTML = '';

    const filtered = allShipments.filter(shipment => {
        const matchesStatus = currentFilter === 'ALL' || shipment.status === currentFilter;
        const searchString = `${shipment.id} ${shipment.trackingNumber || ''} ${shipment.recipient} ${shipment.destinationCity || shipment.city || ''}`.toLowerCase();
        const matchesSearch = searchString.includes(currentSearch.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    if (currentSort.column) {
        filtered.sort((a, b) => {
            let valA = a[currentSort.column] || '';
            let valB = b[currentSort.column] || '';
            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();

            if (valA < valB) return currentSort.ascending ? -1 : 1;
            if (valA > valB) return currentSort.ascending ? 1 : -1;
            return 0;
        });
    }

    if (filtered.length === 0) {
        shipmentsList.innerHTML = `<li class="no-results">No shipments found.</li>`;
        return;
    }

    const fragment = document.createDocumentFragment();

    filtered.forEach(shipment => {
        const clone = shipmentTemplate.content.cloneNode(true);

        const card = clone.querySelector('.shipment-card');
        card.querySelector('.shipment-id').textContent = shipment.trackingNumber || shipment.id;
        card.querySelector('.shipment-recipient').textContent = shipment.recipient;
        card.querySelector('.shipment-city').textContent = shipment.destinationCity || shipment.city || '-';
        
        const badge = card.querySelector('.badge');
        badge.textContent = shipment.status;
        badge.className = `badge status-${shipment.status.toLowerCase().replace('_', '-')}`;

        card.querySelector('.shipment-date').textContent = formatDate(shipment.estimatedDelivery || shipment.date);

        card.addEventListener('click', () => openShipmentDetails(shipment));

        fragment.appendChild(clone);
    });

    shipmentsList.appendChild(fragment);
}

function openShipmentDetails(shipment) {
    dialogBody.innerHTML = `
        <p><strong>ID:</strong> ${escapeHtml(shipment.trackingNumber || shipment.id)}</p>
        <p><strong>Recipient:</strong> ${escapeHtml(shipment.recipient)}</p>
        <p><strong>Destination City:</strong> ${escapeHtml(shipment.destinationCity || shipment.city || '-')}</p>
        <p><strong>Status:</strong> ${escapeHtml(shipment.status)}</p>
        <p><strong>Estimated Delivery:</strong> ${escapeHtml(formatDate(shipment.estimatedDelivery || shipment.date))}</p>
    `;
    shipmentDialog.showModal();
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

mobileNavToggle.addEventListener('click', () => {
    appSidebar.classList.toggle('expanded');
});

filterButtons.forEach(button => {
    button.addEventListener('click', () => {
        filterButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        currentFilter = button.getAttribute('data-status');
        mobileStatusSelect.value = currentFilter;
        renderShipments();
    });
});

mobileStatusSelect.addEventListener('change', (e) => {
    currentFilter = e.target.value;
    filterButtons.forEach(btn => {
        if (btn.getAttribute('data-status') === currentFilter) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    renderShipments();
});

searchInput.addEventListener('input', (e) => {
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
        currentSearch = e.target.value.trim();
        renderShipments();
    }, 300);
});

sortHeaders.forEach(header => {
    header.addEventListener('click', () => {
        const column = header.getAttribute('data-sort');
        if (currentSort.column === column) {
            currentSort.ascending = !currentSort.ascending;
        } else {
            currentSort.column = column;
            currentSort.ascending = true;
        }
        renderShipments();
    });
});

document.addEventListener('DOMContentLoaded', fetchShipments);