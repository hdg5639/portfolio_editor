import { useEffect, useRef, useState } from 'react';

const ACTIVE_ROOT_CLASS = 'layout-chrome-active-root';
const ACTIVE_HOST_CLASS = 'layout-chrome-active-host';
const ACTIVE_CARD_CLASS = 'layout-chrome-active-card';
const ACTIVE_SECTION_CLASS = 'layout-chrome-active-section';

function clearActiveLayoutChromeLayers(doc) {
    if (!doc) return;

    doc.querySelectorAll(`.${ACTIVE_ROOT_CLASS}`).forEach((node) => node.classList.remove(ACTIVE_ROOT_CLASS));
    doc.querySelectorAll(`.${ACTIVE_HOST_CLASS}`).forEach((node) => node.classList.remove(ACTIVE_HOST_CLASS));
    doc.querySelectorAll(`.${ACTIVE_CARD_CLASS}`).forEach((node) => node.classList.remove(ACTIVE_CARD_CLASS));
    doc.querySelectorAll(`.${ACTIVE_SECTION_CLASS}`).forEach((node) => node.classList.remove(ACTIVE_SECTION_CLASS));
}

export default function LayoutChrome({
    label,
    summary,
    dragHandle,
    controls,
    actions,
    defaultExpanded = false,
}) {
    const [expanded, setExpanded] = useState(defaultExpanded);
    const rootRef = useRef(null);
    const activeTargetsRef = useRef([]);

    const clearOwnActiveTargets = () => {
        activeTargetsRef.current.forEach((node) => {
            if (!node) return;
            node.classList.remove(ACTIVE_ROOT_CLASS, ACTIVE_HOST_CLASS, ACTIVE_CARD_CLASS, ACTIVE_SECTION_CLASS);
        });
        activeTargetsRef.current = [];
    };

    const bringToFront = () => {
        const root = rootRef.current;
        if (!root) return;

        const doc = root.ownerDocument;
        clearActiveLayoutChromeLayers(doc);
        clearOwnActiveTargets();

        const host = root.closest('.profile-layout-item, .project-block-shell, .custom-item-shell, .project-card-inner');
        const card = root.closest('.portfolio-card, .preview-card');
        const section = root.closest('.section-tile');

        root.classList.add(ACTIVE_ROOT_CLASS);
        host?.classList.add(ACTIVE_HOST_CLASS);
        card?.classList.add(ACTIVE_CARD_CLASS);
        section?.classList.add(ACTIVE_SECTION_CLASS);

        activeTargetsRef.current = [root, host, card, section].filter(Boolean);
    };

    useEffect(() => {
        setExpanded(defaultExpanded);
    }, [defaultExpanded]);

    useEffect(() => {
        if (expanded) {
            bringToFront();
        } else {
            clearOwnActiveTargets();
        }

        return () => {
            clearOwnActiveTargets();
        };
    }, [expanded]);

    return (
        <div
            ref={rootRef}
            className={`layout-chrome block-layout-chrome no-print ${expanded ? 'is-expanded' : 'is-collapsed'}`}
            onClick={(event) => event.stopPropagation()}
            onMouseDown={bringToFront}
            onTouchStart={bringToFront}
        >
            <div className="layout-chrome-card">
                <div className="layout-chrome-bar">
                    <div className="layout-chrome-main">
                        {dragHandle}
                        <div className="layout-chrome-title">
                            <strong>{label}</strong>
                        </div>
                    </div>

                    <div className="layout-chrome-summary" aria-label="현재 블럭 크기">
                        {summary}
                    </div>

                    <button
                        type="button"
                        className="layout-chrome-toggle"
                        onClick={(event) => {
                            event.stopPropagation();
                            setExpanded((current) => {
                                const next = !current;
                                if (next) {
                                    requestAnimationFrame(() => bringToFront());
                                }
                                return next;
                            });
                        }}
                        aria-expanded={expanded}
                        aria-label={expanded ? '배치 옵션 접기' : '배치 옵션 펼치기'}
                    >
                        <span aria-hidden="true">{expanded ? '▴' : '▾'}</span>
                    </button>
                </div>

                {expanded ? (
                    <div className="layout-chrome-panel">
                        <div className="layout-chrome-controls">{controls}</div>
                        {actions ? <div className="layout-chrome-actions">{actions}</div> : null}
                    </div>
                ) : null}
            </div>
        </div>
    );
}
