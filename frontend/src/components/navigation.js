export function initNavigation() {
    const appSidebar = document.getElementById('app-sidebar');
    const mobileNavToggle = document.getElementById('mobile-nav-toggle');

    if (!mobileNavToggle || !appSidebar) return;

    const setExpanded = (expanded) => {
        appSidebar.classList.toggle('expanded', expanded);
        mobileNavToggle.setAttribute('aria-expanded', String(expanded));
    };

    mobileNavToggle.addEventListener('click', () => {
        setExpanded(!appSidebar.classList.contains('expanded'));
    });

    appSidebar.addEventListener('click', (e) => {
        if (e.target.closest('#nav-list a')) setExpanded(false);
    });

    document.addEventListener('click', (e) => {
        if (!appSidebar.contains(e.target)) setExpanded(false);
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') setExpanded(false);
    });
}
