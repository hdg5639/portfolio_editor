function Field({ label, children }) {
    return (
        <label className="style-field">
            <span>{label}</span>
            {children}
        </label>
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

function StyleControls({ value, onChange }) {
    const current = value || {};

    return (
        <div className="style-grid compact">
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

            <Field label="테두리색">
                <input
                    type="color"
                    value={
                        current.borderColor && current.borderColor !== 'transparent'
                            ? current.borderColor
                            : '#e8e1d7'
                    }
                    onChange={(e) => onChange('borderColor', e.target.value)}
                />
            </Field>

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
                        <div className="style-grid compact">
                            <Field label="외부 배경색">
                                <input
                                    type="color"
                                    value={store.portfolio.styles.page.baseBackgroundColor || '#ece7dc'}
                                    onChange={(e) =>
                                        actions.updateGlobalStyle('page', 'baseBackgroundColor', e.target.value)
                                    }
                                />
                            </Field>
                        </div>

                        <StyleControls
                            value={store.portfolio.styles.page}
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