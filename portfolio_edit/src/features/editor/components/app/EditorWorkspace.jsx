import { useEffect, useMemo } from 'react';
import { usePdfExport } from '../../hooks/usePdfExport.js';
import { useMobileViewportLock } from '../../hooks/useMobileViewportLock.js';
import { useEditorHistory } from '../../hooks/useEditorHistory.js';
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

function isTypingTarget(target) {
  if (!(target instanceof HTMLElement)) return false;
  const tagName = target.tagName;
  return target.isContentEditable || tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT';
}

export default function EditorWorkspace({ store, onExit }) {
  const ui = store?.ui ?? {
    editorLayoutMode: 'auto',
    isMobile: false,
  };
  const mode = store?.mode ?? 'edit';
  const actions = store?.actions ?? {};
  const portfolio = store?.portfolio ?? {
    styles: {
      page: {},
    },
  };
  const selected = store?.selected ?? null;
  const editorLayoutModeClass = ui.editorLayoutMode === 'auto' ? 'editor-layout-auto' : `editor-layout-force-${ui.editorLayoutMode}`;
  const effectiveLayoutClass = ui.isMobile ? 'editor-mode-mobile' : 'editor-mode-desktop';
  const { exportRef, isExporting, isExportSheetOpen, openExportSheet, closeExportSheet, handleExportPdf } =
    usePdfExport({ store });
  const { nextMode, currentModeLabel, nextModeLabel } = useTopBarModeLabels(mode);
  const { canUndo, canRedo, undo, redo } = useEditorHistory();

  useMobileViewportLock(ui.isMobile);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const handleKeyDown = (event) => {
      if (event.defaultPrevented || event.isComposing || isTypingTarget(event.target)) return;
      if (!(event.metaKey || event.ctrlKey) || event.altKey) return;

      const key = event.key.toLowerCase();

      if (key === 'z' && event.shiftKey) {
        if (!canRedo) return;
        event.preventDefault();
        redo();
        return;
      }

      if (key === 'z') {
        if (!canUndo) return;
        event.preventDefault();
        undo();
        return;
      }

      if (key === 'y') {
        if (!canRedo) return;
        event.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canUndo, canRedo, undo, redo]);

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
        canUndo={canUndo}
        canRedo={canRedo}
        onChangeEditorLayoutMode={actions.setEditorLayoutMode}
        onToggleMode={() => actions.setMode(nextMode)}
        onUndo={undo}
        onRedo={redo}
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
