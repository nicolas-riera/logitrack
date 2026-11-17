export function initNavigation() {
    const appSidebar = document.getElementById('app-sidebar');
    const mobileNavToggle = document.getElementById('mobile-nav-toggle');

    if (mobileNavToggle && appSidebar) {
        mobileNavToggle.addEventListener('click', () => {
            appSidebar.classList.toggle('expanded');
        });
    }
}