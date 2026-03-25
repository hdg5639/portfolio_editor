import { useEffect, useRef, useState } from 'react';

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
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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
        <div className="layout-size-control">
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