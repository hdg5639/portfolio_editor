import './styles/index.css';
import { useMemo, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { usePortfolioStore } from './hooks/usePortfolioStore';
import SidePanel from './components/SidePanel';
import StylePanel from './components/StylePanel';
import EditablePortfolioCanvas from './sections/EditablePortfolioCanvas';

const MOBILE_LAYOUT_TOOLS = [
    { key: 'sections', label: '섹션' },
    { key: 'custom', label: '커스텀' },
    { key: 'skills', label: '기술' },
    { key: 'projects', label: '프로젝트' },
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
    const titleMap = isLayout
        ? {
              sections: '섹션 표시',
              custom: '커스텀 섹션',
              skills: '기술 스택',
              projects: '프로젝트',
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
                className="mobile-sheet-backdrop"
                onClick={() => actions.toggleMobileSheet(false)}
                aria-label="모바일 편집창 닫기"
            />

            <section className="mobile-editor-sheet">
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
                {(isLayout ? MOBILE_LAYOUT_TOOLS : MOBILE_STYLE_TOOLS).map((tool) => (
                    <MobileDockButton
                        key={tool.key}
                        active={isLayout ? ui.mobileLayoutTool === tool.key : ui.mobileStyleTool === tool.key}
                        label={tool.label}
                        onClick={() => {
                            if (isLayout) {
                                actions.setMobileLayoutTool(tool.key);
                                return;
                            }
                            actions.setMobileStyleTool(tool.key);
                        }}
                    />
                ))}

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

export default function App() {
    const store = usePortfolioStore();
    const { ui, mode, actions, portfolio } = store;
    const exportRef = useRef(null);
    const [isExporting, setIsExporting] = useState(false);
    const currentSelectedStyle = useMemo(() => store.actions.getSelectedStyle(), [store.actions]);

    const handleExportPdf = async () => {
        const target = exportRef.current;
        if (!target || isExporting) return;

        try {
            setIsExporting(true);

            const prevMode = mode;
            if (mode !== 'preview') {
                actions.setMode('preview');
                await new Promise((resolve) => setTimeout(resolve, 200));
            }

            await document.fonts?.ready;

            const A4_WIDTH_MM = 210;
            const A4_HEIGHT_MM = 297;
            const EXPORT_WIDTH_PX = 1240;
            const EXPORT_PADDING = 0;

            const clone = target.cloneNode(true);

            const wrapper = document.createElement('div');
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

            const canvas = await html2canvas(clone, {
                scale: 2,
                useCORS: true,
                backgroundColor: portfolio.styles.page.backgroundColor || '#ffffff',
                logging: false,
                width: clone.scrollWidth,
                height: clone.scrollHeight,
                windowWidth: clone.scrollWidth,
                windowHeight: clone.scrollHeight,
            });

            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = A4_WIDTH_MM;
            const pdfHeight = A4_HEIGHT_MM;

            const canvasWidth = canvas.width;
            const canvasHeight = canvas.height;
            const pageHeightPx = Math.floor((canvasWidth * pdfHeight) / pdfWidth);

            let renderedHeight = 0;
            let pageIndex = 0;

            while (renderedHeight < canvasHeight) {
                const sliceCanvas = document.createElement('canvas');
                sliceCanvas.width = canvasWidth;
                sliceCanvas.height = Math.min(pageHeightPx, canvasHeight - renderedHeight);

                const ctx = sliceCanvas.getContext('2d');
                ctx.drawImage(
                    canvas,
                    0,
                    renderedHeight,
                    canvasWidth,
                    sliceCanvas.height,
                    0,
                    0,
                    canvasWidth,
                    sliceCanvas.height
                );

                const imgData = sliceCanvas.toDataURL('image/png');
                const sliceHeightMm = (sliceCanvas.height * pdfWidth) / canvasWidth;

                if (pageIndex > 0) {
                    pdf.addPage();
                }

                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, sliceHeightMm, undefined, 'FAST');

                renderedHeight += sliceCanvas.height;
                pageIndex += 1;
            }

            const safeName = (portfolio.profile?.name || 'portfolio')
                .replace(/[\/:*?"<>|]/g, '')
                .replace(/\s+/g, '-');

            pdf.save(`${safeName}-portfolio.pdf`);

            document.body.removeChild(wrapper);

            if (prevMode !== 'preview') {
                actions.setMode(prevMode);
            }
        } catch (error) {
            console.error('PDF export failed:', error);
            alert('PDF 추출 중 오류가 발생했습니다.');
        } finally {
            setIsExporting(false);
        }
    };

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
                        {!ui.isMobile ? (
                            <>
                                <button type="button" onClick={() => actions.togglePanel('content')}>
                                    {ui.showContentPanel ? '구성 패널 닫기' : '구성 패널 열기'}
                                </button>

                                <button type="button" onClick={() => actions.togglePanel('style')}>
                                    {ui.showStylePanel ? '스타일 패널 닫기' : '스타일 패널 열기'}
                                </button>
                            </>
                        ) : null}

                        <button
                            type="button"
                            className={mode === 'edit' ? 'active-toggle' : ''}
                            onClick={() => actions.setMode('edit')}
                        >
                            편집
                        </button>

                        <button
                            type="button"
                            className={mode === 'preview' ? 'active-toggle' : ''}
                            onClick={() => actions.setMode('preview')}
                        >
                            미리보기
                        </button>

                        <button type="button" onClick={handleExportPdf} disabled={isExporting}>
                            {isExporting ? 'PDF 생성 중...' : 'PDF 추출'}
                        </button>

                        {!ui.isMobile ? (
                            <button type="button" onClick={actions.reset}>
                                초기화
                            </button>
                        ) : null}
                    </div>
                </div>
            </header>

            <main
                className={`layout-shell ${showDesktopContentPanel ? 'has-left-panel' : 'left-panel-closed'} ${
                    showDesktopStylePanel ? 'has-right-panel' : 'right-panel-closed'
                } ${ui.isMobile ? 'is-mobile-layout' : ''}`}
            >
                {showDesktopContentPanel ? (
                    <aside className="sidebar-rail left-rail is-open">
                        <SidePanel store={store} />
                    </aside>
                ) : null}

                <section className="layout-main">
                    <EditablePortfolioCanvas ref={exportRef} store={store} />
                </section>

                {showDesktopStylePanel ? (
                    <aside className="sidebar-rail right-rail is-open">
                        <StylePanel store={store} />
                    </aside>
                ) : null}
            </main>

            {ui.isMobile ? (
                <>
                    <MobileSelectionChip store={store} />
                    <MobileQuickFab store={store} current={currentSelectedStyle} />
                    <MobileBottomDock store={store} />
                    {ui.mobileSheetOpen ? <MobileEditorSheet store={store} /> : null}
                </>
            ) : null}
        </div>
    );
}
