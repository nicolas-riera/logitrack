import { STATUS_LABELS } from './constants.js';

export function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function toDateInputValue(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().slice(0, 10);
}

export function fromDateInputValue(value) {
    return value ? `${value}T12:00:00.000Z` : undefined;
}

export function formatStatus(status) {
    return STATUS_LABELS[status] || status || '-';
}

export function statusClass(status) {
    return `status-${String(status).toLowerCase().replace(/_/g, '-')}`;
}

export function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
