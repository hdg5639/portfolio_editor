import { useLayoutEffect, useRef } from 'react';

export default function AutoGrowTextarea({ className = '', value, placeholder, onChange, inputMeta }) {
    const ref = useRef(null);

    useLayoutEffect(() => {
        const node = ref.current;
        if (!node) return;
        node.style.height = '0px';
        node.style.height = `${node.scrollHeight}px`;
    }, [value]);

    return (
        <textarea
            ref={ref}
            value={value || ''}
            placeholder={placeholder}
            rows={1}
            className={className}
            onChange={(event) => onChange(event.target.value)}
            {...inputMeta}
        />
    );
}
