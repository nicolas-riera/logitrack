let onChangeHandler = () => {};

export function initDropdowns(onChange) {
    onChangeHandler = onChange;
}

export function closeDropdowns(except = null) {
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

export function setDropdownValue(filterName, value) {
    const dropdown = document.querySelector(`.dropdown[data-filter="${filterName}"]`);
    const option = [...(dropdown?.querySelectorAll('.dropdown-option') ?? [])].find(opt => opt.dataset.value === value);
    if (!option) return false;
    selectOption(dropdown, option);
    return true;
}

export function handleDropdownClick(e) {
    const dropdown = e.target.closest('.dropdown');
    if (!dropdown) {
        closeDropdowns();
        return false;
    }

    const toggle = e.target.closest('.dropdown-toggle');
    if (toggle) {
        const open = !dropdown.classList.contains('open');
        closeDropdowns(dropdown);
        dropdown.classList.toggle('open', open);
        toggle.setAttribute('aria-expanded', String(open));
        return true;
    }

    const option = e.target.closest('.dropdown-option');
    if (option) {
        selectOption(dropdown, option);
        closeDropdowns();
        dropdown.querySelector('.dropdown-toggle').focus();
        onChangeHandler(dropdown.dataset.filter, option.dataset.value);
    }
    return true;
}
