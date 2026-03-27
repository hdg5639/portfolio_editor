import SidePanel from '../SidePanel';
import StylePanel from '../StylePanel';
import EditablePortfolioCanvas from '../../sections/EditablePortfolioCanvas';

function PanelFab({ side, icon, label, onClick, ariaLabel }) {
  return (
    <button
      type="button"
      className={`panel-fab panel-fab-${side} no-print`}
      onClick={onClick}
      aria-label={ariaLabel}
      title={ariaLabel}
    >
      {side === 'left' ? (
        <>
          <span className="panel-fab-icon">{icon}</span>
          <span className="panel-fab-label">{label}</span>
        </>
      ) : (
        <>
          <span className="panel-fab-label">{label}</span>
          <span className="panel-fab-icon">{icon}</span>
        </>
      )}
    </button>
  );
}

export default function EditorLayout({ store, exportRef }) {
  const { ui, actions } = store;
  const showDesktopContentPanel = !ui.isMobile && ui.showContentPanel;
  const showDesktopStylePanel = !ui.isMobile && ui.showStylePanel;

  return (
    <main
      className={`layout-shell ${showDesktopContentPanel ? 'has-left-panel' : 'left-panel-closed'} ${
        showDesktopStylePanel ? 'has-right-panel' : 'right-panel-closed'
      } ${ui.isMobile ? 'is-mobile-layout' : ''}`}
    >
      {!ui.isMobile && !showDesktopContentPanel ? (
        <PanelFab side="left" icon="☰" label="구성" onClick={() => actions.togglePanel('content')} ariaLabel="구성 패널 열기" />
      ) : null}

      {!ui.isMobile && !showDesktopStylePanel ? (
        <PanelFab side="right" icon="✦" label="스타일" onClick={() => actions.togglePanel('style')} ariaLabel="스타일 패널 열기" />
      ) : null}

      {showDesktopContentPanel ? (
        <aside className="sidebar-rail left-rail is-open">
          <SidePanel store={store} onRequestClose={() => actions.togglePanel('content')} />
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
          <StylePanel store={store} onRequestClose={() => actions.togglePanel('style')} />
        </aside>
      ) : null}
    </main>
  );
}
