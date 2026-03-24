import './styles/index.css';
import { usePortfolioStore } from './hooks/usePortfolioStore';
import SidePanel from './components/SidePanel';
import StylePanel from './components/StylePanel';
import EditablePortfolioCanvas from './sections/EditablePortfolioCanvas';

export default function App() {
    const store = usePortfolioStore();
    const { ui, mode, actions, portfolio } = store;

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

                        <button type="button" onClick={() => window.print()}>
                            PDF 추출
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
                        ui.showContentPanel ? '320px' : '0px'
                    } minmax(0, 1fr) ${ui.showStylePanel ? '320px' : '0px'}`,
                }}
            >
                {ui.showContentPanel ? <SidePanel store={store} /> : <div />}
                <EditablePortfolioCanvas store={store} />
                {ui.showStylePanel ? <StylePanel store={store} /> : <div />}
            </main>
        </div>
    );
}