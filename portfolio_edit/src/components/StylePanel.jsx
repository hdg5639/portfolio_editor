function Field({ label, children }) {
    return (
        <label className="style-field">
            <span>{label}</span>
            {children}
        </label>
    );
}

function AccordionItem({ title, defaultOpen = false, children }) {
    return (
        <details className="style-accordion" open={defaultOpen}>
            <summary>{title}</summary>
            <div className="style-accordion-body">{children}</div>
        </details>
    );
}

function StyleControls({ value, onChange, compact = false }) {
    const current = value || {};

    return (
        <div className={`style-grid ${compact ? 'compact' : ''}`}>
            {!compact ? (
                <>
                    <Field label="페이지 베이스 배경색">
                        <input
                            type="color"
                            value={current.baseBackgroundColor || '#ece7dc'}
                            onChange={(e) => onChange('baseBackgroundColor', e.target.value)}
                        />
                    </Field>

                    <Field label="페이지 너비 모드">
                        <select
                            value={current.widthMode || 'fixed'}
                            onChange={(e) => onChange('widthMode', e.target.value)}
                        >
                            <option value="fixed">고정 비율</option>
                            <option value="custom">자유 선택</option>
                        </select>
                    </Field>

                    {(current.widthMode || 'fixed') === 'fixed' ? (
                        <Field label="고정 페이지 너비(px)">
                            <input
                                type="number"
                                min="720"
                                max="1600"
                                step="10"
                                value={current.fixedWidth ?? 980}
                                onChange={(e) => onChange('fixedWidth', Number(e.target.value))}
                            />
                        </Field>
                    ) : (
                        <Field label="자유 페이지 너비(px)">
                            <input
                                type="number"
                                min="720"
                                max="2200"
                                step="10"
                                value={current.customWidth ?? 1280}
                                onChange={(e) => onChange('customWidth', Number(e.target.value))}
                            />
                        </Field>
                    )}
                </>
            ) : null}

            <Field label="글자색">
                <input
                    type="color"
                    value={current.color || '#1d1d1b'}
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

            <Field label="폰트">
                <input
                    type="text"
                    value={current.fontFamily || 'inherit'}
                    onChange={(e) => onChange('fontFamily', e.target.value)}
                    placeholder="예: Noto Sans KR"
                />
            </Field>

            <Field label="크기">
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

export default function StylePanel({ store }) {
    const { selected, actions } = store;
    const current = actions.getSelectedStyle();

    return (
        <div className="panel-stack style-panel-shell">
            <section className="panel-section style-panel-summary">
                <div className="panel-section-body style-panel-summary-body">
                    <div className="style-panel-head">
                        <strong>스타일 편집</strong>
                        <p>선택 대상: {selected?.label || '없음'}</p>
                    </div>

                    <div className="style-quick-grid">
                        <Field label="빠른 글자색">
                            <input
                                type="color"
                                value={
                                    current?.color && current.color !== 'transparent'
                                        ? current.color
                                        : '#1d1d1b'
                                }
                                onChange={(e) => actions.updateSelectedStyle('color', e.target.value)}
                            />
                        </Field>

                        <Field label="빠른 배경색">
                            <input
                                type="color"
                                value={
                                    current?.backgroundColor && current.backgroundColor !== 'transparent'
                                        ? current.backgroundColor
                                        : '#ffffff'
                                }
                                onChange={(e) =>
                                    actions.updateSelectedStyle('backgroundColor', e.target.value)
                                }
                            />
                        </Field>

                        <Field label="빠른 크기">
                            <input
                                type="number"
                                value={current?.fontSize ?? 16}
                                onChange={(e) =>
                                    actions.updateSelectedStyle('fontSize', Number(e.target.value))
                                }
                            />
                        </Field>

                        <Field label="빠른 굵기">
                            <select
                                value={String(current?.fontWeight ?? 400)}
                                onChange={(e) => actions.updateSelectedStyle('fontWeight', e.target.value)}
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
                </div>
            </section>

            <AccordionItem title="전역 스타일" defaultOpen>
                <StyleControls
                    value={store.portfolio.styles.page}
                    onChange={(field, value) => actions.updateGlobalStyle('page', field, value)}
                />
            </AccordionItem>

            <AccordionItem title="공통 카드 스타일" defaultOpen>
                <StyleControls
                    value={store.portfolio.styles.card}
                    onChange={(field, value) => actions.updateGlobalStyle('card', field, value)}
                />
            </AccordionItem>

            <AccordionItem title="선택 요소 스타일" defaultOpen>
                <StyleControls
                    value={current}
                    onChange={(field, value) => actions.updateSelectedStyle(field, value)}
                />
            </AccordionItem>
        </div>
    );
}