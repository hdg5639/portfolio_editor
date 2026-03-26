import { useEffect, useRef, useState } from 'react';



const DROPDOWN_HOST_SELECTOR = [
    '.profile-layout-item',
    '.project-block-shell',
    '.custom-item-shell',
    '.project-card-inner',
    '.section-tile',
    '.timeline-row',
    '.skill-row',
].join(', ');

function updateDropdownHostState(rootNode, delta) {
    if (!rootNode) return () => {};
    const host = rootNode.closest(DROPDOWN_HOST_SELECTOR);
    if (!host) return () => {};

    const current = Number(host.dataset.dropdownOpenCount || 0);
    const next = Math.max(0, current + delta);

    if (next > 0) {
        host.dataset.dropdownOpenCount = String(next);
        host.classList.add('dropdown-open-host');
    } else {
        delete host.dataset.dropdownOpenCount;
        host.classList.remove('dropdown-open-host');
    }

    return () => {
        const latest = Number(host.dataset.dropdownOpenCount || 0);
        const reduced = Math.max(0, latest - 1);
        if (reduced > 0) {
            host.dataset.dropdownOpenCount = String(reduced);
        } else {
            delete host.dataset.dropdownOpenCount;
            host.classList.remove('dropdown-open-host');
        }
    };
}

function MiniDropdown({
                          label,
                          value,
                          options,
                          onSelect,
                      }) {
    const [open, setOpen] = useState(false);
    const rootRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!rootRef.current) return;
            if (!rootRef.current.contains(event.target)) {
                setOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside, { passive: true });
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        if (!open) return undefined;
        return updateDropdownHostState(rootRef.current, 1);
    }, [open]);

    return (
        <div className={`mini-dropdown ${open ? 'open' : ''}`} ref={rootRef}>
            <button
                type="button"
                className="mini-dropdown-trigger"
                onClick={(event) => {
                    event.stopPropagation();
                    setOpen((prev) => !prev);
                }}
            >
                <span className="mini-dropdown-label">{label}</span>
                <span className="mini-dropdown-value">{value}</span>
                <span className="mini-dropdown-caret">▾</span>
            </button>

            {open ? (
                <div
                    className="mini-dropdown-menu"
                    onClick={(event) => event.stopPropagation()}
                >
                    {options.map((option) => (
                        <button
                            key={option}
                            type="button"
                            className={`mini-dropdown-item ${value === option ? 'active' : ''}`}
                            onClick={() => {
                                onSelect(option);
                                setOpen(false);
                            }}
                        >
                            {option}
                        </button>
                    ))}
                </div>
            ) : null}
        </div>
    );
}

export default function LayoutSizeControl({
                                              widthValue,
                                              heightValue,
                                              widthOptions = [12, 8, 6, 4, 3],
                                              heightOptions = [1, 2, 3],
                                              onWidthChange,
                                              onHeightChange,
                                          }) {
    return (
        <div className="layout-size-control" onClick={(e) => e.stopPropagation()}>
            <MiniDropdown
                label="W"
                value={widthValue}
                options={widthOptions}
                onSelect={onWidthChange}
            />
            <MiniDropdown
                label="H"
                value={heightValue}
                options={heightOptions}
                onSelect={onHeightChange}
            />
        </div>
    );
}