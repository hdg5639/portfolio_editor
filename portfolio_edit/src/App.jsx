import './styles/index.css';
import { useEffect, useMemo, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { usePortfolioStore } from './hooks/usePortfolioStore';
import SidePanel from './components/SidePanel';
import StylePanel from './components/StylePanel';
import EditablePortfolioCanvas from './sections/EditablePortfolioCanvas';


const PDF_BREAK_SELECTORS = [
    '.portfolio-card > .section-head',
    '.profile-layout-item',
    '.skill-row',
    '.timeline-row',
    '.projects-list > .project-card-inner',
    '.project-card-inner > .project-top-meta',
    '.project-card-inner > .chip-list',
    '.project-card-inner > .project-block-grid > .project-block-shell',
    '.project-card-inner > .project-add-blocks',
    '.custom-section-grid > .custom-item-shell',
    '.custom-item.simple',
    '.custom-item.timeline',
];

function collectPdfBreakCandidates(root, pageHeightCss) {
    if (!root || typeof window === 'undefined') return [];

    const rootRect = root.getBoundingClientRect();
    const selector = PDF_BREAK_SELECTORS.join(', ');
    const maxKeepTogetherHeight = pageHeightCss * 0.9;
    const candidates = [];

    root.querySelectorAll(selector).forEach((element) => {
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);

        if (!rect.height || rect.height < 24) return;
        if (style.display === 'none' || style.visibility === 'hidden') return;
        if (element.closest('.no-print')) return;

        const top = rect.top - rootRect.top;
        const bottom = rect.bottom - rootRect.top;
        const height = rect.height;

        if (height > maxKeepTogetherHeight) return;

        candidates.push({ top, bottom, height });
    });

    candidates.sort((a, b) => a.top - b.top);
    return candidates;
}


function measureEffectiveExportHeight(root) {
    if (!root || typeof window === 'undefined') return 0;

    const rootRect = root.getBoundingClientRect();
    const rootStyle = window.getComputedStyle(root);
    const paddingBottom = parseFloat(rootStyle.paddingBottom || '0') || 0;
    let maxBottom = 0;

    root.querySelectorAll('*').forEach((element) => {
        if (element.closest('.no-print')) return;

        const style = window.getComputedStyle(element);
        if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) == 0) return;

        const rect = element.getBoundingClientRect();
        if (!rect.width && !rect.height) return;

        maxBottom = Math.max(maxBottom, rect.bottom - rootRect.top);
    });

    const effectiveHeight = Math.ceil(maxBottom + paddingBottom);
    return Math.max(1, Math.min(root.scrollHeight || effectiveHeight, effectiveHeight || root.scrollHeight || 0));
}

function buildPdfSlices(totalHeightCss, pageHeightCss, candidates) {
    if (!totalHeightCss || !pageHeightCss) {
        return [{ start: 0, end: totalHeightCss || 0 }];
    }

    const minFillRatio = 0.58;
    const maxBlankRatio = 0.42;
    const minBreakGap = 36;
    const slices = [];
    let currentTop = 0;
    let guard = 0;

    while (currentTop < totalHeightCss - 1 && guard < 400) {
        guard += 1;

        const preferredEnd = currentTop + pageHeightCss;
        if (preferredEnd >= totalHeightCss) {
            slices.push({ start: currentTop, end: totalHeightCss });
            break;
        }

        const crossing = candidates.filter((candidate) => {
            if (candidate.top <= currentTop + minBreakGap) return false;
            if (candidate.top >= preferredEnd) return false;
            return candidate.bottom > preferredEnd;
        });

        let nextEnd = preferredEnd;

        if (crossing.length > 0) {
            const viable = crossing.filter((candidate) => {
                const used = candidate.top - currentTop;
                const blank = preferredEnd - candidate.top;
                return used >= pageHeightCss * minFillRatio && blank <= pageHeightCss * maxBlankRatio;
            });

            const selected = viable.length > 0 ? viable[viable.length - 1] : null;
            if (selected) {
                nextEnd = selected.top;
            }
        }

        if (nextEnd <= currentTop + 1) {
            nextEnd = preferredEnd;
        }

        slices.push({ start: currentTop, end: Math.min(nextEnd, totalHeightCss) });
        currentTop = nextEnd;
    }

    if (slices.length === 0) {
        slices.push({ start: 0, end: totalHeightCss });
    }

    return slices.filter((slice, index) => {
        const height = slice.end - slice.start;
        if (height <= 2) return false;
        if (index === slices.length - 1 && height < pageHeightCss * 0.035) return false;
        return true;
    });
}

const MOBILE_LAYOUT_TOOLS = [
    { key: 'sections', label: '섹션' },
    { key: 'custom', label: '커스텀' },
    { key: 'skills', label: '기술' },
    { key: 'projects', label: '프로젝트' },
    { key: 'timeline', label: '이력' },
];

const MOBILE_STYLE_TOOLS = [
    { key: 'text', label: '텍스트' },
    { key: 'align', label: '정렬' },
    { key: 'box', label: '박스' },
    { key: 'select', label: '선택' },
];

function MobileDockButton({ active, label, onClick, emphasized = false }) {
    return (
        <button
            type="button"
            className={`mobile-dock-button ${active ? 'active' : ''} ${emphasized ? 'emphasized' : ''}`}
            onClick={onClick}
        >
            <span>{label}</span>
        </button>
    );
}

function MobileEditorSheet({ store }) {
    const { ui, actions } = store;
    const isLayout = ui.mobileEditorMode === 'layout';

    const [shouldRender, setShouldRender] = useState(ui.mobileSheetOpen);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (ui.mobileSheetOpen) {
            setShouldRender(true);
            requestAnimationFrame(() => {
                requestAnimationFrame(() => setIsVisible(true));
            });
            return;
        }

        setIsVisible(false);
        const timer = setTimeout(() => setShouldRender(false), 220);
        return () => clearTimeout(timer);
    }, [ui.mobileSheetOpen]);

    if (!shouldRender) return null;

    const titleMap = isLayout
        ? {
            sections: '섹션 표시',
            custom: '커스텀 섹션',
            skills: '기술 스택',
            projects: '프로젝트',
            timeline: '수상 · 자격증',
        }
        : {
            text: '텍스트 스타일',
            align: '정렬 스타일',
            box: '박스 스타일',
            select: '선택 전환',
        };

    const title = titleMap[isLayout ? ui.mobileLayoutTool : ui.mobileStyleTool] || '편집';

    return (
        <>
            <button
                type="button"
                className={`mobile-sheet-backdrop ${isVisible ? 'is-open' : ''}`}
                onClick={() => actions.toggleMobileSheet(false)}
                aria-label="모바일 편집창 닫기"
            />

            <section className={`mobile-editor-sheet ${isVisible ? 'is-open' : ''}`}>
                <div className="mobile-editor-sheet-handle" />

                <div className="mobile-editor-sheet-head">
                    <div>
                        <strong>{title}</strong>
                        <p>{isLayout ? '구성 항목을 바로 수정합니다.' : '선택 대상을 기준으로 스타일을 수정합니다.'}</p>
                    </div>

                    <button type="button" className="mobile-sheet-close" onClick={() => actions.toggleMobileSheet(false)}>
                        닫기
                    </button>
                </div>

                <div className="mobile-editor-sheet-body">
                    {isLayout ? (
                        <SidePanel store={store} mobileTool={ui.mobileLayoutTool} embedded />
                    ) : (
                        <StylePanel store={store} mobileTool={ui.mobileStyleTool} embedded />
                    )}
                </div>
            </section>
        </>
    );
}

function MobileQuickFab({ store }) {
    const { ui, actions } = store;

    if (ui.mobileEditorMode !== 'style') return null;

    return (
        <div className={`mobile-quick-fab-shell ${ui.mobileQuickOpen ? 'is-open' : ''}`}>
            {ui.mobileQuickOpen ? (
                <div className="mobile-quick-panel">
                    <StylePanel store={store} quickOnly embedded />
                </div>
            ) : null}

            <button
                type="button"
                className="mobile-quick-fab"
                onClick={() => actions.toggleMobileQuick()}
            >
                {ui.mobileQuickOpen ? '닫기' : '빠른'}
            </button>
        </div>
    );
}

function MobileSelectionChip({ store }) {
    const { ui, selected, actions } = store;

    if (ui.mobileEditorMode !== 'style') return null;

    const cardKeys = [
        'profileCard',
        'projectsCard',
        'skillsCard',
        'timelineCard',
        'awardsCard',
        'certificatesCard',
        'customCard',
    ];

    const typeLabel =
        selected?.key === 'page'
            ? '페이지'
            : cardKeys.includes(selected?.key)
                ? '카드'
                : '요소';

    return (
        <button
            type="button"
            className="mobile-selection-chip no-print"
            onClick={() => {
                actions.setMobileStyleTool('select');
                actions.toggleMobileSheet(true);
            }}
        >
            <span className="mobile-selection-chip-label">선택됨</span>
            <strong>{selected?.label || '선택 없음'}</strong>
            <em>{typeLabel}</em>
        </button>
    );
}

function MobileBottomDock({ store }) {
    const { ui, actions } = store;
    const isLayout = ui.mobileEditorMode === 'layout';

    return (
        <div className="mobile-bottom-dock no-print">
            <div className="mobile-bottom-dock-inner">
                {(isLayout ? MOBILE_LAYOUT_TOOLS : MOBILE_STYLE_TOOLS).map((tool) => {
                    const isActive =
                        ui.mobileSheetOpen &&
                        (isLayout ? ui.mobileLayoutTool === tool.key : ui.mobileStyleTool === tool.key);

                    return (
                        <MobileDockButton
                            key={tool.key}
                            active={isActive}
                            label={tool.label}
                            onClick={() => {
                                if (isActive) {
                                    actions.toggleMobileSheet(false);
                                    return;
                                }

                                if (isLayout) {
                                    actions.setMobileLayoutTool(tool.key);
                                    return;
                                }

                                actions.setMobileStyleTool(tool.key);
                            }}
                        />
                    );
                })}

                <MobileDockButton
                    active={false}
                    label={isLayout ? '스타일' : '구성'}
                    emphasized
                    onClick={() => actions.setMobileEditorMode(isLayout ? 'style' : 'layout')}
                />
            </div>
        </div>
    );
}


function ExportOrientationDialog({ isOpen, isExporting, currentOrientation, onClose, onExport }) {
    if (!isOpen) return null;

    return (
        <>
            <button
                type="button"
                className="export-dialog-backdrop"
                onClick={onClose}
                aria-label="PDF 방향 선택 닫기"
            />

            <section className="export-dialog no-print" role="dialog" aria-modal="true" aria-label="PDF 방향 선택">
                <div className="export-dialog-head">
                    <div>
                        <strong>PDF 방향 선택</strong>
                        <p>추출 전에 세로형 또는 가로형을 선택합니다.</p>
                    </div>

                    <button type="button" className="mobile-sheet-close" onClick={onClose}>
                        닫기
                    </button>
                </div>

                <div className="orientation-picker export-orientation-picker">
                    <button
                        type="button"
                        className={`orientation-card ${currentOrientation !== 'landscape' ? 'active' : ''}`}
                        onClick={() => onExport('portrait')}
                        disabled={isExporting}
                    >
                        <span className="orientation-card-preview portrait" />
                        <strong>세로형</strong>
                        <p>A4 Portrait로 저장</p>
                    </button>

                    <button
                        type="button"
                        className={`orientation-card ${currentOrientation === 'landscape' ? 'active' : ''}`}
                        onClick={() => onExport('landscape')}
                        disabled={isExporting}
                    >
                        <span className="orientation-card-preview landscape" />
                        <strong>가로형</strong>
                        <p>A4 Landscape로 저장</p>
                    </button>
                </div>
            </section>
        </>
    );
}

export default function App() {
    const store = usePortfolioStore();
    const { ui, mode, actions, portfolio } = store;
    const exportRef = useRef(null);
    const [isExporting, setIsExporting] = useState(false);
    const [isExportSheetOpen, setIsExportSheetOpen] = useState(false);
    const currentSelectedStyle = useMemo(() => store.actions.getSelectedStyle(), [store.actions]);
    const nextMode = mode === 'edit' ? 'preview' : 'edit';
    const currentModeLabel = mode === 'edit' ? '편집' : '미리보기';
    const nextModeLabel = nextMode === 'edit' ? '편집' : '미리보기';

    const handleExportPdf = async (nextOrientation = portfolio.styles.page?.orientation || 'portrait') => {
        const target = exportRef.current;
        if (!target || isExporting) return;

        let wrapper = null;

        try {
            setIsExporting(true);
            setIsExportSheetOpen(false);

            const prevMode = mode;
            const prevOrientation = portfolio.styles.page?.orientation || 'portrait';
            const resolvedOrientation = nextOrientation || prevOrientation;

            if (prevOrientation !== resolvedOrientation) {
                actions.setPageOrientation(resolvedOrientation);
                await new Promise((resolve) => setTimeout(resolve, 220));
            }

            if (mode !== 'preview') {
                actions.setMode('preview');
                await new Promise((resolve) => setTimeout(resolve, 220));
            }

            await document.fonts?.ready;

            const isLandscape = resolvedOrientation === 'landscape';
            const A4_WIDTH_MM = isLandscape ? 297 : 210;
            const A4_HEIGHT_MM = isLandscape ? 210 : 297;
            const EXPORT_WIDTH_PX = isLandscape ? 1754 : 1240;
            const EXPORT_PADDING = 0;

            const clone = target.cloneNode(true);

            wrapper = document.createElement('div');
            wrapper.style.position = 'fixed';
            wrapper.style.left = '-100000px';
            wrapper.style.top = '0';
            wrapper.style.width = `${EXPORT_WIDTH_PX}px`;
            wrapper.style.padding = `${EXPORT_PADDING}px`;
            wrapper.style.background = portfolio.styles.page.baseBackgroundColor || '#ece7dc';
            wrapper.style.zIndex = '-1';

            clone.style.width = `${EXPORT_WIDTH_PX}px`;
            clone.style.maxWidth = `${EXPORT_WIDTH_PX}px`;
            clone.style.margin = '0 auto';
            clone.style.transform = 'none';
            clone.style.boxSizing = 'border-box';

            wrapper.appendChild(clone);
            document.body.appendChild(wrapper);

            await new Promise((resolve) => setTimeout(resolve, 150));

            const effectiveHeightCss = measureEffectiveExportHeight(clone);
            clone.style.minHeight = `${effectiveHeightCss}px`;
            clone.style.height = `${effectiveHeightCss}px`;
            wrapper.style.height = `${effectiveHeightCss}px`;
            wrapper.style.overflow = 'hidden';

            const canvas = await html2canvas(clone, {
                scale: 2,
                useCORS: true,
                backgroundColor: portfolio.styles.page.backgroundColor || '#ffffff',
                logging: false,
                width: clone.scrollWidth,
                height: effectiveHeightCss,
                windowWidth: clone.scrollWidth,
                windowHeight: effectiveHeightCss,
            });

            const pdf = new jsPDF(
                resolvedOrientation === 'landscape' ? 'l' : 'p',
                'mm',
                'a4'
            );
            const pdfWidth = A4_WIDTH_MM;
            const pdfHeight = A4_HEIGHT_MM;

            const canvasWidth = canvas.width;
            const canvasHeight = canvas.height;
            const renderScale = canvasWidth / Math.max(1, clone.scrollWidth);
            const pageHeightCss = (clone.scrollWidth * pdfHeight) / pdfWidth;
            const breakCandidates = collectPdfBreakCandidates(clone, pageHeightCss);
            const cssSlices = buildPdfSlices(effectiveHeightCss, pageHeightCss, breakCandidates);

            let pageIndex = 0;

            for (const slice of cssSlices) {
                const startPx = Math.max(0, Math.floor(slice.start * renderScale));
                const endPx = Math.min(canvasHeight, Math.ceil(slice.end * renderScale));
                const sliceHeightPx = Math.max(1, endPx - startPx);

                if (sliceHeightPx < 8) {
                    continue;
                }

                const sliceCanvas = document.createElement('canvas');
                sliceCanvas.width = canvasWidth;
                sliceCanvas.height = sliceHeightPx;

                const ctx = sliceCanvas.getContext('2d');
                ctx.drawImage(
                    canvas,
                    0,
                    startPx,
                    canvasWidth,
                    sliceHeightPx,
                    0,
                    0,
                    canvasWidth,
                    sliceHeightPx
                );

                const imgData = sliceCanvas.toDataURL('image/png');
                const sliceHeightMm = (sliceCanvas.height * pdfWidth) / canvasWidth;

                if (pageIndex > 0) {
                    pdf.addPage();
                }

                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, sliceHeightMm, undefined, 'FAST');
                pageIndex += 1;
            }

            const safeName = (portfolio.profile?.name || 'portfolio')
                .replace(/[\/:*?"<>|]/g, '')
                .replace(/\s+/g, '-');

            pdf.save(`${safeName}-portfolio.pdf`);

            if (prevMode !== 'preview') {
                actions.setMode(prevMode);
            }
        } catch (error) {
            console.error('PDF export failed:', error);
            alert('PDF 추출 중 오류가 발생했습니다.');
        } finally {
            if (wrapper && wrapper.parentNode) {
                wrapper.parentNode.removeChild(wrapper);
            }
            setIsExporting(false);
        }
    };

    useEffect(() => {
        if (typeof document === 'undefined' || typeof window === 'undefined') return undefined;

        const viewportMeta = document.querySelector('meta[name="viewport"]');
        const previousViewport = viewportMeta?.getAttribute('content') || '';

        if (ui.isMobile && viewportMeta) {
            viewportMeta.setAttribute(
                'content',
                'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover'
            );
        }

        if (!ui.isMobile) {
            if (viewportMeta && previousViewport) {
                viewportMeta.setAttribute('content', previousViewport);
            }
            return undefined;
        }

        const preventGesture = (event) => {
            event.preventDefault();
        };

        document.addEventListener('gesturestart', preventGesture, { passive: false });
        document.addEventListener('gesturechange', preventGesture, { passive: false });
        document.addEventListener('gestureend', preventGesture, { passive: false });

        return () => {
            document.removeEventListener('gesturestart', preventGesture);
            document.removeEventListener('gesturechange', preventGesture);
            document.removeEventListener('gestureend', preventGesture);

            if (viewportMeta && previousViewport) {
                viewportMeta.setAttribute('content', previousViewport);
            }
        };
    }, [ui.isMobile]);

    const showDesktopContentPanel = !ui.isMobile && ui.showContentPanel;
    const showDesktopStylePanel = !ui.isMobile && ui.showStylePanel;

    return (
        <div
            className={`app-shell ${ui.isMobile ? 'mobile-app-shell' : ''}`}
            style={{
                backgroundColor:
                    portfolio.styles.page.baseBackgroundColor &&
                    portfolio.styles.page.baseBackgroundColor !== 'transparent'
                        ? portfolio.styles.page.baseBackgroundColor
                        : 'transparent',
            }}
        >
            <header className="topbar no-print">
                <div className="topbar-inner">
                    <div className="topbar-left">
                        <strong>Portfolio Editor Prototype</strong>
                        <p>
                            {ui.isMobile
                                ? `모바일 ${ui.mobileEditorMode === 'layout' ? '구성' : '스타일'} 편집 · 선택: ${store.selected?.label || '없음'}`
                                : '완성본 위에서 직접 편집하고, 토글로 미리보기 전환'}
                        </p>
                    </div>

                    <div className="topbar-right">
                        {ui.isMobile ? (
                            <div className="topbar-mobile-controls">
                                <button
                                    type="button"
                                    className="topbar-mode-toggle topbar-mode-toggle-mobile"
                                    onClick={() => actions.setMode(nextMode)}
                                    aria-label={`${nextModeLabel}로 전환`}
                                >
                                    <span className="topbar-mode-toggle-kicker">Mode</span>
                                    <strong>{currentModeLabel}</strong>
                                    <span className="topbar-mode-toggle-next">→ {nextModeLabel}</span>
                                </button>

                                <div className="topbar-mobile-icon-stack">
                                    <button
                                        type="button"
                                        className="topbar-icon-button topbar-icon-button-primary"
                                        onClick={() => setIsExportSheetOpen(true)}
                                        disabled={isExporting}
                                        aria-label={isExporting ? 'PDF 생성 중' : 'PDF 추출'}
                                        title={isExporting ? 'PDF 생성 중' : 'PDF 추출'}
                                    >
                                        <span aria-hidden="true">⤓</span>
                                    </button>

                                    <button
                                        type="button"
                                        className="topbar-icon-button"
                                        onClick={actions.reset}
                                        aria-label="초기화"
                                        title="초기화"
                                    >
                                        <span aria-hidden="true">⟲</span>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <button
                                    type="button"
                                    className="topbar-mode-toggle"
                                    onClick={() => actions.setMode(nextMode)}
                                    aria-label={`${nextModeLabel}로 전환`}
                                >
                                    <span className="topbar-mode-toggle-kicker">Mode</span>
                                    <span className="topbar-mode-toggle-body">
                                        <strong>{currentModeLabel}</strong>
                                        <span className="topbar-mode-toggle-separator" aria-hidden="true">·</span>
                                        <span className="topbar-mode-toggle-next">→ {nextModeLabel}</span>
                                    </span>
                                </button>

                                <div className="topbar-action-group">
                                    <button
                                        type="button"
                                        className="topbar-action-button topbar-action-button-primary"
                                        onClick={() => setIsExportSheetOpen(true)}
                                        disabled={isExporting}
                                    >
                                        <span className="topbar-action-icon" aria-hidden="true">↗</span>
                                        <span className="topbar-action-text">
                                            <span className="topbar-button-kicker">Export</span>
                                            <strong>{isExporting ? 'PDF 생성 중...' : 'PDF 추출'}</strong>
                                        </span>
                                    </button>

                                    <button
                                        type="button"
                                        className="topbar-action-button"
                                        onClick={actions.reset}
                                    >
                                        <span className="topbar-action-icon" aria-hidden="true">⟲</span>
                                        <span className="topbar-action-text">
                                            <span className="topbar-button-kicker">Reset</span>
                                            <strong>초기화</strong>
                                        </span>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </header>

            <main
                className={`layout-shell ${showDesktopContentPanel ? 'has-left-panel' : 'left-panel-closed'} ${
                    showDesktopStylePanel ? 'has-right-panel' : 'right-panel-closed'
                } ${ui.isMobile ? 'is-mobile-layout' : ''}`}
            >
                {!ui.isMobile && !showDesktopContentPanel ? (
                    <button
                        type="button"
                        className="panel-fab panel-fab-left no-print"
                        onClick={() => actions.togglePanel('content')}
                        aria-label="구성 패널 열기"
                        title="구성 패널 열기"
                    >
                        <span className="panel-fab-icon">☰</span>
                        <span className="panel-fab-label">구성</span>
                    </button>
                ) : null}

                {!ui.isMobile && !showDesktopStylePanel ? (
                    <button
                        type="button"
                        className="panel-fab panel-fab-right no-print"
                        onClick={() => actions.togglePanel('style')}
                        aria-label="스타일 패널 열기"
                        title="스타일 패널 열기"
                    >
                        <span className="panel-fab-label">스타일</span>
                        <span className="panel-fab-icon">✦</span>
                    </button>
                ) : null}

                {showDesktopContentPanel ? (
                    <aside className="sidebar-rail left-rail is-open">
                        <SidePanel
                            store={store}
                            onRequestClose={() => actions.togglePanel('content')}
                        />
                    </aside>
                ) : null}

                <section className="layout-main">
                    <EditablePortfolioCanvas
                        ref={exportRef}
                        store={store}
                        hideZoomControls={ui.isMobile && (ui.mobileSheetOpen || ui.mobileQuickOpen)}
                    />
                </section>

                {showDesktopStylePanel ? (
                    <aside className="sidebar-rail right-rail is-open">
                        <StylePanel
                            store={store}
                            onRequestClose={() => actions.togglePanel('style')}
                        />
                    </aside>
                ) : null}
            </main>

            <ExportOrientationDialog
                isOpen={isExportSheetOpen}
                isExporting={isExporting}
                currentOrientation={portfolio.styles.page?.orientation || 'portrait'}
                onClose={() => !isExporting && setIsExportSheetOpen(false)}
                onExport={handleExportPdf}
            />

            {ui.isMobile ? (
                <>
                    <MobileQuickFab store={store} />
                    <MobileSelectionChip store={store} />
                    <MobileBottomDock store={store} />
                    <MobileEditorSheet store={store} />
                </>
            ) : null}
        </div>
    );
}
