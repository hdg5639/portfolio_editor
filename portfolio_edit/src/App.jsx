import './styles/index.css';
import { useMemo } from 'react';
import { usePortfolioStore } from './hooks/usePortfolioStore';
import { usePdfExport } from './hooks/usePdfExport';
import { useMobileViewportLock } from './hooks/useMobileViewportLock';
import TopBar from './components/app/TopBar';
import EditorLayout from './components/app/EditorLayout';
import ExportOrientationDialog from './components/app/ExportOrientationDialog';
import {
  MobileBottomDock,
  MobileEditorSheet,
  MobileQuickFab,
  MobileSelectionChip,
} from './components/app/MobileEditorControls';

function useTopBarModeLabels(mode) {
  return useMemo(() => {
    const nextMode = mode === 'edit' ? 'preview' : 'edit';
    return {
      nextMode,
      currentModeLabel: mode === 'edit' ? '편집' : '미리보기',
      nextModeLabel: nextMode === 'edit' ? '편집' : '미리보기',
    };
  }, [mode]);
}

export default function App() {
  const store = usePortfolioStore();
  const { ui, mode, actions, portfolio, selected } = store;
  const { exportRef, isExporting, isExportSheetOpen, openExportSheet, closeExportSheet, handleExportPdf } =
    usePdfExport({ store });
  const { nextMode, currentModeLabel, nextModeLabel } = useTopBarModeLabels(mode);

  useMobileViewportLock(ui.isMobile);

  return (
    <div
      className={`app-shell ${ui.isMobile ? 'mobile-app-shell' : ''}`}
      style={{
        backgroundColor:
          portfolio.styles.page.baseBackgroundColor && portfolio.styles.page.baseBackgroundColor !== 'transparent'
            ? portfolio.styles.page.baseBackgroundColor
            : 'transparent',
      }}
    >
      <TopBar
        isMobile={ui.isMobile}
        mobileEditorMode={ui.mobileEditorMode}
        selectedLabel={selected?.label}
        currentModeLabel={currentModeLabel}
        nextModeLabel={nextModeLabel}
        isExporting={isExporting}
        onToggleMode={() => actions.setMode(nextMode)}
        onOpenExport={openExportSheet}
        onReset={actions.reset}
      />

      <EditorLayout store={store} exportRef={exportRef} />

      <ExportOrientationDialog
        isOpen={isExportSheetOpen}
        isExporting={isExporting}
        currentOrientation={portfolio.styles.page?.orientation || 'portrait'}
        onClose={closeExportSheet}
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
