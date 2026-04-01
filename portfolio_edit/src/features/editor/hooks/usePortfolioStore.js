import { useCallback, useEffect, useMemo, useRef } from 'react';
import { produce } from 'immer';
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

  return produce(currentValue, (draft) => {
    const result = updater(draft);
    if (result !== undefined) {
      return result;
    }
    return undefined;
  });
}

export function usePortfolioStore() {
  const { portfolio, mode, selected, ui } = useEditorStore(
    useShallow((state) => ({
      portfolio: state?.portfolio ?? INITIAL_EDITOR_STATE.portfolio,
      mode: state?.mode ?? INITIAL_EDITOR_STATE.mode,
      selected: state?.selected ?? INITIAL_EDITOR_STATE.selected,
      ui: state?.ui ?? INITIAL_EDITOR_STATE.ui,
    })),
  );

  const actionNameRef = useRef(null);

  const setPortfolio = useCallback((updater) => {
    const currentPortfolio = useEditorStore.getState()?.portfolio ?? INITIAL_EDITOR_STATE.portfolio;
    const nextPortfolio = resolveNextState(currentPortfolio, updater);

    if (nextPortfolio === currentPortfolio) return;

    useEditorStore.setState(
      { portfolio: nextPortfolio },
      false,
      actionNameRef.current || 'portfolio/update',
    );
  }, []);

  const setUi = useCallback((updater) => {
    const currentUi = useEditorStore.getState()?.ui ?? INITIAL_EDITOR_STATE.ui;
    const nextUi = resolveNextState(currentUi, updater);

    if (nextUi === currentUi) return;

    useEditorStore.setState(
      { ui: nextUi },
      false,
      actionNameRef.current || 'ui/update',
    );
  }, []);

  const setModeState = useCallback((updater) => {
    const currentMode = useEditorStore.getState()?.mode ?? INITIAL_EDITOR_STATE.mode;
    const nextMode = resolveNextState(currentMode, updater);

    if (nextMode === currentMode) return;

    useEditorStore.setState(
      { mode: nextMode },
      false,
      actionNameRef.current || 'mode/update',
    );
  }, []);

  const setSelected = useCallback((updater) => {
    const currentSelected = useEditorStore.getState()?.selected ?? INITIAL_EDITOR_STATE.selected;
    const nextSelected = resolveNextState(currentSelected, updater);

    if (nextSelected === currentSelected) return;

    useEditorStore.setState(
      { selected: nextSelected },
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
