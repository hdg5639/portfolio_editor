import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  EDITOR_LAYOUT_MODE_STORAGE_KEY,
  detectMobileViewport,
  getStoredEditorLayoutMode,
  migratePortfolio,
  clone,
  resolveEditorLayoutMode,
  normalizeEditorLayoutMode,
} from '../utils/storeHelpers.js';
import { defaultPortfolio } from '../utils/defaultPortfolio.js';

export const LEGACY_PORTFOLIO_STORAGE_KEY = 'portfolio-editor-v5';
export const PORTFOLIO_STORE_STORAGE_KEY = 'portfolio-editor-zustand-v1';

function getLegacyPortfolioSnapshot() {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(LEGACY_PORTFOLIO_STORAGE_KEY);
    if (!raw) return null;
    return migratePortfolio(JSON.parse(raw));
  } catch {
    return null;
  }
}

function createInitialPortfolioState() {
  return getLegacyPortfolioSnapshot() || clone(defaultPortfolio);
}

function createInitialUiState() {
  const viewportIsMobile = detectMobileViewport();
  const editorLayoutMode = getStoredEditorLayoutMode();
  const isMobile = resolveEditorLayoutMode(editorLayoutMode, viewportIsMobile);

  return {
    showContentPanel: true,
    showStylePanel: true,
    showEditHelpers: true,
    viewportIsMobile,
    editorLayoutMode,
    isMobile,
    mobileEditorMode: 'layout',
    mobileLayoutTool: 'sections',
    mobileStyleTool: 'text',
    mobileSheetOpen: false,
    mobileQuickOpen: false,
  };
}

function createInitialEditorState() {
  return {
    portfolio: createInitialPortfolioState(),
    mode: 'edit',
    selected: { key: 'page', label: '페이지 전체' },
    ui: createInitialUiState(),
  };
}

function mergePersistedState(persistedState, currentState) {
  if (!persistedState || typeof persistedState !== 'object') {
    return currentState;
  }

  const viewportIsMobile = detectMobileViewport();
  const persistedLayoutMode = normalizeEditorLayoutMode(
    persistedState.ui?.editorLayoutMode ?? currentState.ui.editorLayoutMode,
  );

  return {
    ...currentState,
    portfolio: persistedState.portfolio ? migratePortfolio(persistedState.portfolio) : currentState.portfolio,
    ui: {
      ...currentState.ui,
      editorLayoutMode: persistedLayoutMode,
      viewportIsMobile,
      isMobile: resolveEditorLayoutMode(persistedLayoutMode, viewportIsMobile),
      mobileSheetOpen: false,
      mobileQuickOpen: false,
    },
  };
}

export const useEditorStore = create(
  devtools(
    persist(
      immer(() => createInitialEditorState()),
      {
        name: PORTFOLIO_STORE_STORAGE_KEY,
        version: 1,
        storage: createJSONStorage(() => window.localStorage),
        partialize: (state) => ({
          portfolio: state.portfolio,
          ui: {
            editorLayoutMode: state.ui.editorLayoutMode,
          },
        }),
        merge: (persistedState, currentState) => mergePersistedState(persistedState, currentState),
      },
    ),
    { name: 'portfolio-editor-store' },
  ),
);

export function syncEditorViewport() {
  const viewportIsMobile = detectMobileViewport();

  useEditorStore.setState(
    (state) => {
      state.ui.viewportIsMobile = viewportIsMobile;
      state.ui.isMobile = resolveEditorLayoutMode(state.ui.editorLayoutMode, viewportIsMobile);
      if (!state.ui.isMobile) {
        state.ui.mobileSheetOpen = false;
        state.ui.mobileQuickOpen = false;
      }
    },
    false,
    'ui/syncViewport',
  );
}

export { EDITOR_LAYOUT_MODE_STORAGE_KEY };
