import { useMemo } from 'react';
import { usePdfExport } from '../../hooks/usePdfExport.js';
import { useMobileViewportLock } from '../../hooks/useMobileViewportLock.js';
import TopBar from './TopBar.jsx';
import EditorLayout from './EditorLayout.jsx';
import ExportOrientationDialog from './ExportOrientationDialog.jsx';
import {
  MobileBottomDock,
  MobileEditorSheet,
  MobileQuickFab,
  MobileSelectionChip,
} from './MobileEditorControls.jsx';

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

export default function EditorWorkspace({ store, onExit }) {
  const { ui, mode, actions, portfolio, selected } = store;
  const editorLayoutModeClass = ui.editorLayoutMode === 'auto' ? 'editor-layout-auto' : `editor-layout-force-${ui.editorLayoutMode}`;
  const effectiveLayoutClass = ui.isMobile ? 'editor-mode-mobile' : 'editor-mode-desktop';
  const { exportRef, isExporting, isExportSheetOpen, openExportSheet, closeExportSheet, handleExportPdf } =
    usePdfExport({ store });
  const { nextMode, currentModeLabel, nextModeLabel } = useTopBarModeLabels(mode);

  useMobileViewportLock(ui.isMobile);

  return (
    <div
      className={`app-shell editor-workspace-shell ${ui.isMobile ? 'mobile-app-shell' : ''} ${editorLayoutModeClass} ${effectiveLayoutClass}`}
      style={{
        backgroundColor:
          portfolio.styles.page.baseBackgroundColor && portfolio.styles.page.baseBackgroundColor !== 'transparent'
            ? portfolio.styles.page.baseBackgroundColor
            : 'transparent',
      }}
    >
      {onExit ? (
        <button type="button" className="workspace-back-button no-print" onClick={onExit}>
          ← 대시보드로
        </button>
      ) : null}

      <TopBar
        isMobile={ui.isMobile}
        mobileEditorMode={ui.mobileEditorMode}
        selectedLabel={selected?.label}
        currentModeLabel={currentModeLabel}
        nextModeLabel={nextModeLabel}
        isExporting={isExporting}
        editorLayoutMode={ui.editorLayoutMode}
        onChangeEditorLayoutMode={actions.setEditorLayoutMode}
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
