import { useCallback } from 'react';
import { getNativeDragId, hasNativeDragType, setNativeDragData } from '../utils/nativeDragData.js';

export default function useNativeReorderAdapter({
  id,
  dragType,
  draggingId,
  dragOverId,
  setDraggingId,
  setDragOverId,
  enabled = true,
  tapEnabled = false,
  onMove,
  acceptDragType = dragType,
}) {
  const isDragging = draggingId === id;
  const isDragOver = dragOverId === id && draggingId !== id;
  const showTapOverlay = tapEnabled && !!draggingId && draggingId !== id;

  const clearDragState = useCallback(() => {
    setDraggingId(null);
    setDragOverId(null);
  }, [setDraggingId, setDragOverId]);

  const isAcceptedDragEvent = useCallback(
    (event) => hasNativeDragType(event, acceptDragType),
    [acceptDragType],
  );

  const commitMove = useCallback(
    (fromId) => {
      if (fromId && fromId !== id) {
        onMove(String(fromId), String(id));
      }
      clearDragState();
    },
    [clearDragState, id, onMove],
  );

  const handleDragStart = useCallback(
    (event) => {
      if (!enabled) return;
      event.stopPropagation();
      setDraggingId(String(id));
      setNativeDragData(event.dataTransfer, dragType, id);
    },
    [dragType, enabled, id, setDraggingId],
  );

  const handleDragOver = useCallback(
    (event) => {
      if (!enabled || !draggingId || !isAcceptedDragEvent(event)) return false;
      event.preventDefault();
      event.stopPropagation();
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'move';
      }
      if (dragOverId !== id) {
        setDragOverId(String(id));
      }
      return true;
    },
    [dragOverId, draggingId, enabled, id, isAcceptedDragEvent, setDragOverId],
  );

  const handleDragLeave = useCallback(
    (event) => {
      if (!isAcceptedDragEvent(event)) return false;
      const nextTarget = event.relatedTarget;
      if (nextTarget && event.currentTarget?.contains?.(nextTarget)) return false;
      if (dragOverId === id) {
        setDragOverId(null);
      }
      return true;
    },
    [dragOverId, id, isAcceptedDragEvent, setDragOverId],
  );

  const handleDrop = useCallback(
    (event) => {
      if (!enabled || !isAcceptedDragEvent(event)) return false;
      event.preventDefault();
      event.stopPropagation();
      const dragged = getNativeDragId(event.dataTransfer, acceptDragType) || draggingId;
      commitMove(dragged);
      return true;
    },
    [acceptDragType, commitMove, draggingId, enabled, isAcceptedDragEvent],
  );

  const handleDragEnd = useCallback(
    (event) => {
      event?.stopPropagation?.();
      clearDragState();
    },
    [clearDragState],
  );

  const toggleTapArm = useCallback(
    (event) => {
      if (!tapEnabled) return false;
      event.preventDefault();
      event.stopPropagation();
      setDraggingId((current) => (current === String(id) ? null : String(id)));
      setDragOverId(null);
      return true;
    },
    [id, setDraggingId, setDragOverId, tapEnabled],
  );

  const handleTapReorder = useCallback(
    (event) => {
      if (!showTapOverlay) return false;
      event.preventDefault();
      event.stopPropagation();
      commitMove(draggingId);
      return true;
    },
    [commitMove, draggingId, showTapOverlay],
  );

  return {
    isDragging,
    isDragOver,
    showTapOverlay,
    dragHandleProps: {
      draggable: enabled,
      onDragStart: handleDragStart,
      onDragEnd: handleDragEnd,
      onMouseDown: (event) => event.stopPropagation(),
    },
    dropTargetProps: {
      onDragOver: handleDragOver,
      onDragLeave: handleDragLeave,
      onDrop: handleDrop,
      onDragEnd: handleDragEnd,
    },
    captureDropTargetProps: {
      onDragEnterCapture: handleDragOver,
      onDragOverCapture: handleDragOver,
      onDragLeaveCapture: handleDragLeave,
      onDropCapture: handleDrop,
    },
    isAcceptedDragEvent,
    clearDragState,
    toggleTapArm,
    handleTapReorder,
    handleDragEnd,
  };
}
