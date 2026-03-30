import { useEffect, useMemo, useState } from 'react';

function clampNumber(value, min, max) {
    if (!Number.isFinite(value)) return min;
    return Math.min(max, Math.max(min, value));
}

function LayoutStepper({
    label,
    value,
    min,
    max,
    suffix,
    onChange,
    compact = false,
}) {
    const [draft, setDraft] = useState(String(value));

    useEffect(() => {
        setDraft(String(value));
    }, [value]);

    const commitDraft = () => {
        const parsed = Number(draft);
        const nextValue = clampNumber(Number.isFinite(parsed) ? parsed : Number(value), min, max);
        setDraft(String(nextValue));
        if (nextValue !== value) {
            onChange(nextValue);
        }
    };

    const adjustValue = (delta) => {
        const nextValue = clampNumber(Number(value) + delta, min, max);
        setDraft(String(nextValue));
        if (nextValue !== value) {
            onChange(nextValue);
        }
    };

    return (
        <div className={`mini-stepper ${compact ? 'is-compact' : ''}`}>
            <span className="mini-stepper-label">{label}</span>
            <div className="mini-stepper-controls">
                <button
                    type="button"
                    className="mini-stepper-button"
                    onClick={() => adjustValue(-1)}
                    disabled={value <= min}
                    aria-label={`${label} 감소`}
                >
                    −
                </button>
                <input
                    type="number"
                    min={min}
                    max={max}
                    step="1"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className="mini-stepper-input"
                    value={draft}
                    onChange={(event) => {
                        const next = event.target.value;
                        if (next === '' || /^\d+$/.test(next)) {
                            setDraft(next);
                        }
                    }}
                    onBlur={commitDraft}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                            event.currentTarget.blur();
                        }
                    }}
                    aria-label={`${label} 수치 입력`}
                />
                <span className="mini-stepper-suffix">{suffix}</span>
                <button
                    type="button"
                    className="mini-stepper-button"
                    onClick={() => adjustValue(1)}
                    disabled={value >= max}
                    aria-label={`${label} 증가`}
                >
                    +
                </button>
            </div>
        </div>
    );
}

export default function LayoutSizeControl({
    widthValue,
    heightValue,
    widthOptions = [12, 8, 6, 4, 3],
    heightOptions = [1, 2, 3, 4, 5, 6, 7, 8, 10, 12],
    minWidthValue,
    minHeightValue,
    onWidthChange,
    onHeightChange,
    compact = false,
}) {
    const resolvedMinWidth = Math.max(
        1,
        Number.isFinite(Number(minWidthValue)) ? Number(minWidthValue) : Math.min(...widthOptions),
    );
    const resolvedMinHeight = Math.max(
        1,
        Number.isFinite(Number(minHeightValue)) ? Number(minHeightValue) : Math.min(...heightOptions),
    );

    const resolvedWidthOptions = useMemo(
        () => Array.from(new Set([...widthOptions, widthValue, resolvedMinWidth]))
            .filter((option) => Number.isFinite(Number(option)))
            .sort((a, b) => Number(a) - Number(b)),
        [resolvedMinWidth, widthOptions, widthValue],
    );

    const resolvedHeightOptions = useMemo(
        () => Array.from(new Set([...heightOptions, heightValue, resolvedMinHeight]))
            .filter((option) => Number.isFinite(Number(option)))
            .sort((a, b) => Number(a) - Number(b)),
        [heightOptions, heightValue, resolvedMinHeight],
    );

    const maxWidth = Math.max(resolvedMinWidth, ...resolvedWidthOptions);
    const maxHeight = Math.max(resolvedMinHeight, ...resolvedHeightOptions);

    return (
        <div className={`layout-size-control ${compact ? 'is-compact' : ''}`} onClick={(e) => e.stopPropagation()}>
            <div className="layout-size-meta">
                <span className="layout-size-footprint">현재 {widthValue} × {heightValue}</span>
                <span className="layout-size-min">최소 {resolvedMinWidth} × {resolvedMinHeight}</span>
            </div>
            <LayoutStepper
                label="가로"
                value={Number(widthValue)}
                min={resolvedMinWidth}
                max={maxWidth}
                suffix="칸"
                compact={compact}
                onChange={onWidthChange}
            />
            <LayoutStepper
                label="세로"
                value={Number(heightValue)}
                min={resolvedMinHeight}
                max={maxHeight}
                suffix="줄"
                compact={compact}
                onChange={onHeightChange}
            />
        </div>
    );
}
