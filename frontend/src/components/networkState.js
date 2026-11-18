const networkState = document.getElementById('network-state');

export function showLoading(containerToClear) {
    networkState.className = 'network-state loading';
    networkState.innerHTML = `
        <div class="spinner"></div>
        <p>Loading shipments...</p>
    `;
    if (containerToClear) {
        containerToClear.innerHTML = '';
    }
}

export function showError(message) {
    networkState.className = 'network-state error';
    networkState.innerHTML = `
        <p class="error-message">${message}</p>
        <button type="button" class="btn-primary" data-action="retry">Retry</button>
    `;
}

export function hideNetworkState() {
    networkState.className = 'network-state hidden';
    networkState.innerHTML = '';
}
