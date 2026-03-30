import { getSelectionTypeLabel, isCardSelectionKey } from '../utils/storeHelpers';

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
    const { r, g, b } = hexToRgb(hex);

    if (safeAlpha >= 100) return hex;

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
                    <label className="alpha-color-picker">
                        <input
                            type="color"
                            value={parsed.hex}
                            onChange={(e) =>
                                onChange(buildColorWithAlpha(e.target.value, parsed.alpha))
                            }
                        />
                        <span>
            <i
                className="alpha-color-picker-fill"
                style={{backgroundColor: parsed.hex}}
            />
        </span>
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

                    <input
                        className="alpha-range-input"
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={parsed.alpha}
                        onInput={(e) =>
                            onChange(buildColorWithAlpha(parsed.hex, clampAlpha(e.currentTarget.value)))
                        }
                        onChange={(e) =>
                            onChange(buildColorWithAlpha(parsed.hex, clampAlpha(e.currentTarget.value)))
                        }
                    />

                    <div className="alpha-value-box">
                        <input
                            type="number"
                            min="0"
                            max="100"
                            step="1"
                            value={parsed.alpha}
                            onChange={(e) =>
                                onChange(buildColorWithAlpha(parsed.hex, clampAlpha(e.currentTarget.value)))
                            }
                        />
                    </div>
                </div>
            </Field>
        </div>
    );
}

function Field({label, children}) {
    return (
        <div className="style-field">
            <span>{label}</span>
            {children}
        </div>
    );
}

function AccordionItem({title, children, defaultOpen = false}) {
    return (
        <details className="style-accordion" open={defaultOpen}>
            <summary>{title}</summary>
            <div className="style-accordion-body">{children}</div>
        </details>
    );
}


function isGroupVisible(visibleGroups, group) {
    return !visibleGroups || visibleGroups.includes(group);
}

function SelectionBadge({ selected }) {
    const typeLabel =
        getSelectionTypeLabel(selected?.key);

    return (
        <div className="mobile-selection-badge">
            <span className="mobile-selection-badge-kicker">현재 선택</span>
            <strong>{selected?.label || '선택 없음'}</strong>
            <em>{typeLabel}</em>
        </div>
    );
}

function MobileSelectTool({ selected, actions }) {
    return (
        <section className="panel-section mobile-select-tool-panel">
            <div className="panel-section-head">
                <strong>선택 전환</strong>
            </div>

            <div className="panel-section-body mobile-select-tool-body">
                <SelectionBadge selected={selected} />

                <div className="mobile-select-tool-actions">
                    <button
                        type="button"
                        className="mobile-select-action primary"
                        onClick={() => actions.selectPage()}
                    >
                        페이지 전체 선택
                    </button>
                </div>

                <div className="mobile-select-tool-guide">
                    <strong>선택 가이드</strong>
                    <p>캔버스를 탭하면 페이지 / 카드 / 요소 중 해당 대상을 바로 선택합니다.</p>
                    <p>텍스트나 이미지를 선택한 뒤 다시 박스 스타일을 수정하고 싶으면 카드 배경을 탭하거나 페이지 전체 선택을 눌러주세요.</p>
                </div>
            </div>
        </section>
    );
}

function StyleToolHint({ title, description }) {
    return (
        <div className="mobile-style-tool-hint">
            <strong>{title}</strong>
            <p>{description}</p>
        </div>
    );
}

function StyleControls({value, onChange, compact = false, alphaTargets = {}, visibleGroups = null}) {
    const current = value || {};
    const alphaBackground = Boolean(alphaTargets.backgroundColor);
    const alphaBorder = Boolean(alphaTargets.borderColor);
    const alphaBaseBackground = Boolean(alphaTargets.baseBackgroundColor);
    const showGroup = (group) => isGroupVisible(visibleGroups, group);

    return (
        <div className="style-grid compact">
            {showGroup('box') && Object.prototype.hasOwnProperty.call(current, 'baseBackgroundColor') &&
                (alphaBaseBackground ? (
                    <AlphaColorField
                        label="외부 배경색"
                        value={current.baseBackgroundColor}
                        fallback="#ffffff"
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
                                    : '#ffffff'
                            }
                            onChange={(e) => onChange('baseBackgroundColor', e.target.value)}
                        />
                    </Field>
                ))
            }

            {showGroup('text') ? (
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
                ): null
            }

            {showGroup('box') ? (
                    alphaBackground ? (
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
                    )
                ) : null
            }

            {showGroup('text') ? (
                    <Field label="글자 크기">
                        <input
                            type="number"
                            value={current.fontSize ?? 16}
                            onChange={(e) => onChange('fontSize', Number(e.target.value))}
                        />
                    </Field>
                ) : null
            }

            {showGroup('text') ? (
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
                ) : null
            }

            {showGroup('align') ? (
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
                ) : null
            }

            {showGroup('align') ? (
                    <Field label="줄간격">
                        <input
                            type="number"
                            step="0.1"
                            value={current.lineHeight ?? 1.6}
                            onChange={(e) => onChange('lineHeight', Number(e.target.value))}
                        />
                    </Field>
                ) : null
            }

            {showGroup('align') ? (
                    <Field label="자간">
                        <input
                            type="number"
                            step="0.1"
                            value={current.letterSpacing ?? 0}
                            onChange={(e) => onChange('letterSpacing', Number(e.target.value))}
                        />
                    </Field>
                ) : null
            }

            {showGroup('box') ? (
                    alphaBorder ? (
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
                    )
                ) : null
            }

            {showGroup('box') ? (
                    <Field label="모서리">
                        <input
                            type="number"
                            value={current.borderRadius ?? 0}
                            onChange={(e) => onChange('borderRadius', Number(e.target.value))}
                        />
                    </Field>
                ) : null
            }

            {showGroup('box') ? (
                    <Field label="패딩">
                        <input
                            type="number"
                            value={current.padding ?? 0}
                            onChange={(e) => onChange('padding', Number(e.target.value))}
                        />
                    </Field>
                ) : null
            }
        </div>
    );
}

function CardStyleControls({ value, onChange, visibleGroups = null }) {
    const current = value || {};
    const showGroup = (group) => isGroupVisible(visibleGroups, group);

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

export default function StylePanel({ store, mobileTool = '', embedded = false, quickOnly = false, onRequestClose }) {
    const { selected, actions } = store;
    const current = actions.getSelectedStyle();
    const selectionMeta = actions.getSelectionStyleMeta?.() || { kind: 'element' };
    const selectionTypeLabel = getSelectionTypeLabel(selected?.key);
    const isCardSelection = isCardSelectionKey(selected?.key);
    const isBlockSelection = selectionMeta.kind === 'block';
    const isPageSelection = selectionMeta.kind === 'page';

    const quickPanel = (
        <div className="style-quick-grid">
            {isPageSelection ? (
                <>
                    <label className="style-field">
                        <span>외부 배경색</span>
                        <input
                            type="color"
                            value={current?.baseBackgroundColor && current.baseBackgroundColor !== 'transparent' ? current.baseBackgroundColor : '#ffffff'}
                            onChange={(e) => actions.updateSelectedStyle('baseBackgroundColor', e.target.value)}
                        />
                    </label>
                    <label className="style-field">
                        <span>내부 배경색</span>
                        <input
                            type="color"
                            value={current?.backgroundColor && current.backgroundColor !== 'transparent' ? current.backgroundColor : '#ffffff'}
                            onChange={(e) => actions.updateSelectedStyle('backgroundColor', e.target.value)}
                        />
                    </label>
                    <label className="style-field">
                        <span>줄간격</span>
                        <input
                            type="number"
                            step="0.1"
                            value={current?.lineHeight ?? 1.6}
                            onChange={(e) => actions.updateSelectedStyle('lineHeight', Number(e.target.value))}
                        />
                    </label>
                    <label className="style-field">
                        <span>정렬</span>
                        <select
                            value={current?.textAlign || 'left'}
                            onChange={(e) => actions.updateSelectedStyle('textAlign', e.target.value)}
                        >
                            <option value="left">left</option>
                            <option value="center">center</option>
                            <option value="right">right</option>
                        </select>
                    </label>
                </>
            ) : isBlockSelection ? (
                <>
                    <label className="style-field">
                        <span>빠른 글자색</span>
                        <input
                            type="color"
                            value={current?.color || '#1d1d1b'}
                            onChange={(e) => actions.updateSelectedStyle('color', e.target.value)}
                        />
                    </label>
                    <label className="style-field">
                        <span>빠른 크기</span>
                        <input
                            type="number"
                            value={parseInt(current?.fontSize, 10) || 16}
                            onChange={(e) => actions.updateSelectedStyle('fontSize', Number(e.target.value))}
                        />
                    </label>
                    <label className="style-field">
                        <span>빠른 굵기</span>
                        <select
                            value={String(current?.fontWeight ?? '400')}
                            onChange={(e) => actions.updateSelectedStyle('fontWeight', e.target.value)}
                        >
                            <option value="300">300</option>
                            <option value="400">400</option>
                            <option value="500">500</option>
                            <option value="600">600</option>
                            <option value="700">700</option>
                            <option value="800">800</option>
                        </select>
                    </label>
                    <label className="style-field">
                        <span>정렬</span>
                        <select
                            value={current?.textAlign || 'left'}
                            onChange={(e) => actions.updateSelectedStyle('textAlign', e.target.value)}
                        >
                            <option value="left">left</option>
                            <option value="center">center</option>
                            <option value="right">right</option>
                        </select>
                    </label>
                </>
            ) : (
                <>
                    <label className="style-field">
                        <span>빠른 글자색</span>
                        <input
                            type="color"
                            value={current?.color || '#1d1d1b'}
                            onChange={(e) => actions.updateSelectedStyle('color', e.target.value)}
                        />
                    </label>
                    <label className="style-field">
                        <span>빠른 배경색</span>
                        <input
                            type="color"
                            value={current?.backgroundColor && current.backgroundColor !== 'transparent' ? current.backgroundColor : '#ffffff'}
                            onChange={(e) => actions.updateSelectedStyle('backgroundColor', e.target.value)}
                        />
                    </label>
                    <label className="style-field">
                        <span>빠른 크기</span>
                        <input
                            type="number"
                            value={parseInt(current?.fontSize, 10) || 16}
                            onChange={(e) => actions.updateSelectedStyle('fontSize', Number(e.target.value))}
                        />
                    </label>
                    <label className="style-field">
                        <span>빠른 굵기</span>
                        <select
                            value={String(current?.fontWeight ?? '400')}
                            onChange={(e) => actions.updateSelectedStyle('fontWeight', e.target.value)}
                        >
                            <option value="300">300</option>
                            <option value="400">400</option>
                            <option value="500">500</option>
                            <option value="600">600</option>
                            <option value="700">700</option>
                            <option value="800">800</option>
                        </select>
                    </label>
                </>
            )}
        </div>
    );

    if (quickOnly) {
        return (
            <div className={`style-panel-quick-only ${embedded ? 'embedded-panel-shell' : ''}`}>
                <div className="panel-section style-panel-summary compact-floating-panel">
                    <div className="panel-section-head compact-floating-panel-head">
                        <strong>빠른 설정</strong>
                        <span>{selected?.label || '선택 없음'} · {selectionTypeLabel}</span>
                    </div>
                    <div className="panel-section-body style-panel-summary-body">{quickPanel}</div>
                </div>
            </div>
        );
    }

    const isEmbeddedMobileTool = embedded && mobileTool;
    const selectedTool = mobileTool || 'text';

    if (isEmbeddedMobileTool) {
        const selectedStylePanel = selectedTool === 'select' ? (
            <MobileSelectTool selected={selected} actions={actions}/>
        ) : isBlockSelection && selectedTool === 'box' ? (
            <section className="panel-section">
                <div className="panel-section-head">
                    <strong>{selected?.label || '선택 대상'}</strong>
                </div>
                <div className="panel-section-body">
                    <SelectionBadge selected={selected}/>
                    <StyleToolHint
                        title="블럭 선택은 내부 기본 텍스트를 조절합니다"
                        description="현재 선택은 블럭입니다. 박스 탭 대신 텍스트/정렬 탭에서 내부 요소들의 기본 스타일을 맞춰주세요."
                    />
                </div>
            </section>
        ) : (
            <section className="panel-section">
                <div className="panel-section-head">
                    <strong>{selected?.label || '선택 대상'}</strong>
                </div>
                <div className="panel-section-body style-panel-summary-body">
                    <SelectionBadge selected={selected}/>

                    {isCardSelection && selectedTool === 'box' ? (
                        <CardStyleControls
                            value={current}
                            visibleGroups={['box']}
                            onChange={(field, value) =>
                                actions.updateSelectedStyle(field, value)
                            }
                        />
                    ) : (
                        <StyleControls
                            value={current}
                            visibleGroups={isPageSelection && selectedTool === 'text' ? ['align'] : [selectedTool]}
                            alphaTargets={{
                                backgroundColor: true,
                                borderColor: true,
                                baseBackgroundColor: selected?.key === 'page',
                            }}
                            onChange={(field, value) =>
                                actions.updateSelectedStyle(field, value)
                            }
                        />
                    )}
                </div>
            </section>
        );

        return (
            <div className="sidebar-panel style-panel-shell embedded-panel-shell">
                <div className="sidebar-panel-body">
                    <div className="panel-stack">{selectedStylePanel}</div>
                </div>
            </div>
        );
    }

    const showGlobal = false;
    const showSelected = true;

    return (
        <div className={`sidebar-panel style-panel-shell ${embedded ? 'embedded-panel-shell' : ''}`}>
            <div className="sidebar-panel-header">
                <button
                    type="button"
                    className="sidebar-panel-header-hit"
                    onClick={() => onRequestClose?.()}
                    title="스타일 패널 닫기"
                >
                    <div className="sidebar-panel-header-text">
                        <strong>스타일 편집</strong>
                        <p>선택 대상: {selected?.label || '없음'} · {selectionTypeLabel}</p>
                    </div>
                    <span className="sidebar-panel-header-close">닫기</span>
                </button>
            </div>

            <div className="sidebar-panel-body">
                <div className="panel-stack">
                    {showSelected ? (
                        <section className="panel-section style-panel-summary">
                            <div className="panel-section-body style-panel-summary-body">{quickPanel}</div>
                        </section>
                    ) : null}

                    {showGlobal ? (
                        <AccordionItem title="페이지 기본 스타일" defaultOpen>
                            <StyleControls
                                value={store.portfolio.styles.page}
                                visibleGroups={['align', 'box']}
                                alphaTargets={{
                                    baseBackgroundColor: true,
                                    backgroundColor: true,
                                }}
                                onChange={(field, value) =>
                                    actions.updateGlobalStyle('page', field, value)
                                }
                            />
                        </AccordionItem>
                    ) : null}

                    {showSelected ? (
                        isCardSelection ? (
                            <>
                                <AccordionItem title="선택 카드 박스 스타일" defaultOpen>
                                    <CardStyleControls
                                        value={current}
                                        onChange={(field, value) =>
                                            actions.updateSelectedStyle(field, value)
                                        }
                                    />
                                </AccordionItem>
                                <AccordionItem title="선택 카드 내부 기본 텍스트" defaultOpen>
                                    <StyleControls
                                        value={current}
                                        visibleGroups={['text', 'align']}
                                        onChange={(field, value) =>
                                            actions.updateSelectedStyle(field, value)
                                        }
                                    />
                                </AccordionItem>
                            </>
                        ) : isBlockSelection ? (
                            <AccordionItem title="선택 블럭 내부 기본 텍스트" defaultOpen>
                                <StyleControls
                                    value={current}
                                    visibleGroups={['text', 'align']}
                                    onChange={(field, value) =>
                                        actions.updateSelectedStyle(field, value)
                                    }
                                />
                            </AccordionItem>
                        ) : isPageSelection ? (
                            <AccordionItem title="페이지 기본 흐름" defaultOpen>
                                <StyleControls
                                    value={current}
                                    visibleGroups={['align', 'box']}
                                    alphaTargets={{
                                        backgroundColor: true,
                                        baseBackgroundColor: true,
                                    }}
                                    onChange={(field, value) =>
                                        actions.updateSelectedStyle(field, value)
                                    }
                                />
                            </AccordionItem>
                        ) : (
                            <AccordionItem title="선택 요소 스타일" defaultOpen>
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
                            </AccordionItem>
                        )
                    ) : null}
                </div>
            </div>
        </div>
    );
}
