import { useMemo } from 'react';
import {
  clone,
  migratePortfolio,
  normalizeEditorLayoutMode,
  resolveEditorLayoutMode,
} from '../../utils/storeHelpers.js';
import { defaultPortfolio } from '../../utils/defaultPortfolio.js';

export function useUiActions(
  setUi,
  setModeState,
  setSelected,
  setPortfolio,
  LAYOUT_MODE_STORAGE_KEY,
) {
  return useMemo(
    () => ({
      setMode: (nextMode) => {
        setModeState(nextMode);
        if (nextMode === 'preview') {
          setSelected(null);
        }
      },
      clearSelection: () => {
        setSelected(null);
      },
      select: (next) => {
        setSelected(next);
      },
      selectPage: () => {
        setSelected({ key: 'page', label: '페이지 전체' });
        setUi((prev) => ({
          ...prev,
          mobileEditorMode: prev.isMobile ? 'style' : prev.mobileEditorMode,
          mobileStyleTool: prev.isMobile ? 'box' : prev.mobileStyleTool,
        }));
      },
      togglePanel: (panel) =>
        setUi((prev) => ({
          ...prev,
          [panel === 'content' ? 'showContentPanel' : 'showStylePanel']:
            !prev[panel === 'content' ? 'showContentPanel' : 'showStylePanel'],
        })),
      toggleEditHelpers: () =>
        setUi((prev) => ({
          ...prev,
          showEditHelpers: !prev.showEditHelpers,
        })),
      setEditHelpersVisible: (visible) =>
        setUi((prev) => ({
          ...prev,
          showEditHelpers: Boolean(visible),
        })),

      setEditorLayoutMode: (nextLayoutMode) => {
        const normalizedLayoutMode = normalizeEditorLayoutMode(nextLayoutMode);
        setUi((prev) => {
          const viewportIsMobile = prev.viewportIsMobile ?? prev.isMobile;
          const isMobile = resolveEditorLayoutMode(normalizedLayoutMode, viewportIsMobile);

          if (typeof window !== 'undefined') {
            window.localStorage.setItem(LAYOUT_MODE_STORAGE_KEY, normalizedLayoutMode);
          }

          return {
            ...prev,
            editorLayoutMode: normalizedLayoutMode,
            isMobile,
            mobileSheetOpen: isMobile ? prev.mobileSheetOpen : false,
            mobileQuickOpen: isMobile ? prev.mobileQuickOpen : false,
          };
        });
      },
      setMobileEditorMode: (mode) =>
        setUi((prev) => ({
          ...prev,
          mobileEditorMode: mode,
          mobileSheetOpen: false,
          mobileQuickOpen: mode === 'style' ? prev.mobileQuickOpen : false,
        })),
      setMobileLayoutTool: (tool) =>
        setUi((prev) => ({
          ...prev,
          mobileLayoutTool: tool,
          mobileEditorMode: 'layout',
          mobileSheetOpen: true,
          mobileQuickOpen: false,
        })),
      setMobileStyleTool: (tool) =>
        setUi((prev) => ({
          ...prev,
          mobileStyleTool: tool,
          mobileEditorMode: 'style',
          mobileSheetOpen: true,
        })),
      toggleMobileSheet: (force) =>
        setUi((prev) => ({
          ...prev,
          mobileSheetOpen: typeof force === 'boolean' ? force : !prev.mobileSheetOpen,
        })),
      toggleMobileQuick: (force) =>
        setUi((prev) => ({
          ...prev,
          mobileQuickOpen: typeof force === 'boolean' ? force : !prev.mobileQuickOpen,
        })),
      reset: () => {
        setPortfolio(migratePortfolio(clone(defaultPortfolio)));
        setSelected({ key: 'page', label: '페이지 전체' });
        setModeState('edit');
      },
    }),
    [setUi, setModeState, setSelected, setPortfolio, LAYOUT_MODE_STORAGE_KEY],
  );
}
