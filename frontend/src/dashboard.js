import { formatDate, formatStatus, statusClass } from './core/utils.js';
import { getShipments, createShipment, updateShipment, resetShipments } from './api/shipmentsApi.js';
import { initNavigation } from './components/navigation.js';
import { initDropdowns } from './components/dropdown.js';
import { initShipmentModal, openShipmentDetails, openShipmentForm, openResetConfirm } from './components/shipmentModal.js';
import { showLoading, showError, hideNetworkState } from './components/networkState.js';

const shipmentsList = document.getElementById('shipments-list');
const shipmentTemplate = document.getElementById('shipment-template');
const searchInput = document.getElementById('search-input');
const filterDropdowns = document.querySelectorAll('.dropdown[data-filter]');
const priorityOnlyCheckbox = document.getElementById('priority-only');
const filtersToggle = document.getElementById('filters-toggle');
const filtersPanel = document.getElementById('filters-panel');
const filtersCount = document.getElementById('filters-count');
const sortHeaders = document.querySelectorAll('.list-header .sortable');
const newShipmentButton = document.getElementById('btn-new-shipment');
const resetDataButton = document.getElementById('btn-reset-data');

let allShipments = [];
const filters = { status: 'ALL', carrier: 'ALL', priorityOnly: false };
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

function matchesFilters(shipment) {
    const matchesStatus = filters.status === 'ALL' || shipment.status === filters.status;
    const matchesCarrier = filters.carrier === 'ALL' || shipment.carrier?.toUpperCase() === filters.carrier.toUpperCase();
    const matchesPriority = !filters.priorityOnly || Boolean(shipment.isPriority);
    const searchString = `${shipment.id} ${shipment.trackingNumber || ''} ${shipment.recipient} ${shipment.destinationCity || shipment.city || ''} ${shipment.carrier || ''}`.toLowerCase();
    const matchesSearch = searchString.includes(currentSearch.toLowerCase());

    return matchesStatus && matchesCarrier && matchesPriority && matchesSearch;
}

function sortValue(shipment, column) {
    const value = shipment[column] ?? '';
    if (column === 'estimatedDelivery') return value ? new Date(value).getTime() : 0;
    return typeof value === 'string' ? value.toLowerCase() : value;
}

function renderShipments() {
    shipmentsList.innerHTML = '';

    const filtered = allShipments.filter(matchesFilters);

    if (currentSort.column) {
        const { column, ascending } = currentSort;
        filtered.sort((a, b) => {
            const valA = sortValue(a, column);
            const valB = sortValue(b, column);
            if (valA < valB) return ascending ? -1 : 1;
            if (valA > valB) return ascending ? 1 : -1;
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
        const idElement = card.querySelector('.shipment-id');

        card.dataset.id = shipment.id;
        card.classList.toggle('is-priority', Boolean(shipment.isPriority));

        idElement.textContent = shipment.trackingNumber || shipment.id;
        if (shipment.isPriority) idElement.title = 'Priority shipment';

        card.querySelector('.shipment-recipient').textContent = shipment.recipient;
        card.querySelector('.shipment-city').textContent = shipment.destinationCity || shipment.city || '-';
        card.querySelector('.shipment-carrier').textContent = shipment.carrier || '-';

        const badge = card.querySelector('.badge');
        badge.textContent = formatStatus(shipment.status);
        badge.className = `badge ${statusClass(shipment.status)}`;

        card.querySelector('.shipment-date').textContent = formatDate(shipment.estimatedDelivery || shipment.date);

        fragment.appendChild(clone);
    });

    shipmentsList.appendChild(fragment);
}

function updateFiltersCount() {
    const activeCount = [filters.status !== 'ALL', filters.carrier !== 'ALL', filters.priorityOnly].filter(Boolean).length;
    filtersCount.textContent = activeCount;
    filtersCount.hidden = activeCount === 0;
}

function updateSortHeaders() {
    sortHeaders.forEach(header => {
        const isActive = header.dataset.sort === currentSort.column;
        header.classList.toggle('sort-asc', isActive && currentSort.ascending);
        header.classList.toggle('sort-desc', isActive && !currentSort.ascending);
    });
}

async function handleCreate(payload) {
    const created = await createShipment(payload);
    allShipments.unshift(created);
    renderShipments();
    return created;
}

async function handleUpdate(id, payload) {
    const updated = await updateShipment(id, payload);
    allShipments = allShipments.map(s => (s.id === id ? updated : s));
    renderShipments();
    return updated;
}

async function handleReset() {
    await resetShipments();
    await loadDashboardData();
}

function bindDashboardEvents() {
    shipmentsList.addEventListener('click', (e) => {
        const card = e.target.closest('.shipment-card');
        if (!card) return;

        const shipment = allShipments.find(s => String(s.id) === card.dataset.id);
        if (shipment) openShipmentDetails(shipment);
    });

    initDropdowns(filterDropdowns, (key, value) => {
        filters[key] = value;
        updateFiltersCount();
        renderShipments();
    });

    priorityOnlyCheckbox.addEventListener('change', (e) => {
        filters.priorityOnly = e.target.checked;
        updateFiltersCount();
        renderShipments();
    });

    filtersToggle.addEventListener('click', () => {
        const expanded = filtersPanel.classList.toggle('open');
        filtersToggle.setAttribute('aria-expanded', String(expanded));
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
            const column = header.dataset.sort;
            if (currentSort.column === column) {
                currentSort.ascending = !currentSort.ascending;
            } else {
                currentSort = { column, ascending: true };
            }
            updateSortHeaders();
            renderShipments();
        });
    });

    newShipmentButton.addEventListener('click', () => openShipmentForm());
    resetDataButton.addEventListener('click', openResetConfirm);
}

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initShipmentModal({ onCreate: handleCreate, onUpdate: handleUpdate, onReset: handleReset });
    bindDashboardEvents();
    loadDashboardData();
});
