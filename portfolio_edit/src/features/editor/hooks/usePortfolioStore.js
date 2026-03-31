import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useEditorStore, EDITOR_LAYOUT_MODE_STORAGE_KEY, syncEditorViewport } from '../store/useEditorStore.js';

import { useUiActions } from './actions/useUiActions.js';
import { useStyleActions } from './actions/useStyleActions.js';
import { useProjectActions } from './actions/useProjectActions.js';
import { useCustomSectionActions } from './actions/useCustomSectionActions.js';
import { useLayoutAndProfileActions } from './actions/useLayoutAndProfileActions.js';

const LEGACY_STORAGE_KEY = 'portfolio-editor-v5';

export function usePortfolioStore() {
  const { portfolio, mode, selected, ui } = useEditorStore(
    useShallow((state) => ({
      portfolio: state.portfolio,
      mode: state.mode,
      selected: state.selected,
      ui: state.ui,
    })),
  );

  const actionNameRef = useRef(null);

  const setPortfolio = useCallback((updater) => {
    useEditorStore.setState(
      (state) => {
        state.portfolio = typeof updater === 'function' ? updater(state.portfolio) : updater;
      },
      false,
      actionNameRef.current || 'portfolio/update',
    );
  }, []);

  const setUi = useCallback((updater) => {
    useEditorStore.setState(
      (state) => {
        state.ui = typeof updater === 'function' ? updater(state.ui) : updater;
      },
      false,
      actionNameRef.current || 'ui/update',
    );
  }, []);

  const setModeState = useCallback((updater) => {
    useEditorStore.setState(
      (state) => {
        state.mode = typeof updater === 'function' ? updater(state.mode) : updater;
      },
      false,
      actionNameRef.current || 'mode/update',
    );
  }, []);

  const setSelected = useCallback((updater) => {
    useEditorStore.setState(
      (state) => {
        state.selected = typeof updater === 'function' ? updater(state.selected) : updater;
      },
      false,
      actionNameRef.current || 'selection/update',
    );
  }, []);

  useEffect(() => {
    syncEditorViewport();
    if (typeof window === 'undefined') return undefined;

    const handleResize = () => syncEditorViewport();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const uiActions = useUiActions(
    setUi,
    setModeState,
    setSelected,
    setPortfolio,
    LEGACY_STORAGE_KEY,
    EDITOR_LAYOUT_MODE_STORAGE_KEY,
  );
  const styleActions = useStyleActions(portfolio, setPortfolio, selected);
  const projectActions = useProjectActions(setPortfolio);
  const customSectionActions = useCustomSectionActions(setPortfolio, portfolio);
  const layoutAndProfileActions = useLayoutAndProfileActions(setPortfolio);

  const rawActions = useMemo(
    () => ({
      ...uiActions,
      ...styleActions,
      ...projectActions,
      ...customSectionActions,
      ...layoutAndProfileActions,
    }),
    [uiActions, styleActions, projectActions, customSectionActions, layoutAndProfileActions],
  );

  const actions = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(rawActions).map(([actionName, action]) => [
          actionName,
          (...args) => {
            actionNameRef.current = `editor/${actionName}`;
            try {
              return action(...args);
            } finally {
              actionNameRef.current = null;
            }
          },
        ]),
      ),
    [rawActions],
  );

  return { portfolio, mode, selected, ui, actions };
}
