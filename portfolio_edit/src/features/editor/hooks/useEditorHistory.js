import { useMemo } from 'react';
import { useStore } from 'zustand';
import { useEditorStore } from '../store/useEditorStore.js';

function useTemporalField(selector) {
  return useStore(useEditorStore.temporal, selector);
}

export function useEditorHistory() {
  const undo = useTemporalField((state) => state.undo);
  const redo = useTemporalField((state) => state.redo);
  const clear = useTemporalField((state) => state.clear);
  const pastStateCount = useTemporalField((state) => state.pastStates.length);
  const futureStateCount = useTemporalField((state) => state.futureStates.length);

  return useMemo(
    () => ({
      undo,
      redo,
      clearHistory: clear,
      canUndo: pastStateCount > 0,
      canRedo: futureStateCount > 0,
      pastStateCount,
      futureStateCount,
    }),
    [undo, redo, clear, pastStateCount, futureStateCount],
  );
}
