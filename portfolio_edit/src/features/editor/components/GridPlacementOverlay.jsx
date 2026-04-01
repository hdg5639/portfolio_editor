import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { GRID_COLUMN_COUNT, GRID_GAP, GRID_ROW_HEIGHT } from '../utils/layoutGrid.js';

function resolveTrackIndex(relativeValue, trackSize, gapSize, count) {
  const safeTrackSize = Math.max(1, trackSize);
  const safeGapSize = Math.max(0, gapSize);
  const clampedCount = Math.max(1, count || 1);

  for (let index = 0; index < clampedCount; index += 1) {
    const start = index * (safeTrackSize + safeGapSize);
    const end = start + safeTrackSize;
    const nextStart = end + safeGapSize;

    if (relativeValue >= start && relativeValue <= end) {
      return index + 1;
    }

    if (relativeValue > end && relativeValue < nextStart) {
      const midpoint = end + safeGapSize / 2;
      return Math.min(clampedCount, relativeValue <= midpoint ? index + 1 : index + 2);
    }
  }

  return clampedCount;
}

function resolveCellFromPointer(event, rows) {
  const currentTarget = event.currentTarget;
  if (!currentTarget) return null;

  const rect = currentTarget.getBoundingClientRect();
  const safeRows = Math.max(1, rows || 1);
  const layoutWidth = Math.max(1, currentTarget.offsetWidth || currentTarget.clientWidth || rect.width);
  const layoutHeight = Math.max(1, currentTarget.offsetHeight || currentTarget.clientHeight || rect.height);
  const scaleX = rect.width / layoutWidth;
  const scaleY = rect.height / layoutHeight;
  const scaledGapX = GRID_GAP * scaleX;
  const scaledGapY = GRID_GAP * scaleY;
  const columnWidth = (rect.width - scaledGapX * (GRID_COLUMN_COUNT - 1)) / GRID_COLUMN_COUNT;
  const rowHeight = GRID_ROW_HEIGHT * scaleY;

  const relativeX = Math.min(Math.max(0, event.clientX - rect.left), Math.max(0, rect.width - 1));
  const relativeY = Math.min(Math.max(0, event.clientY - rect.top), Math.max(0, rect.height - 1));

  return {
    x: resolveTrackIndex(relativeX, columnWidth, scaledGapX, GRID_COLUMN_COUNT),
    y: resolveTrackIndex(relativeY, rowHeight, scaledGapY, safeRows),
  };
}

export default function GridPlacementOverlay({
  rows,
  preview,
  items = [],
  activeItemId = null,
  showOccupiedRanges = false,
  interactive = false,
  active = false,
  confirmBeforePlace = false,
  isMobileLayout = false,
  confirmText = '배치하기',
  cancelText = '취소',
  onCellEnter,
  onCellDrop,
  onCellClick,
  onCellConfirm,
  onPointerLeave,
  onCancel,
}) {
  const safeRows = Math.max(1, rows || 1);
  const [pendingCell, setPendingCell] = useState(null);


  const occupiedItems = useMemo(() => {
    if (!(showOccupiedRanges && active)) return [];
    return (items || [])
      .filter((item) => item?.visible !== false)
      .filter((item) => String(item?.id ?? item?.key) !== String(activeItemId))
      .map((item) => ({
        id: String(item?.id ?? item?.key),
        label: item?.label || item?.title || (item?.key ? String(item.key) : '') || (item?.type ? String(item.type) : ''),
        gridX: Number(item?.gridX) || 1,
        gridY: Number(item?.gridY) || 1,
        colSpan: Math.max(1, Number(item?.colSpan) || 1),
        rowSpan: Math.max(1, Number(item?.rowSpan) || 1),
      }));
  }, [active, activeItemId, items, showOccupiedRanges]);

  const confirmUi = useMemo(() => {
    if (!(confirmBeforePlace && interactive && active && pendingCell)) return null;

    const node = (
      <div
        className={`mobile-placement-confirm no-print ${isMobileLayout ? 'is-editor-mobile-layout' : 'is-editor-desktop-layout'}`}
        role="dialog"
        aria-label="배치 확인"
      >
        <div className="mobile-placement-confirm-card">
          <div className="mobile-placement-confirm-copy">
            <strong>미리보기 위치 확인</strong>
            <span>원하는 칸인지 보고 배치하세요.</span>
          </div>

          <div className="mobile-placement-confirm-actions">
            <button
              type="button"
              className="mobile-placement-cancel"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setPendingCell(null);
                onPointerLeave?.();
                onCancel?.(event);
              }}
            >
              {cancelText}
            </button>
            <button
              type="button"
              className="mobile-placement-commit"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onCellConfirm?.(pendingCell, event);
                setPendingCell(null);
              }}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    );

    return typeof document !== 'undefined' ? createPortal(node, document.body) : node;
  }, [active, cancelText, confirmBeforePlace, confirmText, interactive, isMobileLayout, onCancel, onCellConfirm, onPointerLeave, pendingCell]);

  useEffect(() => {
    if (!interactive || !active || !confirmBeforePlace) {
      setPendingCell(null);
    }
  }, [interactive, active, confirmBeforePlace]);

  const handlePreviewCell = (cell, event) => {
    if (!cell) return;
    setPendingCell(cell);
    onCellEnter?.(cell, event);
  };

  return (
    <>
      <div
        className={`grid-placement-overlay ${active ? 'is-active' : ''} ${interactive ? 'is-interactive' : ''}`}
        style={{
          '--grid-columns': GRID_COLUMN_COUNT,
          '--grid-rows': safeRows,
          '--grid-gap': `${GRID_GAP}px`,
          '--grid-row-height': `${GRID_ROW_HEIGHT}px`,
        }}
        onDragLeave={() => {
          if (confirmBeforePlace) return;
          onPointerLeave?.();
        }}
        onMouseLeave={() => {
          if (confirmBeforePlace) return;
          onPointerLeave?.();
        }}
        onMouseMove={(event) => {
          if (!interactive || confirmBeforePlace) return;
          const cell = resolveCellFromPointer(event, safeRows);
          if (cell) onCellEnter?.(cell, event);
        }}
        onDragOver={(event) => {
          if (!interactive) return;
          event.preventDefault();
          const cell = resolveCellFromPointer(event, safeRows);
          if (!cell) return;
          if (confirmBeforePlace) {
            handlePreviewCell(cell, event);
            return;
          }
          onCellEnter?.(cell, event);
        }}
        onDrop={(event) => {
          if (!interactive) return;
          event.preventDefault();
          const cell = resolveCellFromPointer(event, safeRows);
          if (cell) onCellDrop?.(cell, event);
        }}
        onClick={(event) => {
          if (!interactive) return;
          const cell = resolveCellFromPointer(event, safeRows);
          if (!cell) return;
          if (confirmBeforePlace) {
            event.preventDefault();
            event.stopPropagation();
            handlePreviewCell(cell, event);
            return;
          }
          onCellClick?.(cell, event);
        }}
      >
        <div className="grid-placement-lines" />

        {occupiedItems.map((item) => (
          <div
            key={item.id}
            className="grid-occupied-range"
            style={{
              gridColumn: `${item.gridX} / span ${item.colSpan}`,
              gridRow: `${item.gridY} / span ${item.rowSpan}`,
            }}
          >
            {item.label ? <span className="grid-occupied-range-label">{item.label}</span> : null}
          </div>
        ))}

        {preview ? (
          <div
            className={`grid-footprint-preview ${preview.valid === false ? 'is-invalid' : ''}`}
            style={{
              gridColumn: `${preview.gridX} / span ${preview.colSpan}`,
              gridRow: `${preview.gridY} / span ${preview.rowSpan}`,
            }}
          >
            <span>{preview.colSpan} × {preview.rowSpan}</span>
          </div>
        ) : null}
      </div>

      {confirmUi}
    </>
  );
}
