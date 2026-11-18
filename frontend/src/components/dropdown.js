function closeAll(except = null) {
    document.querySelectorAll('.dropdown.open').forEach(dropdown => {
        if (dropdown === except) return;
        dropdown.classList.remove('open');
        dropdown.querySelector('.dropdown-toggle').setAttribute('aria-expanded', 'false');
    });
}

function selectOption(dropdown, option) {
    dropdown.querySelectorAll('.dropdown-option').forEach(opt => {
        const selected = opt === option;
        opt.classList.toggle('active', selected);
        opt.setAttribute('aria-checked', String(selected));
    });

    dropdown.querySelector('.dropdown-value').textContent = option.textContent;
    dropdown.classList.toggle('has-value', option.dataset.value !== 'ALL');
}

export function initDropdowns(onChange) {
    document.addEventListener('click', (e) => {
        const dropdown = e.target.closest('.dropdown');
        if (!dropdown) {
            closeAll();
            return;
        }

        const toggle = e.target.closest('.dropdown-toggle');
        if (toggle) {
            const open = !dropdown.classList.contains('open');
            closeAll(dropdown);
            dropdown.classList.toggle('open', open);
            toggle.setAttribute('aria-expanded', String(open));
            return;
        }

        const option = e.target.closest('.dropdown-option');
        if (option) {
            selectOption(dropdown, option);
            closeAll();
            dropdown.querySelector('.dropdown-toggle').focus();
            onChange(dropdown.dataset.filter, option.dataset.value);
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeAll();
    });
}
