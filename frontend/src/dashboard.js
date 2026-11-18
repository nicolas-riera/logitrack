import { formatDate, formatStatus, statusClass } from './core/utils.js';
import { getShipments, createShipment, updateShipment, resetShipments } from './api/shipmentsApi.js';
import { initNavigation, closeNavigation } from './components/navigation.js';
import { initDropdowns, handleDropdownClick, closeDropdowns, setDropdownValue } from './components/dropdown.js';
import { initShipmentModal, openShipmentDetails, openShipmentForm, openResetConfirm } from './components/shipmentModal.js';
import { showLoading, showError, hideNetworkState } from './components/networkState.js';

const appMain = document.querySelector('.app-main');
const shipmentsList = document.getElementById('shipments-list');
const shipmentTemplate = document.getElementById('shipment-template');
const searchInput = document.getElementById('search-input');
const priorityOnlyCheckbox = document.getElementById('priority-only');
const filtersToggle = document.getElementById('filters-toggle');
const filtersPanel = document.getElementById('filters-panel');
const filtersCount = document.getElementById('filters-count');
const sortHeaders = document.querySelectorAll('.list-header .sortable');

const FILTERS_STORAGE_KEY = 'logitrack.filters';
const SORT_STORAGE_KEY = 'logitrack.sort';

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
        showError('Unable to connect to the server. Please check if the backend is running.');
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

function saveToStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.warn(`Unable to save ${key}`, error);
    }
}

function readFromStorage(key) {
    try {
        const value = JSON.parse(localStorage.getItem(key));
        return value && typeof value === 'object' ? value : null;
    } catch {
        return null;
    }
}

function restoreFilters() {
    const saved = readFromStorage(FILTERS_STORAGE_KEY);
    if (!saved) return;

    ['status', 'carrier'].forEach(key => {
        if (typeof saved[key] === 'string' && setDropdownValue(key, saved[key])) {
            filters[key] = saved[key];
        }
    });

    filters.priorityOnly = saved.priorityOnly === true;
    priorityOnlyCheckbox.checked = filters.priorityOnly;
    updateFiltersCount();
}

function restoreSort() {
    const saved = readFromStorage(SORT_STORAGE_KEY);
    const isKnownColumn = [...sortHeaders].some(header => header.dataset.sort === saved?.column);
    if (!isKnownColumn) return;

    currentSort = { column: saved.column, ascending: saved.ascending !== false };
    updateSortHeaders();
}

function applyFilters() {
    saveToStorage(FILTERS_STORAGE_KEY, filters);
    updateFiltersCount();
    renderShipments();
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

function toggleFiltersPanel() {
    const expanded = filtersPanel.classList.toggle('open');
    filtersToggle.setAttribute('aria-expanded', String(expanded));
}

function sortBy(column) {
    if (currentSort.column === column) {
        currentSort.ascending = !currentSort.ascending;
    } else {
        currentSort = { column, ascending: true };
    }
    saveToStorage(SORT_STORAGE_KEY, currentSort);
    updateSortHeaders();
    renderShipments();
}

function openCardDetails(card) {
    const shipment = allShipments.find(s => String(s.id) === card.dataset.id);
    if (shipment) openShipmentDetails(shipment);
}

function handleMainClick(e) {
    e.stopPropagation();
    closeNavigation();
    if (handleDropdownClick(e)) return;

    const actionElement = e.target.closest('[data-action]');
    if (actionElement) {
        switch (actionElement.dataset.action) {
            case 'toggle-filters': toggleFiltersPanel(); break;
            case 'new-shipment': openShipmentForm(); break;
            case 'reset-data': openResetConfirm(); break;
            case 'retry': loadDashboardData(); break;
        }
        return;
    }

    const sortHeader = e.target.closest('.list-header .sortable');
    if (sortHeader) {
        sortBy(sortHeader.dataset.sort);
        return;
    }

    const card = e.target.closest('.shipment-card');
    if (card) openCardDetails(card);
}

function handleMainInput(e) {
    e.stopPropagation();

    if (e.target === searchInput) {
        clearTimeout(searchDebounceTimer);
        searchDebounceTimer = setTimeout(() => {
            currentSearch = searchInput.value.trim();
            renderShipments();
        }, 300);
    } else if (e.target === priorityOnlyCheckbox) {
        filters.priorityOnly = priorityOnlyCheckbox.checked;
        applyFilters();
    }
}

function handleFilterChange(key, value) {
    filters[key] = value;
    applyFilters();
}

function closeMenus() {
    closeDropdowns();
    closeNavigation();
}

function bindDashboardEvents() {
    appMain.addEventListener('click', handleMainClick);
    appMain.addEventListener('input', handleMainInput);
    document.addEventListener('click', closeMenus);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeMenus();
    });
    initDropdowns(handleFilterChange);
}

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initShipmentModal({ onCreate: handleCreate, onUpdate: handleUpdate, onReset: handleReset });
    bindDashboardEvents();
    restoreFilters();
    restoreSort();
    loadDashboardData();
});
