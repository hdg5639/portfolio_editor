import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useEditorStore, EDITOR_LAYOUT_MODE_STORAGE_KEY, syncEditorViewport } from '../store/useEditorStore.js';
import { useUiActions } from './actions/useUiActions.js';
import { useStyleActions } from './actions/useStyleActions.js';
import { useProjectActions } from './actions/useProjectActions.js';
import { useCustomSectionActions } from './actions/useCustomSectionActions.js';
import { useLayoutAndProfileActions } from './actions/useLayoutAndProfileActions.js';

const INITIAL_EDITOR_STATE = useEditorStore.getInitialState();

function resolveNextState(currentValue, updater) {
  if (typeof updater !== 'function') return updater;
  const result = updater(currentValue);
  return result === undefined ? currentValue : result;
}

export function usePortfolioStore() {
  const { portfolio, mode, selected, ui } = useEditorStore(
    useShallow((state) => {
      const safeState = state ?? INITIAL_EDITOR_STATE;
      return {
        portfolio: safeState.portfolio,
        mode: safeState.mode,
        selected: safeState.selected,
        ui: safeState.ui,
      };
    }),
  );

  const actionNameRef = useRef(null);

  const setPortfolio = useCallback((updater) => {
    useEditorStore.setState(
      (state) => {
        const nextPortfolio = resolveNextState(state.portfolio, updater);
        if (nextPortfolio !== state.portfolio) {
          state.portfolio = nextPortfolio;
        }
      },
      false,
      actionNameRef.current || 'portfolio/update',
    );
  }, []);

  const setUi = useCallback((updater) => {
    useEditorStore.setState(
      (state) => {
        const nextUi = resolveNextState(state.ui, updater);
        if (nextUi !== state.ui) {
          state.ui = nextUi;
        }
      },
      false,
      actionNameRef.current || 'ui/update',
    );
  }, []);

  const setModeState = useCallback((updater) => {
    useEditorStore.setState(
      (state) => {
        const nextMode = resolveNextState(state.mode, updater);
        if (nextMode !== state.mode) {
          state.mode = nextMode;
        }
      },
      false,
      actionNameRef.current || 'mode/update',
    );
  }, []);

  const setSelected = useCallback((updater) => {
    useEditorStore.setState(
      (state) => {
        const nextSelected = resolveNextState(state.selected, updater);
        if (nextSelected !== state.selected) {
          state.selected = nextSelected;
        }
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

  return useMemo(
    () => ({ portfolio, mode, selected, ui, actions }),
    [portfolio, mode, selected, ui, actions],
  );
}
