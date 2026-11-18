import { closeDropdowns } from './dropdown.js';

const appSidebar = document.getElementById('app-sidebar');
const mobileNavToggle = document.getElementById('mobile-nav-toggle');

function setExpanded(expanded) {
    appSidebar.classList.toggle('expanded', expanded);
    mobileNavToggle.setAttribute('aria-expanded', String(expanded));
}

export function closeNavigation() {
    if (appSidebar && mobileNavToggle) setExpanded(false);
}

export function initNavigation() {
    if (!mobileNavToggle || !appSidebar) return;

    appSidebar.addEventListener('click', (e) => {
        e.stopPropagation();
        closeDropdowns();

        if (e.target.closest('#mobile-nav-toggle')) {
            setExpanded(!appSidebar.classList.contains('expanded'));
        } else if (e.target.closest('#nav-list a')) {
            setExpanded(false);
        }
    });
}
