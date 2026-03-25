function clampAlpha(value) {
    const next = Number(value);
    if (Number.isNaN(next)) return 100;
    return Math.max(0, Math.min(100, next));
}

function hexToRgb(hex) {
    const normalized = hex.replace('#', '').trim();

    if (normalized.length === 3) {
        const r = normalized[0] + normalized[0];
        const g = normalized[1] + normalized[1];
        const b = normalized[2] + normalized[2];
        return {
            r: parseInt(r, 16),
            g: parseInt(g, 16),
            b: parseInt(b, 16),
        };
    }

    if (normalized.length === 6 || normalized.length === 8) {
        return {
            r: parseInt(normalized.slice(0, 2), 16),
            g: parseInt(normalized.slice(2, 4), 16),
            b: parseInt(normalized.slice(4, 6), 16),
        };
    }

    return { r: 255, g: 255, b: 255 };
}

function rgbToHex(r, g, b) {
    const toHex = (value) => value.toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function parseColorWithAlpha(value, fallback = '#ffffff') {
    if (!value) {
        return { hex: fallback, alpha: 100 };
    }

    if (value === 'transparent') {
        return { hex: fallback, alpha: 0 };
    }

    const raw = String(value).trim();

    if (raw.startsWith('#')) {
        const normalized = raw.replace('#', '');
        if (normalized.length === 8) {
            const rgbHex = `#${normalized.slice(0, 6)}`;
            const alphaHex = normalized.slice(6, 8);
            const alpha = Math.round((parseInt(alphaHex, 16) / 255) * 100);
            return { hex: rgbHex, alpha };
        }

        if (normalized.length === 3 || normalized.length === 6) {
            return { hex: raw, alpha: 100 };
        }
    }

    const rgbaMatch = raw.match(
        /rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/i
    );

    if (rgbaMatch) {
        const r = Math.max(0, Math.min(255, Math.round(Number(rgbaMatch[1]))));
        const g = Math.max(0, Math.min(255, Math.round(Number(rgbaMatch[2]))));
        const b = Math.max(0, Math.min(255, Math.round(Number(rgbaMatch[3]))));
        const alphaRaw = rgbaMatch[4] == null ? 1 : Number(rgbaMatch[4]);
        const alpha = Math.round(Math.max(0, Math.min(1, alphaRaw)) * 100);

        return {
            hex: rgbToHex(r, g, b),
            alpha,
        };
    }

    return { hex: fallback, alpha: 100 };
}

function buildColorWithAlpha(hex, alpha) {
    const safeAlpha = clampAlpha(alpha);

    if (safeAlpha <= 0) return 'transparent';
    if (safeAlpha >= 100) return hex;

    const { r, g, b } = hexToRgb(hex);
    const opacity = Number((safeAlpha / 100).toFixed(2));
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

function AlphaColorField({ label, value, fallback = '#ffffff', onChange }) {
    const parsed = parseColorWithAlpha(value, fallback);
    const previewColor = buildColorWithAlpha(parsed.hex, parsed.alpha);

    return (
        <div className="alpha-color-field">
            <Field label={label}>
                <div className="alpha-color-stack">
                    <div className="alpha-color-row">
                        <label className="alpha-color-picker">
                            <input
                                type="color"
                                value={parsed.hex}
                                onChange={(e) =>
                                    onChange(buildColorWithAlpha(e.target.value, parsed.alpha))
                                }
                            />
                            <span>색상 선택</span>
                        </label>

                        <div className="alpha-color-preview-shell">
                            {parsed.alpha > 0 ? (
                                <div
                                    className="alpha-color-preview-fill"
                                    style={{backgroundColor: previewColor}}
                                />
                            ) : null}
                            {parsed.alpha === 0 ? (
                                <span className="alpha-color-preview-text">투명</span>
                            ) : null}
                        </div>
                    </div>

                    <div className="alpha-range-row">
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={parsed.alpha}
                            onChange={(e) =>
                                onChange(buildColorWithAlpha(parsed.hex, e.target.value))
                            }
                        />
                        <input
                            type="number"
                            min="0"
                            max="100"
                            value={parsed.alpha}
                            onChange={(e) =>
                                onChange(buildColorWithAlpha(parsed.hex, e.target.value))
                            }
                        />
                        <span>%</span>
                    </div>
                </div>
            </Field>
        </div>
    );
}

function Field({ label, children }) {
    return (
        <div className="style-field">
            <span>{label}</span>
            {children}
        </div>
    );
}

function AccordionItem({ title, children, defaultOpen = false }) {
    return (
        <details className="style-accordion" open={defaultOpen}>
            <summary>{title}</summary>
            <div className="style-accordion-body">{children}</div>
        </details>
    );
}

function StyleControls({ value, onChange, compact = false, alphaTargets = {} }) {
    const current = value || {};
    const alphaBackground = Boolean(alphaTargets.backgroundColor);
    const alphaBorder = Boolean(alphaTargets.borderColor);
    const alphaBaseBackground = Boolean(alphaTargets.baseBackgroundColor);

    return (
        <div className="style-grid compact">
            {Object.prototype.hasOwnProperty.call(current, 'baseBackgroundColor') &&
                (alphaBaseBackground ? (
                    <AlphaColorField
                        label="외부 배경색"
                        value={current.baseBackgroundColor}
                        fallback="#ece7dc"
                        onChange={(next) => onChange('baseBackgroundColor', next)}
                    />
                ) : (
                    <Field label="외부 배경색">
                        <input
                            type="color"
                            value={
                                current.baseBackgroundColor &&
                                current.baseBackgroundColor !== 'transparent'
                                    ? current.baseBackgroundColor
                                    : '#ece7dc'
                            }
                            onChange={(e) => onChange('baseBackgroundColor', e.target.value)}
                        />
                    </Field>
                ))}
            <Field label="글자색">
                <input
                    type="color"
                    value={
                        current.color && current.color !== 'transparent'
                            ? current.color
                            : '#1d1d1b'
                    }
                    onChange={(e) => onChange('color', e.target.value)}
                />
            </Field>

            {alphaBackground ? (
                <AlphaColorField
                    label="배경색"
                    value={current.backgroundColor}
                    fallback="#ffffff"
                    onChange={(next) => onChange('backgroundColor', next)}
                />
            ) : (
                <Field label="배경색">
                    <input
                        type="color"
                        value={
                            current.backgroundColor && current.backgroundColor !== 'transparent'
                                ? current.backgroundColor
                                : '#ffffff'
                        }
                        onChange={(e) => onChange('backgroundColor', e.target.value)}
                    />
                </Field>
            )}

            <Field label="글자 크기">
                <input
                    type="number"
                    value={current.fontSize ?? 16}
                    onChange={(e) => onChange('fontSize', Number(e.target.value))}
                />
            </Field>

            <Field label="굵기">
                <select
                    value={String(current.fontWeight ?? 400)}
                    onChange={(e) => onChange('fontWeight', e.target.value)}
                >
                    <option value="300">300</option>
                    <option value="400">400</option>
                    <option value="500">500</option>
                    <option value="600">600</option>
                    <option value="700">700</option>
                    <option value="800">800</option>
                </select>
            </Field>

            <Field label="정렬">
                <select
                    value={current.textAlign || 'left'}
                    onChange={(e) => onChange('textAlign', e.target.value)}
                >
                    <option value="left">left</option>
                    <option value="center">center</option>
                    <option value="right">right</option>
                </select>
            </Field>

            <Field label="줄간격">
                <input
                    type="number"
                    step="0.1"
                    value={current.lineHeight ?? 1.6}
                    onChange={(e) => onChange('lineHeight', Number(e.target.value))}
                />
            </Field>

            <Field label="자간">
                <input
                    type="number"
                    step="0.1"
                    value={current.letterSpacing ?? 0}
                    onChange={(e) => onChange('letterSpacing', Number(e.target.value))}
                />
            </Field>

            {alphaBorder ? (
                <AlphaColorField
                    label="테두리색"
                    value={current.borderColor}
                    fallback="#e5e5e5"
                    onChange={(next) => onChange('borderColor', next)}
                />
            ) : (
                <Field label="테두리색">
                    <input
                        type="color"
                        value={
                            current.borderColor && current.borderColor !== 'transparent'
                                ? current.borderColor
                                : '#e5e5e5'
                        }
                        onChange={(e) => onChange('borderColor', e.target.value)}
                    />
                </Field>
            )}

            <Field label="모서리">
                <input
                    type="number"
                    value={current.borderRadius ?? 0}
                    onChange={(e) => onChange('borderRadius', Number(e.target.value))}
                />
            </Field>

            <Field label="패딩">
                <input
                    type="number"
                    value={current.padding ?? 0}
                    onChange={(e) => onChange('padding', Number(e.target.value))}
                />
            </Field>
        </div>
    );
}

function CardStyleControls({ value, onChange }) {
    const current = value || {};

    return (
        <div className="style-grid compact">
            <AlphaColorField
                label="배경색"
                value={current.backgroundColor}
                fallback="#ffffff"
                onChange={(next) => onChange('backgroundColor', next)}
            />

            <AlphaColorField
                label="테두리색"
                value={current.borderColor}
                fallback="#e8e1d7"
                onChange={(next) => onChange('borderColor', next)}
            />

            <Field label="모서리">
                <input
                    type="number"
                    value={current.borderRadius ?? 24}
                    onChange={(e) => onChange('borderRadius', Number(e.target.value))}
                />
            </Field>

            <Field label="패딩">
                <input
                    type="number"
                    value={current.padding ?? 28}
                    onChange={(e) => onChange('padding', Number(e.target.value))}
                />
            </Field>
        </div>
    );
}

export default function StylePanel({ store }) {
    const { selected, actions } = store;
    const current = actions.getSelectedStyle();
    const isCardSelection = [
        'profileCard',
        'projectsCard',
        'skillsCard',
        'timelineCard',
        'customCard',
    ].includes(selected?.key);

    return (
        <div className="sidebar-panel style-panel-shell">
            <div className="sidebar-panel-header">
                <div className="sidebar-panel-header-text">
                    <strong>스타일 편집</strong>
                    <p>선택 대상: {selected?.label || '없음'}</p>
                </div>
            </div>

            <div className="sidebar-panel-body">
                <div className="panel-stack">
                    <section className="panel-section style-panel-summary">
                        <div className="panel-section-body style-panel-summary-body">
                            {isCardSelection ? (
                                <CardStyleControls
                                    value={current}
                                    onChange={(field, value) =>
                                        actions.updateSelectedStyle(field, value)
                                    }
                                />
                            ) : (
                                <div className="style-quick-grid">
                                    <Field label="빠른 글자색">
                                        <input
                                            type="color"
                                            value={
                                                current?.color && current.color !== 'transparent'
                                                    ? current.color
                                                    : '#1d1d1b'
                                            }
                                            onChange={(e) =>
                                                actions.updateSelectedStyle('color', e.target.value)
                                            }
                                        />
                                    </Field>

                                    <Field label="빠른 배경색">
                                        <input
                                            type="color"
                                            value={
                                                current?.backgroundColor &&
                                                current.backgroundColor !== 'transparent'
                                                    ? current.backgroundColor
                                                    : '#ffffff'
                                            }
                                            onChange={(e) =>
                                                actions.updateSelectedStyle(
                                                    'backgroundColor',
                                                    e.target.value
                                                )
                                            }
                                        />
                                    </Field>

                                    <Field label="빠른 크기">
                                        <input
                                            type="number"
                                            value={current?.fontSize ?? 16}
                                            onChange={(e) =>
                                                actions.updateSelectedStyle(
                                                    'fontSize',
                                                    Number(e.target.value)
                                                )
                                            }
                                        />
                                    </Field>

                                    <Field label="빠른 굵기">
                                        <select
                                            value={String(current?.fontWeight ?? 400)}
                                            onChange={(e) =>
                                                actions.updateSelectedStyle(
                                                    'fontWeight',
                                                    e.target.value
                                                )
                                            }
                                        >
                                            <option value="300">300</option>
                                            <option value="400">400</option>
                                            <option value="500">500</option>
                                            <option value="600">600</option>
                                            <option value="700">700</option>
                                            <option value="800">800</option>
                                        </select>
                                    </Field>
                                </div>
                            )}
                        </div>
                    </section>

                    <AccordionItem title="전역 스타일" defaultOpen>
                        <StyleControls
                            value={store.portfolio.styles.page}
                            alphaTargets={{
                                baseBackgroundColor: true,
                                backgroundColor: true,
                                borderColor: true,
                            }}
                            onChange={(field, value) =>
                                actions.updateGlobalStyle('page', field, value)
                            }
                        />
                    </AccordionItem>

                    <AccordionItem
                        title={isCardSelection ? '선택 카드 스타일' : '선택 요소 스타일'}
                        defaultOpen
                    >
                        {isCardSelection ? (
                            <CardStyleControls
                                value={current}
                                onChange={(field, value) =>
                                    actions.updateSelectedStyle(field, value)
                                }
                            />
                        ) : (
                            <StyleControls
                                value={current}
                                alphaTargets={{
                                    backgroundColor: true,
                                    borderColor: true,
                                }}
                                onChange={(field, value) =>
                                    actions.updateSelectedStyle(field, value)
                                }
                            />
                        )}
                    </AccordionItem>
                </div>
            </div>
        </div>
    );
}