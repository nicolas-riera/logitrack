import { formatDate } from './core/utils.js';
import { getShipments } from './api/shipmentsApi.js';
import { initNavigation } from './components/navigation.js';
import { openShipmentDetails } from './components/shipmentModal.js';
import { showLoading, showError, hideNetworkState } from './components/networkState.js';

const shipmentsList = document.getElementById('shipments-list');
const shipmentTemplate = document.getElementById('shipment-template');
const searchInput = document.getElementById('search-input');
const filterButtons = document.querySelectorAll('.filter-btn');
const mobileStatusSelect = document.getElementById('mobile-status-select');
const sortHeaders = document.querySelectorAll('.list-header .sortable');

let allShipments = [];
let currentFilter = 'ALL';
let currentSearch = '';
let currentSort = { column: null, ascending: true };
let searchDebounceTimer = null;

async function loadDashboardData() {
    showLoading(shipmentsList);
    try {
        allShipments = await getShipments();
        hideNetworkState();
        renderShipments();
    } catch (error) {
        showError('Unable to connect to the server. Please check if the backend is running.', loadDashboardData);
    }
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

function bindDashboardEvents() {
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
            btn.classList.toggle('active', btn.getAttribute('data-status') === currentFilter);
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
}

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    bindDashboardEvents();
    loadDashboardData();
});