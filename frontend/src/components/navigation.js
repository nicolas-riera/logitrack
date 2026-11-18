export function initNavigation() {
    const appSidebar = document.getElementById('app-sidebar');
    const mobileNavToggle = document.getElementById('mobile-nav-toggle');

    if (!mobileNavToggle || !appSidebar) return;

    const setExpanded = (expanded) => {
        appSidebar.classList.toggle('expanded', expanded);
        mobileNavToggle.setAttribute('aria-expanded', String(expanded));
    };

    document.addEventListener('click', (e) => {
        if (e.target.closest('#mobile-nav-toggle')) {
            setExpanded(!appSidebar.classList.contains('expanded'));
        } else if (e.target.closest('#nav-list a') || !appSidebar.contains(e.target)) {
            setExpanded(false);
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') setExpanded(false);
    });
}
