export default function EditableCustomText({
    as = 'input',
    value,
    placeholder,
    onChange,
    className = '',
    disabled = false,
    style,
    onClick,
    ...rest
}) {
    if (disabled) {
        return (
            <div className={className} style={style} onClick={onClick}>
                {value || placeholder}
            </div>
        );
    }

    if (as === 'textarea') {
        return (
            <textarea
                className={className}
                value={value || ''}
                placeholder={placeholder}
                onChange={(e) => onChange(e.target.value)}
                style={style}
                onClick={onClick}
                {...rest}
            />
        );
    }

    return (
        <input
            className={className}
            value={value || ''}
            placeholder={placeholder}
            onChange={(e) => onChange(e.target.value)}
            style={style}
            onClick={onClick}
            {...rest}
        />
    );
}
