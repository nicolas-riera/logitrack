export function initDropdowns(dropdowns, onChange) {
    const closeAll = (except = null) => {
        dropdowns.forEach(dropdown => {
            if (dropdown === except) return;
            dropdown.classList.remove('open');
            dropdown.querySelector('.dropdown-toggle').setAttribute('aria-expanded', 'false');
        });
    };

    dropdowns.forEach(dropdown => {
        const toggle = dropdown.querySelector('.dropdown-toggle');
        const valueLabel = dropdown.querySelector('.dropdown-value');
        const options = dropdown.querySelectorAll('.dropdown-option');

        toggle.addEventListener('click', () => {
            const open = !dropdown.classList.contains('open');
            closeAll(dropdown);
            dropdown.classList.toggle('open', open);
            toggle.setAttribute('aria-expanded', String(open));
        });

        dropdown.querySelector('.dropdown-menu').addEventListener('click', (e) => {
            const option = e.target.closest('.dropdown-option');
            if (!option) return;

            options.forEach(opt => {
                const selected = opt === option;
                opt.classList.toggle('active', selected);
                opt.setAttribute('aria-checked', String(selected));
            });

            valueLabel.textContent = option.textContent;
            dropdown.classList.toggle('has-value', option.dataset.value !== 'ALL');
            closeAll();
            toggle.focus();
            onChange(dropdown.dataset.filter, option.dataset.value);
        });
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.dropdown')) closeAll();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeAll();
    });
}
