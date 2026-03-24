import './styles/index.css';
import { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { usePortfolioStore } from './hooks/usePortfolioStore';
import SidePanel from './components/SidePanel';
import StylePanel from './components/StylePanel';
import EditablePortfolioCanvas from './sections/EditablePortfolioCanvas';

export default function App() {
    const store = usePortfolioStore();
    const { ui, mode, actions, portfolio } = store;
    const exportRef = useRef(null);
    const [isExporting, setIsExporting] = useState(false);

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
            const EXPORT_WIDTH_PX = 1240; // A4 기준으로 비교적 선명한 고정 폭
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
                .replace(/[\\/:*?"<>|]/g, '')
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

    return (
        <div
            className="app-shell"
            style={{
                backgroundColor: portfolio.styles.page.baseBackgroundColor || '#ece7dc',
            }}
        >
            <header className="topbar no-print">
                <div className="topbar-inner">
                    <div className="topbar-left">
                        <strong>Portfolio Editor Prototype</strong>
                        <p>완성본 위에서 직접 편집하고, 토글로 미리보기 전환</p>
                    </div>

                    <div className="topbar-right">
                        <button type="button" onClick={() => actions.togglePanel('content')}>
                            {ui.showContentPanel ? '구성 패널 닫기' : '구성 패널 열기'}
                        </button>

                        <button type="button" onClick={() => actions.togglePanel('style')}>
                            {ui.showStylePanel ? '스타일 패널 닫기' : '스타일 패널 열기'}
                        </button>

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

                        <button type="button" onClick={actions.reset}>
                            초기화
                        </button>
                    </div>
                </div>
            </header>

            <main
                className="layout-shell"
                style={{
                    gridTemplateColumns: `${
                        ui.showContentPanel ? '280px' : '0px'
                    } minmax(0, 1fr) ${ui.showStylePanel ? '300px' : '0px'}`,
                }}
            >
                {ui.showContentPanel ? <SidePanel store={store}/> : <div/>}
                <EditablePortfolioCanvas ref={exportRef} store={store}/>
                {ui.showStylePanel ? <StylePanel store={store}/> : <div/>}
            </main>
        </div>
    );
}